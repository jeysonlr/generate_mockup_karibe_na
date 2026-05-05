# 🚀 Guia de Execução Local — Karibe N.A Mockup Generator

> Guia completo e testado para rodar o projeto do zero em qualquer máquina Linux/macOS/Windows (WSL2).

---

## 📋 Pré-requisitos

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| Docker | 24.x+ | `docker --version` |
| Docker Compose | 2.x (plugin) | `docker compose version` |
| Git | qualquer | `git --version` |
| Node.js *(opcional, para dev local sem Docker)* | 20.x LTS | `node --version` |

> **Importante:** Use **Docker Compose v2** (`docker compose` com espaço, não `docker-compose`).  
> Para instalar: https://docs.docker.com/compose/install/

---

## 📁 Estrutura do Projeto

```
generate_mockup_karibe_na/
├── backend/         # API NestJS + Prisma + Sharp
├── frontend/        # Next.js 14 + Tailwind + Fabric.js
├── docker-compose.yml
├── setup.sh         # Script de setup automático
└── EXECUCAO_LOCAL.md
```

---

## ⚡ Método 1 — Setup Automático (recomendado)

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd generate_mockup_karibe_na

# Execute o script de setup
chmod +x setup.sh
./setup.sh
```

O script cria os arquivos `.env`, instala dependências e sobe todos os containers.

---

## 🛠️ Método 2 — Setup Manual (passo a passo)

### Passo 1 — Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd generate_mockup_karibe_na
```

### Passo 2 — Criar arquivos de variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

> Os valores padrão já estão configurados para funcionar localmente. Você pode editá-los se precisar de configurações diferentes.

**Verificação:**
```bash
ls backend/.env && ls frontend/.env.local
# Deve mostrar ambos os arquivos
```

### Passo 3 — Subir os containers

```bash
docker compose up --build
```

> Na primeira execução, o Docker vai:
> 1. Baixar as imagens base (Node 20 Alpine, PostgreSQL 16, pgAdmin)
> 2. Instalar as dependências nativas do Sharp (compilação C++)
> 3. Instalar todos os pacotes npm
> 4. Gerar o Prisma Client
> 5. Subir todos os serviços

> ⏱️ **Tempo estimado na primeira execução:** 5–10 minutos (depende da conexão e CPU).

### Passo 4 — Executar as migrations do banco

Aguarde o backend estar pronto (você verá `🚀 Backend rodando em http://localhost:3333`), depois em **outro terminal**:

```bash
docker compose exec backend npx prisma migrate dev --name init
```

> Se o banco já tiver as tabelas (ex: após reiniciar), use `prisma migrate deploy` em vez de `migrate dev`.

### Passo 5 — (Opcional) Popular o banco com dados de exemplo

```bash
docker compose exec backend npx prisma db seed
```

---

## 🌐 URLs de Acesso

Após subir tudo com sucesso:

| Serviço | URL | Credenciais |
|---|---|---|
| **Frontend** | http://localhost:3000 | — |
| **Backend API** | http://localhost:3333 | — |
| **Swagger (docs)** | http://localhost:3333/api | — |
| **pgAdmin** | http://localhost:5050 | admin@karibe.com / admin123 |
| **PostgreSQL** | localhost:5432 | karibe / karibe123 |

---

## 🔄 Comandos do Dia a Dia

```bash
# Subir em background (sem logs no terminal)
docker compose up -d

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend

# Parar todos os containers (mantém dados)
docker compose stop

# Parar e remover containers (mantém volumes/dados)
docker compose down

# Parar, remover containers E volumes (APAGA DADOS DO BANCO)
docker compose down -v

# Reconstruir após mudanças no Dockerfile ou package.json
docker compose up --build

# Executar comando dentro do container
docker compose exec backend <comando>
docker compose exec frontend <comando>
```

---

## 🗄️ Gerenciamento do Banco de Dados

```bash
# Criar nova migration após alterar schema.prisma
docker compose exec backend npx prisma migrate dev --name nome_da_migration

# Aplicar migrations pendentes (produção)
docker compose exec backend npx prisma migrate deploy

# Abrir Prisma Studio (interface visual do banco)
docker compose exec backend npx prisma studio
# Acesse: http://localhost:5555

# Resetar o banco completamente (CUIDADO: apaga todos os dados)
docker compose exec backend npx prisma migrate reset

# Ver status das migrations
docker compose exec backend npx prisma migrate status
```

