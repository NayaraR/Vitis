import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./labels";

export type Me = {
  userId: string;
  email: string;
  fullName: string | null;
  userType: "internal" | "external";
  active: boolean;
  areaId: string | null;
  organizationId: string | null;
  isTeamManager: boolean;
  roles: Role[];
  isInternal: boolean;
  isEditor: boolean;
  isAuthor: boolean;
  isReviewer: boolean;
  isCurator: boolean;
  isAdmin: boolean;
};

export const meQueryKey = ["me"];

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    staleTime: 60_000,
    queryFn: async (): Promise<Me | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      const roles = (r ?? []).map((x) => x.role as Role);
      const internal = p?.user_type === "internal" && !!p?.active;
      const has = (x: Role) => internal && roles.includes(x);
      return {
        userId: u.user.id,
        email: u.user.email ?? "",
        fullName: p?.full_name ?? null,
        userType: (p?.user_type as "internal" | "external") ?? "external",
        active: p?.active ?? false,
        areaId: p?.area_id ?? null,
        organizationId: p?.organization_id ?? null,
        isTeamManager: !!p?.active && !!p?.organization_id && roles.includes("team_manager"),
        roles,
        isInternal: internal,
        isAuthor: has("author"),
        isReviewer: has("reviewer"),
        isCurator: has("curator") || has("admin"),
        isAdmin: has("admin"),
        isEditor: has("author") || has("reviewer") || has("curator") || has("admin"),
      };
    },
  });
}
