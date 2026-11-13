import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/vitis/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/labels";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/convite/$token")({
  head: () => pageHead("Convite da equipe", "Aceite o convite para entrar na equipe da sua loja na VITIS."),
  component: Invite,
});

function Invite() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const accept = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_invite", { p_token: token });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`Você agora faz parte de ${data}.`);
    await qc.invalidateQueries();
    navigate({ to: "/cultivo" });
  };
  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center">
        <Users className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <h1 className="mt-3 text-2xl font-extrabold">Convite para a equipe</h1>
        <p className="mt-2 text-muted-foreground">Ao aceitar, sua conta fica ligada à organização que enviou o convite. O gestor da loja poderá acompanhar seu progresso nas trilhas.</p>
        <Button className="mt-6" onClick={accept} disabled={busy}>Aceitar convite</Button>
      </div>
    </AppShell>
  );
}
