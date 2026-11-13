
alter table public.articles add column cover_image text, add column cover_label text, add column cover_style text not null default 'dark' check (cover_style in ('dark','light')), add column event_at timestamptz;
alter table public.article_drafts add column cover_image text, add column cover_label text, add column cover_style text not null default 'dark' check (cover_style in ('dark','light')), add column event_at timestamptz;

create type public.collection_kind as enum ('onboarding','guides','custom');
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null, slug text not null unique, icon text not null default 'book-open',
  kind public.collection_kind not null default 'custom',
  system_id uuid references public.systems(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  content_type public.content_type,
  description text,
  sort_order int not null default 0, active boolean not null default true,
  visibility public.visibility not null default 'internal',
  created_at timestamptz not null default now()
);
create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, article_id)
);
create table public.article_reads (
  user_id uuid not null default auth.uid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  read_at timestamptz not null default now(),
  completed boolean not null default false,
  primary key (user_id, article_id)
);
create table public.article_favorites (
  user_id uuid not null default auth.uid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
grant select, insert, update, delete on public.collections, public.collection_items, public.article_reads, public.article_favorites to authenticated;
grant all on public.collections, public.collection_items, public.article_reads, public.article_favorites to service_role;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.article_reads enable row level security;
alter table public.article_favorites enable row level security;

create policy "read collections" on public.collections for select to authenticated using ((active and public.can_see_visibility(visibility)) or public.is_editor());
create policy "curator manage collections" on public.collections for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "read collection items" on public.collection_items for select to authenticated using (public.can_read_article(article_id));
create policy "curator manage collection items" on public.collection_items for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "own reads select" on public.article_reads for select to authenticated using (user_id = auth.uid());
create policy "own reads insert" on public.article_reads for insert to authenticated with check (user_id = auth.uid() and public.can_read_article(article_id));
create policy "own reads update" on public.article_reads for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reads delete" on public.article_reads for delete to authenticated using (user_id = auth.uid());
create policy "own favs select" on public.article_favorites for select to authenticated using (user_id = auth.uid());
create policy "own favs insert" on public.article_favorites for insert to authenticated with check (user_id = auth.uid() and public.can_read_article(article_id));
create policy "own favs delete" on public.article_favorites for delete to authenticated using (user_id = auth.uid());

-- covers in storage: readable when the article using that path is readable; editors of area may read/upload
create policy "read cover files" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and (
    exists (select 1 from public.articles a where a.cover_image = name and public.can_read_article(a.id))
    or exists (select 1 from public.articles a where a.id = public.try_uuid((storage.foldername(name))[1]) and public.can_manage_area(a.owner_area_id))));

-- drafts carry cover fields
create or replace function public._draft_from_payload(p jsonb, d public.article_drafts) returns public.article_drafts
language plpgsql immutable as $$
begin
  d.title := coalesce(nullif(trim(p->>'title'),''), d.title);
  d.slug := coalesce(nullif(trim(p->>'slug'),''), d.slug);
  d.summary := p->>'summary'; d.quick_answer := p->>'quick_answer'; d.attention := p->>'attention';
  d.materials := coalesce(array(select jsonb_array_elements_text(coalesce(p->'materials','[]'))), '{}');
  d.steps := coalesce(p->'steps','[]'); d.faq := coalesce(p->'faq','[]');
  d.body_extra := p->>'body_extra';
  d.category_id := nullif(p->>'category_id','')::uuid;
  d.content_type := coalesce(nullif(p->>'content_type',''),'procedure')::public.content_type;
  d.audience := coalesce(nullif(array(select jsonb_array_elements_text(coalesce(p->'audience','[]'))), '{}'), '{all}');
  d.visibility := coalesce(nullif(p->>'visibility',''),'internal')::public.visibility;
  d.search_synonyms := coalesce(array(select jsonb_array_elements_text(coalesce(p->'search_synonyms','[]'))), '{}');
  d.owner_area_id := nullif(p->>'owner_area_id','')::uuid;
  d.contact := p->>'contact';
  d.system_ids := coalesce(array(select (jsonb_array_elements_text(coalesce(p->'system_ids','[]')))::uuid), '{}');
  d.tag_names := coalesce(array(select lower(trim(x)) from jsonb_array_elements_text(coalesce(p->'tag_names','[]')) x where trim(x) <> ''), '{}');
  d.cover_image := nullif(p->>'cover_image','');
  d.cover_label := nullif(p->>'cover_label','');
  d.cover_style := coalesce(nullif(p->>'cover_style',''),'dark');
  d.event_at := nullif(p->>'event_at','')::timestamptz;
  return d;
end $$;

