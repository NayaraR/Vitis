import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { CoverArt, coverLabel, type CoverData } from "./Cover";
import { fmtDate } from "@/lib/labels";

export type CoverItem = CoverData & {
  id: string; slug: string; summary?: string | null; version_label?: string | null; reviewed_at?: string | null; featured?: boolean | null;
};

export const COVER_SELECT = "id,slug,title,summary,content_type,version_label,reviewed_at,next_review_at,status,is_example,cover_image,cover_label,cover_style,event_at,published_at,view_count,featured";

/** Large square card for the news carousel. */
export function NewsCard({ a, imageUrl }: { a: CoverItem; imageUrl?: string | undefined }) {
  return (
    <Link to="/artigo/$slug" params={{ slug: a.slug }} className="group block w-[78vw] max-w-[375px] shrink-0 snap-start rounded-[28px] focus-visible:outline-offset-4 sm:w-[340px] lg:w-[max(270px,calc((100%-3.75rem)/4))]">
      <CoverArt a={a} imageUrl={imageUrl} className="aspect-square rounded-[28px] shadow-card transition group-hover:shadow-lift motion-safe:group-hover:-translate-y-1" />
    </Link>
  );
}

/** 16:9 grid card with label, title, summary, version and review date. */
export function CoverGridCard({ a, imageUrl, done, index }: { a: CoverItem; imageUrl?: string | undefined; done?: boolean | undefined; index?: number | undefined }) {
  return (
    <Link to="/artigo/$slug" params={{ slug: a.slug }} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition hover:shadow-lift">
      <CoverArt a={{ ...a, title: "" }} imageUrl={imageUrl} size="sm" className="aspect-video" />
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-2 font-meta font-semibold tracking-wider text-primary">
          {index !== undefined && <span className="text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>}
          {coverLabel(a)}
          {done && <span className="ml-auto flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Concluído</span>}
        </p>
        <h3 className="mt-1 font-display text-base font-bold leading-snug group-hover:text-primary">{a.title}</h3>
        {a.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>}
        <div className="mt-auto flex gap-3 pt-3 font-meta text-muted-foreground">
          {a.version_label && <span>v{a.version_label}</span>}
          {a.reviewed_at && <span>revisado {fmtDate(a.reviewed_at)}</span>}
        </div>
      </div>
    </Link>
  );
}
