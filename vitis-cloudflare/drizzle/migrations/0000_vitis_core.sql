
create extension if not exists unaccent with schema extensions;

create or replace function public.f_unaccent(text) returns text
language sql immutable parallel safe strict set search_path = public, extensions
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

create type public.app_role as enum ('reader','external_reader','author','reviewer','curator','admin');
create type public.user_type as enum ('internal','external');
create type public.visibility as enum ('internal','external','all');
create type public.article_status as enum ('draft','in_review','approved','published','archived');
create type public.content_type as enum ('procedure','manual','checklist','template','quick_guide','video','announcement','other');

create table public.areas (id uuid primary key default gen_random_uuid(), name text not null unique, active boolean not null default true, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text, parent_id uuid references public.categories(id) on delete set null, sort_order int not null default 0, active boolean not null default true, visibility public.visibility not null default 'all', created_at timestamptz not null default now());
create table public.systems (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, description text, active boolean not null default true, visibility public.visibility not null default 'all', created_at timestamptz not null default now());
create table public.tags (id uuid primary key default gen_random_uuid(), name text not null unique);
create table public.internal_domains (domain text primary key check (domain = lower(domain)));
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  show_overdue boolean not null default true,
  default_review_days int not null default 365,
  popular_queries text[] not null default '{}',
  support_channel text,
  accent_color text,
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  user_type public.user_type not null default 'external',
  active boolean not null default true,
  privacy_accepted_at timestamptz,
  area_id uuid references public.areas(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  quick_answer text,
  attention text,
  materials text[] not null default '{}',
  steps jsonb not null default '[]',
  faq jsonb not null default '[]',
  body_extra text,
  category_id uuid references public.categories(id) on delete set null,
  content_type public.content_type not null default 'procedure',
  audience text[] not null default '{all}',
  visibility public.visibility not null default 'internal',
  search_synonyms text[] not null default '{}',
  featured boolean not null default false,
  sort_order int not null default 0,
  status public.article_status not null default 'draft',
  owner_area_id uuid references public.areas(id) on delete set null,
  owner_user_id uuid,
  reviewer_user_id uuid,
  approved_by uuid,
  contact text,
  version_label text,
  change_summary text,
  published_at timestamptz,
  reviewed_at timestamptz,
  next_review_at date,
  is_example boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  search_vector tsvector,
  view_count int not null default 0
);
create index articles_search_idx on public.articles using gin(search_vector);
create index articles_status_idx on public.articles(status);

create table public.article_tags (article_id uuid references public.articles(id) on delete cascade, tag_id uuid references public.tags(id) on delete cascade, primary key (article_id, tag_id));
create table public.article_systems (article_id uuid references public.articles(id) on delete cascade, system_id uuid references public.systems(id) on delete cascade, primary key (article_id, system_id));

create table public.article_drafts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','in_review','approved','returned','published','discarded')),
  return_comment text,
  title text not null,
  slug text not null,
  summary text, quick_answer text, attention text,
  materials text[] not null default '{}',
  steps jsonb not null default '[]',
  faq jsonb not null default '[]',
  body_extra text,
  category_id uuid, content_type public.content_type not null default 'procedure',
  audience text[] not null default '{all}',
  visibility public.visibility not null default 'internal',
  search_synonyms text[] not null default '{}',
  owner_area_id uuid, contact text,
  system_ids uuid[] not null default '{}',
  tag_names text[] not null default '{}',
  approved_by uuid, approved_at timestamptz, submitted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index article_drafts_article_idx on public.article_drafts(article_id);

create table public.article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  version_label text not null,
  snapshot jsonb not null,
  change_summary text,
  kind text not null default 'publish' check (kind in ('publish','review_confirmed','archived','restored')),
  published_by uuid, approved_by uuid,
  published_at timestamptz not null default now()
);

