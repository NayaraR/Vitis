
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
