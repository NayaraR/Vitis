import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/vitis/AppShell";
import { CardsSkeleton, ErrorState, OrganizingState } from "@/components/vitis/States";
import { useSystems } from "@/lib/data";
import { pageHead } from "@/lib/head";
import { SystemIcon } from "@/components/vitis/SystemIcon";

export const Route = createFileRoute("/_authenticated/sistemas/")({
  head: () => pageHead("Sistemas", "Manuais e guias dos sistemas usados nas lojas: SysPDV, VarejoFácil, Easy Assist e outros."),
  component: Systems,
});

function Systems() {
  const s = useSystems();
  return (
    <AppShell>
      <PageHeader title="Sistemas" subtitle="Manuais e guias por sistema." />
      {s.isLoading ? <CardsSkeleton n={3} /> : s.error ? <ErrorState /> : !s.data?.length ? <OrganizingState /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.data.filter((x) => x.active).map((x) => (
            <Link key={x.id} to="/sistemas/$slug" params={{ slug: x.slug }} className="rounded-xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40">
              <SystemIcon s={x} className="h-11 w-11" />
              <h2 className="mt-3 font-display text-lg font-bold">{x.name}</h2>
              {x.description && <p className="text-sm text-muted-foreground">{x.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
