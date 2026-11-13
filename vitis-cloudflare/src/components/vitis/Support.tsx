import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Headset, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/data";
import { useMe } from "@/lib/me";
import { cn } from "@/lib/utils";

/** Page-level context the support sheet includes in the ticket summary. */
type Ctx = { article?: string | undefined; system?: string | undefined };
let pageCtx: Ctx = {};
export function setSupportContext(c: Ctx) { pageCtx = c; }
export function useSupportContext(c: Ctx) {
  useEffect(() => { setSupportContext(c); return () => setSupportContext({}); }, [c.article, c.system]); // eslint-disable-line react-hooks/exhaustive-deps
}

const EVT = "vitis:support";
export function openSupport() { window.dispatchEvent(new Event(EVT)); }
export function useSupportOpener(set: (v: boolean) => void) {
  useEffect(() => {
    const h = () => set(true);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, [set]);
}

export function useSupportVisible() {
  const s = useSettings();
  const { data: me } = useMe();
  if (!s.data || !me) return false;
  return me.isInternal ? s.data.support_show_internal : s.data.support_show_external;
}

export function SupportCta({ text = "Não resolveu? Fale com o suporte", className }: { text?: string; className?: string }) {
  if (!useSupportVisible()) return null;
  return (
    <section className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed bg-primary-soft/60 p-4", className)}>
      <p className="flex items-center gap-2 text-sm font-medium"><Headset className="h-4 w-4 text-primary" aria-hidden /> {text}</p>
      <Button size="sm" variant="outline" onClick={openSupport}>Abrir chamado</Button>
    </section>
  );
}

function useOrgName(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["org-name", orgId],
    enabled: !!orgId,
    queryFn: async () => (await supabase.from("organizations").select("name").eq("id", orgId!).maybeSingle()).data?.name ?? null,
  });
}

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export function SupportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const settings = useSettings();
  const { data: me } = useMe();
  const org = useOrgName(me?.organizationId);
  const [desc, setDesc] = useState("");
  const typed = useDebounced(desc.trim());
  const ctx = open ? pageCtx : {};
  const pageTerms = useMemo(() => ctx.article || ctx.system || path.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "", [ctx.article, ctx.system, path]);
  const q = typed.length >= 3 ? typed : pageTerms;
  const res = useQuery({
    queryKey: ["support-suggest", q],
    enabled: open,
    queryFn: async () => (await supabase.rpc("search_articles", { q, p_limit: 3 })).data ?? [],
  });

  const url = settings.data?.support_portal_url;
  const openTicket = () => {
    if (!url) { toast.error("O endereço do portal de suporte ainda não foi configurado."); return; }
    const summary = [
      "Resumo do contexto (VITIS)",
      `Página: ${window.location.href}`,
      ctx.article && `Artigo: ${ctx.article}`,
      ctx.system && `Sistema: ${ctx.system}`,
      org.data && `Organização: ${org.data}`,
      `Pessoa: ${me?.fullName ?? ""} <${me?.email ?? ""}>`,
      "",
      `Descrição: ${desc.trim() || "(não informada)"}`,
    ].filter((x): x is string => typeof x === "string").join("\n");
    navigator.clipboard?.writeText(summary).then(
      () => toast.success("Resumo copiado; cole no chamado"),
      () => toast.message("Não foi possível copiar automaticamente. Descreva o problema no chamado."),
    );
    window.open(url, "_blank", "noopener,noreferrer");
    void supabase.from("support_requests").insert({
      user_id: me!.userId, description: desc.trim() || null,
      context: { page: path, article: ctx.article ?? null, system: ctx.system ?? null, organization: org.data ?? null },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetTitle className="flex items-center gap-2"><Headset className="h-5 w-5 text-primary" aria-hidden /> Precisa de uma mão?</SheetTitle>
        <SheetDescription>Antes de abrir o chamado, veja se algum destes conteúdos resolve.</SheetDescription>
        <div className="mt-5 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="sup-desc">Descreva o problema</Label>
            <Textarea id="sup-desc" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: não consigo fechar o caixa no sistema" />
            <p className="text-xs text-muted-foreground">Não inclua dados de clientes (CPF, cartão, telefone).</p>
          </div>
          <section aria-live="polite">
            <h3 className="mb-2 flex items-center gap-1.5 font-meta uppercase text-muted-foreground"><Search className="h-3.5 w-3.5" aria-hidden /> Talvez isto resolva</h3>
            {res.isLoading ? <p className="text-sm text-muted-foreground">Buscando…</p> : res.data?.length ? (
              <ul className="space-y-2">
                {res.data.map((a) => (
                  <li key={a.id}>
                    <Link to="/artigo/$slug" params={{ slug: a.slug }} onClick={() => onOpenChange(false)} className="block rounded-xl border p-3 hover:border-primary">
                      <span className="font-semibold">{a.title}</span>
                      {a.summary && <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{a.summary}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Nenhum conteúdo relacionado encontrado.</p>}
          </section>
          <div className="space-y-2 rounded-xl bg-muted p-4">
            <Button className="w-full" onClick={openTicket}><ExternalLink className="mr-2 h-4 w-4" aria-hidden /> Abrir chamado no portal de suporte</Button>
            <p className="text-xs text-muted-foreground">Abre em nova aba. Um resumo desta página e da sua descrição é copiado para você colar no chamado.</p>
            {settings.data?.support_hours && <p className="text-sm"><strong>Atendimento:</strong> {settings.data.support_hours}</p>}
            {settings.data?.support_channel && <p className="text-sm"><strong>Outro canal:</strong> {settings.data.support_channel}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