---

## 🔧 Desenvolvimento sem Docker (opcional)

Se preferir rodar backend e frontend diretamente na sua máquina:

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env
# Editar DATABASE_URL para apontar para seu PostgreSQL local

# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate dev --name init

# Iniciar em modo dev (hot reload)
npm run start:dev
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env.local

# Iniciar em modo dev (hot reload)
npm run dev
```

> Para esse método, você precisará ter um PostgreSQL rodando localmente ou usar o container só do banco:
> ```bash
> docker compose up postgres pgadmin
> ```

---

## 🚨 Solução de Problemas

### ❌ Erro: "port is already allocated"
```bash
# Verificar quem está usando a porta
sudo lsof -i :3000
sudo lsof -i :3333
sudo lsof -i :5432

# Parar o processo ou mudar a porta no docker-compose.yml
```

### ❌ Erro: "cannot connect to the Docker daemon"
```bash
# Linux: adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### ❌ Erro no build do Sharp (módulos nativos)
O Dockerfile já inclui as dependências necessárias (`python3`, `make`, `g++`, `vips-dev`).  
Se ocorrer erro, tente:
```bash
docker compose build --no-cache backend
```

### ❌ Frontend não conecta ao backend
Verifique se `NEXT_PUBLIC_API_URL` no `.env.local` do frontend está configurado como `http://localhost:3333`.

No Docker, o browser acessa o backend pela **porta mapeada** (`localhost:3333`), não pelo nome interno do serviço.

### ❌ Hot reload não funciona no Linux
O `docker-compose.yml` já tem `WATCHPACK_POLLING: 'true'` para resolver isso no frontend.  
Para o backend (NestJS), o `--watch` do nest já usa polling nativo.

### ❌ "prisma: command not found" no container
```bash
# Use npx
docker compose exec backend npx prisma <comando>
```

### ❌ Banco de dados vazio após reiniciar
Os dados são persistidos no volume `postgres_data`. Se você rodar `docker compose down -v`, os dados serão apagados.  
Para preservar dados: use apenas `docker compose down` (sem `-v`).

### ❌ Erro "EACCES: permission denied" em uploads
```bash
docker compose exec backend chmod -R 777 /app/uploads
```

### ❌ node_modules desatualizado após `npm install` local
Os volumes `backend_node_modules` e `frontend_node_modules` isolam o node_modules do Docker.  
Após alterar o `package.json`, reconstrua:
```bash
docker compose up --build
```

---

## 📦 Estrutura de Volumes Docker

| Volume | Conteúdo | Persistido |
|---|---|---|
| `postgres_data` | Dados do PostgreSQL | ✅ Sim |
| `uploads_data` | Arquivos de upload (artes, mockups) | ✅ Sim |
| `backend_node_modules` | node_modules do backend | ✅ Sim |
| `frontend_node_modules` | node_modules do frontend | ✅ Sim |
| `frontend_next` | Cache de build do Next.js | ✅ Sim |

---

## 🏗️ Fluxo Completo de Teste

Após subir tudo, valide o funcionamento:

1. **Acesse** http://localhost:3000 — deve mostrar a tela inicial do Karibe N.A
2. **Verifique a API** em http://localhost:3333/api — deve mostrar o Swagger
3. **Health check:** `curl http://localhost:3333/health` — deve retornar `{"status":"ok"}`
4. **Crie um produto** via Swagger ou pelo frontend
5. **Faça upload de uma arte** (PNG/JPG)
6. **Gere um mockup** no editor visual
7. **Baixe a imagem gerada**

---

## 🌍 Deploy em Produção

Consulte o arquivo [POSTGRES_SETUP.md](./POSTGRES_SETUP.md) para instruções de deploy no Render.com.

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs: `docker compose logs -f`
2. Consulte o [PROJECT_STATUS.md](./PROJECT_STATUS.md) para pendências conhecidas
3. Abra uma issue no repositório

---

*Última atualização: Maio 2025*
