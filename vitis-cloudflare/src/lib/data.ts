import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useSystems() {
  return useQuery({
    queryKey: ["systems"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("systems").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("areas").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export type SearchParams = {
  q?: string | undefined;
  cat?: string | undefined;
  sys?: string | undefined;
  type?: string | undefined;
  aud?: string | undefined;
  since?: string | undefined;
  arch?: boolean | undefined;
};

export function sinceToDate(since?: string) {
  if (!since) return null;
  const d = new Date();
  d.setDate(d.getDate() - Number(since));
  return d.toISOString();
}

export function useSearch(p: SearchParams, limit = 60) {
  return useQuery({
    queryKey: ["search", p, limit],
    queryFn: async () => {
      const args: Record<string, string | boolean | number> = { q: p.q ?? "", p_include_archived: !!p.arch, p_limit: limit };
      if (p.cat) args["p_category"] = p.cat;
      if (p.sys) args["p_system"] = p.sys;
      if (p.type) args["p_type"] = p.type;
      if (p.aud) args["p_audience"] = p.aud;
      const since = sinceToDate(p.since);
      if (since) args["p_updated_since"] = since;
      const { data, error } = await supabase.rpc("search_articles", args);
      if (error) throw error;
      return data;
    },
  });
}
