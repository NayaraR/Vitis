import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Footprints, Timer, Trophy } from "lucide-react";
import { AppShell, AreaBand } from "@/components/vitis/AppShell";
import { CoverGridCard, COVER_SELECT, type CoverItem } from "@/components/vitis/CoverCard";
import { TrailCard } from "@/components/vitis/Trail";
import { CardsSkeleton, EmptyState } from "@/components/vitis/States";
import { supabase } from "@/integrations/supabase/client";
import { useCoverUrls } from "@/lib/covers";
import { useMe } from "@/lib/me";
import { useMyReads } from "@/lib/reads";
import { dayOf, fmtMinutes, studyStreak, trailProgress, useMyCertificates, useTrails } from "@/lib/trails";
import { fmtDate, todayISO } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/jornada")({
  head: () => pageHead("Minha jornada", "Seu progresso nas trilhas, certificados e favoritos na VITIS."),
  component: Journey,
});

function Journey() {
  const { data: me } = useMe();
  const trails = useTrails();
  const reads = useMyReads();
  const certs = useMyCertificates(me?.userId);
  const mine = useQuery({
    queryKey: ["mine", me?.userId],
    enabled: !!me,
    queryFn: async () => {
      const [f, r] = await Promise.all([
        supabase.from("article_favorites").select(`created_at, articles!inner(${COVER_SELECT})`).eq("user_id", me!.userId).eq("articles.status", "published").order("created_at", { ascending: false }),
        supabase.from("article_reads").select(`read_at, completed, articles!inner(${COVER_SELECT}, estimated_minutes)`).eq("user_id", me!.userId).eq("articles.status", "published").order("read_at", { ascending: false }).limit(60),
      ]);
      return {
        favs: (f.data ?? []).map((x) => x.articles as unknown as CoverItem),
        reads: (r.data ?? []).map((x) => ({ a: x.articles as unknown as CoverItem & { estimated_minutes: number }, done: x.completed })),
      };
    },
  });
  const urls = useCoverUrls([...(mine.data?.favs ?? []), ...(mine.data?.reads.map((x) => x.a) ?? [])].map((a) => a.cover_image));
  const u = (a: CoverItem) => (a.cover_image ? urls[a.cover_image] : undefined);

  const rows = (trails.data ?? []).map((t) => ({ t, p: trailProgress(t, reads.data) }));
  const going = rows.filter((r) => r.p.state === "in_progress");
  const done = rows.filter((r) => r.p.state === "done");
  const month = todayISO().slice(0, 7);
  const minutesById = new Map((mine.data?.reads ?? []).map((x) => [x.a.id, x.a.estimated_minutes ?? 0]));
  const completed = (reads.data ?? []).filter((r) => r.completed);
  const monthMinutes = completed.filter((r) => dayOf(r.completed_at ?? r.read_at).startsWith(month)).reduce((s, r) => s + (minutesById.get(r.article_id) ?? 0), 0);
  const streak = studyStreak((reads.data ?? []).flatMap((r) => [dayOf(r.read_at), ...(r.completed_at ? [dayOf(r.completed_at)] : [])]), todayISO());

  const stats = [
    { icon: Timer, label: "Minutos estudados no mês", value: fmtMinutes(monthMinutes) },
    { icon: Flame, label: "Sequência de dias de estudo", value: `${streak} ${streak === 1 ? "dia" : "dias"}` },
    { icon: Trophy, label: "Trilhas concluídas", value: String(done.length) },
    { icon: Award, label: "Certificados", value: String(certs.data?.length ?? 0) },
  ];

  return (
    <AppShell>
      <AreaBand title="Minha jornada" icon={Footprints} />
      <ul className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="rounded-2xl border bg-card p-4">
            <s.icon className="h-5 w-5 text-primary" aria-hidden />
            <p className="mt-2 font-display text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </li>
        ))}
      </ul>
      {trails.isLoading || mine.isLoading ? <CardsSkeleton /> : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-xl font-bold">Estou estudando</h2>
            {going.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{going.map(({ t, p }) => <TrailCard key={t.id} t={t} pct={p.pct} />)}</div>
              : <EmptyState title="Nenhuma trilha em andamento"><Link to="/cultivo" className="text-primary underline">Escolha uma trilha no Cultivo</Link>.</EmptyState>}
          </section>
          {done.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Concluídas</h2>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{done.map(({ t, p }) => <TrailCard key={t.id} t={t} pct={p.pct} />)}</div>
            </section>
          )}
          <section>
            <h2 className="mb-4 text-xl font-bold">Conquistas e certificados</h2>
            {certs.data?.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {certs.data.map((c) => (
                  <li key={c.id}><Link to="/certificado/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:border-primary">
                    <Award className="h-8 w-8 shrink-0 text-primary" aria-hidden />
                    <span><span className="block font-semibold">{c.path_title}</span><span className="font-meta text-muted-foreground">{fmtDate(c.issued_at)} · {c.code}</span></span>
                  </Link></li>
                ))}
              </ul>
            ) : <EmptyState title="Nenhum certificado ainda">Conclua uma trilha para receber o primeiro.</EmptyState>}
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold">Favoritos</h2>
            {mine.data?.favs.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{mine.data.favs.map((a) => <CoverGridCard key={a.id} a={a} imageUrl={u(a)} />)}</div>
              : <EmptyState title="Nenhum favorito ainda">Use o botão “Favoritar” em um artigo para guardá-lo aqui.</EmptyState>}
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold">Lidos recentemente</h2>
            {mine.data?.reads.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{mine.data.reads.slice(0, 9).map(({ a, done: d }) => <CoverGridCard key={a.id} a={a} imageUrl={u(a)} done={d} />)}</div>
              : <EmptyState title="Nada lido ainda">Os conteúdos que você abrir aparecerão aqui.</EmptyState>}
          </section>
        </div>
      )}
    </AppShell>
  );
}
