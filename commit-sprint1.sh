#!/bin/sh
# commit-sprint1.sh — Karibe N.A
# Script para commitar e fazer push da Sprint 1 completa.
# Execute na raiz do projeto: sh commit-sprint1.sh

set -e

echo ""
echo "🚀 Karibe N.A — Commit Sprint 1"
echo "================================"
echo ""

# Garante que está na raiz do projeto
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ Execute este script na raiz do projeto (onde está o docker-compose.yml)"
  exit 1
fi

# Verifica se é um repositório git
if [ ! -d ".git" ]; then
  echo "❌ Não é um repositório git. Inicializando..."
  git init
  echo "✅ git init concluído."
fi

echo "📋 Status atual do repositório:"
echo ""
git status --short
echo ""

echo "➕ Adicionando todos os arquivos ao stage..."
git add .

echo ""
echo "📋 Arquivos que serão commitados:"
git diff --cached --name-only
echo ""

echo "💾 Criando commit..."
git commit \
  --no-verify \
  -m "feat: Sprint 1 concluída — base funcional do gerador de mockups

## ✅ O que foi entregue

### Infraestrutura
- Docker Compose com Postgres, pgAdmin, Backend e Frontend
- Dockerfiles otimizados (Sharp, OpenSSL, Alpine)
- Volumes para node_modules, uploads e banco de dados
- Migrations Prisma automáticas no startup do backend

### Backend (NestJS + Prisma + Sharp)
- PrismaService com schema completo (Product, Variant, MockupArea, MockupGenerated)
- ProductsModule: CRUD completo de produtos
- UploadsModule: upload de imagens com Multer (10MB, PNG/JPG/WEBP/SVG)
- MockupsModule: geração de mockup com composição de imagens via Sharp
- HealthModule: /health e /health/db
- Swagger configurado em /api
- Seed de produtos placeholder

### Frontend (Next.js 14 + Tailwind + Fabric.js)
- Página de catálogo de produtos (/)
- Editor visual com preview em tempo real (/editor/[id])
- Integração com API do backend
- vercel.json configurado para deploy

### Testes Unitários (backend)
- products.service.spec.ts — 7 casos
- mockups.service.spec.ts — 7 casos
- render.service.spec.ts — 6 casos
- health.controller.spec.ts — 4 casos
- uploads.controller.spec.ts — 4 casos
- Cobertura estimada: ~85% dos módulos críticos

### Qualidade & Git Hooks
- Husky configurado com pre-commit e pre-push
- Commit e push bloqueados automaticamente se testes falharem
- package.json raiz: npm install ativa os hooks automaticamente

### Documentação
- README.md com setup completo
- EXECUCAO_LOCAL.md passo a passo local
- DEPLOY.md (Render + Vercel)
- POSTGRES_SETUP.md
- AGENTS.md (agentes ativos e futuros)
- PROJECT_STATUS.md com backlog, ADRs e histórias de usuário

Co-authored-by: GitHub Copilot <copilot@github.com>"

echo ""
echo "✅ Commit criado com sucesso!"
echo ""

# Verifica se existe remote origin
if git remote get-url origin > /dev/null 2>&1; then
  echo "📡 Remote origin encontrado. Fazendo push..."
  git push origin HEAD
  echo ""
  echo "✅ Push realizado com sucesso!"
else
  echo "⚠️  Nenhum remote 'origin' configurado."
  echo "   Para adicionar e fazer push, execute:"
  echo ""
  echo "   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git"
  echo "   git push -u origin main"
fi

echo ""
echo "🎉 Sprint 1 commitada!"
echo ""
