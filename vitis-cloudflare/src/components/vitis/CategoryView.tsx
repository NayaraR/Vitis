import { Link } from "@tanstack/react-router";
import { useCategories, useSearch } from "@/lib/data";
import { useCategoryCounts } from "@/lib/counts";
import { CategoryCard } from "./CategoryCard";
import { ArticleCard } from "./ArticleCard";
import { CardsSkeleton, ErrorState, OrganizingState, EmptyState } from "./States";
import { PageHeader } from "./AppShell";

export function CategoryView({ slug }: { slug: string }) {
  const cats = useCategories();
  const cat = cats.data?.find((c) => c.slug === slug);
  const counts = useCategoryCounts(cats.data);
  const results = useSearch({ cat: cat?.id }, 100);
  if (cats.isLoading) return <CardsSkeleton />;
  if (cats.error) return <ErrorState />;
  if (!cat) return <EmptyState title="Categoria não encontrada" />;
  const parent = cats.data?.find((c) => c.id === cat.parent_id);
  const subs = (cats.data ?? []).filter((c) => c.parent_id === cat.id && c.active);
  return (
    <>
      <nav aria-label="Trilha" className="mb-3 text-sm text-muted-foreground">
        <Link to="/inicio" className="hover:underline">Início</Link>
        {parent && (
          <> / <Link to="/categoria/$slug" params={{ slug: parent.slug }} className="hover:underline">{parent.name}</Link></>
        )}{" "}
        / <span className="text-foreground">{cat.name}</span>
      </nav>
      <PageHeader title={cat.name} subtitle={cat.description ?? undefined} />
      {subs.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Subcategorias</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subs.map((s) => (
              <CategoryCard key={s.id} slug={s.slug} name={s.name} description={s.description} count={counts.data?.total[s.id] ?? 0} />
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 text-lg font-bold">Conteúdos</h2>
        {results.isLoading ? (
          <CardsSkeleton n={3} />
        ) : results.error ? (
          <ErrorState />
        ) : results.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {results.data.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
        ) : (
          <OrganizingState />
        )}
      </section>
    </>
  );
}
