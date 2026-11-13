import { useEffect, useId, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/data";
import { Highlight } from "./Highlight";
import { cn } from "@/lib/utils";

type Sug = { slug: string; title: string; category_name: string | null };

export function SearchBox({ size = "md", autoFocus, initial = "" }: { size?: "md" | "lg"; autoFocus?: boolean | undefined; initial?: string | undefined }) {
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [sugs, setSugs] = useState<Sug[]>([]);
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(initial), [initial]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSugs([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_articles", { q, p_limit: 6 });
      setSugs((data ?? []) as Sug[]);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (term: string) => {
    setOpen(false);
    navigate({ to: "/biblioteca", search: { q: term || undefined } });
  };

  const popular = settings?.popular_queries ?? [];
  return (
    <div ref={wrap} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q.trim());
        }}
      >
        <label htmlFor={listId + "-in"} className="sr-only">Buscar na VITIS</label>
        <Search className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", size === "lg" ? "h-5 w-5 left-4" : "h-4 w-4")} aria-hidden />
        <input
          id={listId + "-in"}
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={size === "lg" ? "Ex.: troca sem nota, fechamento de caixa, senha do PDV…" : "Buscar manuais, processos, sistemas…"}
          autoComplete="off"
          aria-controls={listId}
          aria-expanded={open}
          className={cn(
            "w-full rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "lg" ? "h-14 pl-12 pr-28 text-base shadow-card" : "h-10 pl-9 pr-3 text-sm",
          )}
        />
        {size === "lg" && (
          <button type="submit" className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Buscar
          </button>
        )}
      </form>
      {open && (sugs.length > 0 || (q.trim().length < 2 && popular.length > 0)) && (
        <div id={listId} className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lift">
          {q.trim().length < 2 ? (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">Consultas populares</p>
              {popular.map((p) => (
                <button key={p} type="button" onClick={() => go(p)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> {p}
                </button>
              ))}
            </>
          ) : (
            <>
              {sugs.map((s) => (
                <Link key={s.slug} to="/artigo/$slug" params={{ slug: s.slug }} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-accent focus-visible:bg-accent">
                  <span className="font-medium"><Highlight text={s.title} query={q} /></span>
                  {s.category_name && <span className="block text-xs text-muted-foreground">{s.category_name}</span>}
                </Link>
              ))}
              <button type="button" onClick={() => go(q.trim())} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-accent">
                Ver todos os resultados para “{q.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
