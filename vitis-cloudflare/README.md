# Academia de Conhecimento VITIS

O site roda no **Cloudflare Workers**. O banco, o login e os anexos ficam no **seu próprio projeto Supabase**. O projeto não depende mais do Lovable.

## 1. Criar o Supabase

1. Entre em https://supabase.com e crie um projeto. O plano gratuito serve; escolha a região São Paulo.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase/setup.sql` e clique em **Run**. O script cria as tabelas, as funções, as permissões, o bucket `attachments` e os dados iniciais.
3. Em **Project Settings › API**, copie a **Project URL** e a **Publishable key** (`sb_publishable_...`).

## 2. Configurar o login

Em **Authentication › URL Configuration**:

- **Site URL:** `https://vitis.<sua-conta>.workers.dev`, ou o seu domínio
- **Redirect URLs:** adicione `https://vitis.<sua-conta>.workers.dev/**` e `http://localhost:8080/**`

**Login com Google:** abra **Authentication › Sign In / Providers › Google** e ative.

1. No Google Cloud Console, crie um *OAuth Client ID* do tipo aplicação web.
2. Cadastre como redirect a *Callback URL* que o Supabase mostra.
3. Cole o Client ID e o Secret no Supabase.

**E-mails** (confirmação de conta e redefinição de senha): o Supabase envia poucos e-mails por hora no plano gratuito. Para uso real, configure um SMTP em **Authentication › Emails › SMTP Settings**, por exemplo o do Google Workspace ou o Resend.

## 3. Publicar no Cloudflare

Envie este código para o GitHub (repositório NayaraR/Vitis). Depois, no Worker **vitis**:

**Settings › Build**

| Campo | Valor |
|---|---|
| Build command | `bun run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` (a pasta onde está o `package.json`) |

**Build variables** (usadas no build):

- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Publishable key

**Settings › Variables and Secrets** (usadas com o site rodando):

- `SUPABASE_URL` = Project URL
- `SUPABASE_PUBLISHABLE_KEY` = Publishable key

Depois de configurar, clique em **Retry build**.

## 4. Primeiro administrador

Entre no site uma vez com o Google, usando o seu e-mail @vissimo.com.br. Depois, rode isto no SQL Editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles
where email = 'seu.email@vissimo.com.br' and user_type = 'internal'
on conflict do nothing;
```

## Rodar no computador

```bash
cp .env.example .env   # preencha com os dados do Supabase
bun install
bun run dev            # http://localhost:8080
```

## Trazer os dados do Lovable

O banco novo começa vazio, só com os dados iniciais. Se você já tem artigos no Lovable, há duas formas de trazê-los:

- **Pelo próprio site:** exporte os artigos em Administração › Importar / Exportar no site antigo e importe no novo.
- **Pelo banco:** exporte as tabelas em CSV no Lovable Cloud › Database e importe no Supabase (Table Editor › Import data from CSV).

Os usuários precisam criar conta de novo, ou entrar com o Google.