create table public.article_attachments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  file_name text not null,
  storage_path text, url text,
  mime_type text, size_bytes bigint, caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (storage_path is not null or url is not null)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  is_helpful boolean,
  comment text check (char_length(comment) <= 2000),
  issue_type text check (issue_type in ('outdated','incorrect','broken_link','missing_info','other')),
  status text not null default 'new' check (status in ('new','triage','resolved')),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.areas, public.categories, public.systems, public.tags, public.internal_domains, public.app_settings, public.profiles, public.user_roles, public.articles, public.article_tags, public.article_systems, public.article_drafts, public.article_versions, public.article_attachments, public.feedback to authenticated;
grant all on public.areas, public.categories, public.systems, public.tags, public.internal_domains, public.app_settings, public.profiles, public.user_roles, public.articles, public.article_tags, public.article_systems, public.article_drafts, public.article_versions, public.article_attachments, public.feedback to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.is_internal_user() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select active and user_type = 'internal' from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.my_area() returns uuid
language sql stable security definer set search_path = public as $$
  select area_id from public.profiles where id = auth.uid()
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_internal_user() and public.has_role(auth.uid(), 'admin')
$$;
create or replace function public.is_curator() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_internal_user() and (public.has_role(auth.uid(),'curator') or public.has_role(auth.uid(),'admin'))
$$;
create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_internal_user() and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('author','reviewer','curator','admin'))
$$;
create or replace function public.can_manage_area(_area uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_curator() or (public.is_internal_user()
    and (public.has_role(auth.uid(),'author') or public.has_role(auth.uid(),'reviewer'))
    and _area is not null and _area = public.my_area())
$$;
create or replace function public.can_see_visibility(_v public.visibility) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_active_user() and (public.is_internal_user() or _v in ('external','all'))
$$;
create or replace function public.can_read_article(_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.articles a where a.id = _id and (
    (a.status in ('published','archived') and public.can_see_visibility(a.visibility))
    or public.can_manage_area(a.owner_area_id)))
$$;

create or replace function public.get_internal_domains() returns setof text
language sql stable security definer set search_path = public as $$ select domain from public.internal_domains order by domain $$;
create or replace function public.is_internal_email(_email text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.internal_domains where domain = lower(split_part(trim(_email), '@', 2)))
$$;
grant execute on function public.get_internal_domains() to anon, authenticated;
grant execute on function public.is_internal_email(text) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_internal_domain boolean;
  v_provider text := coalesce(new.raw_app_meta_data->>'provider', 'email');
  v_type public.user_type;
begin
  v_internal_domain := exists (select 1 from public.internal_domains where domain = lower(split_part(new.email, '@', 2)));
  if v_provider = 'email' and v_internal_domain then
    raise exception 'Colaboradores entram com a conta Google da empresa.';
  end if;
  v_type := case when v_provider = 'google' and v_internal_domain then 'internal' else 'external' end;
  insert into public.profiles (id, full_name, email, user_type, privacy_accepted_at)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          new.email, v_type,
          case when coalesce((new.raw_user_meta_data->>'privacy_accepted')::boolean, false) then now() else null end);
  insert into public.user_roles (user_id, role) values (new.id, case when v_type = 'internal' then 'reader'::public.app_role else 'external_reader'::public.app_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.guard_user_roles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role in ('author','reviewer','curator','admin','reader')
     and coalesce((select user_type from public.profiles where id = new.user_id), 'external') <> 'internal' then
    raise exception 'Usuário externo não pode receber o papel %', new.role;
  end if;
  return new;
end $$;
create trigger guard_user_roles before insert or update on public.user_roles for each row execute function public.guard_user_roles();

create or replace function public.guard_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.user_type is distinct from old.user_type or new.active is distinct from old.active
       or new.area_id is distinct from old.area_id or new.email is distinct from old.email
       or new.privacy_accepted_at is distinct from old.privacy_accepted_at then
      raise exception 'Somente administradores podem alterar esses campos';
    end if;
  end if;
  if new.user_type = 'external' and old.user_type = 'internal' then
    delete from public.user_roles where user_id = new.id;
    insert into public.user_roles (user_id, role) values (new.id, 'external_reader') on conflict do nothing;
  elsif new.user_type = 'internal' and old.user_type = 'external' then
    delete from public.user_roles where user_id = new.id and role = 'external_reader';
    insert into public.user_roles (user_id, role) values (new.id, 'reader') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger guard_profiles before update on public.profiles for each row execute function public.guard_profiles();

create or replace function public.articles_search_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_tags text; v_sys text; v_cat text;
begin
  select string_agg(t.name, ' ') into v_tags from public.article_tags at join public.tags t on t.id = at.tag_id where at.article_id = new.id;
  select string_agg(s.name, ' ') into v_sys from public.article_systems ast join public.systems s on s.id = ast.system_id where ast.article_id = new.id;
  select c.name || ' ' || coalesce(p.name,'') into v_cat from public.categories c left join public.categories p on p.id = c.parent_id where c.id = new.category_id;
  new.search_vector :=
      setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(new.title,'') || ' ' || array_to_string(new.search_synonyms,' '))), 'A')
   || setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(v_tags,''))), 'B')
   || setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(v_sys,'') || ' ' || coalesce(v_cat,'') || ' ' || coalesce(new.summary,''))), 'C')
   || setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(new.quick_answer,'') || ' ' || coalesce(new.attention,'') || ' ' || array_to_string(new.materials,' ') || ' ' || coalesce(new.steps::text,'') || ' ' || coalesce(new.faq::text,'') || ' ' || coalesce(new.body_extra,''))), 'D');
  return new;
