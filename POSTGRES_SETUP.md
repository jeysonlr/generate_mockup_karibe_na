# 🐘 Setup do PostgreSQL — Karibe N.A

> Guia completo para configurar o banco localmente e no Render.com

---

## 📌 Parte 1 — PostgreSQL Local (com Docker)

O `docker-compose.yml` já sobe o PostgreSQL automaticamente. Basta rodar:

```bash
docker-compose up -d
```

A string de conexão local será:
```
DATABASE_URL="postgresql://karibe:karibe123@localhost:5432/karibe_mockup?schema=public"
```

Você pode acessar o **pgAdmin** em `http://localhost:5050`
- Email: `admin@karibe.com`
- Senha: `admin123`

No pgAdmin, adicione um servidor com:
- Host: `postgres` (dentro do Docker) ou `localhost` (de fora)
- Porta: `5432`
- Usuário: `karibe`
- Senha: `karibe123`
- Database: `karibe_mockup`

---

## 📌 Parte 2 — Criar banco PostgreSQL no Render.com (FREE)

### Passo 1 — Criar conta
1. Acesse [render.com](https://render.com)
2. Crie uma conta (pode usar GitHub)

### Passo 2 — Criar o banco PostgreSQL
1. No dashboard, clique em **"New +"**
2. Selecione **"PostgreSQL"**
3. Preencha:
   - **Name:** `karibe-na-db`
   - **Database:** `karibe_mockup`
   - **User:** `karibe`
   - **Region:** Oregon (US West) — mais próximo do Brasil com free tier
   - **Plan:** **Free**
4. Clique em **"Create Database"**

> ⚠️ **Atenção:** O plano free do Render expira em **90 dias**. Ideal para MVP e validação.

### Passo 3 — Copiar as credenciais
Após criar, o Render exibe:
- **Internal Database URL** (use quando o backend também está no Render)
- **External Database URL** (use para conectar localmente ou de outro serviço)

Copie o **External Database URL**, que tem o formato:
```
postgresql://karibe:SENHA_GERADA@HOST.render.com:5432/karibe_mockup
```

### Passo 4 — Configurar no backend
Cole a URL no arquivo `backend/.env`:
```env
DATABASE_URL="postgresql://karibe:SENHA_GERADA@HOST.render.com:5432/karibe_mockup"
```

---

## 📌 Parte 3 — Criar o Web Service (Backend) no Render

### Passo 1 — Novo Web Service
1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte ao repositório GitHub (`karibe-na-mockup`)

### Passo 2 — Configurar o serviço
- **Name:** `karibe-na-backend`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command:** `node dist/main`
- **Plan:** Free

### Passo 3 — Variáveis de ambiente
Na aba **"Environment"**, adicione:

| Variável            | Valor                        |
|---------------------|------------------------------|
| `DATABASE_URL`      | URL Internal do PostgreSQL   |
| `JWT_SECRET`        | (gere uma string aleatória)  |
| `STORAGE_TYPE`      | `local`                      |
| `UPLOAD_DIR`        | `./uploads`                  |
| `NODE_ENV`          | `production`                 |
| `PORT`              | `3333`                       |
| `FRONTEND_URL`      | URL do seu frontend          |

> 💡 Use a **Internal Database URL** quando o backend está no mesmo Render. É mais rápido e gratuito.

### Passo 4 — Deploy
Clique em **"Create Web Service"**. O Render faz o build automaticamente.

---

## 📌 Parte 4 — Deploy do Frontend

### Opção A — Vercel (recomendado para Next.js)
1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório GitHub
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
4. Adicione a variável de ambiente:
   - `NEXT_PUBLIC_API_URL` = URL do backend no Render (ex: `https://karibe-na-backend.onrender.com`)
5. Deploy automático a cada push

### Opção B — Render Static Site
1. No dashboard, clique em **"New +"**
2. Selecione **"Static Site"**
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `.next` (ou `out` se usar export estático)

---

## 📌 Parte 5 — Rodar migrations no Render

Após o primeiro deploy, as migrations são executadas automaticamente pelo Build Command.

Para rodar manualmente via Render Shell:
```bash
npx prisma migrate deploy
```

Para popular dados iniciais (seed):
```bash
npx prisma db seed
```

---

## 🔐 Boas práticas de segurança

- ✅ **Nunca** commite arquivos `.env` no repositório
- ✅ O `.gitignore` já está configurado para ignorá-los
- ✅ Use variáveis de ambiente em todos os ambientes
- ✅ Troque o `JWT_SECRET` por uma string longa e aleatória em produção
  - Gere com: `openssl rand -base64 32`

---

## 🔗 Resumo das URLs locais

| Serviço    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| Backend    | http://localhost:3333        |
| Swagger    | http://localhost:3333/api    |
| pgAdmin    | http://localhost:5050        |
| PostgreSQL | localhost:5432               |
