import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Highlight } from "./Highlight";
import { ExampleBadge, StatusBadge, TypeBadge } from "./Badges";
import { fmtDate } from "@/lib/labels";

export type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category_name?: string | null;
  content_type: string;
  version_label: string | null;
  reviewed_at: string | null;
  next_review_at: string | null;
  status: string;
  is_example: boolean;
};

export function ArticleCard({ a, query, compact }: { a: ArticleListItem; query?: string | undefined; compact?: boolean | undefined }) {
  return (
    <Link
      to="/artigo/$slug"
      params={{ slug: a.slug }}
      className="group block rounded-xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {a.is_example && <ExampleBadge />}
        <TypeBadge type={a.content_type} />
        {a.status !== "published" || a.next_review_at ? <StatusBadge status={a.status} nextReview={a.next_review_at} /> : null}
        {a.category_name && <span className="text-xs text-muted-foreground">{a.category_name}</span>}
      </div>
      <h3 className="flex items-start justify-between gap-2 font-display text-base font-bold leading-snug">
        <span><Highlight text={a.title} query={query} /></span>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden />
      </h3>
      {!compact && a.summary && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          <Highlight text={a.summary} query={query} />
        </p>
      )}
      <div className="mt-3 flex gap-3 font-meta text-muted-foreground">
        {a.version_label && <span>v{a.version_label}</span>}
        <span>revisado {fmtDate(a.reviewed_at)}</span>
      </div>
    </Link>
  );
}