end $$;
create trigger articles_search before insert or update on public.articles for each row execute function public.articles_search_trigger();

create or replace function public.touch_article_from_link() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.articles set search_vector = null where id = coalesce(new.article_id, old.article_id);
  return null;
end $$;
create trigger article_tags_touch after insert or delete on public.article_tags for each row execute function public.touch_article_from_link();
create trigger article_systems_touch after insert or delete on public.article_systems for each row execute function public.touch_article_from_link();

alter table public.areas enable row level security;
alter table public.categories enable row level security;
alter table public.systems enable row level security;
alter table public.tags enable row level security;
alter table public.internal_domains enable row level security;
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.articles enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_systems enable row level security;
alter table public.article_drafts enable row level security;
alter table public.article_versions enable row level security;
alter table public.article_attachments enable row level security;
alter table public.feedback enable row level security;

create policy "read areas" on public.areas for select to authenticated using (public.is_active_user());
create policy "curator manage areas" on public.areas for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "read categories" on public.categories for select to authenticated using ((active and public.can_see_visibility(visibility)) or public.is_editor());
create policy "curator manage categories" on public.categories for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "read systems" on public.systems for select to authenticated using ((active and public.can_see_visibility(visibility)) or public.is_editor());
create policy "curator manage systems" on public.systems for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "read tags" on public.tags for select to authenticated using (public.is_active_user());
create policy "curator manage tags" on public.tags for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "admin read domains" on public.internal_domains for select to authenticated using (public.is_admin());
create policy "admin manage domains" on public.internal_domains for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "read settings" on public.app_settings for select to authenticated using (public.is_active_user());
create policy "admin update settings" on public.app_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "internal read profiles" on public.profiles for select to authenticated using (public.is_internal_user());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admin read roles" on public.user_roles for select to authenticated using (public.is_admin());
create policy "admin manage roles" on public.user_roles for insert to authenticated with check (public.is_admin());
create policy "admin delete roles" on public.user_roles for delete to authenticated using (public.is_admin());
create policy "read articles" on public.articles for select to authenticated using (
  (status in ('published','archived') and public.can_see_visibility(visibility)) or public.can_manage_area(owner_area_id));
create policy "curator update articles" on public.articles for update to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "admin delete unpublished articles" on public.articles for delete to authenticated using (public.is_admin() and (published_at is null or is_example));
create policy "read article tags" on public.article_tags for select to authenticated using (public.can_read_article(article_id));
create policy "read article systems" on public.article_systems for select to authenticated using (public.can_read_article(article_id));
create policy "editors read drafts" on public.article_drafts for select to authenticated using (
  exists (select 1 from public.articles a where a.id = article_id and public.can_manage_area(a.owner_area_id))
  or public.can_manage_area(owner_area_id));
