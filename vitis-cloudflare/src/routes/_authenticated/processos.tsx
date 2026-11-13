import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/vitis/AppShell";
import { CategoryView } from "@/components/vitis/CategoryView";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/processos")({
  head: () => pageHead("Processos de loja", "Rotinas oficiais de operação, abertura, caixa, atendimento e estoque."),
  component: () => <AppShell><CategoryView slug="processos-de-loja" /></AppShell>,
});
