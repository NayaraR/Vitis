-- Academia VITIS: script único para criar o banco no SEU projeto Supabase.
-- Rode inteiro em Supabase › SQL Editor (uma vez, num projeto novo).

insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict (id) do nothing;

-- ===== 0000_vitis_core.sql =====

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

-- ===== 0001_vitis_storage_and_seed.sql =====

create or replace function public.try_uuid(_t text) returns uuid language plpgsql immutable as $$
begin return _t::uuid; exception when others then return null; end $$;

create policy "read attachment files" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and exists (
    select 1 from public.article_attachments att where att.storage_path = name and public.can_read_article(att.article_id)));
create policy "editors upload attachment files" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and exists (
    select 1 from public.articles a where a.id = public.try_uuid((storage.foldername(name))[1]) and public.can_manage_area(a.owner_area_id)));
create policy "editors delete attachment files" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and exists (
    select 1 from public.articles a where a.id = public.try_uuid((storage.foldername(name))[1]) and public.can_manage_area(a.owner_area_id)));

insert into public.internal_domains values ('vissimo.com.br');
insert into public.app_settings (id, popular_queries, support_channel)
values (1, array['abertura de loja','fechamento de caixa','troca de produto','inventário','senha do PDV'], 'Canal de suporte a definir — configure em Administração › Configurações');

insert into public.areas (name) values ('Operações de loja'),('Financeiro'),('Tecnologia'),('Pessoas'),('Produto'),('Comunicação');

insert into public.systems (name, slug, description) values
 ('SAP','sap','ERP corporativo'), ('VarejoFácil','varejofacil','Sistema de gestão de loja'), ('SysPDV','syspdv','Frente de caixa (PDV)');

insert into public.categories (name, slug, sort_order, description) values
 ('Processos de loja','processos-de-loja',1,'Rotinas da operação diária das lojas'),
 ('Gestão da loja','gestao-da-loja',2,'Indicadores, metas e rotinas de gestão'),
 ('Produto e experiência','produto-e-experiencia',3,'Produto, exposição e experiência do cliente'),
 ('Segurança e infraestrutura','seguranca-e-infraestrutura',4,'Segurança, manutenção e equipamentos'),
 ('Pessoas e treinamento','pessoas-e-treinamento',5,'Equipe, escalas e capacitação'),
 ('Comunicados','comunicados',6,'Comunicados oficiais');
insert into public.categories (name, slug, sort_order, parent_id)
select v.name, v.slug, v.ord, (select id from public.categories where slug='processos-de-loja')
from (values ('Operação de loja','operacao-de-loja',1),('Abertura e fechamento','abertura-e-fechamento',2),('Caixa e pagamentos','caixa-e-pagamentos',3),
 ('Atendimento, trocas e devoluções','atendimento-trocas-devolucoes',4),('Estoque e inventário','estoque-e-inventario',5)) v(name,slug,ord);

