import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, ExternalLink, FileText, ThumbsDown, ThumbsUp, Flag, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fmtDate, fmtSize, ISSUE_TYPES, isOverdue } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function MetaPanel({ rows }: { rows: { label: string; value: React.ReactNode; alert?: boolean }[] }) {
  return (
    <aside aria-labelledby="h-ficha" className="rounded-xl border bg-card p-5 shadow-card">
      <h2 id="h-ficha" className="mb-3 font-bold">Ficha do conteúdo</h2>
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className={cn("font-meta text-sm", r.alert && "font-semibold text-destructive")}>{r.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function nextReviewRow(status: string, next: string | null) {
  return { label: "Próxima revisão", value: next ? fmtDate(next) + (isOverdue(status, next) ? " · vencida" : "") : "—", alert: isOverdue(status, next) };
}

type Att = { id: string; file_name: string; storage_path: string | null; url: string | null; mime_type: string | null; size_bytes: number | null; caption: string | null };

function ext(a: Att) {
  const m = a.file_name.match(/\.([a-z0-9]+)$/i);
  if (m?.[1]) return m[1].toUpperCase();
  return a.url ? "LINK" : a.mime_type?.split("/")[1]?.toUpperCase() ?? "ARQ";
}

export function Attachments({ items }: { items: Att[] }) {
  if (!items.length) return null;
  const open = async (a: Att, download: boolean) => {
    if (a.url) return void window.open(a.url, "_blank", "noopener");
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(a.storage_path!, 300, download ? { download: a.file_name } : undefined);
    if (error || !data) return void toast.error("Sem acesso a este arquivo.");
    window.open(data.signedUrl, "_blank", "noopener");
  };
  return (
    <section aria-labelledby="h-att-list">
      <h2 id="h-att-list" className="mb-3 text-lg font-bold">Materiais relacionados</h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
            <span className="flex h-10 w-12 items-center justify-center rounded-lg bg-accent font-meta font-semibold text-accent-foreground">{ext(a)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.file_name}</p>
              <p className="font-meta text-muted-foreground">{[a.caption, fmtSize(a.size_bytes)].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => open(a, false)}>
                {a.url ? <ExternalLink className="mr-1 h-3.5 w-3.5" /> : <FileText className="mr-1 h-3.5 w-3.5" />} Abrir
              </Button>
              {a.storage_path && (
                <Button variant="ghost" size="sm" onClick={() => open(a, true)} aria-label={`Baixar ${a.file_name}`}><Download className="h-3.5 w-3.5" /></Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function History({ articleId }: { articleId: string }) {
  const q = useQuery({
    queryKey: ["versions", articleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("article_versions").select("id,version_label,change_summary,published_at,approved_by,kind").eq("article_id", articleId).order("published_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set(data.map((v) => v.approved_by).filter(Boolean))] as string[];
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: p } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        p?.forEach((x) => (names[x.id] = x.full_name || x.email || ""));
      }
      return data.map((v) => ({ ...v, approver: v.approved_by ? names[v.approved_by] ?? "—" : "—" }));
    },
  });
  if (!q.data?.length) return null;
  return (
    <section aria-labelledby="h-hist">
      <h2 id="h-hist" className="mb-3 text-lg font-bold">Histórico de alterações</h2>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">Versão</th><th className="px-3 py-2">Data</th><th className="px-3 py-2">Resumo</th><th className="px-3 py-2">Aprovador</th></tr>
          </thead>
          <tbody>
            {q.data.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-3 py-2 font-meta">v{v.version_label}</td>
                <td className="px-3 py-2 font-meta">{fmtDate(v.published_at)}</td>
                <td className="px-3 py-2">{v.change_summary}</td>
                <td className="px-3 py-2">{v.approver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FeedbackBox({ articleId }: { articleId: string }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [issue, setIssue] = useState(false);
  const [issueType, setIssueType] = useState("outdated");
  const [issueText, setIssueText] = useState("");

  const send = useMutation({
    mutationFn: async (row: { is_helpful?: boolean | null; comment?: string | null; issue_type?: string | null }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("feedback").insert({ article_id: articleId, user_id: u.user!.id, ...row });
      if (error) throw error;
    },
    onError: () => toast.error("Não foi possível enviar. Tente novamente."),
  });

  const reminder = (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Não inclua dados de clientes (nome, CPF, telefone, cartão).</p>
  );

  return (
    <section aria-labelledby="h-fb" className="space-y-4 rounded-xl border bg-card p-5">
      <h2 id="h-fb" className="font-bold">Foi útil?</h2>
      {sent ? (
        <p className="text-sm text-success">Obrigado pelo retorno!</p>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant={helpful === true ? "default" : "outline"} size="sm" onClick={async () => { setHelpful(true); await send.mutateAsync({ is_helpful: true }); setSent(true); }}>
              <ThumbsUp className="mr-1 h-4 w-4" /> Sim
            </Button>
            <Button variant={helpful === false ? "default" : "outline"} size="sm" onClick={() => setHelpful(false)}>
              <ThumbsDown className="mr-1 h-4 w-4" /> Não
            </Button>
          </div>
          {helpful === false && (
            <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); await send.mutateAsync({ is_helpful: false, comment: comment || null }); setSent(true); }}>
              <Label htmlFor="fb-c">O que faltou?</Label>
              <Textarea id="fb-c" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
              {reminder}
              <Button size="sm" type="submit" disabled={send.isPending}>Enviar</Button>
            </form>
          )}
        </>
      )}
      <div className="border-t pt-4">
        {!issue ? (
          <Button variant="ghost" size="sm" onClick={() => setIssue(true)}><Flag className="mr-1 h-4 w-4" /> Informar problema ou desatualização</Button>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await send.mutateAsync({ issue_type: issueType, comment: issueText || null });
              toast.success("Problema informado à área responsável.");
              setIssue(false);
              setIssueText("");
            }}
          >
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Tipo de problema</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ISSUE_TYPES).map(([k, v]) => (
                  <label key={k} className={cn("cursor-pointer rounded-full border px-3 py-1 text-sm", issueType === k && "border-primary bg-accent text-accent-foreground")}>
                    <input type="radio" name="issue" value={k} checked={issueType === k} onChange={() => setIssueType(k)} className="sr-only" /> {v}
                  </label>
                ))}
              </div>
            </fieldset>
            <Label htmlFor="fb-i">Descreva (opcional)</Label>
            <Textarea id="fb-i" value={issueText} onChange={(e) => setIssueText(e.target.value)} maxLength={2000} />
            {reminder}
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={send.isPending}>Enviar</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setIssue(false)}>Cancelar</Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
