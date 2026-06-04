# 📋 Project Status — Karibe N.A Mockup Generator

> Documento mantido pelo **Agent 01 (Product Owner)** + **Agent 02 (Scrum Master)**
> Última atualização: 2026-05-11 — Sprint 3 concluída

---

## 🎯 Visão do Produto

Sistema que permite usuários escolherem um produto (camiseta, caneca, boné, chinelo etc.),
enviarem uma arte, ajustarem no editor visual e gerarem um mockup final para download ou envio via WhatsApp.

---

## 📦 Sprint 3 — Admin & Catálogo Dinâmico ✅ CONCLUÍDA

> **Agentes ativos:** Agent 01 (PO), Agent 02 (SM), Agent 03 (Architect), Agent 05 (Backend), Agent 06 (Frontend), Agent 07 (QA)
> **Início:** 2026-05-11 | **Conclusão:** 2026-05-11

### 🎯 Meta da Sprint
Entregar painel admin protegido por JWT para gestão de produtos, e vitrine pública com seção de destaque para produtos personalizáveis.

### ✅ Concluído

#### Backend
- [x] Model `AdminUser` no Prisma + migration
- [x] Campos `price` e `isMockupEnabled` adicionados ao model `Product`
- [x] `POST /auth/login` — autenticação com email/senha, retorna JWT
- [x] `GET /auth/me` — retorna dados do admin autenticado
- [x] `JwtStrategy` + `JwtAuthGuard`
- [x] `AuthModule` registrado no `AppModule`
- [x] `AdminProductsController` (CRUD completo protegido por JWT)
- [x] `POST /admin/products/:id/image/:side` — upload de imagem frente/costa
- [x] `AdminModule` registrado no `AppModule`
- [x] Seed atualizado: admin padrão (`admin@karibena.com` / `admin123`) + `isMockupEnabled` nos produtos
- [x] Migration aplicada no banco de produção (Render)
- [x] Testes unitários: `AuthService` — 6 casos
- [x] Testes unitários: `AdminProductsService` — 7 casos
- [x] ADR-006 documentado — JWT com Passport.js
- [x] ADR-007 documentado — campos `price` e `isMockupEnabled`
- [x] ADR-008 documentado — vitrine pública `/produtos`

#### Frontend
- [x] Interceptor JWT no `api.ts` (token automático no header)
- [x] Interface `Product` atualizada (`price`, `isMockupEnabled`)
- [x] `authApi` e `adminProductsApi` adicionados ao `api.ts`
- [x] `auth.store.ts` — `useAuth` com login, logout, init
- [x] `AdminLayout.tsx` — sidebar com navegação e proteção de rotas
- [x] `/admin/layout.tsx` — wrapper de rotas admin
- [x] `/admin/login` — página de login com validação e feedback
- [x] `/admin/dashboard` — lista de produtos com cards de resumo e tabela
- [x] `ProductForm.tsx` — formulário reutilizável (criar/editar)
- [x] `/admin/produtos/novo` — criar produto
- [x] `/admin/produtos/[id]` — editar produto + upload de imagem + áreas
- [x] Toggles: "Personalização com Mockup", "Frente e Costa", "Produto Ativo"
- [x] `/produtos` — vitrine pública com seção de destaque personalizáveis
- [x] Botão "Personalizar Agora" → editor (para produtos com mockup)
- [x] Botão "Pedir pelo WhatsApp" → link direto (para produtos sem mockup)
- [x] `/` (home) redireciona para `/produtos`
- [x] Build de produção: ✅ sem erros

---

## 📦 Sprint 2 — Experiência do Editor ✅ CONCLUÍDA

> **Agentes ativos:** Agent 01 (PO), Agent 02 (SM), Agent 03 (Architect), Agent 05 (Backend), Agent 06 (Frontend), Agent 07 (QA)
> **Início:** 2026-05-06 | **Conclusão:** 2026-05-09

### 🎯 Meta da Sprint
Entregar uma experiência de editor completa: o usuário consegue adicionar texto com fonte e cor, rotacionar a arte, ver a página de resultado e compartilhar via WhatsApp.

### ✅ Concluído

