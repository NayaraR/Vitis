import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/vitis/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MailCheck } from "lucide-react";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar · VITIS" },
      { name: "description", content: "Acesse a central de conhecimento do Víssimo Group." },
      { property: "og:title", content: "Entrar · VITIS" },
      { property: "og:description", content: "Acesse a central de conhecimento do Víssimo Group." },
    ],
  }),
  component: AuthPage,
});

const INTERNAL_MSG = "Colaboradores entram com a conta Google da empresa.";

function safePath(p?: string) {
  if (!p) return "/inicio";
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin) return "/inicio";
    return u.pathname + u.search;
  } catch {
    return "/inicio";
  }
}

function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "sent">("login");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(search.redirect) as "/inicio", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: safePath(search.redirect) as "/inicio", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, search.redirect]);

  const google = async () => {
    setBusy(true);
    const { data: domains } = await supabase.rpc("get_internal_domains");
    const list = (domains ?? []) as string[];
    const extraParams: Record<string, string> = { prompt: "select_account" };
    if (list.length === 1 && list[0]) extraParams["hd"] = list[0];
    const r = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth", queryParams: extraParams },
    });
    if (r.error) {
      toast.error("Não foi possível entrar com Google.");
      setBusy(false);
    }
  };

  const checkInternal = async () => {
    const { data } = await supabase.rpc("is_internal_email", { _email: email });
    if (data) {
      toast.error(INTERNAL_MSG);
      return true;
    }
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (await checkInternal()) return;
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message.includes("confirmed") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos.");
      } else if (mode === "signup") {
        if (!privacy) return void toast.error("Aceite o aviso de privacidade para continuar.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name, privacy_accepted: true } },
        });
        if (error) toast.error(error.message.includes("Colaboradores") ? INTERNAL_MSG : error.message);
        else setMode("sent");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) toast.error(error.message);
        else {
          toast.success("Se o e-mail estiver cadastrado, você receberá um link.");
          setMode("login");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-hero lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Brand inverse />
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">A resposta oficial,<br />em poucos cliques.</h1>
          <p className="mt-4 max-w-md opacity-80">Manuais, processos de loja e materiais para gerentes — com versão, área responsável e data de revisão em cada conteúdo.</p>
        </div>
        <p className="font-meta opacity-60">Víssimo Group · central de conhecimento</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Brand /></div>
          <h2 className="text-2xl font-extrabold">Entrar na VITIS</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Escolha como você acessa.</p>
          <Tabs defaultValue="internal">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="internal">Sou colaborador</TabsTrigger>
              <TabsTrigger value="external">Sou cliente</TabsTrigger>
            </TabsList>
            <TabsContent value="internal" className="mt-6 space-y-4">
              <button
                type="button"
                onClick={google}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-[10px] rounded-lg border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F] disabled:opacity-60 dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3]"
              >
                <GoogleLogo /> Entrar com Google (colaboradores)
              </button>
              <p className="text-sm text-muted-foreground">Use a conta Google da empresa. Colaboradores não usam cadastro por e-mail e senha.</p>
            </TabsContent>
            <TabsContent value="external" className="mt-6">
              {mode === "sent" ? (
                <div className="rounded-xl border bg-card p-6 text-center">
                  <MailCheck className="mx-auto h-8 w-8 text-success" />
                  <h3 className="mt-3 font-bold">Confirme seu e-mail</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Enviamos um link para <strong>{email}</strong>. Depois de confirmar, você já pode entrar.</p>
                  <Button variant="link" onClick={() => setMode("login")}>Voltar para entrar</Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                  {mode !== "forgot" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                    </div>
                  )}
                  {mode === "signup" && (
                    <div className="flex items-start gap-2">
                      <Checkbox id="privacy" checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} />
                      <Label htmlFor="privacy" className="text-sm font-normal leading-snug">
                        Li e aceito o{" "}
                        <Dialog>
                          <DialogTrigger className="font-semibold text-primary underline">aviso de privacidade</DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Aviso de privacidade (texto provisório)</DialogTitle></DialogHeader>
                            <p className="text-sm text-muted-foreground">
                              Coletamos nome e e-mail apenas para permitir seu acesso à VITIS. Registramos a data do seu aceite. Não vendemos nem compartilhamos seus dados.
                              O texto oficial da política de privacidade e retenção ainda será definido pelo Víssimo Group (LGPD).
                            </p>
                          </DialogContent>
                        </Dialog>
                        .
                      </Label>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link de recuperação"}
                  </Button>
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    {mode === "login" ? (
                      <>
                        <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>Criar conta de cliente</button>
                        <button type="button" className="text-muted-foreground hover:underline" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
                      </>
                    ) : (
                      <button type="button" className="text-primary hover:underline" onClick={() => setMode("login")}>Já tenho conta</button>
                    )}
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
