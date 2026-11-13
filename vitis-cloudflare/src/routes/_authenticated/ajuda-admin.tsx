import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/vitis/AppShell";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/ajuda-admin")({
  head: () => pageHead("Ajuda do administrador", "Como configurar, alimentar e manter a VITIS."),
  component: Help,
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:text-foreground">{children}</div>
    </section>
  );
}

function Help() {
  return (
    <AppShell>
      <PageHeader title="Ajuda do administrador" subtitle="Configuração e operação da VITIS." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="1. Cadastrar o primeiro administrador">
          <p>A pessoa entra uma vez com “Entrar com Google (colaboradores)” usando o e-mail da empresa. Depois, rode no banco (Supabase › SQL Editor), trocando o e-mail:</p>
          <pre>{`insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles
where email = 'PESSOA@SEU-DOMINIO' and user_type = 'internal'
on conflict do nothing;`}</pre>
          <p>Externos não podem virar admin (o banco recusa). A partir daí, os papéis são dados na aba Usuários e perfis.</p>
        </Block>
        <Block title="2. Configurar o login Google">
          <p>Para o login Google: no Google Cloud Console crie um “OAuth Client ID” (aplicação web), com escopos <code>openid</code>, <code>email</code> e <code>profile</code>, e cadastre a URL de callback mostrada em Supabase › Authentication › Sign In / Providers › Google. Cole o Client ID e o Secret no mesmo lugar.</p>
          <p>Domínios internos ficam em Administração › Configurações. Com um único domínio, o login Google já filtra por ele (parâmetro <code>hd</code>). Quem entra com Google de outro domínio vira cliente externo.</p>
        </Block>
        <Block title="3. Categorias, sistemas e áreas">
          <p>Em Administração › Categorias, sistemas e áreas (curadoria/admin): crie itens, escolha a categoria-mãe, defina a visibilidade e desative o que não for mais usado. Desativar não apaga conteúdos.</p>
        </Block>
        <Block title="4. Alimentar e importar artigos">
          <p>Autores criam rascunhos em Administração › Artigos › Novo artigo, só da própria área (defina a área de cada pessoa em Usuários). Para cargas em lote, use Importar / Exportar com JSON ou CSV — tudo entra como rascunho e é exibido um relatório de aceitos e recusados.</p>
        </Block>
        <Block title="5. Aprovar e publicar">
          <p>Autor salva e envia para revisão → revisor da área aprova ou devolve (comentário obrigatório) → Curadoria publica informando versão (diferente da vigente), próxima revisão e resumo da mudança. Editar um artigo publicado cria uma nova versão; a anterior continua no ar até a publicação. Arquivar preserva o histórico.</p>
          <p>Revisões programadas mostra o que vence em 30 dias. “Confirmar sem alteração” registra no histórico e reagenda.</p>
        </Block>
        <Block title="6. Backup e exportação">
          <p>Em Importar / Exportar, um administrador baixa o JSON completo (artigos, versões, categorias, sistemas, feedback) e o CSV de artigos. Os arquivos anexos ficam no armazenamento privado e não entram no JSON (só os metadados). Guarde as exportações em local seguro: elas podem conter feedback de usuários.</p>
        </Block>
        <Block title="Dados de exemplo">
          <p>Os conteúdos com selo “EXEMPLO” servem só para demonstração. Remova-os em Configurações › Remover dados de exemplo antes de abrir a VITIS para as lojas.</p>
        </Block>
      </div>
    </AppShell>
  );
}
