import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/vitis/States";
import { useAreas } from "@/lib/data";
import { ROLES, fmtDate, type Role } from "@/lib/labels";
import { selectCls, useRun } from "./common";

const EDITORIAL: Role[] = ["author", "reviewer", "curator", "admin"];

export function UsersTab() {
  const run = useRun();
  const areas = useAreas();
  const [filter, setFilter] = useState("");
  const orgs = useQuery({ queryKey: ["orgs"], queryFn: async () => (await supabase.from("organizations").select("*").order("name")).data ?? [] });
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: p, error }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (error) throw error;
      return p.map((x) => ({ ...x, roles: (r ?? []).filter((y) => y.user_id === x.id).map((y) => y.role as Role) }));
    },
  });
  if (q.isLoading) return <ListSkeleton />;
  const rows = (q.data ?? []).filter((u) => !filter || `${u.full_name} ${u.email}`.toLowerCase().includes(filter.toLowerCase()));
  const toggleRole = (uid: string, role: Role, has: boolean) =>
    has
      ? run(() => supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role), "Papel removido")
      : run(() => supabase.from("user_roles").insert({ user_id: uid, role }), "Papel adicionado");
  return (
    <div>
      <OrganizationsPanel />
      <Input aria-label="Filtrar usuários" placeholder="Filtrar por nome ou e-mail" className="mb-4 max-w-sm" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">Usuário</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Área</th><th className="px-3 py-2">Organização</th><th className="px-3 py-2">Papéis editoriais</th><th className="px-3 py-2">Ativo</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t align-top">
                <td className="px-3 py-2">
                  <p className="font-medium">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="font-meta text-muted-foreground">desde {fmtDate(u.created_at)}{u.privacy_accepted_at ? ` · LGPD ${fmtDate(u.privacy_accepted_at)}` : ""}</p>
                </td>
                <td className="px-3 py-2">
                  <select aria-label="Tipo de usuário" className={selectCls} value={u.user_type} onChange={(e) => confirm("Alterar o tipo deste usuário? Os papéis serão ajustados.") && run(() => supabase.from("profiles").update({ user_type: e.target.value as "internal" }).eq("id", u.id), "Tipo alterado")}>
                    <option value="internal">Interno</option>
                    <option value="external">Externo</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select aria-label="Área" className={selectCls} value={u.area_id ?? ""} onChange={(e) => run(() => supabase.from("profiles").update({ area_id: e.target.value || null }).eq("id", u.id), "Área alterada")}>
                    <option value="">—</option>
                    {areas.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select aria-label="Organização" className={selectCls} value={u.organization_id ?? ""} onChange={(e) => run(() => supabase.from("profiles").update({ organization_id: e.target.value || null }).eq("id", u.id), "Organização alterada")}>
                    <option value="">—</option>
                    {orgs.data?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  {u.organization_id && (
                    <button type="button" aria-pressed={u.roles.includes("team_manager")} onClick={() => toggleRole(u.id, "team_manager", u.roles.includes("team_manager"))}
                      className={"mt-1 block rounded-full border px-2 py-0.5 text-xs " + (u.roles.includes("team_manager") ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary")}>
                      {ROLES.team_manager}
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
                  {u.user_type === "external" ? (
                    <span className="text-xs text-muted-foreground">Externos não recebem papéis editoriais</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {EDITORIAL.map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button key={r} type="button" aria-pressed={has} onClick={() => toggleRole(u.id, r, has)} className={"rounded-full border px-2 py-0.5 text-xs " + (has ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary")}>
                            {ROLES[r]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Switch aria-label={u.active ? "Bloquear usuário" : "Desbloquear usuário"} checked={u.active} onCheckedChange={(v) => run(() => supabase.from("profiles").update({ active: v }).eq("id", u.id), v ? "Usuário liberado" : "Usuário bloqueado")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ORG_KINDS = { own_store: "Loja própria", franchise: "Franquia", client: "Cliente", restaurant: "Restaurante" } as const;

function OrganizationsPanel() {
  const run = useRun();
  const orgs = useQuery({ queryKey: ["orgs"], queryFn: async () => (await supabase.from("organizations").select("*").order("name")).data ?? [] });
  const [f, setF] = useState({ name: "", kind: "own_store" });
  return (
    <section className="mb-6 rounded-xl border bg-card p-4">
      <h3 className="font-bold">Organizações (lojas e clientes)</h3>
      <p className="mb-3 text-xs text-muted-foreground">Ligue pessoas a uma organização na tabela abaixo. O “Gestor da loja” só vê pessoas e progresso da própria organização.</p>
      <form className="mb-3 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => supabase.from("organizations").insert({ name: f.name.trim(), kind: f.kind }), "Organização criada")) setF({ ...f, name: "" }); }}>
        <Input aria-label="Nome da organização" placeholder="Nome da loja ou cliente" className="max-w-xs" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select aria-label="Tipo de organização" className={selectCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{Object.entries(ORG_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button type="submit" className="rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Adicionar</button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {orgs.data?.map((o) => (
          <li key={o.id} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            {o.name} <span className="font-meta text-muted-foreground">{ORG_KINDS[o.kind as keyof typeof ORG_KINDS]}</span>
            <Switch aria-label={`Ativa: ${o.name}`} checked={o.active} onCheckedChange={(v) => run(() => supabase.from("organizations").update({ active: v }).eq("id", o.id), "Atualizado")} />
          </li>
        ))}
        {orgs.data?.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma organização cadastrada.</li>}
      </ul>
    </section>
  );
}
