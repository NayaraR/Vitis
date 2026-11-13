import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Plus, Trash2, Upload, Link2 } from "lucide-react";
import { AppShell } from "@/components/vitis/AppShell";
import { ArticleBody, type Faq, type Step } from "@/components/vitis/ArticleBody";
import { ListSkeleton, NoAccessState } from "@/components/vitis/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAreas, useCategories, useSystems } from "@/lib/data";
import { useMe } from "@/lib/me";
import { AUDIENCES, CONTENT_TYPES, STATUSES, VISIBILITIES, errMsg, fmtSize, slugify } from "@/lib/labels";
import { pageHead } from "@/lib/head";
import { selectCls, useRun } from "@/components/admin/common";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/vitis/Cover";
import { useCoverUrls } from "@/lib/covers";
import { useCollections } from "@/lib/collections";
import { templateFor } from "@/lib/templates";

const isBodyEmpty = (p: Form) =>
  !p.summary && !p.quick_answer && !p.attention && !p.body_extra && p.materials.every((m) => !m.trim()) && p.steps.every((x) => !x.text.trim()) && p.faq.every((x) => !x.q.trim() && !x.a.trim());

/** Lays out empty slots for the chosen model; the guidance shows only as placeholders. */
function applyTemplate(p: Form, type: string): Form {
  const t = templateFor(type);
  if (!t) return { ...p, steps: p.steps.length ? p.steps : [{ text: "" }] };
  return { ...p, materials: t.materials.map(() => ""), steps: t.steps.length ? t.steps.map(() => ({ text: "" })) : [], faq: t.faq.map(() => ({ q: "", a: "" })) };
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type S = { id?: string | undefined; system?: string | undefined; collection?: string | undefined; type?: string | undefined };
export const Route = createFileRoute("/_authenticated/admin/editor")({
  validateSearch: (s: Record<string, unknown>): S => {
    const str = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : undefined);
    return { id: str("id"), system: str("system"), collection: str("collection"), type: str("type") };
  },
  head: () => pageHead("Editor", "Editor de conteúdo da VITIS com pré-visualização."),
  component: Editor,
});

type Form = {
  title: string; slug: string; summary: string; quick_answer: string; attention: string; materials: string[];
  steps: Step[]; faq: Faq[]; body_extra: string; category_id: string; content_type: string; audience: string[];
  visibility: string; search_synonyms: string; owner_area_id: string; contact: string; system_ids: string[]; tag_names: string;
  cover_image: string; cover_label: string; cover_style: string; event_at: string;
};
const empty: Form = { title: "", slug: "", summary: "", quick_answer: "", attention: "", materials: [], steps: [{ text: "" }], faq: [], body_extra: "", category_id: "", content_type: "procedure", audience: ["all"], visibility: "internal", search_synonyms: "", owner_area_id: "", contact: "", system_ids: [], tag_names: "", cover_image: "", cover_label: "", cover_style: "dark", event_at: "" };

const FLOW = [
  { k: "draft", l: "Rascunho" }, { k: "in_review", l: "Em revisão" }, { k: "approved", l: "Aprovado" }, { k: "published", l: "Publicado" },
];

function Stepper({ status }: { status: string }) {
  const idx = status === "returned" ? 0 : FLOW.findIndex((f) => f.k === status);
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Etapas do fluxo editorial">
      {FLOW.map((f, i) => (
        <li key={f.k} className="flex items-center gap-2">
          <span aria-current={i === idx ? "step" : undefined} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", i < idx && "border-success bg-success-soft text-success", i === idx && "border-primary bg-primary text-primary-foreground", i > idx && "text-muted-foreground")}>
            {i < idx ? <Check className="h-3 w-3" /> : <span className="font-meta">{i + 1}</span>} {f.l}
          </span>
          {i < FLOW.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
        </li>
      ))}
      {status === "returned" && <Badge variant="critical">Devolvido</Badge>}
    </ol>
  );
}

