import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Plus, Trash2, Upload, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAreas, useSystems } from "@/lib/data";
import { useCollections, COLLECTION_ICONS, iconFor } from "@/lib/collections";
import { VISIBILITIES, errMsg, slugify } from "@/lib/labels";
import { imageToDataUrl } from "@/lib/files";
import { SystemIcon } from "@/components/vitis/SystemIcon";
import type { Me } from "@/lib/me";
import { selectCls, useRun } from "./common";
import { cn } from "@/lib/utils";

type Sys = NonNullable<ReturnType<typeof useSystems>["data"]>[number];
type Vis = "internal" | "external" | "all";
const ICONS = ["monitor", ...Object.keys(COLLECTION_ICONS).filter((k) => k !== "monitor")];

function LogoInput({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value && <img src={value} alt="Logotipo do sistema" className="h-9 w-9 rounded border object-contain" />}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring">
        <Upload className="h-4 w-4" aria-hidden /> {value ? "Trocar logotipo" : "Enviar logotipo (opcional)"}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) try { onChange(await imageToDataUrl(f)); } catch (err) { toast.error(errMsg(err)); }
        }} />
      </label>
      {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>Remover</Button>}
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Ícone" className="flex flex-wrap gap-1.5">
      {ICONS.map((k) => {
        const I = iconFor(k);
        return (
          <button key={k} type="button" role="radio" aria-checked={value === k} aria-label={k} onClick={() => onChange(k)}
            className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", value === k && "border-primary bg-primary text-primary-foreground")}>
            <I className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

const STEPS = ["Dados do sistema", "Menu", "Primeiros conteúdos"];

function Wizard({ onDone }: { onDone: () => void }) {
  const areas = useAreas();
  const cols = useCollections();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState({ name: "", description: "", icon: "monitor", logo: null as string | null, area: "", visibility: "internal" as Vis, active: true });
  const nextOrder = (cols.data?.reduce((m, c) => Math.max(m, c.sort_order), 0) ?? 0) + 1;
  const [menu, setMenu] = useState({ onboarding: true, onboardingOrder: nextOrder, guides: true, guidesOrder: nextOrder + 1 });
  const [drafts, setDrafts] = useState({ first: true, faq: true });
  const name = d.name.trim() || "[Sistema]";

  const finish = async () => {
    setBusy(true);
    const log: string[] = [];
    try {
      const { data: sys, error } = await supabase.from("systems").insert({
        name: d.name.trim(), slug: slugify(d.name), description: d.description || null, icon: d.icon, logo_url: d.logo,
        owner_area_id: d.area || null, visibility: d.visibility, active: d.active,
      }).select().single();
      if (error) throw error;
      const made: Record<string, string> = {};
      for (const k of ["onboarding", "guides"] as const) {
        if (!menu[k]) continue;
        const title = k === "onboarding" ? `Primeiros passos no ${sys.name}` : `${sys.name} no dia a dia`;
        const { data: c, error: ce } = await supabase.from("collections").insert({
          title, slug: slugify(title), kind: k, icon: k === "onboarding" ? "list-todo" : "presentation", system_id: sys.id, level: k === "onboarding" ? "beginner" : "intermediate", status: "draft",
          visibility: d.visibility, active: d.active, sort_order: k === "onboarding" ? menu.onboardingOrder : menu.guidesOrder,
        }).select("id").single();
        if (ce) log.push(`Trilha “${title}”: ${errMsg(ce)}`);
        else made[k] = c.id;
      }
      const models = [
        drafts.first && { title: `Primeiros passos no ${sys.name}`, type: "quick_guide", steps: 3, faq: 0, col: made["onboarding"] },
        drafts.faq && { title: `Perguntas frequentes do ${sys.name}`, type: "faq", steps: 0, faq: 3, col: made["guides"] },
      ].filter(Boolean) as { title: string; type: string; steps: number; faq: number; col?: string }[];
      if (models.length && !d.area) log.push("Rascunhos-modelo não criados: escolha uma área responsável.");
      else for (const m of models) {
        const { data: aid, error: de } = await supabase.rpc("save_draft", {
          p_article: null as unknown as string,
          p: {
            title: m.title, slug: slugify(m.title), content_type: m.type, owner_area_id: d.area, visibility: d.visibility,
            system_ids: [sys.id], audience: ["all"],
            steps: Array.from({ length: m.steps }, () => ({ text: "" })),
            faq: Array.from({ length: m.faq }, () => ({ q: "", a: "" })),
          },
        });
        if (de) { log.push(`Rascunho “${m.title}”: ${errMsg(de)}`); continue; }
        if (m.col) await supabase.from("collection_items").insert({ collection_id: m.col, article_id: aid as string, sort_order: 1 });
      }
      await qc.invalidateQueries();
      if (log.length) toast.warning(`Sistema criado, com avisos: ${log.join(" · ")}`);
      else toast.success(`Sistema “${sys.name}” criado`);
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const canNext = step > 0 || d.name.trim().length > 1;
  return (
    <section className="rounded-xl border bg-card p-5" aria-labelledby="wiz">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 id="wiz" className="font-bold">Novo sistema</h3>
        <Button variant="ghost" size="icon" aria-label="Fechar assistente" onClick={onDone}><X className="h-4 w-4" /></Button>
      </div>
      <ol className="mb-5 flex flex-wrap gap-2" aria-label="Etapas">
        {STEPS.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", i < step && "border-success bg-success-soft text-success", i === step && "border-primary bg-primary text-primary-foreground", i > step && "text-muted-foreground")}>
            {i < step ? <Check className="h-3 w-3" aria-hidden /> : <span className="font-meta">{i + 1}</span>} {l}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="w-n">Nome</Label><Input id="w-n" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Ex.: Novo ERP" /></div>
          <div className="space-y-1"><Label htmlFor="w-a">Área responsável</Label>
            <select id="w-a" className={selectCls + " w-full"} value={d.area} onChange={(e) => setD({ ...d, area: e.target.value })}>
              <option value="">Selecione</option>{areas.data?.filter((a) => a.active).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2"><Label htmlFor="w-d">Descrição curta</Label><Textarea id="w-d" rows={2} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
          <div className="space-y-1"><span className="text-sm font-medium">Ícone</span><IconPicker value={d.icon} onChange={(v) => setD({ ...d, icon: v })} /></div>
          <div className="space-y-1"><span className="text-sm font-medium">Logotipo</span><LogoInput value={d.logo} onChange={(v) => setD({ ...d, logo: v })} /></div>
          <div className="space-y-1"><Label htmlFor="w-v">Visibilidade</Label>
            <select id="w-v" className={selectCls + " w-full"} value={d.visibility} onChange={(e) => setD({ ...d, visibility: e.target.value as Vis })}>
              {Object.entries(VISIBILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6"><Switch id="w-ac" checked={d.active} onCheckedChange={(v) => setD({ ...d, active: v })} /><Label htmlFor="w-ac">Ativo</Label></div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Trilhas criadas no Cultivo como rascunho, já ligadas ao sistema. A curadoria adiciona os módulos e publica a trilha.</p>
          {(["onboarding", "guides"] as const).map((k) => (
            <div key={k} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <Checkbox id={`m-${k}`} checked={menu[k]} onCheckedChange={(v) => setMenu({ ...menu, [k]: !!v })} />
              <Label htmlFor={`m-${k}`} className="flex-1">{k === "onboarding" ? `Trilha “Primeiros passos no ${name}”` : `Trilha “${name} no dia a dia”`}</Label>
              <Label htmlFor={`o-${k}`} className="text-xs text-muted-foreground">Ordem</Label>
              <Input id={`o-${k}`} type="number" className="w-20" value={menu[k === "onboarding" ? "onboardingOrder" : "guidesOrder"]} disabled={!menu[k]}
                onChange={(e) => setMenu({ ...menu, [k === "onboarding" ? "onboardingOrder" : "guidesOrder"]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Rascunhos vazios, só com a estrutura. As orientações aparecem no editor como texto de apoio — nenhuma instrução é inventada.</p>
          <div className="flex items-center gap-3 rounded-lg border p-3"><Checkbox id="d1" checked={drafts.first} onCheckedChange={(v) => setDrafts({ ...drafts, first: !!v })} /><Label htmlFor="d1">Primeiros passos no {name} <span className="font-meta text-muted-foreground">guia rápido{menu.onboarding ? " · na trilha de onboarding" : ""}</span></Label></div>
          <div className="flex items-center gap-3 rounded-lg border p-3"><Checkbox id="d2" checked={drafts.faq} onCheckedChange={(v) => setDrafts({ ...drafts, faq: !!v })} /><Label htmlFor="d2">Perguntas frequentes do {name} <span className="font-meta text-muted-foreground">FAQ{menu.guides ? " · nos guias" : ""}</span></Label></div>
          {!d.area && (drafts.first || drafts.faq) && <p role="alert" className="text-sm text-warning">Escolha a área responsável no passo 1 para criar os rascunhos.</p>}
        </div>
      )}

      <div className="mt-5 flex justify-between gap-2 border-t pt-4">
        <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Voltar</Button>
        {step < 2 ? <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Continuar</Button> : <Button disabled={busy} onClick={finish}>{busy ? "Criando…" : "Concluir"}</Button>}
      </div>
    </section>
  );
}

function SystemRow({ s }: { s: Sys }) {
  const run = useRun();
  const areas = useAreas();
  const [open, setOpen] = useState(false);
  const upd = (patch: Partial<Sys>) => run(() => supabase.from("systems").update(patch).eq("id", s.id), "Sistema atualizado");
  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <SystemIcon s={s} className="h-9 w-9" />
        <button type="button" className="flex-1 text-left font-medium hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>{s.name}{!s.active && <span className="ml-2 font-meta text-muted-foreground">desativado</span>}</button>
        <Link to="/sistemas/$slug" params={{ slug: s.slug }} className="text-sm text-primary hover:underline"><ExternalLink className="mr-1 inline h-3.5 w-3.5" aria-hidden />Abrir</Link>
        <Switch aria-label={`Ativo: ${s.name}`} checked={s.active} onCheckedChange={(v) => upd({ active: v })} />
      </div>
      {open && (
        <div className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
          <div className="space-y-1"><Label htmlFor={`n-${s.id}`}>Nome</Label><Input id={`n-${s.id}`} defaultValue={s.name} onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && upd({ name: e.target.value.trim() })} /></div>
          <div className="space-y-1"><Label htmlFor={`a-${s.id}`}>Área responsável</Label>
            <select id={`a-${s.id}`} className={selectCls + " w-full"} value={s.owner_area_id ?? ""} onChange={(e) => upd({ owner_area_id: e.target.value || null })}>
              <option value="">—</option>{areas.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2"><Label htmlFor={`d-${s.id}`}>Descrição</Label><Textarea id={`d-${s.id}`} rows={2} defaultValue={s.description ?? ""} onBlur={(e) => e.target.value !== (s.description ?? "") && upd({ description: e.target.value || null })} /></div>
          <div className="space-y-1"><span className="text-sm font-medium">Ícone</span><IconPicker value={s.icon} onChange={(v) => upd({ icon: v })} /></div>
          <div className="space-y-1"><span className="text-sm font-medium">Logotipo</span><LogoInput value={s.logo_url} onChange={(v) => upd({ logo_url: v })} /></div>
          <div className="space-y-1"><Label htmlFor={`v-${s.id}`}>Visibilidade</Label>
            <select id={`v-${s.id}`} className={selectCls + " w-full"} value={s.visibility} onChange={(e) => upd({ visibility: e.target.value as Vis })}>
              {Object.entries(VISIBILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="ghost" className="text-destructive" onClick={async () => {
              if (!confirm(`Excluir “${s.name}”? Só é possível se não houver artigos publicados ou no histórico.`)) return;
              const { error } = await supabase.from("systems").delete().eq("id", s.id);
              if (error) {
                if (confirm(`${errMsg(error)}\n\nDesativar o sistema agora?`)) upd({ active: false });
              } else run(async () => ({ error: null }), "Sistema excluído");
            }}><Trash2 className="mr-1 h-4 w-4" /> Excluir</Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function SystemsTab({ me }: { me: Me }) {
  const systems = useSystems();
  const [wizard, setWizard] = useState(false);
  if (!me.isCurator) return null;
  return (
    <div className="space-y-4">
      {wizard ? <Wizard onDone={() => setWizard(false)} /> : (
        <Button onClick={() => setWizard(true)}><Plus className="mr-1 h-4 w-4" /> Novo sistema</Button>
      )}
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-1 font-bold">Sistemas cadastrados</h3>
        <p className="mb-3 text-xs text-muted-foreground">Desativado: some do menu, dos filtros e da página Sistemas; os artigos continuam no histórico.</p>
        <ul className="space-y-2">{systems.data?.map((s) => <SystemRow key={s.id} s={s} />)}</ul>
      </section>
    </div>
  );
}
