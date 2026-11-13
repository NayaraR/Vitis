import { Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

export function CategoryCard({ slug, name, description, count }: { slug: string; name: string; description?: string | null; count: number }) {
  return (
    <Link
      to="/categoria/$slug"
      params={{ slug }}
      className="group flex flex-col rounded-xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <FolderOpen className="h-4 w-4" aria-hidden />
        </span>
        <span className="font-meta text-muted-foreground">{count} {count === 1 ? "conteúdo" : "conteúdos"}</span>
      </div>
      <h3 className="mt-3 font-display font-bold leading-snug group-hover:text-primary">{name}</h3>
      {description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
    </Link>
  );
}
