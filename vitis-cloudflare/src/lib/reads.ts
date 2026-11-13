import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** The signed-in person's own reads. */
export function useMyReads() {
  return useQuery({
    queryKey: ["my-reads"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      // Team managers can also read their team's rows, so always scope to self.
      const { data, error } = await supabase.from("article_reads").select("article_id,read_at,completed,completed_at").eq("user_id", u.user.id).order("read_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Progress over a list of article ids: completed reads only. */
export function progressOf(ids: string[], reads: { article_id: string; completed: boolean }[] | undefined) {
  const done = new Set((reads ?? []).filter((r) => r.completed).map((r) => r.article_id));
  return { done, count: ids.filter((i) => done.has(i)).length, total: ids.length };
}
