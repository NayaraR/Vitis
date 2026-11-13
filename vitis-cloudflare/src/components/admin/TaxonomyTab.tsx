import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAreas, useCategories } from "@/lib/data";
import { VISIBILITIES, slugify } from "@/lib/labels";
import { selectCls, useRun } from "./common";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-bold">{title}</h3>
      {children}
    </section>
  );
}

export function TaxonomyTab() {
  const run = useRun();
  const cats = useCategories();
  const areas = useAreas();
  const [cName, setCName] = useState("");
  const [cParent, setCParent] = useState("");
  const [aName, setAName] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Section title="Categorias">
        <form className="mb-3 space-y-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => supabase.from("categories").insert({ name: cName, slug: slugify(cName), parent_id: cParent || null }), "Categoria criada")) setCName(""); }}>
          <Input aria-label="Nome da categoria" placeholder="Nova categoria" value={cName} onChange={(e) => setCName(e.target.value)} required />
          <select aria-label="Categoria-mãe" className={selectCls + " w-full"} value={cParent} onChange={(e) => setCParent(e.target.value)}>
            <option value="">Sem categoria-mãe (topo)</option>
            {cats.data?.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button size="sm" type="submit">Adicionar</Button>
        </form>
        <ul className="space-y-1 text-sm">
          {cats.data?.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className={"flex-1 " + (c.parent_id ? "pl-4 text-muted-foreground" : "font-medium")}>{c.name}</span>
              <select aria-label={`Visibilidade de ${c.name}`} className={selectCls + " h-7 text-xs"} value={c.visibility} onChange={(e) => run(() => supabase.from("categories").update({ visibility: e.target.value as "all" }).eq("id", c.id), "Atualizado")}>
                {Object.entries(VISIBILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Switch aria-label={`Ativa: ${c.name}`} checked={c.active} onCheckedChange={(v) => run(() => supabase.from("categories").update({ active: v }).eq("id", c.id), "Atualizado")} />
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Sistemas">
        <p className="text-sm text-muted-foreground">Sistemas têm uma aba própria: <a className="text-primary underline" href="/admin?tab=sistemas">Administração › Sistemas</a>.</p>
      </Section>
      <Section title="Áreas">
        <form className="mb-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => supabase.from("areas").insert({ name: aName }), "Área criada")) setAName(""); }}>
          <Input aria-label="Nome da área" placeholder="Nova área" value={aName} onChange={(e) => setAName(e.target.value)} required />
          <Button size="sm" type="submit">Adicionar</Button>
        </form>
        <ul className="space-y-1 text-sm">
          {areas.data?.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <span className="flex-1">{a.name}</span>
              <Switch aria-label={`Ativa: ${a.name}`} checked={a.active} onCheckedChange={(v) => run(() => supabase.from("areas").update({ active: v }).eq("id", a.id), "Atualizado")} />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