create or replace function public.save_draft(p_article uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare a public.articles; d public.article_drafts; v_area uuid;
begin
  if not public.is_editor() then raise exception 'Sem permissão'; end if;
  v_area := nullif(p->>'owner_area_id','')::uuid;
  if v_area is null then raise exception 'Informe a área responsável'; end if;
  if not public.can_manage_area(v_area) then raise exception 'Você só pode editar conteúdos da sua área'; end if;
  if not (public.has_role(auth.uid(),'author') or public.is_curator()) then raise exception 'Somente autores, curadoria ou admin criam rascunhos'; end if;
  if coalesce(trim(p->>'title'),'') = '' or coalesce(trim(p->>'slug'),'') = '' then raise exception 'Título e slug são obrigatórios'; end if;
  if p_article is null then
    if exists (select 1 from public.articles where slug = p->>'slug') then raise exception 'Slug já usado por outro artigo'; end if;
    insert into public.articles (slug, title, summary, owner_area_id, status, created_by, updated_by, owner_user_id)
    values (p->>'slug', p->>'title', p->>'summary', v_area, 'draft', auth.uid(), auth.uid(), auth.uid()) returning * into a;
  else
    select * into a from public.articles where id = p_article;
    if not found then raise exception 'Artigo não encontrado'; end if;
    if not public.can_manage_area(a.owner_area_id) then raise exception 'Sem permissão para este artigo'; end if;
    if exists (select 1 from public.articles where slug = p->>'slug' and id <> a.id) then raise exception 'Slug já usado por outro artigo'; end if;
  end if;
  select * into d from public.article_drafts where article_id = a.id and status in ('draft','returned','in_review','approved') order by created_at desc limit 1;
  if found and d.status in ('in_review','approved') then raise exception 'Há uma versão em revisão ou aprovada. Peça a devolução para editar.'; end if;
  if not found then
    d.id := gen_random_uuid(); d.article_id := a.id; d.status := 'draft'; d.created_by := auth.uid(); d.created_at := now();
    d.materials := '{}'; d.steps := '[]'; d.faq := '[]'; d.audience := '{all}'; d.search_synonyms := '{}'; d.system_ids := '{}'; d.tag_names := '{}'; d.cover_style := 'dark';
    d := public._draft_from_payload(p, d);
    d.updated_by := auth.uid(); d.updated_at := now();
    insert into public.article_drafts select d.*;
  else
    d := public._draft_from_payload(p, d);
    update public.article_drafts set title=d.title, slug=d.slug, summary=d.summary, quick_answer=d.quick_answer, attention=d.attention,
      materials=d.materials, steps=d.steps, faq=d.faq, body_extra=d.body_extra, category_id=d.category_id, content_type=d.content_type,
      audience=d.audience, visibility=d.visibility, search_synonyms=d.search_synonyms, owner_area_id=d.owner_area_id, contact=d.contact,
      system_ids=d.system_ids, tag_names=d.tag_names, cover_image=d.cover_image, cover_label=d.cover_label, cover_style=d.cover_style, event_at=d.event_at,
      status='draft', updated_by=auth.uid(), updated_at=now()
    where id = d.id;
  end if;
  perform public._sync_unpublished(a.id, 'draft');
  return a.id;
end $$;

create or replace function public.publish_draft(p_draft uuid, p_version text, p_change_summary text, p_next_review date) returns void
language plpgsql security definer set search_path = public as $$
declare d public.article_drafts; a public.articles; t text; v_tag uuid;
begin
  if not public.is_curator() then raise exception 'Somente a Curadoria VITIS publica'; end if;
  select * into d from public.article_drafts where id = p_draft;
  if not found or d.status <> 'approved' then raise exception 'Somente conteúdo aprovado pode ser publicado'; end if;
  select * into a from public.articles where id = d.article_id;
  if d.owner_area_id is null then raise exception 'Defina a área responsável'; end if;
  if d.approved_by is null then raise exception 'Falta o aprovador'; end if;
  if coalesce(trim(p_version),'') = '' then raise exception 'Informe a versão'; end if;
  if a.version_label is not null and trim(p_version) = a.version_label then raise exception 'A versão deve ser diferente da vigente (%)', a.version_label; end if;
  if p_next_review is null then raise exception 'Informe a próxima revisão'; end if;
  if a.published_at is not null and coalesce(trim(p_change_summary),'') = '' then raise exception 'Informe o resumo da mudança'; end if;
  update public.articles set title=d.title, slug=d.slug, summary=d.summary, quick_answer=d.quick_answer, attention=d.attention,
    materials=d.materials, steps=d.steps, faq=d.faq, body_extra=d.body_extra, category_id=d.category_id, content_type=d.content_type,
    audience=d.audience, visibility=d.visibility, search_synonyms=d.search_synonyms, owner_area_id=d.owner_area_id, contact=d.contact,
    cover_image=d.cover_image, cover_label=d.cover_label, cover_style=d.cover_style, event_at=d.event_at,
    status='published', version_label=trim(p_version), change_summary=coalesce(nullif(trim(p_change_summary),''),'Primeira publicação'),
    published_at=now(), reviewed_at=now(), next_review_at=p_next_review, approved_by=d.approved_by, reviewer_user_id=d.approved_by,
    owner_user_id=coalesce(a.owner_user_id, d.created_by), updated_at=now(), updated_by=auth.uid()
  where id = a.id;
  delete from public.article_tags where article_id = a.id;
  foreach t in array d.tag_names loop
    insert into public.tags(name) values (t) on conflict (name) do update set name = excluded.name returning id into v_tag;
    insert into public.article_tags values (a.id, v_tag) on conflict do nothing;
  end loop;
  delete from public.article_systems where article_id = a.id;
  insert into public.article_systems select a.id, s from unnest(d.system_ids) s where exists (select 1 from public.systems where id = s) on conflict do nothing;
  select * into a from public.articles where id = a.id;
  insert into public.article_versions (article_id, version_label, snapshot, change_summary, published_by, approved_by, kind)
  values (a.id, a.version_label, to_jsonb(a) - 'search_vector', a.change_summary, auth.uid(), d.approved_by, 'publish');
  update public.article_drafts set status='published', updated_at=now() where id = p_draft;
end $$;

create or replace function public.dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_curator() then raise exception 'Somente curadoria e admin'; end if;
  return jsonb_build_object(
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status::text, count(*) n from public.articles group by 1) s),
    'overdue', (select count(*) from public.articles where status = 'published' and next_review_at < current_date),
    'open_feedback', (select count(*) from public.feedback where status <> 'resolved'),
    'top', (select coalesce(jsonb_agg(t), '[]') from (select title, slug, view_count from public.articles where status = 'published' order by view_count desc limit 8) t)
  );
end $$;
revoke execute on function public.dashboard_stats() from anon, public;
grant execute on function public.dashboard_stats() to authenticated;
