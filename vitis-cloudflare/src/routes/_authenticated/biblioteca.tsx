import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/vitis/AppShell";
import { ArticleCard } from "@/components/vitis/ArticleCard";
import { ListSkeleton, ErrorState, NoResultsState, OrganizingState } from "@/components/vitis/States";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCategories, useSearch, useSettings, useSystems, type SearchParams } from "@/lib/data";
import { useMe } from "@/lib/me";
import { AUDIENCES, CONTENT_TYPES } from "@/lib/labels";
import { SupportCta } from "@/components/vitis/Support";
import { pageHead } from "@/lib/head";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/_authenticated/biblioteca")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: str(s["q"]),
    cat: str(s["cat"]),
    sys: str(s["sys"]),
    type: str(s["type"]),
    aud: str(s["aud"]),
    since: str(s["since"]),
    arch: s["arch"] === true || s["arch"] === "true" ? true : undefined,
  }),
  head: () => pageHead("Biblioteca", "Todos os conteúdos oficiais da VITIS, com busca e filtros."),
  component: Library,
});

const selectCls = "h-10 w-full rounded-lg border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Library() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/biblioteca" });
  const cats = useCategories();
  const systems = useSystems();
  const settings = useSettings();
  const { data: me } = useMe();
  const res = useSearch(s);
  const [q, setQ] = useState(s.q ?? "");
  useEffect(() => setQ(s.q ?? ""), [s.q]);

  const set = (patch: Partial<SearchParams>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const hasFilters = !!(s.cat || s.sys || s.type || s.aud || s.since || s.arch);

  return (
    <AppShell>
      <PageHeader title={s.q ? `Resultados para “${s.q}”` : "Biblioteca"} subtitle="Todo o conteúdo publicado, com filtros combináveis." />
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: q.trim() || undefined });
        }}
        className="relative mb-4"
      >
        <label htmlFor="lib-q" className="sr-only">Buscar</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input id="lib-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar sem perder os filtros…" className="h-11 w-full rounded-xl border bg-card pl-9 pr-24 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2">Buscar</Button>
      </form>
      <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <Label htmlFor="f-cat">Categoria</Label>
          <select id="f-cat" className={selectCls} value={s.cat ?? ""} onChange={(e) => set({ cat: e.target.value || undefined })}>
            <option value="">Todas</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-sys">Sistema</Label>
          <select id="f-sys" className={selectCls} value={s.sys ?? ""} onChange={(e) => set({ sys: e.target.value || undefined })}>
            <option value="">Todos</option>
            {systems.data?.filter((c) => c.active || c.id === s.sys).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-type">Tipo de material</Label>
          <select id="f-type" className={selectCls} value={s.type ?? ""} onChange={(e) => set({ type: e.target.value || undefined })}>
            <option value="">Todos</option>
            {Object.entries(CONTENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-aud">Público</Label>
          <select id="f-aud" className={selectCls} value={s.aud ?? ""} onChange={(e) => set({ aud: e.target.value || undefined })}>
            <option value="">Todos</option>
            {Object.entries(AUDIENCES).filter(([k]) => me?.isInternal || k !== "manager").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-since">Atualizado em</Label>
          <select id="f-since" className={selectCls} value={s.since ?? ""} onChange={(e) => set({ since: e.target.value || undefined })}>
            <option value="">Qualquer data</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <div className="flex items-center gap-2">
            <Switch id="f-arch" checked={!!s.arch} onCheckedChange={(v) => set({ arch: v || undefined })} />
            <Label htmlFor="f-arch" className="text-sm font-normal">Incluir arquivados</Label>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => navigate({ search: { q: s.q } })}><X className="mr-1 h-3 w-3" /> Limpar filtros</Button>
          )}
        </div>
      </div>

      {res.isLoading ? <ListSkeleton /> : res.error ? <ErrorState /> : res.data?.length ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">{res.data.length} {res.data.length === 1 ? "conteúdo" : "conteúdos"}</p>
          <div className="grid gap-3 md:grid-cols-2">{res.data.map((a) => <ArticleCard key={a.id} a={a} query={s.q} />)}</div>
        </>
      ) : !s.q && !hasFilters ? <OrganizingState /> : (
        <NoResultsState>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Confira a grafia ou tente uma palavra mais simples.</li>
            {hasFilters && <li>• <button className="text-primary underline" onClick={() => navigate({ search: { q: s.q } })}>Limpe os filtros</button>.</li>}
            {s.q && <li>• <Link to="/biblioteca" search={{}} className="text-primary underline">Limpe a pesquisa</Link>.</li>}
            <li>• Peça ajuda: {settings.data?.support_channel || "canal de suporte a definir"}.</li>
          </ul>
          <SupportCta text="Não encontrou? Fale com o suporte" className="mt-4 text-left" />
        </NoResultsState>
      )}
    </AppShell>
  );
}
