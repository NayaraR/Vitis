import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Award, Clock, Layers, Pencil, Play, Printer, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { AppShell } from "@/components/vitis/AppShell";
import { LevelBadge, ModuleStateIcon, ProgressRing, TrailCover } from "@/components/vitis/Trail";
import { ListSkeleton, NoAccessState } from "@/components/vitis/States";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/me";
import { useMyReads } from "@/lib/reads";
import { LEVELS, TRAIL_AUDIENCES, fmtMinutes, trailProgress, useMyCertificates, useTrail, type Level } from "@/lib/trails";
import { errMsg } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/cultivo/$slug")({
  head: () => pageHead("Trilha", "Trilha de capacitação do Cultivo, na VITIS."),
  component: TrailPage,
});

const STATE_TXT = { not_started: "Não iniciado", in_progress: "Em andamento", done: "Concluído" } as const;

function TrailPage() {
  const { slug } = Route.useParams();
  const { data: me } = useMe();
  const t = useTrail(slug);
  const reads = useMyReads();
  const certs = useMyCertificates(me?.userId);
  if (t.isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!t.data) return <AppShell><NoAccessState>Esta trilha não existe ou não está disponível para o seu perfil.</NoAccessState></AppShell>;
  const trail = t.data;
  const p = trailProgress(trail, reads.data);
  const cert = certs.data?.find((c) => c.collection_id === trail.id);

  return (
    <AppShell>
      <nav aria-label="Trilha de navegação" className="mb-3 text-sm text-muted-foreground"><Link to="/cultivo" className="hover:text-primary">Cultivo</Link> › <span>{trail.title}</span></nav>
      <TrailCover t={trail} className="mb-8 rounded-3xl">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-10">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <LevelBadge level={trail.level} />
              {trail.status === "draft" && <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-foreground">RASCUNHO</span>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-5xl">{trail.title}</h1>
            {trail.description && <p className="mt-3 opacity-90">{trail.description}</p>}
            <p className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
              <span className="flex items-center gap-1"><Layers className="h-4 w-4" aria-hidden /> {trail.modules.length} módulos</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden /> {fmtMinutes(trail.minutes)}</span>
              <span>Para: {trail.audience.map((a) => TRAIL_AUDIENCES[a as keyof typeof TRAIL_AUDIENCES] ?? a).join(", ")}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-background p-1"><ProgressRing pct={p.pct} size={60} label={`${p.done} de ${p.total} módulos concluídos`} /></span>
            {p.next && (
              <Button asChild size="lg" className="rounded-full">
                <Link to="/artigo/$slug" params={{ slug: p.next.slug }} search={{ trilha: trail.slug }}><Play className="mr-2 h-4 w-4 fill-current" aria-hidden /> {p.state === "not_started" ? "Começar" : p.state === "done" ? "Rever" : "Continuar"}</Link>
              </Button>
            )}
          </div>
        </div>
      </TrailCover>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Módulos <span className="font-meta font-normal text-muted-foreground">· {p.done} de {p.total} concluídos</span></h2>
        <div className="flex flex-wrap gap-2">
          {(me?.isTeamManager || me?.isCurator) && <ShareDialog title={trail.title} slug={trail.slug} />}
          {me?.isCurator && <Button asChild variant="outline" size="sm"><Link to="/admin" search={{ tab: "colecoes" }}><Pencil className="mr-1 h-4 w-4" /> Editar trilha</Link></Button>}
        </div>
      </div>
      {trail.modules.length === 0 ? <p className="rounded-xl border p-6 text-muted-foreground">Esta trilha ainda não tem módulos publicados.</p> : (
        <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
          {trail.modules.map((m, i) => (
            <li key={m.id}>
              <Link to="/artigo/$slug" params={{ slug: m.slug }} search={{ trilha: trail.slug }} className="flex items-center gap-4 p-4 hover:bg-muted/60">
                <span className="w-6 text-center font-meta font-bold text-muted-foreground">{i + 1}</span>
                <ModuleStateIcon s={p.states[i]!} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{m.title}</span>
                  {m.summary && <span className="line-clamp-1 block text-sm text-muted-foreground">{m.summary}</span>}
                </span>
                <span className="hidden font-meta text-muted-foreground sm:block">{m.estimated_minutes} min · {STATE_TXT[p.states[i]!]}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Quiz collectionId={trail.id} unlocked={p.state === "done"} />
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Award className="h-5 w-5 text-primary" aria-hidden /> Certificado</h2>
          {cert ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm">Você concluiu esta trilha. Código <span className="font-meta font-bold">{cert.code}</span>.</p>
              <Button asChild><Link to="/certificado/$id" params={{ id: cert.id }}>Ver certificado</Link></Button>
            </div>
          ) : <IssueCert collectionId={trail.id} ready={p.state === "done"} />}
        </section>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Nível: {LEVELS[trail.level as Level]}. O progresso conta os módulos marcados como concluídos.</p>
    </AppShell>
  );
}

function IssueCert({ collectionId, ready }: { collectionId: string; ready: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const issue = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("issue_certificate", { p_collection: collectionId });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    qc.invalidateQueries({ queryKey: ["my-certs"] });
    toast.success("Parabéns! Trilha concluída.");
    navigate({ to: "/certificado/$id", params: { id: (data as { id: string }).id } });
  };
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">{ready ? "Todos os módulos concluídos. Se a trilha tiver teste rápido, atinja a nota mínima para emitir o certificado." : "Conclua todos os módulos para emitir o certificado."}</p>
      <Button onClick={issue} disabled={!ready || busy}>Emitir certificado</Button>
    </div>
  );
}

type QuizData = { id: string; pass_score: number; questions: { id: string; prompt: string; options: string[] }[] } | null;

function Quiz({ collectionId, unlocked }: { collectionId: string; unlocked: boolean }) {
  const { data: me } = useMe();
  const quiz = useQuery({ queryKey: ["quiz", collectionId], queryFn: async () => (await supabase.rpc("get_quiz", { p_collection: collectionId })).data as QuizData });
  const best = useQuery({
    queryKey: ["quiz-best", quiz.data?.id, me?.userId],
    enabled: !!quiz.data?.id && !!me,
    queryFn: async () => (await supabase.from("quiz_attempts").select("score,passed").eq("quiz_id", quiz.data!.id).eq("user_id", me!.userId).order("score", { ascending: false }).limit(1)).data?.[0] ?? null,
  });
  const [ans, setAns] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  if (!quiz.data || !quiz.data.questions.length) return null;
  const q = quiz.data;
  const submit = async () => {
    const { data, error } = await supabase.rpc("submit_quiz", { p_quiz: q.id, p_answers: ans });
    if (error) { toast.error(errMsg(error)); return; }
    setResult(data as { score: number; passed: boolean });
    best.refetch();
  };
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="text-lg font-bold">Teste rápido</h2>
      <p className="text-sm text-muted-foreground">{q.questions.length} perguntas · nota mínima {q.pass_score}%{best.data ? ` · sua melhor nota: ${best.data.score}%${best.data.passed ? " ✓" : ""}` : ""}</p>
      {!unlocked ? <p className="mt-3 text-sm">Disponível depois de concluir todos os módulos.</p> : (
        <form className="mt-4 space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {q.questions.map((x, i) => (
            <fieldset key={x.id}>
              <legend className="mb-2 font-medium">{i + 1}. {x.prompt}</legend>
              <RadioGroup value={ans[x.id]?.toString() ?? ""} onValueChange={(v) => setAns({ ...ans, [x.id]: Number(v) })}>
                {x.options.map((o, j) => (
                  <div key={j} className="flex items-center gap-2"><RadioGroupItem id={`${x.id}-${j}`} value={String(j)} /><Label htmlFor={`${x.id}-${j}`} className="font-normal">{o}</Label></div>
                ))}
              </RadioGroup>
            </fieldset>
          ))}
          <Button type="submit" disabled={Object.keys(ans).length < q.questions.length}>Enviar respostas</Button>
          {result && <p role="status" className={result.passed ? "font-semibold text-success" : "font-semibold text-destructive"}>Nota {result.score}% — {result.passed ? "aprovado! Agora você pode emitir o certificado." : "abaixo da nota mínima. Revise os módulos e tente de novo."}</p>}
        </form>
      )}
    </section>
  );
}

