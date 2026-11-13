import { createFileRoute, redirect } from "@tanstack/react-router";

// "Meus conteúdos" became "Minha jornada".
export const Route = createFileRoute("/_authenticated/meus-conteudos")({
  beforeLoad: () => { throw redirect({ to: "/jornada", replace: true }); },
});
