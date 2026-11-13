import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/vitis/AppShell";
import { CategoryView } from "@/components/vitis/CategoryView";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/categoria/$slug")({
  head: () => pageHead("Categoria", "Conteúdos oficiais por categoria na VITIS."),
  component: () => {
    const { slug } = Route.useParams();
    return <AppShell><CategoryView slug={slug} /></AppShell>;
  },
});