create policy "read versions" on public.article_versions for select to authenticated using (public.can_read_article(article_id));
create policy "read attachments" on public.article_attachments for select to authenticated using (public.can_read_article(article_id));
create policy "editors manage attachments" on public.article_attachments for all to authenticated
  using (exists (select 1 from public.articles a where a.id = article_id and public.can_manage_area(a.owner_area_id)))
  with check (exists (select 1 from public.articles a where a.id = article_id and public.can_manage_area(a.owner_area_id)));
create policy "insert own feedback" on public.feedback for insert to authenticated with check (user_id = auth.uid() and public.can_read_article(article_id));
create policy "read own feedback" on public.feedback for select to authenticated using (user_id = auth.uid());
create policy "area editors read feedback" on public.feedback for select to authenticated using (
  exists (select 1 from public.articles a where a.id = article_id and public.can_manage_area(a.owner_area_id)));
create policy "curator triage feedback" on public.feedback for update to authenticated using (public.is_curator()) with check (public.is_curator());

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
  return d;
end $$;

create or replace function public._sync_unpublished(_article uuid, _status public.article_status) returns void
language plpgsql security definer set search_path = public as $$
declare d public.article_drafts;
begin
  select * into d from public.article_drafts where article_id = _article and status not in ('published','discarded') order by created_at desc limit 1;
  if not found then return; end if;
  update public.articles a set status = _status, title = d.title, slug = d.slug, summary = d.summary,
    category_id = d.category_id, content_type = d.content_type, visibility = d.visibility, owner_area_id = d.owner_area_id,
    updated_at = now(), updated_by = auth.uid()
  where a.id = _article and a.published_at is null and a.status not in ('published','archived');
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
    d.materials := '{}'; d.steps := '[]'; d.faq := '[]'; d.audience := '{all}'; d.search_synonyms := '{}'; d.system_ids := '{}'; d.tag_names := '{}';
    d := public._draft_from_payload(p, d);
    d.updated_by := auth.uid(); d.updated_at := now();
    insert into public.article_drafts select d.*;
  else
    d := public._draft_from_payload(p, d);
    update public.article_drafts set title=d.title, slug=d.slug, summary=d.summary, quick_answer=d.quick_answer, attention=d.attention,
      materials=d.materials, steps=d.steps, faq=d.faq, body_extra=d.body_extra, category_id=d.category_id, content_type=d.content_type,
      audience=d.audience, visibility=d.visibility, search_synonyms=d.search_synonyms, owner_area_id=d.owner_area_id, contact=d.contact,
      system_ids=d.system_ids, tag_names=d.tag_names, status='draft', updated_by=auth.uid(), updated_at=now()
    where id = d.id;
  end if;
  perform public._sync_unpublished(a.id, 'draft');
  return a.id;
end $$;

