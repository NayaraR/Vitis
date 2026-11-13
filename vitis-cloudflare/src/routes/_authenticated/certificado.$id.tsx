import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { AppShell } from "@/components/vitis/AppShell";
import { VineArt } from "@/components/vitis/Trail";
import { ListSkeleton, NoAccessState } from "@/components/vitis/States";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/labels";
import { fmtMinutes } from "@/lib/trails";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/certificado/$id")({
  head: () => pageHead("Certificado", "Certificado de conclusão de trilha do Cultivo, na VITIS."),
  component: CertificatePage,
});

function CertificatePage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["cert", id], queryFn: async () => (await supabase.from("certificates").select("*").eq("id", id).maybeSingle()).data });
  if (q.isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!q.data) return <AppShell><NoAccessState>Certificado não encontrado.</NoAccessState></AppShell>;
  const c = q.data;

  const pdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const css = getComputedStyle(document.documentElement);
    const hex = (css.getPropertyValue("--brand-primary").trim() || "#593069");
    doc.setDrawColor(hex); doc.setLineWidth(1.5); doc.rect(10, 10, 277, 190);
    doc.setTextColor(hex); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("VITIS · CULTIVO", 148.5, 35, { align: "center" });
    doc.setTextColor("#222222"); doc.setFontSize(30); doc.text("Certificado de conclusão", 148.5, 60, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.text("Certificamos que", 148.5, 80, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text(c.full_name ?? "", 148.5, 96, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.text("concluiu a trilha", 148.5, 112, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text(doc.splitTextToSize(c.path_title, 240), 148.5, 128, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    doc.text(`Em ${fmtDate(c.issued_at)} · Duração estimada: ${fmtMinutes(c.minutes)}`, 148.5, 155, { align: "center" });
    doc.setFont("courier", "bold"); doc.text(`Código de verificação: ${c.code}`, 148.5, 185, { align: "center" });
    doc.save(`certificado-${c.code}.pdf`);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <article className="relative isolate overflow-hidden rounded-3xl border-2 border-primary bg-card p-8 text-center md:p-14" aria-label="Certificado">
          <VineArt light className="opacity-60" />
          <p className="font-display text-sm font-extrabold tracking-[0.25em] text-primary">VITIS · CULTIVO</p>
          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Certificado de conclusão</h1>
          <p className="mt-6 text-muted-foreground">Certificamos que</p>
          <p className="mt-1 font-display text-2xl font-bold md:text-3xl">{c.full_name}</p>
          <p className="mt-4 text-muted-foreground">concluiu a trilha</p>
          <p className="mt-1 text-xl font-bold">{c.path_title}</p>
          <p className="mt-6 text-sm">Em {fmtDate(c.issued_at)} · Duração estimada {fmtMinutes(c.minutes)}</p>
          <p className="mt-6 font-meta text-sm">Código de verificação <strong>{c.code}</strong></p>
        </article>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={pdf}><Download className="mr-2 h-4 w-4" aria-hidden /> Baixar PDF</Button>
          <Button asChild variant="outline"><Link to="/jornada">Minha jornada</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}
