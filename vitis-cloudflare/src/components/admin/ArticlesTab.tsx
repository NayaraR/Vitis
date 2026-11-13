import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExampleBadge, StatusBadge } from "@/components/vitis/Badges";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton, EmptyState } from "@/components/vitis/States";
import { STATUSES, fmtDate } from "@/lib/labels";
import type { Me } from "@/lib/me";
import { selectCls, useRun } from "./common";

export function ArticlesTab({ me }: { me: Me }) {
  const [status, setStatus] = useState("");
  const run = useRun();
  const q = useQuery({
    queryKey: ["admin-articles", status],
    queryFn: async () => {
      let r = supabase.from("articles").select("id,slug,title,status,version_label,next_review_at,updated_at,is_example,areas(name),article_drafts(id,status)").order("updated_at", { ascending: false });
      if (status) r = r.eq("status", status as "draft");
      const { data, error } = await r;
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="st" className="text-sm">Status</label>
          <select id="st" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {["draft", "in_review", "approved", "published", "archived"].map((s) => <option key={s} value={s}>{STATUSES[s as "draft"]}</option>)}
          </select>
        </div>
        {(me.isAuthor || me.isCurator) && (
          <Button asChild><Link to="/admin/editor" search={{}}><Plus className="mr-1 h-4 w-4" /> Novo artigo</Link></Button>
        )}
      </div>
      {!me.isCurator && <p className="mb-3 text-sm text-muted-foreground">Você vê apenas os conteúdos da sua área.</p>}
      {q.isLoading ? <ListSkeleton /> : !q.data?.length ? <EmptyState title="Nenhum artigo" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr><th className="px-3 py-2">Título</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Área</th><th className="px-3 py-2">Versão</th><th className="px-3 py-2">Atualizado</th><th className="px-3 py-2">Ações</th></tr>
            </thead>
            <tbody>
              {q.data.map((a) => {
                const open = a.article_drafts.find((d) => ["draft", "returned", "in_review", "approved"].includes(d.status));
                return (
                  <tr key={a.id} className="border-t align-top">
                    <td className="px-3 py-2">
                      <Link to="/artigo/$slug" params={{ slug: a.slug }} className="font-medium hover:text-primary">{a.title}</Link>
                      <div className="mt-1 flex gap-1">{a.is_example && <ExampleBadge />}{open && a.status === "published" && <Badge variant="warning">Nova versão: {STATUSES[open.status as "draft"]}</Badge>}</div>
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={a.status} nextReview={a.next_review_at} /></td>
                    <td className="px-3 py-2">{a.areas?.name ?? "—"}</td>
                    <td className="px-3 py-2 font-meta">{a.version_label ? `v${a.version_label}` : "—"}</td>
                    <td className="px-3 py-2 font-meta">{fmtDate(a.updated_at)}</td>
                    <td className="space-x-1 whitespace-nowrap px-3 py-2">
                      <Button asChild size="sm" variant="outline"><Link to="/admin/editor" search={{ id: a.id }}>Editar</Link></Button>
                      {me.isCurator && a.status === "published" && (
                        <Button size="sm" variant="ghost" onClick={() => confirm("Arquivar este artigo? O histórico é preservado.") && run(() => supabase.rpc("archive_article", { p_article: a.id }), "Arquivado")}>Arquivar</Button>
                      )}
                      {me.isCurator && a.status === "archived" && (
                        <Button size="sm" variant="ghost" onClick={() => run(() => supabase.rpc("restore_article", { p_article: a.id }), "Restaurado")}>Restaurar</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