-- demo articles
do $$
declare
  c_ab uuid := (select id from public.categories where slug='abertura-e-fechamento');
  c_cx uuid := (select id from public.categories where slug='caixa-e-pagamentos');
  c_tr uuid := (select id from public.categories where slug='atendimento-trocas-devolucoes');
  c_es uuid := (select id from public.categories where slug='estoque-e-inventario');
  c_com uuid := (select id from public.categories where slug='comunicados');
  c_ges uuid := (select id from public.categories where slug='gestao-da-loja');
  ar_op uuid := (select id from public.areas where name='Operações de loja');
  ar_fin uuid := (select id from public.areas where name='Financeiro');
  ar_ti uuid := (select id from public.areas where name='Tecnologia');
  ar_com uuid := (select id from public.areas where name='Comunicação');
  s_vf uuid := (select id from public.systems where slug='varejofacil');
  s_pdv uuid := (select id from public.systems where slug='syspdv');
  s_sap uuid := (select id from public.systems where slug='sap');
  st jsonb := '[{"text":"Etapa de exemplo: descreva uma única ação, começando por um verbo."},{"text":"Etapa de exemplo: indique onde a ação acontece (tela, sistema ou local da loja)."},{"text":"Etapa de exemplo: diga como confirmar que a etapa deu certo."}]';
  fq jsonb := '[{"q":"Pergunta de exemplo: o que fazer se a situação for diferente do padrão?","a":"Resposta de exemplo: descreva a exceção e a quem recorrer."},{"q":"Pergunta de exemplo: quem pode autorizar esta ação?","a":"Resposta de exemplo: informe o cargo responsável, sem nomes pessoais."}]';
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid; a6 uuid; t uuid;
begin
  insert into public.articles (slug,title,summary,quick_answer,attention,materials,steps,faq,category_id,content_type,audience,visibility,search_synonyms,featured,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,contact,view_count)
  values ('exemplo-modelo-de-procedimento','EXEMPLO · Modelo de procedimento de abertura de loja','Modelo que mostra a estrutura de um procedimento. Substitua pelo conteúdo oficial da área.',
   'Resposta rápida de exemplo: em uma ou duas frases, diga o que a pessoa precisa fazer.','Alerta de exemplo: use este bloco para riscos, prazos ou proibições.',
   array['Material de exemplo 1','Material de exemplo 2'], st, fq, c_ab,'procedure',array['store_team','manager'],'internal',array['abrir loja','abertura','início do expediente'],true,'published',ar_op,'1.1','Exemplo: ajuste no passo 2 e inclusão de FAQ',now()-interval '20 days',now()-interval '20 days',current_date+300,true,'Área de Operações de loja (canal a definir)',42)
  returning id into a1;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values
   (a1,'1.0',jsonb_build_object('title','EXEMPLO · Modelo de procedimento de abertura de loja','version_label','1.0'),'Primeira publicação (exemplo)','publish',now()-interval '120 days'),
   (a1,'1.1',jsonb_build_object('title','EXEMPLO · Modelo de procedimento de abertura de loja','version_label','1.1'),'Exemplo: ajuste no passo 2 e inclusão de FAQ','publish',now()-interval '20 days');
  insert into public.article_systems values (a1, s_vf);

  insert into public.articles (slug,title,summary,quick_answer,attention,materials,steps,faq,category_id,content_type,audience,visibility,search_synonyms,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,view_count)
  values ('exemplo-checklist-fechamento-caixa','EXEMPLO · Checklist de fechamento de caixa (revisão vencida)','Modelo de checklist com revisão vencida, para demonstrar o aviso de revisão necessária.',
   'Resposta rápida de exemplo: liste o essencial que não pode faltar no fechamento.',null,array['Item de exemplo'],st,'[]',c_cx,'checklist',array['manager'],'internal',array['fechar caixa','sangria','conferência'],'published',ar_fin,'2.0','Exemplo de versão',now()-interval '400 days',now()-interval '400 days',current_date-35,true,30)
  returning id into a2;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a2,'2.0','{}','Exemplo de versão','publish',now()-interval '400 days');
  insert into public.article_systems values (a2, s_pdv);

  insert into public.articles (slug,title,summary,quick_answer,materials,steps,faq,category_id,content_type,audience,visibility,search_synonyms,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,view_count)
  values ('exemplo-guia-trocas','EXEMPLO · Guia rápido de trocas e devoluções','Modelo de guia rápido visível também para clientes (visibilidade: todos). Há uma nova versão em rascunho.',
   'Resposta rápida de exemplo: indique a regra principal em linguagem simples.',array[]::text[],st,fq,c_tr,'quick_guide',array['all'],'all',array['troca','devolução','devolver produto','trocar'],'published',ar_op,'1.0','Primeira publicação (exemplo)',now()-interval '60 days',now()-interval '60 days',current_date+200,true,55)
  returning id into a3;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a3,'1.0','{}','Primeira publicação (exemplo)','publish',now()-interval '60 days');
  insert into public.article_drafts (article_id,status,title,slug,summary,quick_answer,steps,faq,category_id,content_type,audience,visibility,search_synonyms,owner_area_id,tag_names)
  values (a3,'draft','EXEMPLO · Guia rápido de trocas e devoluções','exemplo-guia-trocas','Nova versão em rascunho (exemplo): o texto publicado continua no ar até a publicação.','Resposta rápida de exemplo revisada.',st,fq,c_tr,'quick_guide',array['all'],'all',array['troca','devolução'],ar_op,array['atendimento','troca']);

  insert into public.articles (slug,title,summary,category_id,content_type,audience,visibility,status,owner_area_id,is_example)
  values ('exemplo-inventario-em-revisao','EXEMPLO · Procedimento de inventário (em revisão)','Modelo nunca publicado, aguardando revisão.',c_es,'procedure',array['store_team'],'internal','in_review',ar_op,true)
  returning id into a4;
  insert into public.article_drafts (article_id,status,title,slug,summary,quick_answer,steps,category_id,content_type,audience,visibility,owner_area_id,system_ids,submitted_at)
  values (a4,'in_review','EXEMPLO · Procedimento de inventário (em revisão)','exemplo-inventario-em-revisao','Modelo nunca publicado, aguardando revisão.','Resposta rápida de exemplo.',st,c_es,'procedure',array['store_team'],'internal',ar_op,array[s_sap],now());

  insert into public.articles (slug,title,summary,quick_answer,category_id,content_type,audience,visibility,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example)
  values ('exemplo-comunicado','EXEMPLO · Comunicado institucional','Modelo de comunicado: diga o que mudou, para quem e a partir de quando.','Resumo de exemplo do comunicado.',c_com,'announcement',array['all'],'all','published',ar_com,'1.0','Publicação do comunicado (exemplo)',now()-interval '3 days',now()-interval '3 days',current_date+90,true)
  returning id into a5;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a5,'1.0','{}','Publicação do comunicado (exemplo)','publish',now()-interval '3 days');

  insert into public.articles (slug,title,summary,quick_answer,attention,steps,category_id,content_type,audience,visibility,search_synonyms,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,view_count,featured)
  values ('exemplo-modelo-senha-pdv','EXEMPLO · Modelo de manual de sistema','Modelo de manual de sistema para o Espaço do gerente.','Resposta rápida de exemplo para dúvidas de sistema.','Alerta de exemplo: nunca compartilhe senhas.',st,c_ges,'manual',array['manager'],'internal',array['senha','acesso','login do pdv'],'published',ar_ti,'1.0','Primeira publicação (exemplo)',now()-interval '10 days',now()-interval '10 days',current_date+355,true,18,true)
  returning id into a6;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a6,'1.0','{}','Primeira publicação (exemplo)','publish',now()-interval '10 days');
  insert into public.article_systems values (a6, s_pdv), (a6, s_vf);

  insert into public.tags(name) values ('abertura') returning id into t; insert into public.article_tags values (a1,t);
  insert into public.tags(name) values ('caixa') returning id into t; insert into public.article_tags values (a2,t);
  insert into public.tags(name) values ('atendimento') returning id into t; insert into public.article_tags values (a3,t);
  insert into public.tags(name) values ('sistemas') returning id into t; insert into public.article_tags values (a6,t);
