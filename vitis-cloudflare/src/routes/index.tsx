import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VITIS · Central de conhecimento do Víssimo Group" },
      { name: "description", content: "Manuais, processos de loja e materiais oficiais do Víssimo Group." },
      { property: "og:title", content: "VITIS · Central de conhecimento do Víssimo Group" },
      { property: "og:description", content: "Manuais, processos de loja e materiais oficiais do Víssimo Group." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/inicio" });
  },
});
