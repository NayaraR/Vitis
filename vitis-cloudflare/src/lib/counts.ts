import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Published-article counts per category id (includes children rollup when given the category list). */
export function useCategoryCounts(categories?: { id: string; parent_id: string | null }[]) {
  return useQuery({
    queryKey: ["category-counts", categories?.length],
    enabled: !!categories,
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("category_id").eq("status", "published");
      if (error) throw error;
      const direct: Record<string, number> = {};
      for (const r of data) if (r.category_id) direct[r.category_id] = (direct[r.category_id] ?? 0) + 1;
      const total: Record<string, number> = { ...direct };
      for (const c of categories ?? []) if (c.parent_id && direct[c.id]) total[c.parent_id] = (total[c.parent_id] ?? 0) + (direct[c.id] ?? 0);
      return { total, all: data.length };
    },
  });
}