#### Backend
- [x] `POST /mockup/generate` suporta texto sobreposto (fonte, cor, posição, peso)
- [x] `GET /mockup/:id` — endpoint para buscar mockup por ID (página de resultado)
- [x] `RenderService` suporta `textLayers` via SVG overlay
- [x] `GenerateMockupDto` com `textLayers[]`, `backImageUrl`, `backTransform`, `backTextLayers`
- [x] Suporte a mockup frente + verso (campos `backImageUrl`, `backTransform`, `backTextLayers`)
- [x] Geração condicional: frente e/ou costa — qualquer combinação válida
- [x] Validação flexível: permite conteúdo só na frente, só na costa ou em ambos
- [x] Placeholders PNG gerados programaticamente para todos os produtos (camiseta, caneca, boné, chinelo, costa da camiseta, verso da caneca)
- [x] `MockupsService.findOne()` implementado com NotFoundException
- [x] Testes unitários: `MockupsService` Sprint 2 — 10 casos
- [x] Testes unitários: `RenderService` Sprint 2 — `buildTextSvg` e `generateMockup` com texto
- [x] ADR-005 documentado — estratégia SVG para texto no servidor

#### Frontend
- [x] Componente `TextPanel.tsx` — painel de texto (fonte, cor, tamanho, peso)
- [x] Texto arrastável e redimensionável no canvas por lado (frente/costa)
- [x] Controle de rotação da arte (slider + reset)
- [x] Editor com suporte a **frente e verso** independentes (estado por lado)
- [x] Abas Frente / Costa no sidebar e acima do canvas
- [x] Upload de arte independente por lado
- [x] Arte centralizada automaticamente na área de personalização ao carregar
- [x] Imagem do produto troca corretamente ao alternar entre abas (com `key` forçando reload)
- [x] Download individual (frente), individual (costa) e **combinado frente+costa** num único PNG
- [x] Botão "Gerar Mockup" habilitado com conteúdo em qualquer lado
- [x] Página `/resultado/[id]` — preview, download PNG e compartilhar via WhatsApp
- [x] `api.ts` atualizado — `TextLayer`, `MockupResult`, `mockupsApi.getById`, `backImageUrl`
- [x] `editor.store.ts` atualizado — `textLayers`, `generatedMockupId`, ações CRUD de texto

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

### Sprint 3 — Admin & Catálogo Dinâmico ✅ CONCLUÍDA
- [x] Painel admin simples (autenticação JWT)
- [x] CRUD de produtos pelo admin (sem precisar de dev)
- [x] Upload de imagem base do produto pelo admin
- [x] Configuração da área de personalização pelo admin
- [x] Vitrine pública `/produtos` com seção de destaque personalizáveis
- [x] Botão WhatsApp para produtos não personalizáveis

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

### ADR-005: Renderização de texto no servidor com Sharp + fontes locais
- **Status:** Proposta (Sprint 2)
- **Decisão:** Usar Sharp com `text` overlay via SVG intermediário para renderizar texto no mockup final
- **Motivo:** Sharp não suporta texto nativo; SVG como camada intermediária é leve, sem dependência de browser e mantém qualidade vetorial
- **Alternativa descartada:** Canvas no servidor (pesado, complexo de configurar no Alpine)
- **Impacto:** `render.service.ts` recebe campo `textLayers[]` opcional no DTO

### ADR-006: Autenticação JWT com Passport.js
- **Status:** Aceita
- **Decisão:** `@nestjs/jwt` + `passport-jwt` para autenticação stateless
- **Motivo:** Padrão NestJS, sem sessão no servidor, compatível com deploy no Render
- **Estratégia:** Token no `localStorage` do frontend, header `Authorization: Bearer <token>`

### ADR-007: Campos `price` e `isMockupEnabled` no model Product
- **Status:** Aceita
- **Decisão:** Adicionar `price Decimal?` e `isMockupEnabled Boolean @default(false)` ao model `Product`
- **Motivo:** Controle granular por produto sem nova tabela. `hasSides` já existia.

### ADR-008: Vitrine pública como rota `/produtos`
- **Status:** Aceita
- **Decisão:** Rota `/produtos` separada, home (`/`) redireciona para lá
- **Motivo:** Separa responsabilidade: home = apresentação, `/produtos` = catálogo
- **Regra:** `isMockupEnabled = true` sempre na seção "Personalize o Seu" (topo)

---

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
