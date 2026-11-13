import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Sprout } from "lucide-react";
import { AppShell } from "@/components/vitis/AppShell";
import { LevelBadge, ProgressRing, TrailCard, TrailCover } from "@/components/vitis/Trail";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/vitis/States";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSettings, useSystems } from "@/lib/data";
import { useMe } from "@/lib/me";
import { useMyReads } from "@/lib/reads";
import { LEVELS, audienceFits, fmtMinutes, trailProgress, useMyAssignments, useTrails, type Trail } from "@/lib/trails";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/cultivo/")({
  head: () => pageHead("Cultivo", "Trilhas de capacitação da VITIS para você e sua equipe."),
  component: Cultivo,
});

const sel = "h-10 rounded-lg border bg-background px-3 text-sm";

function Cultivo() {
  const { data: me } = useMe();
  const settings = useSettings();
  const trails = useTrails();
  const reads = useMyReads();
  const systems = useSystems();
  const assigned = useMyAssignments(me?.userId, me?.organizationId);
  const [sys, setSys] = useState("");
  const [lvl, setLvl] = useState("");
  const name = settings.data?.learning_name || "Cultivo";

  const rows = useMemo(() => (trails.data ?? []).map((t) => ({ t, p: trailProgress(t, reads.data), due: assigned.data?.find((a) => a.collection_id === t.id)?.due_date })), [trails.data, reads.data, assigned.data]);
  const filtered = rows.filter(({ t }) => (!sys || t.system_id === sys) && (!lvl || t.level === lvl));
  const usedSystems = (systems.data ?? []).filter((s) => s.active && rows.some((r) => r.t.system_id === s.id));

  const fits = (t: Trail) => audienceFits(t.audience, !!me?.isInternal);
  const recommended =
    rows.find((r) => r.due !== undefined && r.p.state !== "done") ??
    rows.find((r) => r.p.state === "in_progress") ??
    rows.find((r) => fits(r.t) && r.p.state === "not_started" && r.t.level === "beginner") ??
    rows.find((r) => fits(r.t) && r.p.state !== "done");
  const continuing = filtered.filter((r) => r.p.state === "in_progress");
  const startHere = filtered.filter((r) => r.p.state === "not_started" && r.t.level === "beginner" && fits(r.t));

  return (
    <AppShell>
      <header className="mb-6">
        <p className="flex items-center gap-2 font-meta font-semibold uppercase tracking-[0.18em] text-primary"><Sprout className="h-4 w-4" aria-hidden /> Capacitação</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{name}</h1>
        <p className="mt-1 text-muted-foreground">Trilhas de capacitação para você e sua equipe</p>
      </header>

      {trails.isLoading ? <CardsSkeleton /> : trails.error ? <ErrorState /> : rows.length === 0 ? (
        <EmptyState title="Trilhas sendo cultivadas">Ainda não há trilhas publicadas para o seu perfil.</EmptyState>
      ) : (
        <div className="space-y-10">
          {recommended && (
            <TrailCover t={recommended.t} className="rounded-3xl">
              <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-10">
                <div className="max-w-2xl">
                  <p className="font-meta font-semibold uppercase tracking-[0.2em] opacity-90">{recommended.due !== undefined ? "Atribuída a você" : "Recomendada para você"}</p>
                  <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl">{recommended.t.title}</h2>
                  {recommended.t.description && <p className="mt-2 opacity-90">{recommended.t.description}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <LevelBadge level={recommended.t.level} />
                    <span>{recommended.t.modules.length} módulos · {fmtMinutes(recommended.t.minutes)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-background p-1"><ProgressRing pct={recommended.p.pct} size={56} /></span>
                  <Button asChild size="lg" className="rounded-full">
                    <Link to="/cultivo/$slug" params={{ slug: recommended.t.slug }}><Play className="mr-2 h-4 w-4 fill-current" aria-hidden /> {recommended.p.state === "in_progress" ? "Continuar" : "Começar"}</Link>
                  </Button>
                </div>
              </div>
            </TrailCover>
          )}

          <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Filtros de trilhas">
            <div className="space-y-1"><Label htmlFor="f-sys">Sistema</Label>
              <select id="f-sys" className={sel} value={sys} onChange={(e) => setSys(e.target.value)}><option value="">Todos</option>{usedSystems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="space-y-1"><Label htmlFor="f-lvl">Nível</Label>
              <select id="f-lvl" className={sel} value={lvl} onChange={(e) => setLvl(e.target.value)}><option value="">Todos</option>{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {(sys || lvl) && <Button variant="ghost" onClick={() => { setSys(""); setLvl(""); }}>Limpar filtros</Button>}
          </div>

          {continuing.length > 0 && <Grid title="Continuar de onde parei" rows={continuing} />}
          {startHere.length > 0 && <Grid title="Comece por aqui" rows={startHere} />}
          {filtered.length ? <Grid title="Todas as trilhas" rows={filtered} /> : <EmptyState title="Nenhuma trilha com esses filtros">Tente outro sistema ou nível.</EmptyState>}
        </div>
      )}
    </AppShell>
  );
}

function Grid({ title, rows }: { title: string; rows: { t: Trail; p: { pct: number }; due?: string | null | undefined }[] }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map(({ t, p, due }) => <TrailCard key={t.id} t={t} pct={p.pct} due={due} />)}</div>
    </section>
  );
}
