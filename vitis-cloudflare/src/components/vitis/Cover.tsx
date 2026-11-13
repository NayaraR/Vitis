import { CalendarDays, Clock } from "lucide-react";
import { CONTENT_TYPES } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type CoverData = {
  title: string;
  content_type?: string | null;
  cover_image?: string | null;
  cover_label?: string | null;
  cover_style?: string | null;
  event_at?: string | null;
  is_example?: boolean | null;
};

export const coverLabel = (a: CoverData) =>
  (a.cover_label || CONTENT_TYPES[(a.content_type ?? "other") as keyof typeof CONTENT_TYPES] || "Conteúdo").toUpperCase();

function fmtEvent(d: string) {
  const dt = new Date(d);
  const tz = { timeZone: "America/Sao_Paulo" } as const;
  return {
    date: dt.toLocaleDateString("pt-BR", { ...tz, day: "2-digit", month: "2-digit", year: "numeric" }),
    time: dt.toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" }),
  };
}

/** Square/landscape cover: uploaded image or a generated VITIS cover. */
export function CoverArt({ a, imageUrl, className, size = "lg" }: { a: CoverData; imageUrl?: string | undefined; className?: string; size?: "lg" | "sm" }) {
  const light = a.cover_style === "light";
  const ev = a.event_at ? fmtEvent(a.event_at) : null;
  return (
    <div className={cn("relative isolate overflow-hidden", light ? "bg-cover-light text-cover-light-fg" : "bg-cover-dark text-cover-dark-fg", className)}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" loading="lazy" />
      ) : (
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 -z-10 h-full w-full">
          <path d="M100 0 L58 0 C58 26 74 44 100 48 Z" className={light ? "fill-cover-shape/40" : "fill-cover-shape"} />
          <path d="M100 100 L100 66 C82 68 70 82 68 100 Z" className={light ? "fill-cover-shape-2/30" : "fill-cover-shape-2"} />
        </svg>
      )}
      {imageUrl && <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-cover-dark/90 via-cover-dark/30 to-transparent" />}
      <div className={cn("flex h-full flex-col", size === "lg" ? "p-6" : "p-4", imageUrl && "text-cover-dark-fg")}>
        <span className={cn("w-fit rounded-full border border-current px-3 py-0.5 font-meta font-semibold tracking-wider", size === "sm" && "text-[10px]")}>{coverLabel(a)}</span>
        <h3 className={cn("mt-auto font-display font-extrabold leading-[1.05] tracking-tight", size === "lg" ? "text-2xl md:text-[1.7rem]" : "text-lg", "line-clamp-3 shrink-0 pr-4")}>{a.title}</h3>
        {ev && (
          <p className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden /> {ev.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden /> {ev.time}</span>
          </p>
        )}
        <span className={cn("mt-3 font-display text-xs font-extrabold tracking-[0.2em] opacity-80")}>VITIS</span>
      </div>
      {a.is_example && (
        <span className="absolute right-3 top-3 rounded-full bg-example px-2 py-0.5 font-meta font-bold text-primary-foreground">EXEMPLO</span>
      )}
    </div>
  );
}
