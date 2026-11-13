import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton, EmptyState } from "@/components/vitis/States";
import { STATUSES, addDaysISO, fmtDateTime } from "@/lib/labels";
import { useSettings } from "@/lib/data";
import type { Me } from "@/lib/me";
import { useRun } from "./common";

type Draft = { id: string; status: string; title: string; article_id: string; submitted_at: string | null; articles: { slug: string; version_label: string | null; published_at: string | null } | null };

export function ReviewTab({ me }: { me: Me }) {
  const run = useRun();
  const settings = useSettings();
  const [ret, setRet] = useState<Draft | null>(null);
  const [comment, setComment] = useState("");
  const [pub, setPub] = useState<Draft | null>(null);
  const [version, setVersion] = useState("");
  const [summary, setSummary] = useState("");
  const [next, setNext] = useState("");
  const q = useQuery({
    queryKey: ["review-queue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("article_drafts").select("id,status,title,article_id,submitted_at,articles(slug,version_label,published_at)").in("status", ["in_review", "approved"]).order("submitted_at");
      if (error) throw error;
      return data as Draft[];
    },
  });
  const openPublish = (d: Draft) => {
    setPub(d);
    const cur = d.articles?.version_label;
    const n = cur ? (parseFloat(cur) + 0.1).toFixed(1) : "1.0";
    setVersion(isNaN(Number(n)) ? "" : n);
    setSummary("");
    setNext(addDaysISO(settings.data?.default_review_days ?? 365));
  };
  if (q.isLoading) return <ListSkeleton />;
  if (!q.data?.length) return <EmptyState title="Fila vazia">Nenhum conteúdo aguardando revisão ou publicação.</EmptyState>;
  return (
    <div className="space-y-3">
      {q.data.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{d.title}</p>
            <p className="font-meta text-muted-foreground">
              {d.articles?.published_at ? `Nova versão (vigente v${d.articles.version_label})` : "Primeira publicação"} · enviado {fmtDateTime(d.submitted_at)}
            </p>
          </div>
          <Badge variant={d.status === "approved" ? "brand" : "warning"}>{STATUSES[d.status as "draft"]}</Badge>
          <Button asChild size="sm" variant="outline"><Link to="/admin/editor" search={{ id: d.article_id }}>Revisar conteúdo</Link></Button>
          {d.status === "in_review" && (me.isReviewer || me.isAdmin) && (
            <Button size="sm" onClick={() => run(() => supabase.rpc("approve_draft", { p_draft: d.id }), "Aprovado")}>Aprovar</Button>
          )}
          {(me.isReviewer || me.isCurator) && (
            <Button size="sm" variant="ghost" onClick={() => { setRet(d); setComment(""); }}>Devolver</Button>
          )}
          {d.status === "approved" && me.isCurator && <Button size="sm" onClick={() => openPublish(d)}>Publicar</Button>}
        </div>
      ))}

      <Dialog open={!!ret} onOpenChange={(o) => !o && setRet(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Devolver com comentário</DialogTitle></DialogHeader>
          <Label htmlFor="rc">Comentário (obrigatório)</Label>
          <Textarea id="rc" value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button disabled={!comment.trim()} onClick={async () => { if (await run(() => supabase.rpc("return_draft", { p_draft: ret!.id, p_comment: comment }), "Devolvido ao autor")) setRet(null); }}>Devolver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pub} onOpenChange={(o) => !o && setPub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Publicar “{pub?.title}”</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label htmlFor="pv">Versão {pub?.articles?.version_label && <span className="font-meta text-muted-foreground">(vigente v{pub.articles.version_label})</span>}</Label><Input id="pv" value={version} onChange={(e) => setVersion(e.target.value)} className="font-mono" /></div>
            <div className="space-y-1"><Label htmlFor="ps">Resumo da mudança {pub?.articles?.published_at ? "(obrigatório)" : "(opcional)"}</Label><Textarea id="ps" value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="pn">Próxima revisão</Label><Input id="pn" type="date" value={next} onChange={(e) => setNext(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button onClick={async () => { if (await run(() => supabase.rpc("publish_draft", { p_draft: pub!.id, p_version: version, p_change_summary: summary, p_next_review: next }), "Publicado")) setPub(null); }}>Publicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
