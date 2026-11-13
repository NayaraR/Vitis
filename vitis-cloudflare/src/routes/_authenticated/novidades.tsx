import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NEWS_SEEN_KEY } from "@/components/vitis/AppShell";
import { AppShell, PageHeader } from "@/components/vitis/AppShell";
import { ListSkeleton, ErrorState, EmptyState } from "@/components/vitis/States";
import { ExampleBadge, TypeBadge } from "@/components/vitis/Badges";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/novidades")({
  head: () => pageHead("Novidades", "Comunicados e alterações recentes nos conteúdos oficiais."),
  component: News,
});

const KIND: Record<string, string> = { publish: "Nova versão", review_confirmed: "Revisão confirmada", archived: "Arquivado", restored: "Restaurado" };

function News() {
  useEffect(() => localStorage.setItem(NEWS_SEEN_KEY, new Date().toISOString()), []);
  const q = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_versions")
        .select("id,version_label,change_summary,published_at,kind,articles!inner(slug,title,summary,content_type,is_example,status)")
        .order("published_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });
  return (
    <AppShell>
      <PageHeader title="Novidades" subtitle="Comunicados e o que mudou recentemente." />
      {q.isLoading ? <ListSkeleton /> : q.error ? <ErrorState /> : !q.data?.length ? <EmptyState title="Sem novidades por enquanto" /> : (
        <ol className="relative space-y-4 border-l pl-6">
          {q.data.map((n) => (
            <li key={n.id} className="relative">
              <span className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden />
              <Link to="/artigo/$slug" params={{ slug: n.articles.slug }} className="block rounded-xl border bg-card p-4 shadow-card hover:border-primary/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-meta text-muted-foreground">{fmtDate(n.published_at)}</span>
                  <Badge variant={n.articles.content_type === "announcement" ? "brand" : "muted"}>{n.articles.content_type === "announcement" ? "Comunicado" : KIND[n.kind] ?? n.kind}</Badge>
                  <TypeBadge type={n.articles.content_type} />
                  {n.articles.is_example && <ExampleBadge />}
                  <span className="font-meta text-muted-foreground">v{n.version_label}</span>
                </div>
                <h2 className="mt-2 font-display font-bold">{n.articles.title}</h2>
                <p className="text-sm text-muted-foreground">{n.change_summary}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