end $$;

-- ===== 0002_collections_covers_reads.sql =====

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

-- ===== 0003_brand_and_systems.sql =====

alter table public.app_settings add column brand_primary text, add column brand_secondary text, add column brand_logo text;
alter table public.systems add column icon text not null default 'monitor', add column logo_url text, add column owner_area_id uuid references public.areas(id) on delete set null;
alter type public.content_type add value if not exists 'faq';

-- Public branding (colors/logo only) so the sign-in screen can follow the brand too.
create or replace function public.get_brand() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('primary', brand_primary, 'secondary', brand_secondary, 'logo', brand_logo) from public.app_settings where id = 1
$$;
grant execute on function public.get_brand() to anon, authenticated;

-- A system with published articles cannot be deleted (deactivate instead).
create or replace function public.guard_system_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.article_systems s join public.articles a on a.id = s.article_id where s.system_id = old.id and a.status in ('published','archived')) then
    raise exception 'Este sistema tem artigos publicados ou no histórico. Desative-o em vez de excluir.';
  end if;
  return old;
end $$;
create trigger systems_guard_delete before delete on public.systems for each row execute function public.guard_system_delete();

-- Area editors may link articles they manage to collections (curators manage everything).
create policy "area editors link collection items" on public.collection_items for insert to authenticated
  with check (exists (select 1 from public.articles a where a.id = article_id and public.can_manage_area(a.owner_area_id)));
create policy "area editors unlink collection items" on public.collection_items for delete to authenticated
  using (exists (select 1 from public.articles a where a.id = article_id and public.can_manage_area(a.owner_area_id)));

-- ===== 0004_cultivo_trails_teams_support.sql =====

alter type public.app_role add value if not exists 'team_manager';

-- Trails (reuse collections) ------------------------------------------------
alter table public.collections
  add column cover_image text,
  add column cover_style text not null default 'dark' check (cover_style in ('dark','light')),
  add column audience text[] not null default '{all}',
  add column level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  add column status text not null default 'published' check (status in ('draft','published'));
comment on table public.collections is 'Learning paths (trilhas do Cultivo). collection_items are the ordered modules.';
alter table public.articles add column estimated_minutes integer not null default 5 check (estimated_minutes between 1 and 600);
alter table public.article_reads add column completed_at timestamptz;

