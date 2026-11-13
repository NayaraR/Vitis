import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { AppShell, AreaBand } from "@/components/vitis/AppShell";
import { ListSkeleton, NoAccessState, ErrorState } from "@/components/vitis/States";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/me";
import { STATUSES } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Números agregados do acervo VITIS para curadoria."),
  component: Dashboard,
});

type Stats = { by_status: Record<string, number>; overdue: number; open_feedback: number; top: { title: string; slug: string; view_count: number }[] };

function Bars({ rows, label }: { rows: { label: string; value: number; to?: string }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure aria-label={label}>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-sm">
            <span className="truncate" title={r.label}>{r.to ? <Link to="/artigo/$slug" params={{ slug: r.to }} className="hover:text-primary hover:underline">{r.label}</Link> : r.label}</span>
            <span className="h-6 rounded-md bg-muted"><span className="block h-full rounded-md bg-primary" style={{ width: `${(r.value / max) * 100}%` }} /></span>
            <span className="text-right font-meta">{r.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Dashboard() {
  const { data: me, isLoading } = useMe();
  const q = useQuery({
    queryKey: ["dashboard"],
    enabled: !!me?.isCurator,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  if (isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!me?.isCurator) return <AppShell><NoAccessState>O dashboard está disponível para curadoria e administração.</NoAccessState></AppShell>;
  const s = q.data;
  return (
    <AppShell>
      <AreaBand title="Dashboard" icon={BarChart3} />
      <p className="mb-6 text-sm text-muted-foreground">Somente números agregados — nenhum dado pessoal.</p>
      {q.isLoading ? <ListSkeleton /> : q.error || !s ? <ErrorState /> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { l: "Publicados", v: s.by_status["published"] ?? 0 },
              { l: "Revisões vencidas", v: s.overdue },
              { l: "Feedback em aberto", v: s.open_feedback },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">{k.l}</p><p className="mt-1 font-display text-3xl font-extrabold">{k.v}</p></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="mb-4 font-bold">Artigos por status</h2>
              <Bars label="Artigos por status" rows={Object.keys(STATUSES).filter((k) => k in s.by_status || ["draft", "in_review", "approved", "published", "archived"].includes(k)).filter((k) => !["returned", "discarded"].includes(k)).map((k) => ({ label: STATUSES[k as keyof typeof STATUSES], value: s.by_status[k] ?? 0 }))} />
            </section>
            <section className="rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="mb-4 font-bold">Mais consultados</h2>
              <Bars label="Mais consultados por visualizações" rows={s.top.map((t) => ({ label: t.title, value: t.view_count, to: t.slug }))} />
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
