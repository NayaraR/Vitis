import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAreas, useCategories, useSystems } from "@/lib/data";
import { CONTENT_TYPES, errMsg, slugify } from "@/lib/labels";
import { parseCsv, toCsv } from "@/lib/csv";
import type { Me } from "@/lib/me";
import { download } from "./common";

type Raw = Record<string, string | string[] | undefined>;
type Report = { ok: string[]; fail: { title: string; reason: string }[]; missingSystems: string[]; pending: Raw[] };
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v.trim() ? v.split(/[|;]/).map((x) => x.trim()).filter(Boolean) : []);
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function ImportExportTab({ me }: { me: Me }) {
  const cats = useCategories();
  const systems = useSystems();
  const areas = useAreas();
  const qc = useQueryClient();
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  const importFile = async (file: File) => {
    const text = await file.text();
    let items: Raw[] = [];
    try {
      items = file.name.endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      if (!Array.isArray(items)) items = [items];
    } catch {
      toast.error("Arquivo inválido.");
      return;
    }
    await importItems(items, systems.data ?? []);
  };

  const createMissingAndRetry = async () => {
    if (!report) return;
    setBusy(true);
    const created: { id: string; name: string }[] = [];
    for (const name of report.missingSystems) {
      const { data, error } = await supabase.from("systems").insert({ name, slug: slugify(name) }).select("id,name").single();
      if (error) toast.error(`${name}: ${errMsg(error)}`);
      else created.push(data);
    }
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ["systems"] });
    const prevOk = report.ok;
    await importItems(report.pending, [...(systems.data ?? []), ...created]);
    setReport((r) => (r ? { ...r, ok: [...prevOk, ...r.ok] } : r));
  };

  const importItems = async (items: Raw[], sysList: { id: string; name: string }[]) => {
    setBusy(true);
    const rep: Report = { ok: [], fail: [], missingSystems: [], pending: [] };
    for (const raw of items) {
      const it = raw as { [k: string]: string | string[] | undefined } & Partial<Record<"title" | "slug" | "summary" | "quick_answer" | "body" | "category" | "content_type" | "visibility" | "owner_area" | "version_label", string>> & Partial<Record<"audience" | "systems" | "tags" | "search_synonyms", string | string[]>>;
      const title = String(it.title ?? "").trim();
      try {
        if (!title) throw new Error("Sem título");
        const cat = cats.data?.find((c) => norm(c.name) === norm(String(it.category ?? "")));
        if (it.category && !cat) throw new Error(`Categoria “${it.category}” não encontrada`);
        const area = it.owner_area ? areas.data?.find((a) => norm(a.name) === norm(String(it.owner_area))) : areas.data?.find((a) => a.id === me.areaId);
        if (!area) throw new Error(`Área “${it.owner_area ?? ""}” não encontrada`);
        const type = String(it.content_type ?? "procedure");
        if (!(type in CONTENT_TYPES)) throw new Error(`Tipo “${type}” inválido`);
        const sysNames = arr(it.systems);
        const sysIds = sysNames.map((n) => sysList.find((s) => norm(s.name) === norm(n))?.id);
        if (sysIds.some((x) => !x)) {
          const missing = sysNames.filter((_, i) => !sysIds[i]);
          missing.forEach((m) => !rep.missingSystems.some((x) => norm(x) === norm(m)) && rep.missingSystems.push(m));
          rep.pending.push(raw);
          throw new Error("Sistema não encontrado: " + missing.join(", "));
        }
        const vis = String(it.visibility ?? "internal");
        if (!["internal", "external", "all"].includes(vis)) throw new Error(`Visibilidade “${vis}” inválida`);
        const { error } = await supabase.rpc("save_draft", {
          p_article: null as unknown as string,
          p: {
            title,
            slug: String(it.slug ?? "") || slugify(title),
            summary: it.summary ?? null,
            quick_answer: it.quick_answer ?? null,
            body_extra: it.body ?? null,
            category_id: cat?.id ?? null,
            content_type: type,
            audience: arr(it.audience).length ? arr(it.audience) : ["all"],
            visibility: vis,
            system_ids: sysIds as string[],
            tag_names: arr(it.tags),
            search_synonyms: arr(it.search_synonyms),
            owner_area_id: area.id,
          },
        });
        if (error) throw error;
        rep.ok.push(title + (it.version_label ? ` (versão sugerida ${it.version_label})` : ""));
      } catch (e) {
        rep.fail.push({ title: title || "(sem título)", reason: errMsg(e) });
      }
    }
    setReport(rep);
    setBusy(false);
    qc.invalidateQueries();
  };

  const exportJson = async () => {
    const [a, v, c, s, f] = await Promise.all([
      supabase.from("articles").select("*, article_tags(tags(name)), article_systems(systems(name)), article_attachments(*)"),
      supabase.from("article_versions").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("systems").select("*"),
      supabase.from("feedback").select("*"),
    ]);
    const data = { exported_at: new Date().toISOString(), articles: (a.data ?? []).map(({ search_vector: _sv, ...x }) => x), versions: v.data, categories: c.data, systems: s.data, feedback: f.data };
    download(`vitis-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
  };
  const exportCsv = async () => {
    const { data } = await supabase.from("articles").select("slug,title,summary,quick_answer,status,content_type,audience,visibility,version_label,published_at,reviewed_at,next_review_at,search_synonyms,view_count,is_example,categories(name),areas(name)");
    const rows = (data ?? []).map(({ categories, areas: ar, ...r }) => ({ ...r, category: categories?.name ?? "", owner_area: ar?.name ?? "" }));
    download(`vitis-artigos-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), "text/csv;charset=utf-8");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 font-bold">Importar artigos (JSON ou CSV)</h3>
        <p className="mb-2 text-sm text-muted-foreground">Tudo entra como rascunho. Campos: title, slug, summary, quick_answer, body, category (nome), content_type, audience[], visibility, systems[] (nomes), tags[], owner_area, version_label, search_synonyms[]. No CSV, separe listas com “|”.</p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-within:ring-2 focus-within:ring-ring">
          <Upload className="h-4 w-4" /> {busy ? "Importando…" : "Escolher arquivo"}
          <input type="file" accept=".json,.csv" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
        </label>
        {report && (
          <div className="mt-4 space-y-2 text-sm" aria-live="polite">
            <p className="font-semibold text-success">{report.ok.length} aceitos</p>
            <ul className="list-inside list-disc text-muted-foreground">{report.ok.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="font-semibold text-destructive">{report.fail.length} recusados</p>
            <ul className="list-inside list-disc">{report.fail.map((f, i) => <li key={i}><strong>{f.title}</strong>: {f.reason}</li>)}</ul>
            {report.missingSystems.length > 0 && (
              <div className="rounded-lg border border-warning/50 bg-warning-soft p-3">
                <p className="mb-2">Sistemas que ainda não existem: <strong>{report.missingSystems.join(", ")}</strong></p>
                {me.isCurator ? (
                  <Button size="sm" disabled={busy} onClick={createMissingAndRetry}>Criar {report.missingSystems.length > 1 ? "esses sistemas" : "o sistema"} e importar os itens pendentes</Button>
                ) : <p className="text-xs">Peça à curadoria para cadastrá-los em Administração › Sistemas e importe de novo.</p>}
              </div>
            )}
          </div>
        )}
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 font-bold">Exportar</h3>
        <p className="mb-3 text-sm text-muted-foreground">Exporta o que o seu perfil pode ver. Use um administrador para o backup completo.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJson}><Download className="mr-1 h-4 w-4" /> JSON completo</Button>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> CSV de artigos</Button>
        </div>
      </section>
    </div>
  );
}