drop policy if exists "read collections" on public.collections;
create policy "read collections" on public.collections for select to authenticated
  using ((active and status = 'published' and public.can_see_visibility(visibility)) or public.is_editor());

-- Settings ------------------------------------------------------------------
alter table public.app_settings
  add column learning_name text not null default 'Cultivo',
  add column support_portal_url text default 'https://evinobr.atlassian.net/servicedesk/customer/portals',
  add column support_hours text,
  add column support_show_internal boolean not null default true,
  add column support_show_external boolean not null default true;

-- Organizations -------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'own_store' check (kind in ('own_store','franchise','client')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.profiles add column organization_id uuid references public.organizations(id) on delete set null;

create or replace function public.my_org() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid() and active
$$;
create or replace function public.is_team_manager() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return public.is_active_user() and public.my_org() is not null
    and exists (select 1 from public.user_roles where user_id = auth.uid() and role::text = 'team_manager');
end $$;
create or replace function public.manages_user(_u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return public.is_team_manager() and exists (select 1 from public.profiles p where p.id = _u and p.organization_id = public.my_org());
end $$;
revoke execute on function public.my_org(), public.is_team_manager(), public.manages_user(uuid) from anon, public;
grant execute on function public.my_org(), public.is_team_manager(), public.manages_user(uuid) to authenticated;

grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;
create policy "read own or all orgs" on public.organizations for select to authenticated using (public.is_curator() or id = public.my_org());
create policy "admin manage orgs" on public.organizations for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- organization_id is admin-only (or via invite redemption)
create or replace function public.guard_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.user_type is distinct from old.user_type or new.active is distinct from old.active
       or new.area_id is distinct from old.area_id or new.email is distinct from old.email
       or new.privacy_accepted_at is distinct from old.privacy_accepted_at
       or (new.organization_id is distinct from old.organization_id and coalesce(current_setting('vitis.redeem', true), '') <> '1') then
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

create policy "team manager read org profiles" on public.profiles for select to authenticated using (public.manages_user(id));
create policy "team manager read org reads" on public.article_reads for select to authenticated using (public.manages_user(user_id));

-- Invites -------------------------------------------------------------------
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  expires_at timestamptz not null default now() + interval '14 days',
  max_uses integer not null default 1 check (max_uses between 1 and 500),
  uses integer not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.org_invites to authenticated;
grant all on public.org_invites to service_role;
alter table public.org_invites enable row level security;
create policy "manager manage invites" on public.org_invites for all to authenticated
  using (public.is_admin() or (public.is_team_manager() and organization_id = public.my_org()))
  with check (public.is_admin() or (public.is_team_manager() and organization_id = public.my_org()));

create or replace function public.redeem_invite(p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare i public.org_invites; v_email text; v_name text;
begin
  if auth.uid() is null or not public.is_active_user() then raise exception 'Entre na sua conta para aceitar o convite'; end if;
  select * into i from public.org_invites where token = p_token for update;
  if not found then raise exception 'Convite inválido'; end if;
  if i.expires_at < now() then raise exception 'Convite expirado'; end if;
  if i.uses >= i.max_uses then raise exception 'Este convite já atingiu o limite de usos'; end if;
  select email into v_email from public.profiles where id = auth.uid();
  if i.email is not null and lower(i.email) <> lower(v_email) then raise exception 'Este convite foi enviado para outro e-mail'; end if;
  select name into v_name from public.organizations where id = i.organization_id and active;
  if v_name is null then raise exception 'Organização inativa'; end if;
  perform set_config('vitis.redeem', '1', true);
  update public.profiles set organization_id = i.organization_id where id = auth.uid();
  perform set_config('vitis.redeem', '', true);
  update public.org_invites set uses = uses + 1 where id = i.id;
  return v_name;
end $$;
revoke execute on function public.redeem_invite(text) from anon, public;
grant execute on function public.redeem_invite(text) to authenticated;

-- Assignments ---------------------------------------------------------------
create table public.path_assignments (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  due_date date,
  assigned_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.path_assignments to authenticated;
grant all on public.path_assignments to service_role;
alter table public.path_assignments enable row level security;
create policy "members read assignments" on public.path_assignments for select to authenticated
  using (public.is_curator() or (organization_id = public.my_org() and (user_id is null or user_id = auth.uid() or public.is_team_manager())));
create policy "manager manage assignments" on public.path_assignments for all to authenticated
  using (public.is_team_manager() and organization_id = public.my_org())
  with check (public.is_team_manager() and organization_id = public.my_org() and (user_id is null or public.manages_user(user_id)));

-- Quizzes -------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null unique references public.collections(id) on delete cascade,
  pass_score integer not null default 70 check (pass_score between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null default '[]',
  correct_index integer not null default 0,
  sort_order integer not null default 0
);
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  score integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.quizzes, public.quiz_questions to authenticated;
grant select on public.quiz_attempts to authenticated;
grant all on public.quizzes, public.quiz_questions, public.quiz_attempts to service_role;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
create policy "read quizzes" on public.quizzes for select to authenticated
  using (public.is_curator() or exists (select 1 from public.collections c where c.id = collection_id and c.active and c.status = 'published' and public.can_see_visibility(c.visibility)));
create policy "curator manage quizzes" on public.quizzes for all to authenticated using (public.is_curator()) with check (public.is_curator());
-- questions (with answers) only for curators; readers use get_quiz()
create policy "curator manage questions" on public.quiz_questions for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy "read attempts" on public.quiz_attempts for select to authenticated
  using (user_id = auth.uid() or public.manages_user(user_id) or public.is_curator());

create or replace function public.get_quiz(p_collection uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare q public.quizzes;
begin
  select * into q from public.quizzes where collection_id = p_collection and active;
  if not found then return null; end if;
  if not exists (select 1 from public.collections c where c.id = p_collection and c.active and c.status = 'published' and public.can_see_visibility(c.visibility)) then return null; end if;
  return jsonb_build_object('id', q.id, 'pass_score', q.pass_score, 'questions',
    coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'prompt', x.prompt, 'options', x.options) order by x.sort_order) from public.quiz_questions x where x.quiz_id = q.id), '[]'));
end $$;

create or replace function public.submit_quiz(p_quiz uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare q public.quizzes; v_total int; v_right int; v_score int;
begin
  select * into q from public.quizzes where id = p_quiz and active;
  if not found or public.get_quiz(q.collection_id) is null then raise exception 'Teste indisponível'; end if;
  select count(*), count(*) filter (where (p_answers ->> x.id::text)::int = x.correct_index) into v_total, v_right from public.quiz_questions x where x.quiz_id = q.id;
  if v_total = 0 then raise exception 'Teste sem perguntas'; end if;
  v_score := round(100.0 * v_right / v_total);
  insert into public.quiz_attempts (quiz_id, user_id, score, passed) values (q.id, auth.uid(), v_score, v_score >= q.pass_score);
  return jsonb_build_object('score', v_score, 'passed', v_score >= q.pass_score, 'pass_score', q.pass_score);
end $$;

-- Certificates --------------------------------------------------------------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  code text not null unique,
  full_name text,
  path_title text not null,
  minutes integer not null default 0,
  issued_at timestamptz not null default now(),
  unique (user_id, collection_id)
);
grant select on public.certificates to authenticated;
grant all on public.certificates to service_role;
alter table public.certificates enable row level security;
create policy "read certificates" on public.certificates for select to authenticated
  using (user_id = auth.uid() or public.manages_user(user_id) or public.is_curator());

create or replace function public.issue_certificate(p_collection uuid) returns public.certificates
language plpgsql security definer set search_path = public as $$
declare c public.collections; cert public.certificates; v_missing int; v_total int; v_minutes int; q public.quizzes;
begin
  select * into cert from public.certificates where user_id = auth.uid() and collection_id = p_collection;
  if found then return cert; end if;
  select * into c from public.collections where id = p_collection and active and status = 'published' and public.can_see_visibility(visibility);
  if not found then raise exception 'Trilha indisponível'; end if;
  select count(*), count(*) filter (where not exists (select 1 from public.article_reads r where r.user_id = auth.uid() and r.article_id = a.id and r.completed)),
         coalesce(sum(a.estimated_minutes), 0)
    into v_total, v_missing, v_minutes
    from public.collection_items i join public.articles a on a.id = i.article_id
   where i.collection_id = p_collection and a.status = 'published' and public.can_read_article(a.id);
  if v_total = 0 then raise exception 'Trilha sem módulos'; end if;
  if v_missing > 0 then raise exception 'Faltam % módulo(s) para concluir', v_missing; end if;
  select * into q from public.quizzes where collection_id = p_collection and active;
  if found and exists (select 1 from public.quiz_questions where quiz_id = q.id)
     and not exists (select 1 from public.quiz_attempts where quiz_id = q.id and user_id = auth.uid() and passed) then
    raise exception 'Faça o teste rápido e atinja a nota mínima (%)', q.pass_score;
  end if;
  insert into public.certificates (user_id, collection_id, code, full_name, path_title, minutes)
  values (auth.uid(), p_collection, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
          (select coalesce(full_name, email) from public.profiles where id = auth.uid()), c.title, v_minutes)
  returning * into cert;
  return cert;
end $$;

create or replace function public.verify_certificate(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('full_name', full_name, 'path_title', path_title, 'issued_at', issued_at, 'minutes', minutes)
  from public.certificates where code = upper(trim(p_code))
$$;
revoke execute on function public.get_quiz(uuid), public.submit_quiz(uuid, jsonb), public.issue_certificate(uuid), public.verify_certificate(text) from anon, public;
grant execute on function public.get_quiz(uuid), public.submit_quiz(uuid, jsonb), public.issue_certificate(uuid), public.verify_certificate(text) to authenticated;

-- Support requests (phase 2: created in Jira by a server function) ------------
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  description text,
  context jsonb not null default '{}',
  status text not null default 'portal_opened' check (status in ('portal_opened','queued','created','failed')),
  external_key text,
  created_at timestamptz not null default now()
);
grant select, insert on public.support_requests to authenticated;
grant all on public.support_requests to service_role;
alter table public.support_requests enable row level security;
create policy "insert own support request" on public.support_requests for insert to authenticated with check (user_id = auth.uid() and status = 'portal_opened');
create policy "read own support requests" on public.support_requests for select to authenticated using (user_id = auth.uid() or public.is_curator());

-- ===== 0005_support_portal_274_systems_easy_assist.sql =====
alter table public.app_settings alter column support_portal_url set default 'https://evinobr.atlassian.net/servicedesk/customer/portal/274';
update public.app_settings set support_portal_url = 'https://evinobr.atlassian.net/servicedesk/customer/portal/274'
  where support_portal_url is null or support_portal_url = 'https://evinobr.atlassian.net/servicedesk/customer/portals';

alter table public.organizations drop constraint if exists organizations_kind_check;
alter table public.organizations add constraint organizations_kind_check check (kind in ('own_store','franchise','client','restaurant'));

-- Relink SAP to VarejoFácil, then remove (or deactivate) SAP
do $$
declare v_sap uuid; v_vf uuid; v_area uuid; v_sys uuid; v_col uuid;
begin
  select id into v_sap from public.systems where slug = 'sap';
  select id, owner_area_id into v_vf, v_area from public.systems where slug = 'varejofacil';
  if v_sap is not null and v_vf is not null then
    insert into public.article_systems (article_id, system_id) select article_id, v_vf from public.article_systems where system_id = v_sap on conflict do nothing;
    delete from public.article_systems where system_id = v_sap;
    update public.article_drafts set system_ids = array_replace(system_ids, v_sap, v_vf) where v_sap = any(system_ids);
    update public.article_drafts set system_ids = array(select distinct unnest(system_ids)) where v_vf = any(system_ids);
    update public.collections set system_id = v_vf where system_id = v_sap and not exists (select 1 from public.collections c2 where c2.system_id = v_vf and c2.kind = public.collections.kind);
    delete from public.collections where system_id = v_sap;
    begin
      delete from public.systems where id = v_sap;
    exception when others then
      update public.systems set active = false where id = v_sap;
    end;
  end if;

  if v_area is null then select owner_area_id into v_area from public.systems where owner_area_id is not null limit 1; end if;
  insert into public.systems (name, slug, description, icon, active, visibility, owner_area_id)
  values ('Easy Assist', 'easy-assist', 'Sistema para restaurantes', 'utensils', true, 'all', v_area)
  on conflict (slug) do update set active = true, description = excluded.description, icon = excluded.icon, visibility = excluded.visibility
  returning id into v_sys;
  if not exists (select 1 from public.collections where slug = 'primeiros-passos-no-easy-assist') then
    insert into public.collections (title, slug, icon, kind, system_id, description, sort_order, active, visibility, level, status, audience)
    values ('Primeiros passos no Easy Assist', 'primeiros-passos-no-easy-assist', 'utensils', 'onboarding', v_sys,
      'Estrutura da trilha: adicione os módulos publicados e o teste rápido antes de publicar.', 10, true, 'all', 'beginner', 'draft', '{store_team,client}');
  end if;
end $$;