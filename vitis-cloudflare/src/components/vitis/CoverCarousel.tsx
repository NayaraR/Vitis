import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Horizontally scrollable row with keyboard-accessible arrows; native scroll keeps touch drag on mobile. */
export function CoverCarousel({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <div className="relative" role="region" aria-roledescription="carrossel" aria-label={label}>
      <div className="mb-3 flex justify-end gap-2">
        <Button variant="outline" size="icon" className="rounded-full" aria-label="Anterior" onClick={() => by(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="rounded-full" aria-label="Próximo" onClick={() => by(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); by(1); } if (e.key === "ArrowLeft") { e.preventDefault(); by(-1); } }}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 focus-visible:outline-2"
      >
        {children}
      </div>
    </div>
  );
}