create or replace function public.submit_draft(p_draft uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.article_drafts;
begin
  select * into d from public.article_drafts where id = p_draft;
  if not found or d.status not in ('draft','returned') then raise exception 'Rascunho não pode ser submetido'; end if;
  if not (public.is_curator() or (public.has_role(auth.uid(),'author') and public.can_manage_area(d.owner_area_id))) then raise exception 'Sem permissão'; end if;
  update public.article_drafts set status='in_review', submitted_at=now(), return_comment=null, updated_at=now(), updated_by=auth.uid() where id = p_draft;
  perform public._sync_unpublished(d.article_id, 'in_review');
end $$;

create or replace function public.approve_draft(p_draft uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.article_drafts;
begin
  select * into d from public.article_drafts where id = p_draft;
  if not found or d.status <> 'in_review' then raise exception 'Somente itens em revisão podem ser aprovados'; end if;
  if not (public.is_admin() or (public.has_role(auth.uid(),'reviewer') and public.can_manage_area(d.owner_area_id))) then raise exception 'Somente revisores da área aprovam'; end if;
  update public.article_drafts set status='approved', approved_by=auth.uid(), approved_at=now(), updated_at=now(), updated_by=auth.uid() where id = p_draft;
  perform public._sync_unpublished(d.article_id, 'approved');
end $$;

create or replace function public.return_draft(p_draft uuid, p_comment text) returns void
language plpgsql security definer set search_path = public as $$
declare d public.article_drafts;
begin
  if coalesce(trim(p_comment),'') = '' then raise exception 'O comentário de devolução é obrigatório'; end if;
  select * into d from public.article_drafts where id = p_draft;
  if not found or d.status not in ('in_review','approved') then raise exception 'Item não está em revisão'; end if;
  if not (public.is_curator() or (public.has_role(auth.uid(),'reviewer') and public.can_manage_area(d.owner_area_id))) then raise exception 'Sem permissão'; end if;
  update public.article_drafts set status='returned', return_comment=p_comment, approved_by=null, approved_at=null, updated_at=now(), updated_by=auth.uid() where id = p_draft;
  perform public._sync_unpublished(d.article_id, 'draft');
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

create or replace function public.archive_article(p_article uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.articles;
begin
  if not public.is_curator() then raise exception 'Somente a Curadoria arquiva'; end if;
  update public.articles set status='archived', updated_at=now(), updated_by=auth.uid() where id = p_article and status = 'published' returning * into a;
  if not found then raise exception 'Somente artigos publicados podem ser arquivados'; end if;
  insert into public.article_versions (article_id, version_label, snapshot, change_summary, published_by, kind)
  values (a.id, a.version_label, to_jsonb(a) - 'search_vector', 'Conteúdo arquivado', auth.uid(), 'archived');
end $$;

create or replace function public.restore_article(p_article uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.articles;
begin
  if not public.is_curator() then raise exception 'Somente a Curadoria restaura'; end if;
  update public.articles set status='published', updated_at=now(), updated_by=auth.uid() where id = p_article and status = 'archived' returning * into a;
  if not found then raise exception 'Artigo não está arquivado'; end if;
  insert into public.article_versions (article_id, version_label, snapshot, change_summary, published_by, kind)
  values (a.id, a.version_label, to_jsonb(a) - 'search_vector', 'Conteúdo restaurado', auth.uid(), 'restored');
end $$;

create or replace function public.confirm_review(p_article uuid, p_next_review date) returns void
language plpgsql security definer set search_path = public as $$
declare a public.articles;
begin
  if not public.is_curator() then raise exception 'Somente a Curadoria confirma revisões'; end if;
  if p_next_review is null or p_next_review <= current_date then raise exception 'Informe uma próxima revisão futura'; end if;
  update public.articles set reviewed_at=now(), next_review_at=p_next_review, updated_at=now(), updated_by=auth.uid()
  where id = p_article and status = 'published' returning * into a;
  if not found then raise exception 'Somente artigos publicados'; end if;
  insert into public.article_versions (article_id, version_label, snapshot, change_summary, published_by, kind)
  values (a.id, a.version_label, to_jsonb(a) - 'search_vector', 'Revisão periódica confirmada sem alterações', auth.uid(), 'review_confirmed');
end $$;

create or replace function public.discard_draft(p_draft uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.article_drafts;
begin
  select * into d from public.article_drafts where id = p_draft;
  if not found or d.status not in ('draft','returned') then raise exception 'Não é possível descartar'; end if;
  if not public.can_manage_area(d.owner_area_id) then raise exception 'Sem permissão'; end if;
  update public.article_drafts set status='discarded', updated_at=now() where id = p_draft;
end $$;

create or replace function public.increment_view(p_article uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.can_read_article(p_article) then
    update public.articles set view_count = view_count + 1 where id = p_article and status = 'published';
  end if;
end $$;

create or replace function public.remove_example_data() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Somente administradores'; end if;
  delete from public.articles where is_example;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public._search(v_tsq tsquery, p_category uuid, p_system uuid, p_type text, p_audience text, p_updated_since timestamptz, p_include_archived boolean, p_limit int)
returns table (id uuid, slug text, title text, summary text, category_name text, content_type public.content_type, version_label text,
  reviewed_at timestamptz, next_review_at date, published_at timestamptz, status public.article_status, visibility public.visibility,
  is_example boolean, rank real)
language sql stable set search_path = public as $$
  select a.id, a.slug, a.title, a.summary, c.name, a.content_type, a.version_label, a.reviewed_at, a.next_review_at, a.published_at,
         a.status, a.visibility, a.is_example,
         case when v_tsq is null then 0 else ts_rank(a.search_vector, v_tsq) end::real
  from public.articles a left join public.categories c on c.id = a.category_id
  where (a.status = 'published' or (p_include_archived and a.status = 'archived'))
    and (v_tsq is null or a.search_vector @@ v_tsq)
    and (p_category is null or a.category_id = p_category or c.parent_id = p_category)
    and (p_system is null or exists (select 1 from public.article_systems s where s.article_id = a.id and s.system_id = p_system))
    and (p_type is null or a.content_type::text = p_type)
    and (p_audience is null or p_audience = any(a.audience))
    and (p_updated_since is null or greatest(a.published_at, a.reviewed_at) >= p_updated_since)
  order by 14 desc, a.featured desc, greatest(a.published_at, a.reviewed_at) desc nulls last
  limit p_limit
$$;

create or replace function public.search_articles(
  q text default '', p_category uuid default null, p_system uuid default null, p_type text default null,
  p_audience text default null, p_updated_since timestamptz default null, p_include_archived boolean default false, p_limit int default 60)
returns table (id uuid, slug text, title text, summary text, category_name text, content_type public.content_type, version_label text,
  reviewed_at timestamptz, next_review_at date, published_at timestamptz, status public.article_status, visibility public.visibility,
  is_example boolean, rank real)
language plpgsql stable set search_path = public as $$
declare v_txt text; v_tsq tsquery;
begin
  select string_agg(w || ':*', ' & ') into v_txt from (
    select regexp_replace(x, '[^a-z0-9]', '', 'g') w from regexp_split_to_table(lower(public.f_unaccent(coalesce(q,''))), '\s+') x) s where w <> '';
  if v_txt is null then
    return query select * from public._search(null, p_category, p_system, p_type, p_audience, p_updated_since, p_include_archived, p_limit);
    return;
  end if;
  v_tsq := to_tsquery('portuguese', v_txt);
  return query select * from public._search(v_tsq, p_category, p_system, p_type, p_audience, p_updated_since, p_include_archived, p_limit);
  if not found then
    v_tsq := to_tsquery('portuguese', replace(v_txt, ' & ', ' | '));
    return query select * from public._search(v_tsq, p_category, p_system, p_type, p_audience, p_updated_since, p_include_archived, p_limit);
  end if;
end $$;

revoke execute on function public.save_draft(uuid, jsonb), public.submit_draft(uuid), public.approve_draft(uuid), public.return_draft(uuid,text),
  public.publish_draft(uuid,text,text,date), public.archive_article(uuid), public.restore_article(uuid), public.confirm_review(uuid,date),
  public.discard_draft(uuid), public.increment_view(uuid), public.remove_example_data(), public.search_articles(text,uuid,uuid,text,text,timestamptz,boolean,int)
  from anon, public;
grant execute on function public.save_draft(uuid, jsonb), public.submit_draft(uuid), public.approve_draft(uuid), public.return_draft(uuid,text),
  public.publish_draft(uuid,text,text,date), public.archive_article(uuid), public.restore_article(uuid), public.confirm_review(uuid,date),
  public.discard_draft(uuid), public.increment_view(uuid), public.remove_example_data(), public.search_articles(text,uuid,uuid,text,text,timestamptz,boolean,int)
  to authenticated;
