# Fórmula Íntima

Loja online de lingerie e produtos íntimos. Site estático hospedado gratuitamente no **GitHub Pages**, com backend, banco de dados e login social no **Supabase** (plano gratuito) e pagamentos via **Mercado Pago**.

## Como o site funciona

- **Frontend** (`/frontend`): React + Vite, é o site que os clientes acessam. Publicado automaticamente no GitHub Pages a cada alteração na branch `main`.
- **Backend** (`/supabase`): banco de dados Postgres, autenticação (e-mail/senha e Google), upload de fotos de produto e as duas "Edge Functions" que processam pagamento (`create-payment` e `mp-webhook`), tudo rodando no Supabase.
- **Pagamento**: Mercado Pago (Pix, cartão, boleto).

Nenhuma dessas partes cobra mensalidade nos planos gratuitos usados aqui; o Mercado Pago cobra apenas uma taxa por venda aprovada.

---

## Passo a passo para colocar no ar

### 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (escolha uma senha forte de banco de dados e guarde-a).
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole o conteúdo de `supabase/migrations/0001_init.sql` e rode. Repita para `0002_storage.sql` e `0003_functions.sql`, **nessa ordem**.
3. Em **Project Settings → API**, copie:
   - `Project URL` → vai virar `VITE_SUPABASE_URL`
   - `anon public key` → vai virar `VITE_SUPABASE_ANON_KEY`
   - `service_role key` → **nunca** vai para o frontend nem para o repositório; é usada só nas Edge Functions (passo 5).

### 2. Configurar login com Google

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) → crie um projeto → **APIs & Services → Credentials → Create Credentials → OAuth client ID** (tipo "Web application").
2. Em **Authorized redirect URIs**, adicione a URL de callback que o Supabase mostra em **Authentication → Providers → Google** (formato `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
3. Copie o **Client ID** e **Client Secret** gerados e cole em **Authentication → Providers → Google** no Supabase, habilitando o provider.
4. Em **Authentication → URL Configuration**, configure (senão o Supabase redireciona o login de volta para `localhost:3000` por padrão):
   - **Site URL**: `https://SEU-USUARIO.github.io/formula-intima/`
   - **Redirect URLs**: `https://SEU-USUARIO.github.io/formula-intima/**`
5. O app OAuth do Google começa em modo de teste (só contas cadastradas como "usuários de teste" conseguem logar). Para liberar para qualquer cliente, vá em **Google Auth Platform → Público-alvo** e clique em **Publicar app**.

### 3. Configurar Mercado Pago

1. Crie/entre na conta em [mercadopago.com.br](https://www.mercadopago.com.br) com o CPF/CNPJ que vai receber os pagamentos.
2. Acesse [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel) → crie uma aplicação.
3. Use primeiro as **credenciais de teste (sandbox)** para validar tudo. Quando estiver tudo funcionando, troque pelas **credenciais de produção**.
4. Guarde o **Access Token** — ele vai virar o segredo `MP_ACCESS_TOKEN` no próximo passo.

### 4. Publicar as Edge Functions (pagamento)

Isso exige o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado. Na raiz do projeto:

```bash
npx supabase login
npx supabase link --project-ref SEU-PROJECT-REF
npx supabase functions deploy create-payment
npx supabase functions deploy mp-webhook

npx supabase secrets set MP_ACCESS_TOKEN=seu-access-token-mercado-pago
npx supabase secrets set SITE_URL=https://SEU-USUARIO.github.io/formula-intima
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já ficam disponíveis automaticamente dentro das Edge Functions — não precisa configurá-los manualmente.

No painel do Mercado Pago, configure a **URL de notificação (webhook)** para:
`https://SEU-PROJETO.supabase.co/functions/v1/mp-webhook`

### 5. Configurar o repositório no GitHub

1. Em **Settings → Secrets and variables → Actions** do repositório, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Em **Settings → Pages**, em "Build and deployment", selecione **Source: GitHub Actions**.
3. A cada `git push` na branch `main`, o site é buildado e publicado automaticamente (veja `.github/workflows/deploy.yml`). A URL final fica em `https://SEU-USUARIO.github.io/formula-intima/`.

### 6. Criar a conta de administradora (sua mãe)

1. Ela deve se cadastrar normalmente pelo site (e-mail/senha ou Google).
2. No Supabase, vá em **Table Editor → profiles**, encontre a linha dela e mude a coluna `role` de `cliente` para `admin`.
3. Com isso, ao entrar no site, o link **Painel admin** aparece no menu para cadastrar produtos, controlar estoque e ver pedidos.

---

## Rodando o projeto localmente

```bash
cd frontend
cp .env.example .env    # preencha com a URL e a anon key do seu projeto Supabase
npm install
npm run dev
```

## Estrutura do repositório

```
frontend/            site (React + Vite + TypeScript + Tailwind)
supabase/
  migrations/         schema do banco (SQL, aplicar em ordem)
  functions/          Edge Functions (pagamento e webhook do Mercado Pago)
.github/workflows/    build e deploy automático para o GitHub Pages
```

## Sobre discrição e privacidade

- O checkout usa embalagem e comunicação neutras — o conteúdo do pedido não aparece em rótulos externos nem em SMS/e-mail (ajuste o texto dos e-mails de confirmação do seu provedor de envio quando configurar).
- O site pede confirmação de maioridade (18+) antes de mostrar qualquer produto.
- Dados de clientes seguem a LGPD — veja a página **Política de Privacidade** no próprio site.
