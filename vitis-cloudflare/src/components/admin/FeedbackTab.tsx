import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton, EmptyState } from "@/components/vitis/States";
import { ISSUE_TYPES, fmtDateTime } from "@/lib/labels";
import type { Me } from "@/lib/me";
import { selectCls, useRun } from "./common";

const FB_STATUS = { new: "Novo", triage: "Em triagem", resolved: "Resolvido" };

export function FeedbackTab({ me }: { me: Me }) {
  const run = useRun();
  const [st, setSt] = useState("new");
  const q = useQuery({
    queryKey: ["feedback", st],
    queryFn: async () => {
      let r = supabase.from("feedback").select("id,is_helpful,comment,issue_type,status,created_at,articles(title,slug)").order("created_at", { ascending: false }).limit(200);
      if (st) r = r.eq("status", st);
      const { data, error } = await r;
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="fbst" className="text-sm">Situação</label>
        <select id="fbst" className={selectCls} value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="">Todas</option>
          {Object.entries(FB_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {q.isLoading ? <ListSkeleton /> : !q.data?.length ? <EmptyState title="Sem feedback" /> : (
        <div className="space-y-2">
          {q.data.map((f) => (
            <div key={f.id} className="flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {f.issue_type ? <Badge variant="critical">{ISSUE_TYPES[f.issue_type as "other"]}</Badge> : f.is_helpful ? <Badge variant="success">Foi útil</Badge> : <Badge variant="warning">Não foi útil</Badge>}
                  <span className="font-meta text-muted-foreground">{fmtDateTime(f.created_at)}</span>
                </div>
                {f.articles && <Link to="/artigo/$slug" params={{ slug: f.articles.slug }} className="mt-1 block font-semibold hover:text-primary">{f.articles.title}</Link>}
                {f.comment && <p className="mt-1 text-sm text-muted-foreground">{f.comment}</p>}
              </div>
              {me.isCurator ? (
                <select aria-label="Situação do feedback" className={selectCls} value={f.status} onChange={(e) => run(() => supabase.from("feedback").update({ status: e.target.value }).eq("id", f.id), "Atualizado")}>
                  {Object.entries(FB_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              ) : <Badge variant="muted">{FB_STATUS[f.status as "new"]}</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
