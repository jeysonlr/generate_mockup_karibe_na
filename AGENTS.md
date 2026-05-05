# 🤖 Agentes do Time — Karibe N.A Mockup Generator

> Baseado no projeto [ai-dev-team-by-jeyson](https://github.com/jeysonlr/ai-dev-team-by-jeyson)
> Última atualização: 2026-05-04

---

## ✅ Agentes Ativos (já utilizados neste projeto)

### 🎯 Agent 01 — Product Owner
- **Status:** ✅ Ativo
- **Repositório:** [agents/01-product-owner](https://github.com/jeysonlr/ai-dev-team-by-jeyson/blob/main/agents/01-product-owner/README.md)
- **Responsabilidades no projeto:**
  - Definiu o escopo do MVP (gerador de mockups)
  - Escreveu as histórias de usuário (US-001 a US-004)
  - Mantém o backlog priorizado no `PROJECT_STATUS.md`
  - Definiu os critérios de aceite por funcionalidade
- **Artefatos gerados:**
  - `PROJECT_STATUS.md` — backlog, histórias e ADRs

---

### 🔄 Agent 02 — Scrum Master
- **Status:** ✅ Ativo
- **Repositório:** [agents/02-scrum-master](https://github.com/jeysonlr/ai-dev-team-by-jeyson/blob/main/agents/02-scrum-master/README.md)
- **Responsabilidades no projeto:**
  - Organizou as sprints (Sprint 1 definida)
  - Distribuiu tarefas entre os agentes
  - Documentou impedimentos e pendências com o cliente
  - Mantém o fluxo de entregas visível
- **Artefatos gerados:**
  - Seção de sprints no `PROJECT_STATUS.md`

---

### 🏛️ Agent 03 — Architect
- **Status:** ✅ Ativo
- **Repositório:** [agents/03-architect](https://github.com/jeysonlr/ai-dev-team-by-jeyson/blob/main/agents/03-architect/README.md)
- **Responsabilidades no projeto:**
  - Definiu a arquitetura monorepo (front + back no mesmo repo)
  - Documentou os ADRs (ADR-001 a ADR-004)
  - Escolheu e justificou a stack tecnológica
  - Validou separação de responsabilidades entre serviços
- **Artefatos gerados:**
  - `docker-compose.yml`
  - ADRs no `PROJECT_STATUS.md`
  - Diagramas de arquitetura no `doc.md`

---

### 👨‍💻 Agent 04 — Tech Lead
- **Status:** ✅ Ativo
- **Repositório:** [agents/04-tech-lead](https://github.com/jeysonlr/ai-dev-team-by-jeyson/blob/main/agents/04-tech-lead/README.md)
- **Responsabilidades no projeto:**
  - Estabeleceu padrões de código e estrutura de pastas
  - Configurou variáveis de ambiente (sem secrets hardcoded)
  - Definiu padrão de commits semânticos
  - Criou guias de setup local e deploy
  - Sinalizou pendências técnicas e placeholders
- **Artefatos gerados:**
  - `README.md`
  - `POSTGRES_SETUP.md`
  - `.env.example` (backend e frontend)
  - `.gitignore` (raiz, backend e frontend)
  - `backend/public/placeholders/PENDENTE.md`

---

### ⚙️ Agent 05 — Backend Dev
- **Status:** ✅ Ativo
- **Repositório:** [agents/05-backend-dev](https://github.com/jeysonlr/ai-dev-team-by-jeyson/blob/main/agents/05-backend-dev/README.md)
- **Responsabilidades no projeto:**
  - Desenvolveu a API REST com NestJS
  - Configurou Prisma ORM e schema do banco
  - Implementou o motor de render (Sharp)
  - Criou módulos: products, uploads, mockups, health
  - Documentou endpoints via Swagger
  - Criou seed com produtos e variantes iniciais
- **Artefatos gerados:**
  - `backend/` — estrutura completa
  - `backend/Dockerfile`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/seed.ts`
  - `backend/src/**` — todos os módulos

---

### 🎨 Agent 06 — Frontend Dev
- **Status:** ✅ Ativo
- **Repositório:** [agents/06-frontend-dev](https://github.com/jeysonlr/ai-dev-team-by-jeyson/blob/main/agents/06-frontend-dev/README.md)
- **Responsabilidades no projeto:**
  - Desenvolveu interface com Next.js + TailwindCSS
  - Implementou editor visual com drag & drop
  - Criou sistema de tema dinâmico (paleta configurável pelo cliente)
  - Integrou frontend com API do backend
  - Implementou download e compartilhamento via WhatsApp
- **Artefatos gerados:**
  - `frontend/` — estrutura completa
  - `frontend/Dockerfile`
  - `frontend/src/app/page.tsx` — home
  - `frontend/src/app/editor/[id]/page.tsx` — editor
  - `frontend/src/config/theme.config.ts` — tema dinâmico
  - `frontend/src/services/api.ts`
  - `frontend/src/store/editor.store.ts`

---

## 🔲 Agentes Disponíveis para Fases Futuras

### 🧪 Agent 07 — QA Engineer *(não cadastrado ainda)*
- **Status:** 🔲 Não utilizado
- **Quando acionar:** Sprint 2+, antes do deploy em produção
- **O que pode fazer:**
  - Escrever e executar testes unitários (backend > 80% cobertura)
  - Escrever testes de componente (frontend)
  - Criar testes E2E do fluxo completo (upload → gerar mockup → download)
  - Simular cenários de falha (imagem inválida, produto não encontrado)
  - Validar acessibilidade (a11y) no frontend
- **Ferramentas sugeridas:**
  - Backend: Jest + Supertest
  - Frontend: Vitest + Testing Library
  - E2E: Playwright

---

### 🚀 Agent 08 — DevOps / SRE *(não cadastrado ainda)*
- **Status:** 🔲 Não utilizado
- **Quando acionar:** Antes do go-live em produção
- **O que pode fazer:**
  - Configurar pipeline CI/CD completo (GitHub Actions)
  - Configurar ambientes staging e produção
  - Monitoramento com Prometheus + Grafana
  - Configurar alertas (fila travada, erros 5xx, etc.)
  - Health checks e rollback automático
  - Otimizar Dockerfiles para produção
- **Artefatos que geraria:**
  - `.github/workflows/ci.yml`
  - `.github/workflows/cd-staging.yml`
  - `.github/workflows/cd-prod.yml`
  - `docker-compose.staging.yml`
  - `infra/prometheus/` + `infra/grafana/`

---

### 🔐 Agent 09 — Security Engineer *(não cadastrado ainda)*
- **Status:** 🔲 Não utilizado
- **Quando acionar:** Antes de habilitar pagamentos ou dados sensíveis
- **O que pode fazer:**
  - Implementar autenticação JWT para área admin
  - Configurar rate limiting na API
  - Validação e sanitização de uploads (antivírus, tipo MIME real)
  - Proteção contra CSRF e XSS
  - Auditoria de dependências (npm audit)
  - Configurar HTTPS e headers de segurança
- **Artefatos que geraria:**
  - `backend/src/modules/auth/` — módulo de autenticação
  - Guards e interceptors de segurança

---

### 💳 Agent 10 — Payments Specialist *(não cadastrado ainda)*
- **Status:** 🔲 Não utilizado — **planejado para fase futura**
- **Quando acionar:** Quando o cliente quiser adicionar venda direta no site
- **O que pode fazer:**
  - Integrar Mercado Pago (PIX + Cartão)
  - Implementar fluxo de webhook seguro
  - State machine de pedidos e pagamentos
  - Reconciliação automática de pagamentos
  - Logs de auditoria financeira
- **Artefatos que geraria:**
  - `backend/src/modules/orders/`
  - `backend/src/modules/payments/`
  - `backend/src/integrations/mercado-pago/`

---

### 🧠 Agent 11 — Admin Panel Dev *(não cadastrado ainda)*
- **Status:** 🔲 Não utilizado — **Sprint 3**
- **Quando acionar:** Sprint 3 — quando o cliente quiser gerenciar o catálogo sem depender de dev
- **O que pode fazer:**
  - Criar painel admin com CRUD de produtos
  - Upload de imagem base do produto pelo admin
  - Configuração visual da área de personalização
  - Ativar/desativar produtos e variantes
  - Visualizar mockups gerados
- **Artefatos que geraria:**
  - `frontend/src/app/admin/` — páginas do painel
  - `backend/src/modules/auth/` — login admin

---

### 📊 Agent 12 — Data Analyst *(não cadastrado ainda)*
- **Status:** 🔲 Não utilizado — fase avançada
- **Quando acionar:** Quando houver volume de uso suficiente para análise
- **O que pode fazer:**
  - Configurar dashboards de uso (produtos mais personalizados, etc.)
  - Analisar taxa de conversão (upload → mockup gerado → download)
  - Relatórios para o cliente (vendas, engajamento)

---

## 📋 Ordem de acionamento recomendada

```
Sprint 1  → Agents 01, 02, 03, 04, 05, 06  ✅ (concluído)
Sprint 2  → Agents 07 (QA), 06 (novas features)
Sprint 3  → Agents 11 (Admin), 09 (Security)
Sprint 4  → Agent 08 (DevOps/CI/CD)
Fase 2    → Agent 10 (Pagamentos)
Fase 3    → Agent 12 (Analytics)
```

---

> 💡 Para acionar um agente futuro, basta mencionar no prompt:
> `"Aja como o Agent XX descrito em <link>"` e fornecer o contexto necessário.
