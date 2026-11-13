import { AlertTriangle, Zap, Package } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type Step = { text: string; image_url?: string | null };
export type Faq = { q: string; a: string };
export type ArticleContent = {
  quick_answer?: string | null;
  attention?: string | null;
  materials?: string[] | null;
  steps?: Step[] | unknown;
  faq?: Faq[] | unknown;
  body_extra?: string | null;
};

export function ArticleBody({ c }: { c: ArticleContent }) {
  const steps = (Array.isArray(c.steps) ? c.steps : []) as Step[];
  const faq = (Array.isArray(c.faq) ? c.faq : []) as Faq[];
  return (
    <div className="space-y-8">
      {c.quick_answer && (
        <section aria-labelledby="h-quick" className="rounded-xl border-l-4 border-primary bg-primary-soft p-5">
          <h2 id="h-quick" className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary"><Zap className="h-4 w-4" aria-hidden /> Resposta rápida</h2>
          <p className="text-lg font-medium leading-relaxed">{c.quick_answer}</p>
        </section>
      )}
      {c.attention && (
        <section aria-labelledby="h-att" role="note" className="rounded-xl border border-warning/40 bg-warning-soft p-4">
          <h2 id="h-att" className="mb-1 flex items-center gap-2 font-bold text-warning"><AlertTriangle className="h-4 w-4" aria-hidden /> Atenção</h2>
          <p className="whitespace-pre-line">{c.attention}</p>
        </section>
      )}
      {!!c.materials?.length && (
        <section aria-labelledby="h-mat">
          <h2 id="h-mat" className="mb-2 flex items-center gap-2 text-lg font-bold"><Package className="h-4 w-4 text-primary" aria-hidden /> Materiais necessários</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {c.materials.map((m, i) => <li key={i} className="rounded-lg border bg-card px-3 py-2 text-sm">{m}</li>)}
          </ul>
        </section>
      )}
      {!!steps.length && (
        <section aria-labelledby="h-steps">
          <h2 id="h-steps" className="mb-3 text-lg font-bold">Passo a passo</h2>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-xl border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line leading-relaxed">{s.text}</p>
                  {s.image_url && <img src={s.image_url} alt={`Ilustração da etapa ${i + 1}`} className="mt-3 max-h-80 rounded-lg border" loading="lazy" />}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {c.body_extra && (
        <section aria-labelledby="h-extra">
          <h2 id="h-extra" className="mb-2 text-lg font-bold">Informações complementares</h2>
          <div className="whitespace-pre-line leading-relaxed">{c.body_extra}</div>
        </section>
      )}
      {!!faq.length && (
        <section aria-labelledby="h-faq">
          <h2 id="h-faq" className="mb-2 text-lg font-bold">Exceções e dúvidas frequentes</h2>
          <Accordion type="multiple" className="rounded-xl border bg-card px-4">
            {faq.map((f, i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}
    </div>
  );
}
