import { iconFor } from "@/lib/collections";
import { cn } from "@/lib/utils";

export function SystemIcon({ s, className }: { s: { icon?: string | null; logo_url?: string | null; name: string }; className?: string }) {
  if (s.logo_url) return <img src={s.logo_url} alt="" className={cn("rounded-lg border bg-card object-contain p-1", className)} />;
  const I = iconFor(s.icon ?? "monitor");
  return <span className={cn("flex items-center justify-center rounded-lg bg-primary-soft text-primary", className)}><I className="h-1/2 w-1/2" aria-hidden /></span>;
}
