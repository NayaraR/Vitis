import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, CheckCircle2, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMyReads } from "@/lib/reads";
import { trailProgress, useTrail } from "@/lib/trails";
import { setCompleted, useInvalidateReads } from "./ReadActions";

function useModulePos(trailSlug: string, articleId: string) {
  const t = useTrail(trailSlug);
  const reads = useMyReads();
  const trail = t.data;
  const i = trail ? trail.modules.findIndex((m) => m.id === articleId) : -1;
  return { trail, i, prog: trail ? trailProgress(trail, reads.data) : null };
}

/** "Módulo 3 de 8 · Anterior / Próximo" bar shown when an article is opened from a trail. */
export function TrailNav({ trailSlug, articleId }: { trailSlug: string; articleId: string }) {
  const { trail, i } = useModulePos(trailSlug, articleId);
  if (!trail || i < 0) return null;
  const prev = trail.modules[i - 1], next = trail.modules[i + 1];
  return (
    <nav aria-label="Navegação da trilha" className="sticky top-16 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur md:-mx-8 md:px-8">
      <Link to="/cultivo/$slug" params={{ slug: trail.slug }} className="flex min-w-0 items-center gap-2 text-sm font-semibold hover:text-primary">
        <Sprout className="h-4 w-4 shrink-0 text-primary" aria-hidden /><span className="truncate">{trail.title}</span>
      </Link>
      <span className="font-meta text-muted-foreground">Módulo {i + 1} de {trail.modules.length}</span>
      <span className="ml-auto flex gap-1">
        {prev ? <Button asChild size="sm" variant="ghost"><Link to="/artigo/$slug" params={{ slug: prev.slug }} search={{ trilha: trail.slug }}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Link></Button> : <Button size="sm" variant="ghost" disabled><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button>}
        {next ? <Button asChild size="sm" variant="ghost"><Link to="/artigo/$slug" params={{ slug: next.slug }} search={{ trilha: trail.slug }}>Próximo <ChevronRight className="ml-1 h-4 w-4" /></Link></Button> : <Button size="sm" variant="ghost" disabled>Próximo <ChevronRight className="ml-1 h-4 w-4" /></Button>}
      </span>
    </nav>
  );
}

export function TrailCompleteBar({ trailSlug, articleId }: { trailSlug: string; articleId: string }) {
  const { trail, i, prog } = useModulePos(trailSlug, articleId);
  const navigate = useNavigate();
  const inval = useInvalidateReads();
  if (!trail || i < 0 || !prog) return null;
  const done = prog.states[i] === "done";
  const next = trail.modules[i + 1];
  const complete = async () => {
    if (!(await setCompleted(articleId, true))) return;
    inval(articleId);
    toast.success("Módulo concluído");
    if (next) navigate({ to: "/artigo/$slug", params: { slug: next.slug }, search: { trilha: trail.slug } });
    else navigate({ to: "/cultivo/$slug", params: { slug: trail.slug } });
  };
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-primary-soft p-5">
      <p className="text-sm">{done ? "Módulo concluído." : `Terminou? Conclua o módulo ${i + 1} de ${trail.modules.length}.`}</p>
      {done ? (
        next ? <Button asChild><Link to="/artigo/$slug" params={{ slug: next.slug }} search={{ trilha: trail.slug }}>Próximo módulo <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
          : <Button asChild variant="outline"><Link to="/cultivo/$slug" params={{ slug: trail.slug }}>Voltar à trilha</Link></Button>
      ) : <Button onClick={complete}><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden /> Concluir módulo</Button>}
    </section>
  );
}
