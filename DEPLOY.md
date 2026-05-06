# 🚀 Guia de Deploy — Karibe N.A Mockup Generator

> Passo a passo completo para publicar o projeto na internet usando:
> - **Banco de dados:** Render.com (PostgreSQL free)
> - **Backend:** Render.com (Web Service free)
> - **Frontend:** Vercel (free)

**Tempo estimado:** 30–40 minutos

---

## ✅ Pré-requisitos antes de começar

- [ ] Projeto commitado e **pushado no GitHub** (branch `main`)
- [ ] Conta criada no [render.com](https://render.com) (pode entrar com GitHub)
- [ ] Conta criada na [vercel.com](https://vercel.com) (pode entrar com GitHub)

> Se ainda não fez push para o GitHub:
> ```bash
> git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
> git push -u origin main
> ```

---

## 🗄️ Etapa 1 — Criar o banco PostgreSQL no Render

### 1.1 — Acessar o dashboard
1. Entre em [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** no canto superior direito
3. Selecione **"PostgreSQL"**

### 1.2 — Configurar o banco
Preencha os campos:

| Campo | Valor |
|---|---|
| **Name** | `karibe-na-db` |
| **Database** | `karibe_mockup` |
| **User** | `karibe` |
| **Region** | `Oregon (US West)` |
| **PostgreSQL Version** | `16` |
| **Plan** | `Free` |

Clique em **"Create Database"** e aguarde ~1 minuto.

### 1.3 — Salvar as credenciais
Após criar, na página do banco, role até a seção **"Connections"** e copie:

- **Internal Database URL** → use no backend quando estiver no Render
- **External Database URL** → use para conectar de fora do Render

Guarde as duas URLs, você vai precisar na próxima etapa.

> ⚠️ O plano free expira em **90 dias**. Para produção real, considere um plano pago ou Supabase.

---

## 🔌 Etapa 2 — Fazer o deploy do Backend no Render

### 2.1 — Criar o Web Service
1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Clique em **"Build and deploy from a Git repository"**
4. Conecte sua conta GitHub se ainda não conectou
5. Busque e selecione o repositório `karibe-na-mockup` (ou como você nomeou)
6. Clique em **"Connect"**

### 2.2 — Configurar o serviço

| Campo | Valor |
|---|---|
| **Name** | `karibe-na-backend` |
| **Region** | `Oregon (US West)` ← mesmo do banco! |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Start Command** | `node dist/main` |
| **Plan** | `Free` |

### 2.3 — Configurar variáveis de ambiente
Antes de clicar em criar, vá em **"Advanced"** → **"Add Environment Variable"** e adicione uma por uma:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | *(cole a **Internal** Database URL do passo 1.3)* |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | *(rode `openssl rand -base64 32` no terminal e cole aqui)* |
| `JWT_EXPIRES_IN` | `7d` |
| `STORAGE_TYPE` | `local` |
| `UPLOAD_DIR` | `./uploads` |
| `MAX_FILE_SIZE_MB` | `10` |
| `FRONTEND_URL` | `*` ← deixe assim por ora, atualize após criar o frontend |

> 💡 Para gerar o JWT_SECRET:
> ```bash
> openssl rand -base64 32
> ```

### 2.4 — Criar o serviço
Clique em **"Create Web Service"**.

O Render vai:
1. Clonar o repositório
2. Entrar na pasta `backend`
3. Rodar o Build Command (instala dependências, gera Prisma Client, aplica migrations e compila)
4. Iniciar com o Start Command

Aguarde o build terminar (3–5 minutos). Você verá `==> Your service is live 🎉` quando estiver pronto.

### 2.5 — Verificar se subiu corretamente
Copie a URL do serviço (formato `https://karibe-na-backend.onrender.com`) e acesse:

```
https://karibe-na-backend.onrender.com/health
```

Deve retornar:
```json
{ "status": "ok", "timestamp": "...", "service": "karibe-na-backend" }
```

Acesse também o Swagger:
```
https://karibe-na-backend.onrender.com/api
```

> ⚠️ **Atenção — cold start:** No plano free, o Render suspende o serviço após 15 min sem uso. Na primeira requisição, pode demorar ~30 segundos para "acordar". Isso é normal.

---

## 🌐 Etapa 3 — Fazer o deploy do Frontend na Vercel

### 3.1 — Acessar a Vercel
1. Entre em [vercel.com](https://vercel.com)
2. Clique em **"Add New..."** → **"Project"**
3. Clique em **"Import Git Repository"**
4. Busque e selecione o repositório
5. Clique em **"Import"**

### 3.2 — Configurar o projeto

| Campo | Valor |
|---|---|
| **Project Name** | `karibe-na-frontend` |
| **Framework Preset** | `Next.js` ← Vercel detecta automaticamente |
| **Root Directory** | `frontend` ← **importante clicar em "Edit"** |
| **Build Command** | *(deixar padrão: `next build`)* |
| **Output Directory** | *(deixar padrão: `.next`)* |
| **Install Command** | *(deixar padrão: `npm install`)* |

### 3.3 — Configurar variáveis de ambiente
Na seção **"Environment Variables"**, adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://karibe-na-backend.onrender.com` ← URL do backend criado na Etapa 2 |
| `NEXT_PUBLIC_SITE_NAME` | `Karibe N.A` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `Crie produtos personalizados com sua arte` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5544999999999` ← substitua pelo número real |

### 3.4 — Fazer o deploy
Clique em **"Deploy"**.

A Vercel vai:
1. Clonar o repositório
2. Entrar na pasta `frontend`
3. Instalar dependências e compilar o Next.js
4. Publicar em uma URL como `https://karibe-na-frontend.vercel.app`

Aguarde ~2–3 minutos. Quando terminar, clique em **"Visit"** para acessar o site.

---

## 🔗 Etapa 4 — Conectar Frontend ↔ Backend (CORS)

Agora que temos a URL real do frontend, precisamos atualizar o backend:

1. No dashboard do Render, acesse o serviço `karibe-na-backend`
2. Vá em **"Environment"**
3. Edite a variável `FRONTEND_URL` e coloque a URL real da Vercel:
   ```
   https://karibe-na-frontend.vercel.app
   ```
4. Clique em **"Save Changes"** — o Render vai fazer o redeploy automaticamente

---

## ✅ Verificação Final

Após tudo subir, teste o fluxo completo:

| Teste | URL | Esperado |
|---|---|---|
| Frontend online | `https://karibe-na-frontend.vercel.app` | Tela inicial do Karibe N.A |
| Backend health | `https://karibe-na-backend.onrender.com/health` | `{"status":"ok"}` |
| Swagger online | `https://karibe-na-backend.onrender.com/api` | Documentação da API |
| Banco conectado | `https://karibe-na-backend.onrender.com/health/db` | `{"status":"ok","database":"connected"}` |

---

## 🔁 Deploy automático (CI/CD)

A partir de agora, sempre que você fizer `git push origin main`:
- ✅ **Vercel** reconstrói e publica o frontend automaticamente
- ✅ **Render** reconstrói e publica o backend automaticamente (incluindo novas migrations)

Não precisa fazer mais nada manualmente.

---

## 🚨 Problemas comuns

### ❌ Build falhou no Render — "Cannot find module"
Verifique se o **Root Directory** está como `backend` nas configurações do serviço.

### ❌ "Error: P1001 - Can't reach database server"
- Confirme que a `DATABASE_URL` é a **Internal URL** (não a External)
- Confirme que o banco e o backend estão na **mesma região** (Oregon)

### ❌ Frontend não consegue chamar a API (CORS error)
- Verifique se `FRONTEND_URL` no Render contém exatamente a URL da Vercel (sem `/` no final)
- Verifique se `NEXT_PUBLIC_API_URL` na Vercel contém a URL do Render (sem `/` no final)

### ❌ Render "suspended" / demora para responder
Normal no plano free. O serviço hiberna após 15 min sem uso. Para evitar, considere um plano pago ou use um serviço de ping (ex: UptimeRobot) para manter ativo.

### ❌ Migrations não rodaram no primeiro deploy
Acesse o **Shell** do Render (aba "Shell" no serviço) e rode:
```bash
npx prisma migrate deploy
```

---

## 📋 Resumo das URLs após o deploy

| Serviço | URL |
|---|---|
| **Frontend** | `https://karibe-na-frontend.vercel.app` |
| **Backend API** | `https://karibe-na-backend.onrender.com` |
| **Swagger** | `https://karibe-na-backend.onrender.com/api` |
| **Health check** | `https://karibe-na-backend.onrender.com/health` |

> Substitua pelas URLs reais geradas pelo Render e Vercel.

---

*Após concluir o deploy, avise para prosseguirmos com as próximas sprints!*
