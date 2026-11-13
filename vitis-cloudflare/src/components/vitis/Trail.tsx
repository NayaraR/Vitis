import { Link } from "@tanstack/react-router";
import { Clock, Layers, CheckCircle2, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS, fmtMinutes, type Level, type ModuleState, type Trail } from "@/lib/trails";

/** Generated VITIS cover: organic vine leaves and grape clusters. */
export function VineArt({ light, className }: { light?: boolean; className?: string }) {
  const a = light ? "fill-cover-shape/45" : "fill-cover-shape";
  const b = light ? "fill-cover-shape-2/35" : "fill-cover-shape-2";
  const vein = light ? "stroke-cover-light-fg/15" : "stroke-cover-dark/40";
  return (
    <svg aria-hidden viewBox="0 0 160 90" preserveAspectRatio="xMaxYMid slice" className={cn("absolute inset-0 -z-10 h-full w-full", className)}>
      <path d="M160 -4 C128 0 104 22 110 52 C116 44 126 40 136 42 C132 52 134 62 142 68 C146 52 156 40 166 36 Z" className={a} />
      <path d="M118 46 C130 34 146 24 164 18" className={vein} fill="none" strokeWidth="1.2" />
      <path d="M128 40 C130 48 136 56 142 62" className={vein} fill="none" strokeWidth="1" />
      <path d="M170 96 C150 72 122 70 104 84 C112 86 118 92 120 100 Z" className={b} />
      <g className={b}>
        {[[96, 20], [104, 20], [100, 27], [108, 27], [92, 27], [96, 34], [104, 34], [100, 41]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" />)}
      </g>
      <path d="M100 16 C100 10 104 6 110 4" className={vein} fill="none" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function TrailCover({ t, className, children }: { t: Pick<Trail, "cover_image" | "cover_style" | "title">; className?: string; children?: React.ReactNode }) {
  const light = t.cover_style === "light";
  return (
    <div className={cn("relative isolate overflow-hidden", light ? "bg-cover-light text-cover-light-fg" : "bg-cover-dark text-cover-dark-fg", className)}>
      {t.cover_image ? (
        <>
          <img src={t.cover_image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" loading="lazy" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-cover-dark/70" />
        </>
      ) : <VineArt light={light} />}
      {children}
    </div>
  );
}

export function LevelBadge({ level, className }: { level: string; className?: string }) {
  const n = level === "advanced" ? 3 : level === "intermediate" ? 2 : 1;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-current/30 bg-background/80 px-2.5 py-0.5 text-xs font-semibold text-foreground", className)}>
      <span aria-hidden className="flex gap-0.5">{[1, 2, 3].map((i) => <span key={i} className={cn("h-2.5 w-1 rounded-full", i <= n ? "bg-primary" : "bg-muted-foreground/30")} />)}</span>
      {LEVELS[level as Level] ?? level}
    </span>
  );
}

export function ProgressRing({ pct, size = 44, label }: { pct: number; size?: number; label?: string }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${pct}% concluído`}>
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset]" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
      </svg>
      <span aria-hidden className="absolute font-meta text-[10px] font-bold">{pct}%</span>
    </span>
  );
}

export function ModuleStateIcon({ s }: { s: ModuleState }) {
  if (s === "done") return <CheckCircle2 className="h-5 w-5 text-success" aria-label="Concluído" />;
  if (s === "in_progress") return <CircleDot className="h-5 w-5 text-primary" aria-label="Em andamento" />;
  return <Circle className="h-5 w-5 text-muted-foreground" aria-label="Não iniciado" />;
}

export function TrailCard({ t, pct, due }: { t: Trail; pct: number; due?: string | null | undefined }) {
  return (
    <Link to="/cultivo/$slug" params={{ slug: t.slug }} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-lift">
      <TrailCover t={t} className="aspect-[16/9]">
        <div className="flex h-full flex-col p-4">
          <LevelBadge level={t.level} className="w-fit" />
          <h3 className="mt-auto line-clamp-2 pr-10 font-display text-xl font-extrabold leading-tight">{t.title}</h3>
        </div>
      </TrailCover>
      <div className="flex flex-1 items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          {t.description && <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>}
          <p className="mt-2 flex flex-wrap gap-3 font-meta text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {fmtMinutes(t.minutes)}</span>
            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" aria-hidden /> {t.modules.length} {t.modules.length === 1 ? "módulo" : "módulos"}</span>
            {due && <span className="font-semibold text-warning">prazo {new Date(due + "T12:00:00Z").toLocaleDateString("pt-BR")}</span>}
          </p>
        </div>
        <ProgressRing pct={pct} />
      </div>
    </Link>
  );
}
