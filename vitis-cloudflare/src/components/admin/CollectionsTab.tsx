import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSystems } from "@/lib/data";
import { useCollections } from "@/lib/collections";
import { LEVELS, TRAIL_AUDIENCES } from "@/lib/trails";
import { VISIBILITIES, slugify } from "@/lib/labels";
import { TrailCover } from "@/components/vitis/Trail";
import { selectCls, useRun } from "./common";

type Col = NonNullable<ReturnType<typeof useCollections>["data"]>[number];
const blank = { title: "", description: "", system_id: "", level: "beginner", visibility: "internal", audience: ["store_team"] as string[] };

function AudiencePicker({ value, onChange, idp }: { value: string[]; onChange: (v: string[]) => void; idp: string }) {
  return (
    <fieldset className="flex flex-wrap gap-3"><legend className="mb-1 text-sm font-medium">Público</legend>
      {Object.entries(TRAIL_AUDIENCES).map(([k, v]) => (
        <label key={k} htmlFor={`${idp}-${k}`} className="flex items-center gap-1.5 text-sm">
          <input id={`${idp}-${k}`} type="checkbox" checked={value.includes(k)} onChange={(e) => onChange(e.target.checked ? [...value, k] : value.filter((x) => x !== k))} /> {v}
        </label>
      ))}
    </fieldset>
  );
}