function Editor() {
  const { id, system: sysParam, collection: colParam, type: typeParam } = Route.useSearch();
  const collections = useCollections();
  const { data: me, isLoading: meLoading } = useMe();
  const cats = useCategories();
  const systems = useSystems();
  const areas = useAreas();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const run = useRun();
  const [f, setF] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["editor", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: a, error } = await supabase.from("articles").select("*, article_tags(tags(name)), article_systems(system_id), article_attachments(*)").eq("id", id!).maybeSingle();
      if (error) throw error;
      const { data: d } = await supabase.from("article_drafts").select("*").eq("article_id", id!).in("status", ["draft", "returned", "in_review", "approved"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return { a, d };
    },
  });

  useEffect(() => {
    if (!id) {
      const sys = systems.data?.find((x) => x.id === sysParam);
      const col = collections.data?.find((x) => x.id === colParam);
      const sysId = sys?.id ?? col?.system_id ?? undefined;
      const sys2 = systems.data?.find((x) => x.id === sysId);
      const type = typeParam ?? (col?.kind === "guides" ? "quick_guide" : col?.content_type ?? "procedure");
      setF(applyTemplate({
        ...empty,
        content_type: type,
        owner_area_id: sys2?.owner_area_id && (me?.isCurator || sys2.owner_area_id === me?.areaId) ? sys2.owner_area_id : me?.areaId ?? "",
        visibility: sys2 ? sys2.visibility : col ? col.visibility : "internal",
        system_ids: sysId ? [sysId] : [],
      }, type));
      return;
    }
    if (!q.data?.a) return;
    const src = q.data.d ?? q.data.a;
    setF({
      title: src.title, slug: src.slug, summary: src.summary ?? "", quick_answer: src.quick_answer ?? "", attention: src.attention ?? "",
      materials: src.materials ?? [], steps: (src.steps as Step[]) ?? [], faq: (src.faq as Faq[]) ?? [], body_extra: src.body_extra ?? "",
      category_id: src.category_id ?? "", content_type: src.content_type, audience: src.audience, visibility: src.visibility,
      search_synonyms: (src.search_synonyms ?? []).join(", "), owner_area_id: src.owner_area_id ?? "", contact: src.contact ?? "",
      system_ids: q.data.d ? q.data.d.system_ids : q.data.a.article_systems.map((s) => s.system_id),
      tag_names: (q.data.d ? q.data.d.tag_names : q.data.a.article_tags.map((t) => t.tags?.name ?? "")).join(", "),
      cover_image: src.cover_image ?? "", cover_label: src.cover_label ?? "", cover_style: src.cover_style ?? "dark",
      event_at: src.event_at ? toLocalInput(src.event_at) : "",
    });
  }, [id, q.data, me?.areaId, me?.isCurator, sysParam, colParam, typeParam, systems.data, collections.data]);

  const draft = q.data?.d;
  const article = q.data?.a;
  const status = draft?.status ?? article?.status ?? "draft";
  const locked = draft && ["in_review", "approved"].includes(draft.status);

  const payload = useMemo(() => ({
    ...f,
    materials: f.materials.filter((m) => m.trim()),
    steps: f.steps.filter((s) => s.text.trim()).map((s) => ({ text: s.text, image_url: s.image_url || null })),
    faq: f.faq.filter((x) => x.q.trim()),
    search_synonyms: f.search_synonyms.split(",").map((x) => x.trim()).filter(Boolean),
    tag_names: f.tag_names.split(",").map((x) => x.trim()).filter(Boolean),
    event_at: f.event_at ? new Date(f.event_at).toISOString() : "",
  }), [f]);

  const coverUrl = useCoverUrls([f.cover_image])[f.cover_image];

  const save = async (submit: boolean) => {
    setBusy(true);
    try {
      const { data: aid, error } = await supabase.rpc("save_draft", { p_article: (id ?? null) as unknown as string, p: payload });
      if (error) throw error;
      if (submit) {
        const { data: d } = await supabase.from("article_drafts").select("id").eq("article_id", aid).in("status", ["draft", "returned"]).order("created_at", { ascending: false }).limit(1).single();
        const r = await supabase.rpc("submit_draft", { p_draft: d!.id });
        if (r.error) throw r.error;
      }
      toast.success(submit ? "Enviado para revisão" : "Rascunho salvo");
      await qc.invalidateQueries();
      if (!id && colParam) {
        const link = await supabase.from("collection_items").insert({ collection_id: colParam, article_id: aid as string, sort_order: 99 });
        if (link.error) toast.error("Não foi possível incluir na coleção: " + errMsg(link.error));
      }
      if (!id) navigate({ to: "/admin/editor", search: { id: aid as string }, replace: true });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (meLoading || (id && q.isLoading)) return <AppShell><ListSkeleton /></AppShell>;
  if (!me?.isEditor) return <AppShell><NoAccessState /></AppShell>;
  if (id && !article) return <AppShell><NoAccessState>Artigo não encontrado ou fora da sua área.</NoAccessState></AppShell>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const tpl = templateFor(f.content_type);
  const myAreas = me.isCurator ? areas.data : areas.data?.filter((a) => a.id === me.areaId);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admin" search={{ tab: "artigos" }}><ArrowLeft className="mr-1 h-4 w-4" /> Administração</Link></Button>
        <Stepper status={status} />
      </div>
      <h1 className="mb-1 text-2xl font-extrabold">{id ? "Editar conteúdo" : "Novo conteúdo"}</h1>
      {article?.status === "published" && <p className="mb-2 text-sm text-muted-foreground">A versão publicada (v{article.version_label}) continua no ar até a nova versão ser publicada.</p>}
      {draft?.status === "returned" && draft.return_comment && (
        <div role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-critical-soft p-3 text-sm"><strong>Devolvido:</strong> {draft.return_comment}</div>
      )}
      {locked && <div role="status" className="mb-4 rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm">Esta versão está {STATUSES[draft!.status as "draft"].toLowerCase()} e não pode ser editada. Use a Fila de revisão para aprovar, devolver ou publicar.</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <fieldset disabled={!!locked || busy} className="space-y-5 rounded-xl border bg-card p-5">
          <legend className="sr-only">Formulário do conteúdo</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2"><Label htmlFor="t">Título</Label><Input id="t" value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value, slug: id ? p.slug : slugify(e.target.value) }))} /></div>
            <div className="space-y-1"><Label htmlFor="sl">Slug (endereço)</Label><Input id="sl" className="font-mono" value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></div>
            <div className="space-y-1"><Label htmlFor="ar">Área responsável</Label>
              <select id="ar" className={selectCls + " w-full"} value={f.owner_area_id} onChange={(e) => set("owner_area_id", e.target.value)}>
                <option value="">Selecione</option>{myAreas?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label htmlFor="cat">Categoria</Label>
              <select id="cat" className={selectCls + " w-full"} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">—</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label htmlFor="ct">Tipo de material</Label>
              <select id="ct" className={selectCls + " w-full"} value={f.content_type} onChange={(e) => setF((p) => (isBodyEmpty(p) ? applyTemplate({ ...p, content_type: e.target.value }, e.target.value) : { ...p, content_type: e.target.value }))}>
                {Object.entries(CONTENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {tpl && <p className="text-xs text-muted-foreground">Modelo “{tpl.label}”: os textos em cinza são orientação e não serão publicados.</p>}
            </div>
            <div className="space-y-1"><Label htmlFor="vis">Visibilidade</Label>
              <select id="vis" className={selectCls + " w-full"} value={f.visibility} onChange={(e) => set("visibility", e.target.value)}>
                {Object.entries(VISIBILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label htmlFor="co">Contato</Label><Input id="co" value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Canal da área (sem dados pessoais)" /></div>
          </div>
          <fieldset><legend className="mb-1 text-sm font-medium">Público</legend>
            <div className="flex flex-wrap gap-2">{Object.entries(AUDIENCES).map(([k, v]) => {
              const on = f.audience.includes(k);
              return <button key={k} type="button" aria-pressed={on} onClick={() => set("audience", on ? f.audience.filter((x) => x !== k) : [...f.audience, k])} className={cn("rounded-full border px-3 py-1 text-sm", on && "border-primary bg-accent text-accent-foreground")}>{v}</button>;
            })}</div>
          </fieldset>
          <fieldset><legend className="mb-1 text-sm font-medium">Sistemas</legend>
            <div className="flex flex-wrap gap-2">{systems.data?.filter((s) => s.active || f.system_ids.includes(s.id)).map((s) => {
              const on = f.system_ids.includes(s.id);
              return <button key={s.id} type="button" aria-pressed={on} onClick={() => set("system_ids", on ? f.system_ids.filter((x) => x !== s.id) : [...f.system_ids, s.id])} className={cn("rounded-full border px-3 py-1 text-sm", on && "border-primary bg-accent text-accent-foreground")}>{s.name}</button>;
            })}</div>
          </fieldset>
          <CoverFields f={f} set={set} articleId={article?.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="tg">Tags (separadas por vírgula)</Label><Input id="tg" value={f.tag_names} onChange={(e) => set("tag_names", e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="sy">Sinônimos de busca (vírgula)</Label><Input id="sy" value={f.search_synonyms} onChange={(e) => set("search_synonyms", e.target.value)} placeholder="palavras usadas nas lojas" /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="su">Resumo</Label><Textarea id="su" rows={2} placeholder={tpl?.summary} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="qa">Resposta rápida</Label><Textarea id="qa" rows={2} placeholder={tpl?.quick_answer} value={f.quick_answer} onChange={(e) => set("quick_answer", e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="at">Atenção (alerta)</Label><Textarea id="at" rows={2} placeholder={tpl?.attention} value={f.attention} onChange={(e) => set("attention", e.target.value)} /></div>

          <fieldset className="space-y-2"><legend className="text-sm font-medium">Materiais necessários</legend>
            {f.materials.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Input aria-label={`Material ${i + 1}`} placeholder={tpl?.materials[i]} value={m} onChange={(e) => set("materials", f.materials.map((x, j) => (j === i ? e.target.value : x)))} />
                <Button type="button" variant="ghost" size="icon" aria-label="Remover material" onClick={() => set("materials", f.materials.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set("materials", [...f.materials, ""])}><Plus className="mr-1 h-3 w-3" /> Material</Button>
          </fieldset>

          <fieldset className="space-y-2"><legend className="text-sm font-medium">Passo a passo</legend>
            {f.steps.map((s, i) => (
              <div key={i} className="space-y-1 rounded-lg border p-2">
                <div className="flex gap-2">
                  <span className="mt-2 font-meta">{i + 1}.</span>
                  <Textarea aria-label={`Etapa ${i + 1}`} rows={2} placeholder={tpl?.steps[i] ?? "Descreva uma única ação, começando por um verbo."} value={s.text} onChange={(e) => set("steps", f.steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover etapa" onClick={() => set("steps", f.steps.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Input aria-label={`Imagem da etapa ${i + 1} (URL opcional)`} placeholder="URL de imagem (opcional)" value={s.image_url ?? ""} onChange={(e) => set("steps", f.steps.map((x, j) => (j === i ? { ...x, image_url: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set("steps", [...f.steps, { text: "" }])}><Plus className="mr-1 h-3 w-3" /> Etapa</Button>
          </fieldset>

          <fieldset className="space-y-2"><legend className="text-sm font-medium">Exceções e dúvidas frequentes</legend>
            {f.faq.map((x, i) => (
              <div key={i} className="space-y-1 rounded-lg border p-2">
                <div className="flex gap-2">
                  <Input aria-label={`Pergunta ${i + 1}`} placeholder={tpl?.faq[i]?.q ?? "Pergunta"} value={x.q} onChange={(e) => set("faq", f.faq.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover pergunta" onClick={() => set("faq", f.faq.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Textarea aria-label={`Resposta ${i + 1}`} placeholder={tpl?.faq[i]?.a ?? "Resposta"} rows={2} value={x.a} onChange={(e) => set("faq", f.faq.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set("faq", [...f.faq, { q: "", a: "" }])}><Plus className="mr-1 h-3 w-3" /> Pergunta</Button>
          </fieldset>
          <div className="space-y-1"><Label htmlFor="be">Informações complementares (opcional)</Label><Textarea id="be" rows={4} placeholder={tpl?.body_extra} value={f.body_extra} onChange={(e) => set("body_extra", e.target.value)} /></div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {(me.isAuthor || me.isCurator) && <Button type="button" variant="outline" onClick={() => save(false)}>Salvar rascunho</Button>}
            {(me.isAuthor || me.isCurator) && <Button type="button" onClick={() => save(true)}>Salvar e enviar para revisão</Button>}
            {draft && ["draft", "returned"].includes(draft.status) && article?.published_at && (
              <Button type="button" variant="ghost" onClick={() => confirm("Descartar esta nova versão?") && run(() => supabase.rpc("discard_draft", { p_draft: draft.id }), "Rascunho descartado")}>Descartar nova versão</Button>
            )}
          </div>
        </fieldset>

        <div className="space-y-4">
          <div className="xl:sticky xl:top-32">
            <p className="mb-2 font-meta uppercase text-muted-foreground">Pré-visualização ao vivo</p>
            <div className="max-h-[75vh] overflow-y-auto rounded-xl border bg-background p-5">
              <div className="mb-5 w-full max-w-[300px]"><CoverArt a={{ title: f.title || "Título do conteúdo", content_type: f.content_type, cover_label: f.cover_label, cover_style: f.cover_style, event_at: payload.event_at || null }} imageUrl={coverUrl} className="aspect-square rounded-[24px]" /></div>
              <h2 className="text-2xl font-extrabold">{f.title || "Título do conteúdo"}</h2>
              {f.summary && <p className="mb-6 mt-2 text-muted-foreground">{f.summary}</p>}
              <ArticleBody c={payload} />
            </div>
            {article && <CollectionsPicker articleId={article.id} />}
            {article && <AttachmentsManager articleId={article.id} items={article.article_attachments} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

type Att = { id: string; file_name: string; storage_path: string | null; url: string | null; size_bytes: number | null };

function AttachmentsManager({ articleId, items }: { articleId: string; items: Att[] }) {
  const run = useRun();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const upload = async (file: File) => {
    setBusy(true);
    const path = `${articleId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const up = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type });
    if (up.error) {
      toast.error(errMsg(up.error));
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("article_attachments").insert({ article_id: articleId, file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size, sort_order: items.length });
    if (error) toast.error(errMsg(error));
    else toast.success("Anexo adicionado");
    setBusy(false);
    qc.invalidateQueries();
  };
  return (
    <section className="mt-4 rounded-xl border bg-card p-4">
      <h3 className="font-bold">Materiais relacionados (anexos)</h3>
      <p className="mb-3 text-xs text-muted-foreground">Os anexos valem para o artigo imediatamente (PDF, DOCX, XLSX, PPTX, vídeo — até 50 MB).</p>
      <ul className="mb-3 space-y-1 text-sm">
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-2">
            <span className="flex-1 truncate">{a.file_name} <span className="font-meta text-muted-foreground">{a.url ? "link" : fmtSize(a.size_bytes)}</span></span>
            <Button size="sm" variant="ghost" aria-label={`Remover ${a.file_name}`} onClick={async () => {
              if (!confirm("Remover anexo?")) return;
              if (a.storage_path) await supabase.storage.from("attachments").remove([a.storage_path]);
              run(() => supabase.from("article_attachments").delete().eq("id", a.id), "Anexo removido");
            }}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring">
        <Upload className="h-4 w-4" /> {busy ? "Enviando…" : "Enviar arquivo"}
        <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,video/*,image/*" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => supabase.from("article_attachments").insert({ article_id: articleId, file_name: name || url, url, sort_order: items.length }), "Link adicionado")) { setUrl(""); setName(""); }
      }}>
        <Input aria-label="Nome do link" placeholder="Nome do link" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Input aria-label="URL externa" type="url" required placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
        <Button size="sm" type="submit" variant="outline"><Link2 className="mr-1 h-3 w-3" /> Adicionar link</Button>
      </form>
    </section>
  );
}

function CoverFields({ f, set, articleId }: { f: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; articleId?: string | undefined }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (!articleId) return;
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem (JPG, PNG ou WebP)."); return; }
    setBusy(true);
    const path = `${articleId}/cover-${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const up = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type });
    setBusy(false);
    if (up.error) { toast.error(errMsg(up.error)); return; }
    set("cover_image", path);
    toast.success("Capa enviada — salve o rascunho para registrar.");
  };
  return (
    <fieldset className="space-y-3 rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Capa e evento</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label htmlFor="cl">Etiqueta da capa</Label><Input id="cl" value={f.cover_label} onChange={(e) => set("cover_label", e.target.value.toUpperCase())} placeholder="COMUNICADO, LIVE, NOVIDADE…" /></div>
        <div className="space-y-1"><Label htmlFor="cs">Estilo da capa</Label>
          <select id="cs" className={selectCls + " w-full"} value={f.cover_style} onChange={(e) => set("cover_style", e.target.value)}>
            <option value="dark">Escuro (destaque)</option><option value="light">Claro (neutro)</option>
          </select>
        </div>
        <div className="space-y-1"><Label htmlFor="ev">Data e hora do evento (opcional)</Label><Input id="ev" type="datetime-local" value={f.event_at} onChange={(e) => set("event_at", e.target.value)} /></div>
        <div className="space-y-1"><span className="text-sm font-medium">Imagem de capa</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring", articleId ? "cursor-pointer" : "opacity-60")}>
              <Upload className="h-4 w-4" aria-hidden /> {busy ? "Enviando…" : "Enviar imagem"}
              <input type="file" accept="image/*" className="sr-only" disabled={!articleId || busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {f.cover_image && <Button type="button" variant="ghost" size="sm" onClick={() => set("cover_image", "")}>Remover capa</Button>}
          </div>
          {!articleId && <p className="text-xs text-muted-foreground">Salve o rascunho uma vez para enviar a capa.</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Sem imagem, a VITIS gera uma capa automática. A capa segue a mesma visibilidade do artigo.</p>
    </fieldset>
  );
}

function CollectionsPicker({ articleId }: { articleId: string }) {
  const cols = useCollections();
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["article-collections", articleId],
    queryFn: async () => (await supabase.from("collection_items").select("collection_id").eq("article_id", articleId)).data ?? [],
  });
  const on = new Set(items.data?.map((i) => i.collection_id));
  const toggle = async (cid: string) => {
    const { error } = on.has(cid)
      ? await supabase.from("collection_items").delete().eq("collection_id", cid).eq("article_id", articleId)
      : await supabase.from("collection_items").insert({ collection_id: cid, article_id: articleId, sort_order: 99 });
    if (error) { toast.error(errMsg(error)); return; }
    qc.invalidateQueries({ queryKey: ["article-collections", articleId] });
    qc.invalidateQueries({ queryKey: ["collection"] });
  };
  return (
    <section className="mt-4 rounded-xl border bg-card p-4">
      <h3 className="font-bold">Coleções e trilhas</h3>
      <p className="mb-3 text-xs text-muted-foreground">Vale imediatamente; o artigo só aparece na trilha quando publicado.</p>
      <div className="flex flex-wrap gap-2">
        {cols.data?.map((c) => (
          <button key={c.id} type="button" aria-pressed={on.has(c.id)} onClick={() => toggle(c.id)} className={cn("rounded-full border px-3 py-1 text-sm", on.has(c.id) && "border-primary bg-accent text-accent-foreground")}>{c.title}</button>
        ))}
      </div>
    </section>
  );
}
