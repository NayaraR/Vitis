import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { AppShell, AreaBand } from "@/components/vitis/AppShell";
import { CoverCarousel } from "@/components/vitis/CoverCarousel";
import { NewsCard, CoverGridCard, COVER_SELECT, type CoverItem } from "@/components/vitis/CoverCard";
import { CardsSkeleton, EmptyState } from "@/components/vitis/States";
import { ExampleBadge } from "@/components/vitis/Badges";
import { supabase } from "@/integrations/supabase/client";
import { useCoverUrls } from "@/lib/covers";
import { fmtDate } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => pageHead("Comunicados e avisos", "Últimas notícias, comunicados e atualizações da sua organização na VITIS."),
  component: Home,
});

function Home() {
  const news = useQuery({
    queryKey: ["home-carousel"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select(COVER_SELECT)
        .eq("status", "published").or("content_type.eq.announcement,featured.eq.true")
        .order("published_at", { ascending: false }).limit(12);
      if (error) throw error;
      return data as CoverItem[];
    },
  });
  const top = useQuery({
    queryKey: ["most-viewed-covers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select(COVER_SELECT)
        .eq("status", "published").order("view_count", { ascending: false }).limit(6);
      if (error) throw error;
      return data as CoverItem[];
    },
  });
  const updates = useQuery({
    queryKey: ["home-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("article_versions")
        .select("id,version_label,change_summary,published_at,articles!inner(slug,title,is_example,status)")
        .eq("articles.status", "published").order("published_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });
  const urls = useCoverUrls([...(news.data ?? []), ...(top.data ?? [])].map((a) => a.cover_image));

  return (
    <AppShell>
      <AreaBand title="Mural" icon={Megaphone} />
      <section aria-labelledby="noticias" className="mb-12">
        <h2 id="noticias" className="text-2xl font-extrabold">Notícias</h2>
        <p className="mb-2 text-muted-foreground">Essas são as últimas notícias da sua organização.</p>
        {news.isLoading ? <CardsSkeleton n={4} /> : !news.data?.length ? (
          <EmptyState title="Nenhum comunicado publicado">Os comunicados aparecerão aqui assim que forem publicados.</EmptyState>
        ) : (
          <CoverCarousel label="Notícias">
            {news.data.map((a) => <NewsCard key={a.id} a={a} imageUrl={a.cover_image ? urls[a.cover_image] : undefined} />)}
          </CoverCarousel>
        )}
      </section>

      <div className="grid gap-10 xl:grid-cols-3">
        <section className="xl:col-span-2" aria-labelledby="mais">
          <h2 id="mais" className="mb-4 text-xl font-bold">Mais consultados</h2>
          {top.isLoading ? <CardsSkeleton n={3} /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {top.data?.map((a) => <CoverGridCard key={a.id} a={a} imageUrl={a.cover_image ? urls[a.cover_image] : undefined} />)}
            </div>
          )}
        </section>
        <section aria-labelledby="atual" className="rounded-2xl border bg-card p-5 shadow-card xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="atual" className="font-bold">Atualizações recentes</h2>
            <Link to="/novidades" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <ul className="space-y-4">
            {updates.data?.map((v) => (
              <li key={v.id}>
                <Link to="/artigo/$slug" params={{ slug: v.articles.slug }} className="block hover:text-primary">
                  <span className="font-meta text-muted-foreground">{fmtDate(v.published_at)} · v{v.version_label}</span>
                  <span className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold">{v.articles.is_example && <ExampleBadge />}{v.articles.title}</span>
                  {v.change_summary && <span className="mt-0.5 block text-sm text-muted-foreground">{v.change_summary}</span>}
                </Link>
              </li>
            ))}
            {updates.data?.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma atualização ainda.</li>}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
