import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/data";
import { AA, DEFAULT_PRIMARY, DEFAULT_SECONDARY, applyBrand, derive, isHex } from "@/lib/brand";
import { imageToDataUrl } from "@/lib/files";
import { errMsg } from "@/lib/labels";
import { CoverArt } from "@/components/vitis/Cover";
import { useRun } from "./common";

export function BrandSection() {
  const s = useSettings();
  const run = useRun();
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (!s.data) return;
    setPrimary(s.data.brand_primary ?? "");
    setSecondary(s.data.brand_secondary ?? "");
    setLogo(s.data.brand_logo ?? null);
  }, [s.data]);

  const pOk = !primary || isHex(primary);
  const sOk = !secondary || isHex(secondary);
  const d = derive(primary || null, secondary || null);
  const failing = d.checks.filter((c) => c.ratio < AA);

  // Live preview across the whole interface while editing.
  useEffect(() => {
    if (pOk && sOk) applyBrand({ primary: primary || null, secondary: secondary || null, logo });
  }, [primary, secondary, logo, pOk, sOk]);

  const save = () =>
    run(() => supabase.from("app_settings").update({ brand_primary: primary || null, brand_secondary: secondary || null, brand_logo: logo, updated_at: new Date().toISOString() }).eq("id", 1), "Marca salva");

  const colorField = (id: string, label: string, v: string, set: (x: string) => void, def: string, ok: boolean) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input type="color" aria-label={`${label} (seletor)`} value={isHex(v) ? v : def} onChange={(e) => set(e.target.value)} className="h-9 w-12 cursor-pointer rounded border bg-card" />
        <Input id={id} className="font-mono" placeholder={def} value={v} onChange={(e) => set(e.target.value.trim())} aria-invalid={!ok} />
      </div>
      {!ok && <p className="text-xs text-destructive">Use o formato #RRGGBB.</p>}
    </div>
  );

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 lg:col-span-2">
      <div>
        <h3 className="font-bold">Marca</h3>
        <p className="text-sm text-muted-foreground">Cores e logotipo aplicados em toda a interface e nas capas geradas. Vazio = paleta provisória da VITIS.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (pOk && sOk) save(); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            {colorField("bp", "Cor primária", primary, setPrimary, DEFAULT_PRIMARY, pOk)}
            {colorField("bs", "Cor secundária", secondary, setSecondary, DEFAULT_SECONDARY, sOk)}
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Logotipo</span>
            <div className="flex flex-wrap items-center gap-3">
              {logo && <img src={logo} alt="Logotipo atual" className="h-10 w-10 rounded border object-contain" />}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring">
                <Upload className="h-4 w-4" aria-hidden /> Enviar logotipo
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { setLogo(await imageToDataUrl(f)); } catch (err) { toast.error(errMsg(err)); }
                }} />
              </label>
              {logo && <Button type="button" variant="ghost" size="sm" onClick={() => setLogo(null)}>Remover</Button>}
            </div>
            <p className="text-xs text-muted-foreground">Quadrado, PNG/SVG, até 200 KB.</p>
          </div>
          <div role="status" aria-live="polite" className={failing.length ? "rounded-lg border border-warning/50 bg-warning-soft p-3 text-sm" : "rounded-lg border border-success/40 bg-success-soft p-3 text-sm"}>
            <p className="mb-2 flex items-center gap-2 font-semibold">
              {failing.length ? <AlertTriangle className="h-4 w-4 text-warning" aria-hidden /> : <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />}
              {failing.length ? "Contraste abaixo do mínimo AA (4,5:1) em alguns pontos" : "Contraste AA atendido"}
            </p>
            <ul className="space-y-0.5">
              {d.checks.map((c) => (
                <li key={c.label} className="flex justify-between gap-2"><span>{c.label}</span><span className={"font-meta " + (c.ratio < AA ? "text-destructive" : "")}>{c.ratio.toFixed(1)}:1</span></li>
              ))}
            </ul>
            {failing.length > 0 && <p className="mt-2 text-xs">Escolha um tom mais escuro (ou mais claro) para a cor primária. A cor de texto já é ajustada automaticamente quando possível.</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!pOk || !sOk}>Salvar marca</Button>
            <Button type="button" variant="outline" onClick={() => { setPrimary(""); setSecondary(""); setLogo(null); }}>Voltar à paleta provisória</Button>
          </div>
        </form>
        <div>
          <p className="mb-2 font-meta uppercase text-muted-foreground">Prévia da capa</p>
          <CoverArt a={{ title: "Título do comunicado", cover_label: "COMUNICADO" }} className="aspect-square rounded-[24px]" />
        </div>
      </div>
    </section>
  );
}
