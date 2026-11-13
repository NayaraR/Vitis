
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
