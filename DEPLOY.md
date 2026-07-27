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
| `CRON_SECRET` | valor aleatório novo — **obrigatório** pro sync automático (ver Passo 2) |
| `NEXT_PUBLIC_APP_NAME` | copie de `.env.local` (ex.: `TimeUp`) |
| `TZ` | `America/Sao_Paulo` |
| `SOFTCOM_MOCK` | `0` |
| `AUTH_TRUST_HOST` | `true` |

### 1d. Deploy + finalizar URL
1. Clique **Deploy**.
2. Quando sair a URL (ex.: `https://timeup-xxxx.vercel.app`), adicione a env **`AUTH_URL`** = essa URL e faça **Redeploy** (o login depende disso).
3. Pronto — acesse a URL e logue.

## 🟨 Passo 2 — Sincronização automática

O sync deixou de depender de alguém clicar em "Sincronizar". Existe agora um endpoint agendável:

**`GET/POST /api/cron/sync`** — sincroniza **todos os tenants** com integração Softcom ativa.
Autenticação por header (nunca por query string), aceita duas formas:

| Header | Quem usa |
|---|---|
| `Authorization: Bearer $CRON_SECRET` | Vercel Cron (envia sozinho) |
| `x-internal-secret: $INTERNAL_SYNC_SECRET` | n8n, cron-job.org, worker do VPS, `curl` manual |

Cada execução refaz o **total do mês + KPIs por completo** e reconstrói apenas os **últimos 5 dias**
da curva diária (`SYNC_CRON_DAILY_DAYS`) — o mês inteiro continua sendo varrido no botão manual e no
backfill. É isso que mantém a execução em ~15s em vez de ~80s (o limite de função da Vercel no plano
Hobby é 60s). Tenants com um sync ainda em andamento (<15min) são pulados, então agendas curtas não
empilham execuções.

### 2a. Vercel Cron (já configurado no código)
`apps/web/vercel.json` agenda `0 6 * * *` (UTC) = **03:00 de Brasília, todo dia**.

⚠️ Falta **1 passo manual**: em Vercel → Settings → Environment Variables (Production), criar
**`CRON_SECRET`** com um valor aleatório. Sem essa variável a Vercel não manda o header e o endpoint
responde **401** (ou seja: o cron "roda" e não sincroniza nada). Gere com:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```
Depois faça **Redeploy**. Confira em Vercel → Project → **Cron Jobs** (o agendamento só passa a
existir a partir do deploy de produção).

**Frequência:** o plano **Hobby só permite 1 execução por dia** — por isso o padrão é diário. No
plano **Pro**, troque o `schedule` em `apps/web/vercel.json` para `0 * * * *` (de hora em hora) ou
`*/30 * * * *` (a cada 30min) e faça deploy.

### 2b. Sincronizar de hora em hora sem pagar Pro (opcional, recomendado)
Como o endpoint aceita `x-internal-secret`, qualquer agendador externo serve. O **n8n que já roda no
VPS** é o caminho mais direto: *Schedule Trigger* (ex.: a cada 30min) → *HTTP Request* `GET
https://<sua-url>.vercel.app/api/cron/sync` com o header `x-internal-secret: <INTERNAL_SYNC_SECRET>`.
Alternativa sem tocar no VPS: [cron-job.org](https://cron-job.org) (grátis, permite header custom).

### 2c. Worker no VPS (alternativa mais robusta, não obrigatória)
`apps/worker` já existe e roda `syncTenant` a cada 15min **colado no Postgres do VPS** (sem limite de
tempo, sem depender da Vercel). Faz varredura completa do mês. Só vale a pena se a operação crescer;
hoje o cron da Vercel + agendador externo cobrem o caso. Se quisermos, subo via SSH.

### Testar na mão
```bash
curl -i -H "x-internal-secret: SEU_INTERNAL_SYNC_SECRET" https://<sua-url>.vercel.app/api/cron/sync
```
Resposta esperada: `{"ok":true,...,"tenants":[{"status":"success","rows":N}]}`. O histórico de
execuções também aparece em **/app/integracao**.

## 🔒 Segurança (importante)

1. **Troque a senha de root do VPS** — ela foi colada no chat. Depois me passe por um canal seguro ou crie uma **chave SSH** pra mim.
2. O Postgres está exposto na internet (porta 54320) com senha forte. Hardening recomendado depois: **SSL no Postgres** (hoje a conexão Vercel↔VPS vai sem TLS) e/ou **firewall** restringindo a origem.
3. `connection_limit=5` no `DATABASE_URL` evita estourar conexões a partir das funções serverless da Vercel. Se crescer o tráfego, colocamos um **PgBouncer**.

## ℹ️ Limitação conhecida
Upload de **logo** (imagem) não persiste na Vercel (filesystem efêmero). Hoje quase não é usado; quando precisar, migramos pra **Vercel Blob** ou pro **MinIO** que já existe no VPS.
