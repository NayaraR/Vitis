import { supabase } from "@/integrations/supabase/client";
import { COVER_SELECT, type CoverItem } from "@/components/vitis/CoverCard";

type ColLike = { id: string; system_id: string | null; category_id: string | null; content_type: string | null };

/** Fixed items (in order) followed by published articles matching the collection's system/category/type. */
export async function loadCollectionArticles(c: ColLike): Promise<CoverItem[]> {
  const { data: items } = await supabase.from("collection_items").select(`sort_order, articles!inner(${COVER_SELECT})`).eq("collection_id", c.id).eq("articles.status", "published").order("sort_order");
  const list: CoverItem[] = (items ?? []).map((i) => i.articles as unknown as CoverItem);
  const seen = new Set(list.map((a) => a.id));
  if (c.system_id || c.category_id || c.content_type) {
    let ids: string[] | null = null;
    if (c.system_id) {
      const { data: s } = await supabase.from("article_systems").select("article_id").eq("system_id", c.system_id);
      ids = (s ?? []).map((x) => x.article_id);
    }
    if (ids === null || ids.length) {
      let aq = supabase.from("articles").select(COVER_SELECT).eq("status", "published");
      if (ids) aq = aq.in("id", ids);
      if (c.category_id) aq = aq.eq("category_id", c.category_id);
      if (c.content_type) aq = aq.eq("content_type", c.content_type as "procedure");
      const { data: extra } = await aq.order("sort_order").order("published_at", { ascending: false }).limit(60);
      (extra as CoverItem[] | null)?.forEach((a) => !seen.has(a.id) && list.push(a));
    }
  }
  return list;
}
