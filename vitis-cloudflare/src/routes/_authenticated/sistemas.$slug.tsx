import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/vitis/AppShell";
import { ArticleCard } from "@/components/vitis/ArticleCard";
import { CoverGridCard, type CoverItem } from "@/components/vitis/CoverCard";
import { SystemIcon } from "@/components/vitis/SystemIcon";
import { CardsSkeleton, EmptyState, NoAccessState, OrganizingState } from "@/components/vitis/States";
import { ExampleBadge } from "@/components/vitis/Badges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSearch } from "@/lib/data";
import { useMe } from "@/lib/me";
import { useCoverUrls } from "@/lib/covers";
import { useMyReads, progressOf } from "@/lib/reads";
import { loadCollectionArticles } from "@/lib/collection-items";
import { fmtDate } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/sistemas/$slug")({
  head: () => pageHead("Sistema", "Onboarding, guias e novidades de um sistema usado nas lojas."),
  component: SystemPage,
});

function Grid({ list, urls, done, ordered }: { list: CoverItem[]; urls: Record<string, string>; done?: Set<string>; ordered?: boolean }) {
  if (!list.length) return <EmptyState title="Conteúdos sendo organizados">Ainda não há conteúdos publicados aqui.</EmptyState>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((a, i) => <CoverGridCard key={a.id} a={a} imageUrl={a.cover_image ? urls[a.cover_image] : undefined} index={ordered ? i : undefined} done={done?.has(a.id)} />)}
    </div>
  );
}

function SystemPage() {
  const { slug } = Route.useParams();
  const { data: me } = useMe();
  const reads = useMyReads();
  const q = useQuery({
    queryKey: ["system-page", slug],
    queryFn: async () => {
      const { data: sys, error } = await supabase.from("systems").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!sys) return null;
      const { data: cols } = await supabase.from("collections").select("*").eq("system_id", sys.id).eq("active", true).order("sort_order");
      const onb = (cols ?? []).filter((c) => c.kind === "onboarding");
      const gui = (cols ?? []).filter((c) => c.kind !== "onboarding");
      const [onbList, guiList] = await Promise.all([
        Promise.all(onb.map(loadCollectionArticles)).then((x) => x.flat()),
        Promise.all(gui.map(loadCollectionArticles)).then((x) => x.flat()),
      ]);
      const uniq = (l: CoverItem[]) => l.filter((a, i) => l.findIndex((b) => b.id === a.id) === i);
      const { data: links } = await supabase.from("article_systems").select("article_id").eq("system_id", sys.id);
      const ids = (links ?? []).map((l) => l.article_id);
      const news = ids.length
        ? (await supabase.from("article_versions").select("id,version_label,change_summary,published_at,articles!inner(slug,title,is_example,status)").in("article_id", ids).eq("articles.status", "published").order("published_at", { ascending: false }).limit(20)).data ?? []
        : [];
      return { sys, onboarding: uniq(onbList), guides: uniq(guiList), firstCollection: onb[0] ?? gui[0] ?? null, news };
    },
  });
  const all = useSearch({ sys: q.data?.sys.id }, 100);
  const urls = useCoverUrls([...(q.data?.onboarding ?? []), ...(q.data?.guides ?? [])].map((a) => a.cover_image));

  if (q.isLoading) return <AppShell><CardsSkeleton /></AppShell>;
  if (!q.data) return <AppShell><NoAccessState>Este sistema não existe ou não está disponível para o seu perfil.</NoAccessState></AppShell>;
  const { sys, onboarding, guides, news, firstCollection } = q.data;
  const prog = progressOf(onboarding.map((a) => a.id), reads.data);
  const canWrite = me?.isAuthor || me?.isCurator;

  return (
    <AppShell>
      <nav aria-label="Trilha" className="mb-3 text-sm text-muted-foreground">
        <Link to="/sistemas" className="hover:underline">Sistemas</Link> / <span className="text-foreground">{sys.name}</span>
      </nav>
      <section className="relative isolate mb-6 overflow-hidden rounded-3xl bg-cover-dark p-6 text-topbar-foreground md:p-10">
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 -z-10 h-full w-full">
          <path d="M100 0 L72 0 C72 30 84 50 100 55 Z" className="fill-cover-shape-2" />
          <path d="M100 100 L100 72 C90 74 84 86 83 100 Z" className="fill-cover-shape" />
        </svg>
        <div className="flex flex-wrap items-center gap-4">
          <SystemIcon s={sys} className="h-16 w-16 bg-card" />
          <div className="min-w-0 flex-1">
            <p className="font-meta uppercase tracking-[0.2em] text-cover-dark-fg">Sistema{!sys.active && " · desativado"}</p>
            <h1 className="text-3xl font-extrabold md:text-4xl">{sys.name}</h1>
            {sys.description && <p className="mt-1 max-w-2xl opacity-90">{sys.description}</p>}
          </div>
          {canWrite && (
            <Button asChild className="rounded-full bg-topbar-foreground text-topbar hover:bg-topbar-foreground/90">
              <Link to="/admin/editor" search={{ system: sys.id, collection: firstCollection?.id }}><Plus className="mr-1 h-4 w-4" /> Novo artigo para este sistema</Link>
            </Button>
          )}
        </div>
      </section>

      <Tabs defaultValue={onboarding.length ? "onboarding" : "todos"}>
        <TabsList className="mb-5 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="guias">Guias</TabsTrigger>
          <TabsTrigger value="todos">Todos os artigos</TabsTrigger>
          <TabsTrigger value="novidades">Novidades do sistema</TabsTrigger>
        </TabsList>
        <TabsContent value="onboarding">
          {onboarding.length > 0 && (
            <div className="mb-5 max-w-md">
              <p className="mb-2 text-sm font-semibold">{prog.count} de {prog.total} concluídos</p>
              <Progress value={(prog.count / prog.total) * 100} aria-label="Progresso do onboarding" />
            </div>
          )}
          <Grid list={onboarding} urls={urls} done={prog.done} ordered />
        </TabsContent>
        <TabsContent value="guias"><Grid list={guides} urls={urls} /></TabsContent>
        <TabsContent value="todos">
          {all.isLoading ? <CardsSkeleton n={3} /> : all.data?.length ? (
            <div className="grid gap-3 md:grid-cols-2">{all.data.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
          ) : <OrganizingState />}
        </TabsContent>
        <TabsContent value="novidades">
          {news.length ? (
            <ul className="space-y-4 rounded-2xl border bg-card p-5">
              {news.map((v) => (
                <li key={v.id}>
                  <Link to="/artigo/$slug" params={{ slug: v.articles.slug }} className="block hover:text-primary">
                    <span className="font-meta text-muted-foreground">{fmtDate(v.published_at)} · v{v.version_label}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 font-semibold">{v.articles.is_example && <ExampleBadge />}{v.articles.title}</span>
                    {v.change_summary && <span className="block text-sm text-muted-foreground">{v.change_summary}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Sem novidades">Nenhuma alteração publicada para este sistema ainda.</EmptyState>}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