function ShareDialog({ title, slug }: { title: string; slug: string }) {
  const [qr, setQr] = useState("");
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/cultivo/${slug}` : "";
  useEffect(() => { if (open && url) QRCode.toDataURL(url, { width: 480, margin: 1 }).then(setQr); }, [open, url]);
  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title></head><body style="font-family:sans-serif;text-align:center;padding:40px"><p style="letter-spacing:.2em;font-weight:700">VITIS · CULTIVO</p><h1>${title.replace(/</g, "&lt;")}</h1><img src="${qr}" style="width:320px"/><p>Aponte a câmera do celular para começar a trilha.</p><p style="font-size:12px">${url}</p><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Share2 className="mr-1 h-4 w-4" /> Compartilhar com minha equipe</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Compartilhar “{title}”</DialogTitle>
        <DialogDescription>Envie o link ou imprima o QR code para o mural da loja. Cada pessoa entra com a própria conta.</DialogDescription>
        <div className="flex flex-col items-center gap-3">
          {qr ? <img src={qr} alt={`QR code para ${url}`} className="h-56 w-56 rounded-lg border bg-card p-2" /> : <div className="h-56 w-56 animate-pulse rounded-lg bg-muted" />}
          <code className="w-full break-all rounded bg-muted p-2 text-center text-xs">{url}</code>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copiado"))}>Copiar link</Button>
            <Button onClick={print} disabled={!qr}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
