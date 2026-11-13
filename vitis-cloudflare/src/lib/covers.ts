import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const isUrl = (p: string) => /^https?:\/\//i.test(p);

/** Resolve cover_image values (storage paths in the private bucket or absolute URLs) to displayable URLs. */
export function useCoverUrls(paths: (string | null | undefined)[]) {
  const list = Array.from(new Set(paths.filter((p): p is string => !!p))).sort();
  return useQuery({
    queryKey: ["cover-urls", list],
    enabled: list.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const map: Record<string, string> = {};
      const stored = list.filter((p) => !isUrl(p));
      list.filter(isUrl).forEach((p) => (map[p] = p));
      if (stored.length) {
        const { data } = await supabase.storage.from("attachments").createSignedUrls(stored, 3600);
        data?.forEach((d) => d.path && d.signedUrl && (map[d.path] = d.signedUrl));
      }
      return map;
    },
  }).data ?? {};
}