/** Trails (learning paths) of Cultivo: metadata, ordered modules and the optional quick test. */
export function CollectionsTab() {
  const run = useRun();
  const cols = useCollections();
  const systems = useSystems();
  const [f, setF] = useState(blank);
  const [sel, setSel] = useState<string | null>(null);

  const create = async () => {
    const ok = await run(() => supabase.from("collections").insert({
      title: f.title, slug: slugify(f.title), kind: "custom", icon: "graduation-cap", description: f.description || null,
      system_id: f.system_id || null, level: f.level, visibility: f.visibility as "internal", audience: f.audience.length ? f.audience : ["all"],
      status: "draft", sort_order: (cols.data?.length ?? 0) + 1,
    }), "Trilha criada como rascunho");
    if (ok) setF(blank);
  };
  const move = async (c: Col, dir: -1 | 1) => {
    const list = cols.data ?? [];
    const o = list[list.findIndex((x) => x.id === c.id) + dir];
    if (!o) return;
    await supabase.from("collections").update({ sort_order: o.sort_order }).eq("id", c.id);
    await run(() => supabase.from("collections").update({ sort_order: c.sort_order === o.sort_order ? c.sort_order + dir : c.sort_order }).eq("id", o.id), "Ordem atualizada");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-1 font-bold">Trilhas</h3>
        <p className="mb-3 text-xs text-muted-foreground">Só trilhas publicadas e ativas aparecem no Cultivo. Clientes só veem trilhas com visibilidade “clientes” ou “todos”.</p>
        <ul className="space-y-2">
          {cols.data?.map((c, i) => (
            <li key={c.id} className={"rounded-lg border p-2 " + (sel === c.id ? "border-primary" : "")}>
              <div className="flex items-center gap-2">
                <button type="button" className="flex-1 text-left text-sm font-medium hover:underline" onClick={() => setSel(sel === c.id ? null : c.id)} aria-expanded={sel === c.id}>{c.title}</button>
                <span className={"rounded-full px-2 py-0.5 font-meta " + (c.status === "published" ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{c.status === "published" ? "Publicada" : "Rascunho"}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Subir ${c.title}`} disabled={i === 0} onClick={() => move(c, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Descer ${c.title}`} disabled={i === (cols.data?.length ?? 0) - 1} onClick={() => move(c, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Switch aria-label={`Ativa: ${c.title}`} checked={c.active} onCheckedChange={(v) => run(() => supabase.from("collections").update({ active: v }).eq("id", c.id), "Atualizado")} />
              </div>
              {sel === c.id && <TrailEditor c={c} systems={systems.data ?? []} />}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-bold">Nova trilha</h3>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="nt">Título</Label><Input id="nt" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Primeiros passos no Easy Assist" /></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="nd">Descrição</Label><Input id="nd" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="ns">Sistema (opcional)</Label><select id="ns" className={selectCls + " w-full"} value={f.system_id} onChange={(e) => setF({ ...f, system_id: e.target.value })}><option value="">—</option>{systems.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="space-y-1"><Label htmlFor="nl">Nível</Label><select id="nl" className={selectCls + " w-full"} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="space-y-1"><Label htmlFor="nv">Visibilidade</Label><select id="nv" className={selectCls + " w-full"} value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value })}>{Object.entries(VISIBILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="sm:col-span-2"><AudiencePicker idp="na" value={f.audience} onChange={(v) => setF({ ...f, audience: v })} /></div>
          <Button type="submit" className="w-fit"><Plus className="mr-1 h-4 w-4" /> Criar trilha</Button>
        </form>
      </section>
    </div>
  );
}

function TrailEditor({ c, systems }: { c: Col; systems: { id: string; name: string }[] }) {
  const run = useRun();
  const [pick, setPick] = useState("");
  const items = useQuery({
    queryKey: ["collection-items-admin", c.id],
    queryFn: async () => (await supabase.from("collection_items").select("article_id,sort_order,articles(title,status,estimated_minutes)").eq("collection_id", c.id).order("sort_order")).data ?? [],
  });
  const arts = useQuery({
    queryKey: ["articles-picker"],
    queryFn: async () => (await supabase.from("articles").select("id,title,status").neq("status", "archived").order("title")).data ?? [],
  });
  const upd = (patch: Partial<Col>) => run(() => supabase.from("collections").update(patch).eq("id", c.id), "Trilha atualizada");
  const list = items.data ?? [];
  const reorder = async (i: number, dir: -1 | 1) => {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    await supabase.from("collection_items").update({ sort_order: i + dir }).eq("collection_id", c.id).eq("article_id", a.article_id);
    await run(() => supabase.from("collection_items").update({ sort_order: i }).eq("collection_id", c.id).eq("article_id", b.article_id), "Ordem atualizada");
  };
  const coverFile = (file?: File) => {
    if (!file) return;
    if (file.size > 300_000) { toast.error("Use uma imagem de até 300 KB."); return; }
    const r = new FileReader();
    r.onload = () => upd({ cover_image: String(r.result) });
    r.readAsDataURL(file);
  };
  const total = list.reduce((s, it) => s + (it.articles?.status === "published" ? it.articles.estimated_minutes : 0), 0);

  return (
    <div className="mt-3 space-y-4 border-t pt-3">
      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input aria-label="Título" defaultValue={c.title} onBlur={(e) => e.target.value !== c.title && upd({ title: e.target.value })} />
          <select aria-label="Situação" className={selectCls} value={c.status} onChange={(e) => upd({ status: e.target.value })}><option value="draft">Rascunho</option><option value="published">Publicada</option></select>
          <Textarea aria-label="Descrição" className="sm:col-span-2" rows={2} defaultValue={c.description ?? ""} onBlur={(e) => e.target.value !== (c.description ?? "") && upd({ description: e.target.value || null })} />
          <select aria-label="Nível" className={selectCls} value={c.level} onChange={(e) => upd({ level: e.target.value })}>{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select aria-label="Visibilidade" className={selectCls} value={c.visibility} onChange={(e) => upd({ visibility: e.target.value as Col["visibility"] })}>{Object.entries(VISIBILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select aria-label="Sistema" className={selectCls} value={c.system_id ?? ""} onChange={(e) => upd({ system_id: e.target.value || null })}><option value="">Sem sistema</option>{systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select aria-label="Estilo da capa gerada" className={selectCls} value={c.cover_style} onChange={(e) => upd({ cover_style: e.target.value })}><option value="dark">Capa escura</option><option value="light">Capa clara</option></select>
          <div className="sm:col-span-2"><AudiencePicker idp={`a-${c.id}`} value={c.audience} onChange={(v) => upd({ audience: v.length ? v : ["all"] })} /></div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Label htmlFor={`cv-${c.id}`} className="text-sm">Imagem de capa (opcional, até 300 KB)</Label>
            <input id={`cv-${c.id}`} type="file" accept="image/*" className="text-sm" onChange={(e) => coverFile(e.target.files?.[0])} />
            {c.cover_image && <Button size="sm" variant="ghost" onClick={() => upd({ cover_image: null })}>Usar capa gerada</Button>}
          </div>
        </div>
        <TrailCover t={c} className="aspect-[16/9] rounded-xl"><p className="p-3 font-display font-extrabold leading-tight">{c.title}</p></TrailCover>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Módulos (em ordem) · duração total {total} min</p>
        <ol className="space-y-1 text-sm">
          {list.map((it, i) => (
            <li key={it.article_id} className="flex items-center gap-1">
              <span className="w-6 font-meta text-muted-foreground">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{it.articles?.title}{it.articles?.status !== "published" && <span className="ml-1 font-meta text-warning">(não publicado)</span>}</span>
              <Input aria-label={`Minutos de ${it.articles?.title}`} type="number" min={1} max={600} className="h-8 w-20" defaultValue={it.articles?.estimated_minutes}
                onBlur={(e) => Number(e.target.value) !== it.articles?.estimated_minutes && run(() => supabase.from("articles").update({ estimated_minutes: Number(e.target.value) || 5 }).eq("id", it.article_id), "Duração atualizada")} />
              <span className="text-xs text-muted-foreground">min</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Subir" disabled={i === 0} onClick={() => reorder(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Descer" disabled={i === list.length - 1} onClick={() => reorder(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remover ${it.articles?.title}`} onClick={() => run(() => supabase.from("collection_items").delete().eq("collection_id", c.id).eq("article_id", it.article_id), "Removido")}><Trash2 className="h-3.5 w-3.5" /></Button>
            </li>
          ))}
          {list.length === 0 && <li className="text-muted-foreground">Nenhum módulo.</li>}
        </ol>
        <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (pick && (await run(() => supabase.from("collection_items").insert({ collection_id: c.id, article_id: pick, sort_order: list.length }), "Adicionado"))) setPick(""); }}>
          <select aria-label="Adicionar módulo" className={selectCls + " min-w-0 flex-1"} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Adicionar artigo como módulo…</option>
            {arts.data?.filter((a) => !list.some((l) => l.article_id === a.id)).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <Button size="sm" type="submit">Adicionar</Button>
        </form>
      </div>

      <QuizEditor collectionId={c.id} />
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm(`Excluir a trilha “${c.title}”? Os artigos não são afetados; certificados emitidos desta trilha serão removidos.`) && run(() => supabase.from("collections").delete().eq("id", c.id), "Trilha excluída")}><Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir trilha</Button>
    </div>
  );
}

function QuizEditor({ collectionId }: { collectionId: string }) {
  const run = useRun();
  const q = useQuery({
    queryKey: ["quiz-admin", collectionId],
    queryFn: async () => {
      const { data: quiz } = await supabase.from("quizzes").select("*").eq("collection_id", collectionId).maybeSingle();
      const qs = quiz ? (await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("sort_order")).data ?? [] : [];
      return { quiz, qs };
    },
  });
  const [nq, setNq] = useState({ prompt: "", options: "", correct: 0 });
  if (!q.data) return null;
  const { quiz, qs } = q.data;
  if (!quiz) return <Button size="sm" variant="outline" onClick={() => run(() => supabase.from("quizzes").insert({ collection_id: collectionId }), "Teste criado")}>Adicionar teste rápido</Button>;
  const opts = nq.options.split("\n").map((x) => x.trim()).filter(Boolean);
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold">Teste rápido ({qs.length} perguntas; recomendado 3 a 5)</p>
        <Label htmlFor={`ps-${quiz.id}`} className="text-xs">Nota mínima (%)</Label>
        <Input id={`ps-${quiz.id}`} type="number" min={1} max={100} className="h-8 w-20" defaultValue={quiz.pass_score} onBlur={(e) => run(() => supabase.from("quizzes").update({ pass_score: Number(e.target.value) || 70 }).eq("id", quiz.id), "Nota mínima salva")} />
        <Switch aria-label="Teste ativo" checked={quiz.active} onCheckedChange={(v) => run(() => supabase.from("quizzes").update({ active: v }).eq("id", quiz.id), "Atualizado")} />
      </div>
      <ol className="mb-3 space-y-1 text-sm">
        {qs.map((x, i) => (
          <li key={x.id} className="flex items-start gap-2">
            <span className="flex-1">{i + 1}. {x.prompt} <span className="font-meta text-muted-foreground">· correta: {(x.options as string[])[x.correct_index]}</span></span>
            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Excluir pergunta" onClick={() => run(() => supabase.from("quiz_questions").delete().eq("id", x.id), "Pergunta excluída")}><Trash2 className="h-3.5 w-3.5" /></Button>
          </li>
        ))}
      </ol>
      <form className="grid gap-2" onSubmit={async (e) => { e.preventDefault(); if (opts.length < 2) { toast.error("Informe pelo menos 2 alternativas."); return; } if (await run(() => supabase.from("quiz_questions").insert({ quiz_id: quiz.id, prompt: nq.prompt, options: opts, correct_index: Math.min(nq.correct, opts.length - 1), sort_order: qs.length }), "Pergunta adicionada")) setNq({ prompt: "", options: "", correct: 0 }); }}>
        <Input aria-label="Pergunta" required placeholder="Pergunta" value={nq.prompt} onChange={(e) => setNq({ ...nq, prompt: e.target.value })} />
        <Textarea aria-label="Alternativas, uma por linha" rows={3} placeholder="Alternativas, uma por linha" value={nq.options} onChange={(e) => setNq({ ...nq, options: e.target.value })} />
        <div className="flex items-center gap-2">
          <Label htmlFor={`co-${quiz.id}`} className="text-xs">Alternativa correta</Label>
          <select id={`co-${quiz.id}`} className={selectCls} value={nq.correct} onChange={(e) => setNq({ ...nq, correct: Number(e.target.value) })}>{(opts.length ? opts : ["—"]).map((o, i) => <option key={i} value={i}>{i + 1}. {o.slice(0, 40)}</option>)}</select>
          <Button size="sm" type="submit">Adicionar pergunta</Button>
        </div>
      </form>
    </div>
  );
}
