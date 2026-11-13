import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/vitis/AppShell";
import { NoAccessState, ListSkeleton } from "@/components/vitis/States";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/me";
import { pageHead } from "@/lib/head";
import { ArticlesTab } from "@/components/admin/ArticlesTab";
import { ReviewTab } from "@/components/admin/ReviewTab";
import { ScheduledTab } from "@/components/admin/ScheduledTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { TaxonomyTab } from "@/components/admin/TaxonomyTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { ImportExportTab } from "@/components/admin/ImportExportTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { CollectionsTab } from "@/components/admin/CollectionsTab";
import { SystemsTab } from "@/components/admin/SystemsTab";

type S = { tab?: string | undefined };
export const Route = createFileRoute("/_authenticated/admin/")({
  validateSearch: (s: Record<string, unknown>): S => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined }),
  head: () => pageHead("Administração", "Gestão editorial da VITIS: artigos, revisões, feedback e configurações."),
  component: Admin,
});

function Admin() {
  const { data: me, isLoading } = useMe();
  const { tab = "artigos" } = Route.useSearch();
  const navigate = Route.useNavigate();
  if (isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!me?.isEditor) return <AppShell><NoAccessState /></AppShell>;
  const tabs = [
    { v: "artigos", l: "Artigos", show: true, c: <ArticlesTab me={me} /> },
    { v: "revisao", l: "Fila de revisão", show: true, c: <ReviewTab me={me} /> },
    { v: "programadas", l: "Revisões programadas", show: true, c: <ScheduledTab me={me} /> },
    { v: "feedback", l: "Feedback", show: true, c: <FeedbackTab me={me} /> },
    { v: "taxonomia", l: "Categorias, sistemas e áreas", show: me.isCurator, c: <TaxonomyTab /> },
    { v: "sistemas", l: "Sistemas", show: me.isCurator, c: <SystemsTab me={me} /> },
    { v: "colecoes", l: "Trilhas do Cultivo", show: me.isCurator, c: <CollectionsTab /> },
    { v: "usuarios", l: "Usuários e perfis", show: me.isAdmin, c: <UsersTab /> },
    { v: "importar", l: "Importar / Exportar", show: me.isCurator, c: <ImportExportTab me={me} /> },
    { v: "config", l: "Configurações", show: me.isAdmin, c: <SettingsTab /> },
  ].filter((t) => t.show);
  return (
    <AppShell>
      <PageHeader title="Administração" subtitle={`Perfil: ${me.roles.join(", ")}`}>
        {me.isAdmin && <Button asChild variant="outline" size="sm"><Link to="/ajuda-admin">Ajuda do administrador</Link></Button>}
      </PageHeader>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>
        <TabsList className="mb-6 h-auto flex-wrap justify-start">
          {tabs.map((t) => <TabsTrigger key={t.v} value={t.v}>{t.l}</TabsTrigger>)}
        </TabsList>
        {tabs.map((t) => <TabsContent key={t.v} value={t.v}>{t.c}</TabsContent>)}
      </Tabs>
    </AppShell>
  );
}
