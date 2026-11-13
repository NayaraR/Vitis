import { createFileRoute, redirect } from "@tanstack/react-router";

// Old collection URLs now live in Cultivo.
export const Route = createFileRoute("/_authenticated/colecao/$slug")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/cultivo/$slug", params: { slug: params.slug }, replace: true }); },
});
