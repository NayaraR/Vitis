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