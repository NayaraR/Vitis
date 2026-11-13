import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/vitis/AppShell";
import { ArticleCard } from "@/components/vitis/ArticleCard";
import { CardsSkeleton, NoAccessState, OrganizingState } from "@/components/vitis/States";
import { useSearch } from "@/lib/data";
import { useMe } from "@/lib/me";
import { CONTENT_TYPES } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/gerente")({
  head: () => pageHead("Espaço do gerente", "Checklists, modelos e procedimentos para gerentes de loja."),
  component: Manager,
});

const ORDER = ["checklist", "template", "procedure", "manual", "quick_guide", "video", "announcement", "other"];

function Manager() {
  const { data: me } = useMe();
  const res = useSearch({ aud: "manager" }, 200);
  if (me && !me.isInternal) return <AppShell><NoAccessState /></AppShell>;
  const groups = ORDER.map((t) => ({ t, items: (res.data ?? []).filter((a) => a.content_type === t) })).filter((g) => g.items.length);
  return (
    <AppShell>
      <PageHeader title="Espaço do gerente" subtitle="Materiais com público “Gerente”, agrupados por tipo." />
      {res.isLoading ? <CardsSkeleton /> : !groups.length ? <OrganizingState /> : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.t}>
              <h2 className="mb-3 text-lg font-bold">{CONTENT_TYPES[g.t as keyof typeof CONTENT_TYPES]}s</h2>
              <div className="grid gap-3 md:grid-cols-2">{g.items.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
