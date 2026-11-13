import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton, EmptyState } from "@/components/vitis/States";
import { addDaysISO, fmtDate, todayISO } from "@/lib/labels";
import { useSettings } from "@/lib/data";
import type { Me } from "@/lib/me";
import { useRun } from "./common";

export function ScheduledTab({ me }: { me: Me }) {
  const run = useRun();
  const settings = useSettings();
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null);
  const [next, setNext] = useState("");
  const q = useQuery({
    queryKey: ["scheduled"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("id,slug,title,next_review_at,version_label,areas(name)").eq("status", "published").lte("next_review_at", addDaysISO(30)).order("next_review_at");
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading) return <ListSkeleton />;
  if (!q.data?.length) return <EmptyState title="Nenhuma revisão nos próximos 30 dias" />;
  const today = todayISO();
  return (
    <div className="space-y-3">
      {q.data.map((a) => {
        const late = (a.next_review_at ?? "") < today;
        return (
          <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
            <div className="min-w-0 flex-1">
              <Link to="/artigo/$slug" params={{ slug: a.slug }} className="font-semibold hover:text-primary">{a.title}</Link>
              <p className="font-meta text-muted-foreground">{a.areas?.name} · v{a.version_label}</p>
            </div>
            <Badge variant={late ? "critical" : "warning"}>{late ? "Vencida" : "Vence"} em {fmtDate(a.next_review_at)}</Badge>
            <Button asChild size="sm" variant="outline"><Link to="/admin/editor" search={{ id: a.id }}>Atualizar conteúdo</Link></Button>
            {me.isCurator && (
              <Button size="sm" onClick={() => { setTarget(a); setNext(addDaysISO(settings.data?.default_review_days ?? 365)); }}>Confirmar sem alteração</Button>
            )}
          </div>
        );
      })}
      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar revisão de “{target?.title}”</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O conteúdo continua igual. A confirmação fica registrada no histórico.</p>
          <Label htmlFor="cn">Próxima revisão</Label>
          <Input id="cn" type="date" value={next} onChange={(e) => setNext(e.target.value)} />
          <DialogFooter>
            <Button onClick={async () => { if (await run(() => supabase.rpc("confirm_review", { p_article: target!.id, p_next_review: next }), "Revisão confirmada")) setTarget(null); }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
