# TimeUp — Deploy (Vercel + VPS)

Arquitetura: **front no Vercel** + **Postgres e worker no VPS** (`31.97.23.112`).

## ✅ Já feito (por mim, via SSH)

- Postgres dedicado e **isolado** rodando no VPS como stack Swarm `timeup` (serviço `timeup-db`, `postgres:16`), sem encostar no Supabase/n8n/etc.
- Exposto na porta **`54320`** do host (porta fora do padrão pra reduzir varredura).
- Schema criado (`prisma db push`) e **todos os dados migrados** do banco local (1 tenant, 2 empresas, 6 colaboradores, metas, vendas, usuários).
- Conexão: `postgresql://postgres:<SENHA_DB>@31.97.23.112:54320/timeup?schema=public`
  - A senha do banco (`<SENHA_DB>`) eu gerei e te passei no chat. Trate como segredo.

## 🟦 Passo 1 — Subir o front no Vercel (precisa da sua conta)

### 1a. Colocar o código no GitHub
Na raiz do projeto (`C:\Projetos\TimeUp`):
```bash
git init
git add -A
git commit -m "TimeUp"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/timeup.git   # crie o repo no GitHub antes
git push -u origin main
```

### 1b. Importar no Vercel
1. https://vercel.com → **Add New… → Project** → importe o repo `timeup`.
2. Em **Root Directory**, selecione **`apps/web`**.
3. Framework: **Next.js** (detecta sozinho). Install/Build: deixe o padrão (o `pnpm install` já roda `prisma generate` via postinstall).
4. **Region**: São Paulo (**gru1**) — já está no `apps/web/vercel.json`; confirme em Settings → Functions se possível (pra ficar perto do banco).

### 1c. Variáveis de ambiente (Settings → Environment Variables, ambiente Production)
| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:<SENHA_DB>@31.97.23.112:54320/timeup?schema=public&connection_limit=5` |
| `MASTER_ENCRYPTION_KEY` | **copie EXATAMENTE** de `apps/web/.env.local` ⚠️ (se mudar, o sync Softcom quebra — os segredos no banco foram cifrados com essa chave) |
| `AUTH_SECRET` | copie de `.env.local` (ou gere: `openssl rand -base64 32`) |
| `INTERNAL_SYNC_SECRET` | copie de `.env.local` |
| `NEXT_PUBLIC_APP_NAME` | copie de `.env.local` (ex.: `TimeUp`) |
| `TZ` | `America/Sao_Paulo` |
| `SOFTCOM_MOCK` | `0` |
| `AUTH_TRUST_HOST` | `true` |

### 1d. Deploy + finalizar URL
1. Clique **Deploy**.
2. Quando sair a URL (ex.: `https://timeup-xxxx.vercel.app`), adicione a env **`AUTH_URL`** = essa URL e faça **Redeploy** (o login depende disso).
3. Pronto — acesse a URL e logue.

## 🟨 Passo 2 — Worker de sincronização automática (eu faço via SSH, depois do front)

Hoje o sync funciona **manualmente** (botão "Sincronizar"). Pra rodar sozinho a cada 15min, subo o `apps/worker` como serviço no VPS (colado no Postgres local — rápido e sem timeout). Preciso só do código acessível (o mesmo repo do GitHub do Passo 1). Me avise quando o front estiver no ar que eu configuro.

## 🔒 Segurança (importante)

1. **Troque a senha de root do VPS** — ela foi colada no chat. Depois me passe por um canal seguro ou crie uma **chave SSH** pra mim.
2. O Postgres está exposto na internet (porta 54320) com senha forte. Hardening recomendado depois: **SSL no Postgres** (hoje a conexão Vercel↔VPS vai sem TLS) e/ou **firewall** restringindo a origem.
3. `connection_limit=5` no `DATABASE_URL` evita estourar conexões a partir das funções serverless da Vercel. Se crescer o tráfego, colocamos um **PgBouncer**.

## ℹ️ Limitação conhecida
Upload de **logo** (imagem) não persiste na Vercel (filesystem efêmero). Hoje quase não é usado; quando precisar, migramos pra **Vercel Blob** ou pro **MinIO** que já existe no VPS.
