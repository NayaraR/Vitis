import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, ListTodo, Presentation, PlayCircle, GraduationCap, Layers, FileText, Monitor, Megaphone, Star, ShoppingCart, Database, Calculator, Truck, Package, CreditCard, Server, Smartphone, Utensils, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const COLLECTION_ICONS: Record<string, LucideIcon> = {
  "list-todo": ListTodo, presentation: Presentation, "play-circle": PlayCircle, "graduation-cap": GraduationCap,
  layers: Layers, "file-text": FileText, monitor: Monitor, megaphone: Megaphone, star: Star, "book-open": BookOpen,
  "shopping-cart": ShoppingCart, database: Database, calculator: Calculator, truck: Truck, package: Package,
  "credit-card": CreditCard, server: Server, smartphone: Smartphone, utensils: Utensils,
};
export const COLLECTION_KINDS = { onboarding: "Onboarding", guides: "Guias", custom: "Personalizada" } as const;
export const iconFor = (name?: string | null) => COLLECTION_ICONS[name ?? ""] ?? BookOpen;

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("*").order("sort_order").order("title");
      if (error) throw error;
      return data;
    },
  });
}
