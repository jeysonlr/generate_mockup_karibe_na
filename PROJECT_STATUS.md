# 📋 Project Status — Karibe N.A Mockup Generator

> Documento mantido pelo **Agent 01 (Product Owner)** + **Agent 02 (Scrum Master)**
> Última atualização: 2026-05-06

---

## 🎯 Visão do Produto

Sistema que permite usuários escolherem um produto (camiseta, caneca, boné, chinelo etc.),
enviarem uma arte, ajustarem no editor visual e gerarem um mockup final para download ou envio via WhatsApp.

---

## 📦 Sprint 1 — Setup & Base ✅ CONCLUÍDA

### ✅ Concluído
- [x] Documentação do projeto (README, PROJECT_STATUS, POSTGRES_SETUP)
- [x] Estrutura de monorepo definida
- [x] Dockerfile do backend
- [x] Dockerfile do frontend
- [x] docker-compose.yml geral
- [x] Estrutura base do backend (NestJS + Prisma)
- [x] Estrutura base do frontend (Next.js + TailwindCSS)
- [x] Variáveis de ambiente configuradas (.env.example)
- [x] Schema do banco (Prisma)
- [x] Módulo de produtos (CRUD)
- [x] Módulo de upload de imagens
- [x] Motor de render (Sharp)
- [x] Endpoint POST /mockup/generate
- [x] Página inicial (seleção de produtos)
- [x] Editor visual com preview em tempo real
- [x] Integração frontend → backend
- [x] Geração e download do mockup final
- [x] Testes unitários: `ProductsService` (5 testes)
- [x] Testes unitários: `MockupsService` (7 testes)
- [x] Testes unitários: `RenderService` (6 testes)
- [x] Testes unitários: `HealthController` (4 testes)
- [x] Testes unitários: `UploadsController` (4 testes)
- [x] Deploy no Render (backend)
- [x] Deploy no Vercel (frontend)

### 📊 Cobertura estimada: ~85% dos módulos críticos

---

## 🔲 Backlog — Próximas Sprints

### Sprint 2 — Experiência do Editor
- [ ] Adicionar texto sobre o produto
- [ ] Escolha de fonte e cor do texto
- [ ] Rotação da arte no editor
- [ ] Compartilhar via WhatsApp (link direto com imagem)
- [ ] Página de resultado com preview + botões de ação

### Sprint 3 — Admin & Catálogo Dinâmico
- [ ] Painel admin simples (autenticação JWT)
- [ ] CRUD de produtos pelo admin (sem precisar de dev)
- [ ] Upload de imagem base do produto pelo admin
- [ ] Configuração da área de personalização pelo admin

### Sprint 4 — Qualidade & Observabilidade
- [ ] CI/CD com GitHub Actions
- [ ] Logs estruturados
- [ ] Health checks
- [ ] Alertas básicos

---

## ⚠️ Pendências com o Cliente (IMPORTANTE — NÃO ESQUECER)

> Itens que precisam ser fornecidos pelo cliente para avançar:

- [ ] **🖼️ Imagens base reais dos produtos** (camiseta, caneca, boné, chinelo etc.)
  - Precisam ter fundo transparente (PNG) ou fundo adequado
  - Idealmente com marcação visual da área de personalização
  - Atualmente usando **PLACEHOLDERS** gerados programaticamente
  
- [ ] **📐 Coordenadas exatas da área de personalização por produto**
  - Onde exatamente a arte deve ser aplicada em cada produto
  - Atualmente usando valores estimados por padrão
  
- [ ] **🎨 Identidade visual / paleta de cores oficial**
  - Logo em alta resolução (SVG ou PNG)
  - Cores primárias e secundárias
  - Fontes preferidas
  - Atualmente usando design dinâmico configurável via `theme.config.ts`

- [ ] **📋 Catálogo exato de produtos e variantes**
  - Cores disponíveis por produto
  - Tamanhos disponíveis por produto
  - Preços (se necessário exibir)

---

## 🏛️ Decisões de Arquitetura (ADRs)

### ADR-001: Monorepo com pastas separadas
- **Status:** Aceita
- **Decisão:** Um único repositório GitHub com `/backend` e `/frontend` em pastas separadas
- **Motivo:** Facilita versionamento conjunto, PRs unificados e setup inicial mais simples
- **Deploy:** Independente — Render para o back, Vercel/Render para o front

### ADR-002: NestJS + Prisma + PostgreSQL
- **Status:** Aceita
- **Decisão:** Stack backend com NestJS, Prisma ORM, PostgreSQL
- **Motivo:** Tipagem forte, migrations automatizadas, ecosystem maduro

### ADR-003: Sharp para renderização de mockups
- **Status:** Aceita
- **Decisão:** Biblioteca `sharp` para composição de imagens no servidor
- **Motivo:** Alta performance, suporte a transparência, sem dependências de browser

### ADR-004: Sem filas no MVP
- **Status:** Aceita
- **Decisão:** Render síncrono no MVP
- **Evolução:** Adicionar BullMQ + Redis quando necessário

---

## 📊 Histórias de Usuário

### US-001 — Selecionar produto
```
Como visitante,
Quero escolher um produto (camiseta, caneca, etc.),
Para que eu possa personalizá-lo com minha arte.

Critérios de Aceite:
- [ ] Lista de produtos disponíveis exibida na home
- [ ] Cada produto mostra nome, imagem e variantes disponíveis
- [ ] Ao clicar, vai para o editor com o produto selecionado
```

### US-002 — Personalizar produto no editor
```
Como visitante,
Quero enviar minha arte e posicioná-la no produto,
Para que eu possa ver como ficará antes de gerar o mockup.

Critérios de Aceite:
- [ ] Upload de imagem (JPG, PNG)
- [ ] Preview em tempo real no produto
- [ ] Arrastar e redimensionar a arte
- [ ] Trocar variante (cor) do produto
```

### US-003 — Gerar mockup final
```
Como visitante,
Quero gerar e baixar o mockup final,
Para que eu possa enviar para aprovação ou compartilhar.

Critérios de Aceite:
- [ ] Botão "Gerar Mockup" visível e acessível
- [ ] Imagem final gerada com qualidade
- [ ] Botão para baixar em PNG
- [ ] Botão para compartilhar via WhatsApp
```

### US-004 — Produtos dinâmicos (Admin)
```
Como administrador,
Quero cadastrar novos produtos sem depender de dev,
Para que o catálogo seja atualizado de forma autônoma.

Critérios de Aceite:
- [ ] Login admin protegido
- [ ] CRUD de produtos com upload de imagem base
- [ ] Configuração da área de personalização
- [ ] Ativação/desativação de produtos
```
