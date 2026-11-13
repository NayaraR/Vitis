import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/vitis/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · VITIS" },
      { name: "description", content: "Defina uma nova senha para sua conta VITIS." },
      { property: "og:title", content: "Redefinir senha · VITIS" },
      { property: "og:description", content: "Defina uma nova senha para sua conta VITIS." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return void toast.error("Link inválido ou expirado. Peça um novo.");
    toast.success("Senha atualizada.");
    navigate({ to: "/inicio" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-card">
        <Brand />
        <h1 className="text-xl font-extrabold">Nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Nova senha (mín. 8 caracteres)</Label>
          <Input id="pw" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </div>
        <Button className="w-full" disabled={busy}>Salvar nova senha</Button>
      </form>
    </div>
  );
}
