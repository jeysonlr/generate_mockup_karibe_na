# 🎨 Karibe N.A — Mockup Generator

Plataforma de geração de mockups dinâmicos para produtos personalizados.

## 📁 Estrutura do Monorepo

```
generate_mockup_karibe_na/
├── backend/             # API NestJS + Prisma + Sharp
├── frontend/            # App Next.js 14 + Tailwind + Fabric.js
├── docker-compose.yml
├── setup.sh             # Script de setup automático
├── EXECUCAO_LOCAL.md    # Guia completo de execução local
├── PROJECT_STATUS.md    # Backlog, ADRs e pendências
├── AGENTS.md            # Documentação dos agentes do projeto
└── POSTGRES_SETUP.md    # Setup do PostgreSQL (local e Render)
```

> **Um único repositório GitHub** — back e front são deployados de forma independente.

---

## 🚀 Como rodar localmente

> 📖 **Guia completo:** [EXECUCAO_LOCAL.md](./EXECUCAO_LOCAL.md)

### Setup automático (recomendado)

```bash
git clone <URL_DO_REPOSITORIO>
cd generate_mockup_karibe_na
chmod +x setup.sh && ./setup.sh
```

O script configura os `.env`, constrói os containers, executa as migrations e popula o banco automaticamente.

### Setup manual

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up --build -d
docker compose exec backend npx prisma migrate dev --name init
```

| Serviço    | URL                       | Credenciais |
|------------|---------------------------|-------------|
| Frontend   | http://localhost:3000     | — |
| Backend    | http://localhost:3333     | — |
| Swagger    | http://localhost:3333/api | — |
| pgAdmin    | http://localhost:5050     | admin@karibe.com / admin123 |

> ⚠️ Use `docker compose` (v2), não `docker-compose` (v1).

---

## 🛠️ Rodar sem Docker (desenvolvimento)

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Documentação
- [Status do Projeto](./PROJECT_STATUS.md)
- [Setup do Banco de Dados](./POSTGRES_SETUP.md)
- Swagger: `http://localhost:3333/api` (quando o backend estiver rodando)

---

## 🌐 Deploy

| Serviço  | Plataforma         |
|----------|--------------------|
| Backend  | Render.com (free)  |
| Frontend | Vercel ou Render   |
| Banco    | Render PostgreSQL  |

Veja `POSTGRES_SETUP.md` para instruções detalhadas.
