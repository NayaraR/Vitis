import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/labels";

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export function useReadState(articleId: string) {
  return useQuery({
    queryKey: ["read-state", articleId],
    queryFn: async () => {
      const me = await uid();
      const [r, f] = await Promise.all([
        supabase.from("article_reads").select("completed").eq("article_id", articleId).eq("user_id", me).maybeSingle(),
        supabase.from("article_favorites").select("article_id").eq("article_id", articleId).eq("user_id", me).maybeSingle(),
      ]);
      return { opened: !!r.data, completed: !!r.data?.completed, fav: !!f.data };
    },
  });
}

/** Records that the person opened the article (keeps "completed" if already set). */
export function useTrackOpen(articleId: string | undefined, enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!articleId || !enabled) return;
    (async () => {
      const me = await uid();
      const { data } = await supabase.from("article_reads").select("completed").eq("article_id", articleId).eq("user_id", me).maybeSingle();
      if (data) await supabase.from("article_reads").update({ read_at: new Date().toISOString() }).eq("article_id", articleId).eq("user_id", me);
      else await supabase.from("article_reads").upsert({ article_id: articleId }, { onConflict: "user_id,article_id", ignoreDuplicates: true });
      qc.invalidateQueries({ queryKey: ["my-reads"] });
    })();
  }, [articleId, enabled, qc]);
}

export function FavoriteButton({ articleId }: { articleId: string }) {
  const s = useReadState(articleId);
  const qc = useQueryClient();
  const fav = !!s.data?.fav;
  const toggle = async () => {
    const { error } = fav
      ? await supabase.from("article_favorites").delete().eq("article_id", articleId)
      : await supabase.from("article_favorites").insert({ article_id: articleId });
    if (error) { toast.error(errMsg(error)); return; }
    qc.invalidateQueries({ queryKey: ["read-state", articleId] });
    qc.invalidateQueries({ queryKey: ["mine"] });
  };
  return (
    <Button variant="outline" size="sm" onClick={toggle} aria-pressed={fav}>
      <Heart className={fav ? "mr-1 h-3.5 w-3.5 fill-primary text-primary" : "mr-1 h-3.5 w-3.5"} aria-hidden /> {fav ? "Favorito" : "Favoritar"}
    </Button>
  );
}

/** Sets the person's completion of an article; returns true on success. */
export async function setCompleted(articleId: string, completed: boolean) {
  const now = new Date().toISOString();
  const { error } = await supabase.from("article_reads").upsert(
    { user_id: await uid(), article_id: articleId, completed, read_at: now, completed_at: completed ? now : null },
    { onConflict: "user_id,article_id" },
  );
  if (error) { toast.error(errMsg(error)); return false; }
  return true;
}

export function useInvalidateReads() {
  const qc = useQueryClient();
  return (articleId: string) => {
    qc.invalidateQueries({ queryKey: ["read-state", articleId] });
    qc.invalidateQueries({ queryKey: ["my-reads"] });
    qc.invalidateQueries({ queryKey: ["mine"] });
  };
}

export function MarkReadButton({ articleId }: { articleId: string }) {
  const s = useReadState(articleId);
  const inval = useInvalidateReads();
  const done = !!s.data?.completed;
  const toggle = async () => {
    if (!(await setCompleted(articleId, !done))) return;
    if (!done) toast.success("Marcado como lido");
    inval(articleId);
  };
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
      <p className="text-sm">{done ? "Você concluiu este conteúdo." : "Terminou a leitura? Registre para acompanhar seu progresso nas trilhas."}</p>
      <Button onClick={toggle} variant={done ? "outline" : "default"} aria-pressed={done}>
        <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden /> {done ? "Lido ✓ (desfazer)" : "Marcar como lido"}
      </Button>
    </section>
  );
}
