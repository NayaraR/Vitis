import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const LEVELS = { beginner: "Primeiros passos", intermediate: "Intermediário", advanced: "Avançado" } as const;
export type Level = keyof typeof LEVELS;
export const TRAIL_AUDIENCES = { store_team: "Equipe de loja", manager: "Gerente", client: "Cliente externo", all: "Todos" } as const;

export type Module = {
  id: string; slug: string; title: string; summary: string | null; status: string;
  estimated_minutes: number; cover_image: string | null; content_type: string; is_example: boolean;
};
export type Trail = Tables<"collections"> & { modules: Module[]; minutes: number };

const SELECT = "*, collection_items(sort_order, articles(id,slug,title,summary,status,estimated_minutes,cover_image,content_type,is_example))";

type Raw = Tables<"collections"> & { collection_items: { sort_order: number; articles: Module | null }[] };
function shape(c: Raw): Trail {
  const modules = [...(c.collection_items ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.articles)
    .filter((a): a is Module => !!a && a.status === "published");
  const { collection_items: _ignored, ...rest } = c;
  return { ...rest, modules, minutes: modules.reduce((s, m) => s + (m.estimated_minutes || 0), 0) };
}

/** Published, active trails visible to the person (RLS enforces visibility). */
export function useTrails() {
  return useQuery({
    queryKey: ["trails"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select(SELECT).eq("active", true).eq("status", "published").order("sort_order");
      if (error) throw error;
      return (data as unknown as Raw[]).map(shape);
    },
  });
}

export function useTrail(slug: string | undefined) {
  return useQuery({
    queryKey: ["trail", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select(SELECT).eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data ? shape(data as unknown as Raw) : null;
    },
  });
}

export type ReadRow = { article_id: string; read_at: string; completed: boolean; completed_at?: string | null };
export type ModuleState = "not_started" | "in_progress" | "done";

export function trailProgress(t: Pick<Trail, "modules">, reads: ReadRow[] | undefined) {
  const byId = new Map((reads ?? []).map((r) => [r.article_id, r]));
  const states = t.modules.map((m): ModuleState => {
    const r = byId.get(m.id);
    return r?.completed ? "done" : r ? "in_progress" : "not_started";
  });
  const done = states.filter((s) => s === "done").length;
  const total = t.modules.length;
  const state: ModuleState = total > 0 && done === total ? "done" : states.some((s) => s !== "not_started") ? "in_progress" : "not_started";
  const nextIdx = states.findIndex((s) => s !== "done");
  return { states, done, total, pct: total ? Math.round((done / total) * 100) : 0, state, next: t.modules[nextIdx === -1 ? 0 : nextIdx] };
}

export const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);

/** Consecutive study days ending today or yesterday (America/Sao_Paulo). */
export function studyStreak(days: string[], today: string) {
  const set = new Set(days);
  const d = new Date(today + "T12:00:00Z");
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

export const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/** Audiences that fit a person: internal → store team/manager; external → client. */
export function audienceFits(audience: string[], isInternal: boolean) {
  if (audience.includes("all")) return true;
  return isInternal ? audience.includes("store_team") || audience.includes("manager") : audience.includes("client");
}

export function useMyCertificates(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-certs", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("certificates").select("*").eq("user_id", userId!).order("issued_at", { ascending: false })).data ?? [],
  });
}

/** Trails assigned to me or to my whole organization. */
export function useMyAssignments(userId: string | undefined, orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["my-assignments", userId, orgId],
    enabled: !!userId && !!orgId,
    queryFn: async () => (await supabase.from("path_assignments").select("collection_id,due_date,user_id").eq("organization_id", orgId!).or(`user_id.is.null,user_id.eq.${userId}`)).data ?? [],
  });
}
