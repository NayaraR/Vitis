import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Archive, CalendarClock, FlaskConical, Pencil } from "lucide-react";
import { AppShell } from "@/components/vitis/AppShell";
import { ArticleBody } from "@/components/vitis/ArticleBody";
import { Attachments, FeedbackBox, History, MetaPanel, nextReviewRow } from "@/components/vitis/ArticleParts";
import { ExampleBadge, StatusBadge, TypeBadge } from "@/components/vitis/Badges";
import { ListSkeleton, NoAccessState } from "@/components/vitis/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/data";
import { useMe } from "@/lib/me";
import { AUDIENCES, VISIBILITIES, fmtDate, isOverdue } from "@/lib/labels";
import { pageHead } from "@/lib/head";
import { FavoriteButton, MarkReadButton, useTrackOpen } from "@/components/vitis/ReadActions";
import { TrailNav, TrailCompleteBar } from "@/components/vitis/TrailNav";
import { SupportCta, useSupportContext } from "@/components/vitis/Support";

type S = { trilha?: string | undefined };
export const Route = createFileRoute("/_authenticated/artigo/$slug")({
  validateSearch: (s: Record<string, unknown>): S => (typeof s["trilha"] === "string" ? { trilha: s["trilha"] } : {}),
  head: () => pageHead("Artigo", "Conteúdo oficial da central de conhecimento VITIS."),
  component: ArticlePage,
});

function Banner({ tone, icon, children }: { tone: "example" | "critical" | "warning"; icon: React.ReactNode; children: React.ReactNode }) {
  const cls = tone === "example" ? "border-example/40 bg-example-soft text-example" : tone === "critical" ? "border-destructive/40 bg-critical-soft text-destructive" : "border-warning/40 bg-warning-soft text-warning";
  return <div role="status" className={`mb-3 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${cls}`}>{icon}{children}</div>;
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: me } = useMe();
  const settings = useSettings();
  const q = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data: a, error } = await supabase
        .from("articles")
        .select("*, categories(name,slug,parent_id), areas(name)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!a) return null;
      const [sys, tags, att, parent, approver] = await Promise.all([
        supabase.from("article_systems").select("systems(name,slug)").eq("article_id", a.id),
        supabase.from("article_tags").select("tags(name)").eq("article_id", a.id),
        supabase.from("article_attachments").select("*").eq("article_id", a.id).order("sort_order"),
        a.categories?.parent_id ? supabase.from("categories").select("name,slug").eq("id", a.categories.parent_id).maybeSingle() : Promise.resolve({ data: null }),
        a.approved_by ? supabase.from("profiles").select("full_name,email").eq("id", a.approved_by).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return {
        a,
        systems: (sys.data ?? []).map((x) => x.systems).filter(Boolean) as { name: string; slug: string }[],
        tags: (tags.data ?? []).map((x) => x.tags?.name).filter(Boolean) as string[],
        attachments: att.data ?? [],
        parent: parent.data as { name: string; slug: string } | null,
        approver: approver.data ? approver.data.full_name || approver.data.email : null,
      };
    },
  });

  const id = q.data?.a.id;
  useEffect(() => {
    if (id) supabase.rpc("increment_view", { p_article: id });
  }, [id]);
  useTrackOpen(id, q.data?.a.status === "published");
  const { trilha } = Route.useSearch();
  useSupportContext({ article: q.data?.a.title, system: q.data?.systems.map((x) => x.name).join(", ") || undefined });

  if (q.isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!q.data) return <AppShell><NoAccessState>Este conteúdo não existe ou não está disponível para o seu perfil.</NoAccessState></AppShell>;
  const { a, systems, tags, attachments, parent, approver } = q.data;
  const overdue = isOverdue(a.status, a.next_review_at);
  if (overdue && settings.data && !settings.data.show_overdue && !me?.isEditor) {
    return <AppShell><NoAccessState>Este conteúdo está em revisão pela área responsável e voltará em breve.</NoAccessState></AppShell>;
  }
  const notLive = a.status !== "published" && a.status !== "archived";

  return (
    <AppShell>
      <nav aria-label="Trilha" className="mb-4 text-sm text-muted-foreground">
        <Link to="/inicio" className="hover:underline">Início</Link>
        {parent && <> / <Link to="/categoria/$slug" params={{ slug: parent.slug }} className="hover:underline">{parent.name}</Link></>}
        {a.categories && <> / <Link to="/categoria/$slug" params={{ slug: a.categories.slug }} className="hover:underline">{a.categories.name}</Link></>}
      </nav>

      {a.is_example && <Banner tone="example" icon={<FlaskConical className="h-4 w-4" />}>Conteúdo de demonstração — não é instrução real.</Banner>}
      {a.status === "archived" && <Banner tone="critical" icon={<Archive className="h-4 w-4" />}>Arquivado: não é instrução vigente.</Banner>}
      {overdue && <Banner tone="warning" icon={<CalendarClock className="h-4 w-4" />}>Revisão necessária desde {fmtDate(a.next_review_at)}.</Banner>}
      {notLive && <Banner tone="warning" icon={<Pencil className="h-4 w-4" />}>Pré-visualização editorial: este conteúdo ainda não está publicado.</Banner>}

      {trilha && a.status === "published" && <TrailNav trailSlug={trilha} articleId={a.id} />}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {a.is_example && <ExampleBadge />}
          <StatusBadge status={a.status} nextReview={a.next_review_at} />
          <TypeBadge type={a.content_type} />
          {a.audience.map((x) => <Badge key={x} variant="muted">{AUDIENCES[x as keyof typeof AUDIENCES] ?? x}</Badge>)}
        </div>
        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{a.title}</h1>
        {a.summary && <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{a.summary}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {systems.map((s) => (
            <Link key={s.slug} to="/sistemas/$slug" params={{ slug: s.slug }} className="rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground hover:underline">{s.name}</Link>
          ))}
          {tags.map((t) => (
            <Link key={t} to="/biblioteca" search={{ q: t }} className="rounded-full border px-3 py-1 text-muted-foreground hover:border-primary hover:text-primary">#{t}</Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
        {a.status === "published" && <FavoriteButton articleId={a.id} />}
        {me?.isEditor && (
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/editor" search={{ id: a.id }}><Pencil className="mr-1 h-3.5 w-3.5" /> Editar (nova versão)</Link>
          </Button>
        )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-10">
          <ArticleBody c={a} />
          <Attachments items={attachments} />
          <History articleId={a.id} />
          {a.status === "published" && (trilha ? <TrailCompleteBar trailSlug={trilha} articleId={a.id} /> : <MarkReadButton articleId={a.id} />)}
          {a.status === "published" && <FeedbackBox articleId={a.id} />}
          <SupportCta />
        </div>
        <div className="lg:sticky lg:top-32 lg:self-start">
          <MetaPanel
            rows={[
              { label: "Versão vigente", value: a.version_label ? `v${a.version_label}` : "—" },
              { label: "Publicado em", value: fmtDate(a.published_at) },
              { label: "Revisado em", value: fmtDate(a.reviewed_at) },
              nextReviewRow(a.status, a.next_review_at),
              { label: "Área responsável", value: a.areas?.name },
              { label: "Aprovado por", value: approver },
              { label: "Contato", value: a.contact },
              ...(me?.isInternal ? [{ label: "Visibilidade", value: VISIBILITIES[a.visibility] }] : []),
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
