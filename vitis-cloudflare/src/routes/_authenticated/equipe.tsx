import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Mail, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, AreaBand } from "@/components/vitis/AppShell";
import { ListSkeleton, NoAccessState } from "@/components/vitis/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/me";
import { trailProgress, useTrails } from "@/lib/trails";
import { errMsg, fmtDate, todayISO } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => pageHead("Minha equipe", "Convide sua equipe, atribua trilhas e acompanhe o progresso na VITIS."),
  component: Team,
});

const sel = "h-10 w-full rounded-lg border bg-background px-3 text-sm";

function Team() {
  const { data: me, isLoading } = useMe();
  const trails = useTrails();
  const qc = useQueryClient();
  const org = me?.organizationId;
  const data = useQuery({
    queryKey: ["team", org],
    enabled: !!me?.isTeamManager,
    queryFn: async () => {
      const [o, people, assign, invites] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", org!).maybeSingle(),
        supabase.from("profiles").select("id,full_name,email,active").eq("organization_id", org!).order("full_name"),
        supabase.from("path_assignments").select("*").eq("organization_id", org!).order("created_at", { ascending: false }),
        supabase.from("org_invites").select("*").eq("organization_id", org!).order("created_at", { ascending: false }),
      ]);
      const ids = (people.data ?? []).map((p) => p.id);
      const [reads, certs, attempts] = ids.length ? await Promise.all([
        supabase.from("article_reads").select("user_id,article_id,read_at,completed").in("user_id", ids),
        supabase.from("certificates").select("user_id,collection_id,code,issued_at").in("user_id", ids),
        supabase.from("quiz_attempts").select("user_id,quiz_id,score,passed").in("user_id", ids),
      ]) : [{ data: [] }, { data: [] }, { data: [] }];
      const quizzes = (await supabase.from("quizzes").select("id,collection_id")).data ?? [];
      return { orgName: o.data?.name ?? "", people: people.data ?? [], assign: assign.data ?? [], invites: invites.data ?? [], reads: reads.data ?? [], certs: certs.data ?? [], attempts: attempts.data ?? [], quizzes };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["team", org] });

  if (isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!me?.isTeamManager) return <AppShell><NoAccessState>Esta área é para gestores de loja. Peça ao administrador o papel “Gestor da loja” e a ligação à sua organização.</NoAccessState></AppShell>;
  const d = data.data;
  const trailById = new Map((trails.data ?? []).map((t) => [t.id, t]));
  const today = todayISO();

  return (
    <AppShell>
      <AreaBand title={`Minha equipe${d?.orgName ? ` · ${d.orgName}` : ""}`} icon={Users} />
      {!d ? <ListSkeleton /> : (
        <div className="space-y-8">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-4 text-lg font-bold">Progresso da equipe</h2>
            {d.people.length === 0 ? <p className="text-sm text-muted-foreground">Ninguém na equipe ainda. Gere um convite abaixo.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2 pr-3">Pessoa</th><th className="py-2 pr-3">Trilha</th><th className="py-2 pr-3">Progresso</th><th className="py-2 pr-3">Teste</th><th className="py-2">Situação</th></tr></thead>
                  <tbody>
                    {d.people.flatMap((p) => {
                      const mine = d.assign.filter((a) => a.user_id === null || a.user_id === p.id);
                      if (!mine.length) return [<tr key={p.id} className="border-t"><td className="py-2 pr-3 font-medium">{p.full_name || p.email}</td><td colSpan={4} className="py-2 text-muted-foreground">Sem trilhas atribuídas</td></tr>];
                      return mine.map((a) => {
                        const t = trailById.get(a.collection_id);
                        const pr = t ? trailProgress(t, d.reads.filter((r) => r.user_id === p.id)) : null;
                        const cert = d.certs.find((c) => c.user_id === p.id && c.collection_id === a.collection_id);
                        const qz = d.quizzes.find((q) => q.collection_id === a.collection_id);
                        const best = qz ? Math.max(-1, ...d.attempts.filter((x) => x.user_id === p.id && x.quiz_id === qz.id).map((x) => x.score)) : -1;
                        const late = !cert && a.due_date && a.due_date < today;
                        return (
                          <tr key={p.id + a.id} className="border-t">
                            <td className="py-2 pr-3 font-medium">{p.full_name || p.email}</td>
                            <td className="py-2 pr-3">{t?.title ?? "—"}{a.due_date && <span className="block font-meta text-muted-foreground">prazo {fmtDate(a.due_date)}</span>}</td>
                            <td className="py-2 pr-3 font-meta">{pr ? `${pr.done}/${pr.total}` : "—"}</td>
                            <td className="py-2 pr-3 font-meta">{best >= 0 ? `${best}%` : "—"}</td>
                            <td className="py-2">{cert ? <span className="font-semibold text-success">Concluída · {cert.code}</span> : late ? <span className="font-semibold text-destructive">Atrasada</span> : pr?.state === "in_progress" ? "Em andamento" : "Não iniciada"}</td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Assign people={d.people} orgId={org!} onDone={refresh} assignments={d.assign} trailTitle={(id) => trailById.get(id)?.title ?? "—"} />
            <Invites orgId={org!} invites={d.invites} onDone={refresh} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

type Person = { id: string; full_name: string | null; email: string | null };
type Assignment = { id: string; collection_id: string; user_id: string | null; due_date: string | null };

function Assign({ people, orgId, onDone, assignments, trailTitle }: { people: Person[]; orgId: string; onDone: () => void; assignments: Assignment[]; trailTitle: (id: string) => string }) {
  const trails = useTrails();
  const [f, setF] = useState({ trail: "", who: "", due: "" });
  const save = async () => {
    const { error } = await supabase.from("path_assignments").insert({ collection_id: f.trail, organization_id: orgId, user_id: f.who || null, due_date: f.due || null });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Trilha atribuída"); setF({ trail: "", who: "", due: "" }); onDone();
  };
  const name = (id: string | null) => (id ? people.find((p) => p.id === id)?.full_name || people.find((p) => p.id === id)?.email || "—" : "Toda a equipe");
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-bold">Atribuir trilha</h2>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="space-y-1 sm:col-span-2"><Label htmlFor="as-t">Trilha</Label><select id="as-t" required className={sel} value={f.trail} onChange={(e) => setF({ ...f, trail: e.target.value })}><option value="">Escolha…</option>{trails.data?.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="as-w">Para</Label><select id="as-w" className={sel} value={f.who} onChange={(e) => setF({ ...f, who: e.target.value })}><option value="">Toda a equipe</option>{people.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="as-d">Prazo (opcional)</Label><Input id="as-d" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></div>
        <Button type="submit" className="w-fit">Atribuir</Button>
      </form>
      {assignments.length > 0 && (
        <ul className="mt-5 space-y-2 border-t pt-4 text-sm">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <span className="flex-1"><strong>{trailTitle(a.collection_id)}</strong> · {name(a.user_id)}{a.due_date ? ` · até ${fmtDate(a.due_date)}` : ""}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remover atribuição" onClick={async () => { await supabase.from("path_assignments").delete().eq("id", a.id); onDone(); }}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Invite = { id: string; email: string | null; token: string; expires_at: string; max_uses: number; uses: number };

function Invites({ orgId, invites, onDone }: { orgId: string; invites: Invite[]; onDone: () => void }) {
  const [f, setF] = useState({ email: "", days: 14, uses: 10 });
  const link = (t: string) => `${window.location.origin}/convite/${t}`;
  const create = async () => {
    const email = f.email.trim() || null;
    const { data, error } = await supabase.from("org_invites").insert({
      organization_id: orgId, email, max_uses: email ? 1 : Math.max(1, f.uses),
      expires_at: new Date(Date.now() + Math.max(1, f.days) * 86400000).toISOString(),
    }).select().single();
    if (error) { toast.error(errMsg(error)); return; }
    await navigator.clipboard?.writeText(link(data.token)).catch(() => undefined);
    toast.success("Convite criado e link copiado");
    if (email) window.location.href = `mailto:${email}?subject=${encodeURIComponent("Convite para a VITIS")}&body=${encodeURIComponent(`Olá! Entre na VITIS com sua conta e aceite o convite da equipe:\n${link(data.token)}`)}`;
    setF({ email: "", days: 14, uses: 10 }); onDone();
  };
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-1 text-lg font-bold">Convidar funcionários</h2>
      <p className="mb-4 text-sm text-muted-foreground">Clientes criam a conta com e-mail e senha; colaboradores entram com o Google da empresa. Depois, abrem o link do convite.</p>
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <div className="space-y-1 sm:col-span-3"><Label htmlFor="iv-e">E-mail (deixe vazio para gerar um link da equipe)</Label><Input id="iv-e" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="pessoa@exemplo.com" /></div>
        <div className="space-y-1"><Label htmlFor="iv-d">Validade (dias)</Label><Input id="iv-d" type="number" min={1} max={90} value={f.days} onChange={(e) => setF({ ...f, days: Number(e.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="iv-u">Limite de usos</Label><Input id="iv-u" type="number" min={1} max={500} disabled={!!f.email} value={f.email ? 1 : f.uses} onChange={(e) => setF({ ...f, uses: Number(e.target.value) })} /></div>
        <Button type="submit" className="self-end">{f.email ? <><Mail className="mr-1 h-4 w-4" /> Convidar</> : "Gerar link"}</Button>
      </form>
      {invites.length > 0 && (
        <ul className="mt-5 space-y-2 border-t pt-4 text-sm">
          {invites.map((i) => {
            const expired = new Date(i.expires_at) < new Date() || i.uses >= i.max_uses;
            return (
              <li key={i.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{i.email ?? "Link da equipe"}</span><span className="font-meta text-muted-foreground">{i.uses}/{i.max_uses} usos · {expired ? "encerrado" : `até ${fmtDate(i.expires_at)}`}</span></span>
                {!expired && <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Copiar link do convite" onClick={() => navigator.clipboard.writeText(link(i.token)).then(() => toast.success("Link copiado"))}><Copy className="h-4 w-4" /></Button>}
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Excluir convite" onClick={async () => { await supabase.from("org_invites").delete().eq("id", i.id); onDone(); }}><Trash2 className="h-4 w-4" /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
