import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/data";
import { useRun } from "./common";
import { BrandSection } from "./BrandSection";

export function SettingsTab() {
  const run = useRun();
  const s = useSettings();
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: async () => (await supabase.from("internal_domains").select("domain").order("domain")).data ?? [],
  });
  const [form, setForm] = useState({ show_overdue: true, default_review_days: 365, popular: "", support_channel: "", accent_color: "", learning_name: "Cultivo", support_portal_url: "", support_hours: "", support_show_internal: true, support_show_external: true });
  const [dom, setDom] = useState("");
  useEffect(() => {
    if (s.data)
      setForm({
        show_overdue: s.data.show_overdue,
        default_review_days: s.data.default_review_days,
        popular: s.data.popular_queries.join("\n"),
        support_channel: s.data.support_channel ?? "",
        accent_color: s.data.accent_color ?? "",
        learning_name: s.data.learning_name,
        support_portal_url: s.data.support_portal_url ?? "",
        support_hours: s.data.support_hours ?? "",
        support_show_internal: s.data.support_show_internal,
        support_show_external: s.data.support_show_external,
      });
  }, [s.data]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BrandSection />
      <form
        className="space-y-4 rounded-xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              supabase.from("app_settings").update({
                show_overdue: form.show_overdue,
                default_review_days: Number(form.default_review_days) || 365,
                popular_queries: form.popular.split("\n").map((x) => x.trim()).filter(Boolean),
                support_channel: form.support_channel || null,
                accent_color: form.accent_color || null,
                learning_name: form.learning_name.trim() || "Cultivo",
                support_portal_url: form.support_portal_url.trim() || null,
                support_hours: form.support_hours.trim() || null,
                support_show_internal: form.support_show_internal,
                support_show_external: form.support_show_external,
                updated_at: new Date().toISOString(),
              }).eq("id", 1),
            "Configurações salvas",
          );
        }}
      >
        <h3 className="font-bold">Configurações gerais</h3>
        <div className="flex items-center gap-2">
          <Switch id="so" checked={form.show_overdue} onCheckedChange={(v) => setForm({ ...form, show_overdue: v })} />
          <Label htmlFor="so">Manter visíveis os conteúdos com revisão vencida (com aviso)</Label>
        </div>
        <div className="space-y-1"><Label htmlFor="drd">Prazo padrão de revisão (dias)</Label><Input id="drd" type="number" min={1} value={form.default_review_days} onChange={(e) => setForm({ ...form, default_review_days: Number(e.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="pq">Consultas populares (uma por linha)</Label><Textarea id="pq" rows={5} value={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="ln">Nome da área de capacitação</Label><Input id="ln" value={form.learning_name} onChange={(e) => setForm({ ...form, learning_name: e.target.value })} placeholder="Cultivo" /></div>
        <h3 className="border-t pt-4 font-bold">Suporte</h3>
        <div className="space-y-1"><Label htmlFor="spu">Endereço do portal de suporte (Jira Service Management)</Label><Input id="spu" type="url" value={form.support_portal_url} onChange={(e) => setForm({ ...form, support_portal_url: e.target.value })} placeholder="https://…" /></div>
        <div className="space-y-1"><Label htmlFor="sh">Horário de atendimento</Label><Input id="sh" value={form.support_hours} onChange={(e) => setForm({ ...form, support_hours: e.target.value })} placeholder="Ex.: segunda a sexta, 8h às 18h" /></div>
        <div className="space-y-1"><Label htmlFor="sc">Outro canal de suporte</Label><Input id="sc" value={form.support_channel} onChange={(e) => setForm({ ...form, support_channel: e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch id="ssi" checked={form.support_show_internal} onCheckedChange={(v) => setForm({ ...form, support_show_internal: v })} /><Label htmlFor="ssi">Mostrar o cartão de suporte para colaboradores</Label></div>
        <div className="flex items-center gap-2"><Switch id="sse" checked={form.support_show_external} onCheckedChange={(v) => setForm({ ...form, support_show_external: v })} /><Label htmlFor="sse">Mostrar o cartão de suporte para clientes</Label></div>
        <Button type="submit">Salvar</Button>
      </form>
      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 font-bold">Domínios internos (Google Workspace)</h3>
          <p className="mb-3 text-sm text-muted-foreground">E-mails desses domínios entram só com Google e viram colaboradores.</p>
          <form className="mb-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => supabase.from("internal_domains").insert({ domain: dom.trim().toLowerCase() }), "Domínio adicionado")) setDom(""); }}>
            <Input aria-label="Novo domínio" placeholder="empresa.com.br" value={dom} onChange={(e) => setDom(e.target.value)} required />
            <Button size="sm" type="submit">Adicionar</Button>
          </form>
          <ul className="space-y-1">
            {domains.data?.map((d) => (
              <li key={d.domain} className="flex items-center justify-between font-meta text-sm">
                {d.domain}
                <Button size="sm" variant="ghost" onClick={() => confirm(`Remover ${d.domain}?`) && run(() => supabase.from("internal_domains").delete().eq("domain", d.domain), "Removido")}>Remover</Button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-destructive/40 bg-critical-soft p-4">
          <h3 className="mb-2 font-bold text-destructive">Dados de exemplo</h3>
          <p className="mb-3 text-sm">Remove todos os artigos marcados “EXEMPLO”, com versões, rascunhos, anexos e feedback. Categorias, sistemas e áreas permanecem.</p>
          <Button variant="destructive" onClick={() => confirm("Remover todos os dados de exemplo? Não é possível desfazer.") && run(() => supabase.rpc("remove_example_data"), "Exemplos removidos")}>Remover dados de exemplo</Button>
        </section>
      </div>
    </div>
  );
}
