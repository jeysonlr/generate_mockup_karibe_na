#!/usr/bin/env bash
# Força execução com bash mesmo que chamado com sh
if [ -z "$BASH_VERSION" ]; then
  exec bash "$0" "$@"
fi
# =============================================================================
# setup.sh — Karibe N.A Mockup Generator
# Script de setup automático para execução local
# =============================================================================

set -e  # Abortar em caso de erro

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
  echo -e "\n${BLUE}▶ $1${NC}"
}

print_ok() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║   Karibe N.A — Mockup Generator Setup   ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ─────────────────────────────────────────────
# 1. Verificar pré-requisitos
# ─────────────────────────────────────────────
print_step "Verificando pré-requisitos..."

DOCKER_BIN=""
for d in /usr/bin/docker /usr/local/bin/docker /snap/bin/docker $(command -v docker 2>/dev/null || true); do
  if [ -x "$d" ]; then
    DOCKER_BIN="$d"
    break
  fi
done

if [ -z "$DOCKER_BIN" ]; then
  print_error "Docker não encontrado ou não está no PATH."
  echo "  Instale em: https://docs.docker.com/get-docker/"
  echo "  Se já instalou, tente: source ~/.bashrc  ou  newgrp docker"
  exit 1
fi
print_ok "Docker $("$DOCKER_BIN" --version | awk '{print $3}' | tr -d ',')"

# Garante que 'docker' resolva corretamente no resto do script
export PATH="$(dirname "$DOCKER_BIN"):$PATH"

if ! docker compose version &>/dev/null; then
  # Tenta docker-compose v1 como fallback
  if command -v docker-compose &>/dev/null; then
    print_warn "Docker Compose v2 não encontrado — usando docker-compose v1 como fallback."
    # Cria alias para o restante do script
    docker() {
      if [ "$1" = "compose" ]; then
        shift
        docker-compose "$@"
      else
        command docker "$@"
      fi
    }
    export -f docker
  else
    print_error "Docker Compose não encontrado. Instale em: https://docs.docker.com/compose/install/"
    exit 1
  fi
fi
print_ok "Docker Compose $(docker compose version --short 2>/dev/null || docker-compose version --short 2>/dev/null)"

# ─────────────────────────────────────────────
# 2. Criar arquivos .env
# ─────────────────────────────────────────────
print_step "Configurando variáveis de ambiente..."

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  print_ok "backend/.env criado a partir do .env.example"
else
  print_warn "backend/.env já existe — mantendo arquivo atual"
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  print_ok "frontend/.env.local criado a partir do .env.example"
else
  print_warn "frontend/.env.local já existe — mantendo arquivo atual"
fi

# ─────────────────────────────────────────────
# 3. Criar diretórios necessários
# ─────────────────────────────────────────────
print_step "Criando diretórios de upload..."
mkdir -p backend/uploads/arts backend/uploads/mockups
print_ok "Diretórios backend/uploads/arts e backend/uploads/mockups criados"

# ─────────────────────────────────────────────
# 4. Build e subida dos containers
# ─────────────────────────────────────────────
print_step "Construindo e subindo containers Docker..."
echo -e "${YELLOW}  (isso pode levar 5–10 minutos na primeira execução)${NC}\n"

docker compose up --build -d

# ─────────────────────────────────────────────
# 5. Aguardar backend estar pronto
# ─────────────────────────────────────────────
print_step "Aguardando backend ficar disponível..."

MAX_WAIT=120
WAIT=0
until curl -sf http://localhost:3333/health > /dev/null 2>&1; do
  if [ $WAIT -ge $MAX_WAIT ]; then
    print_error "Timeout: backend não respondeu em ${MAX_WAIT}s"
    echo "Verifique os logs com: docker compose logs backend"
    exit 1
  fi
  printf "."
  sleep 3
  WAIT=$((WAIT + 3))
done
echo ""
print_ok "Backend disponível em http://localhost:3333"

# ─────────────────────────────────────────────
# 6. Executar migrations
# ─────────────────────────────────────────────
print_step "Executando migrations do banco de dados..."

docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || \
docker compose exec -T backend npx prisma migrate dev --name init --skip-generate

print_ok "Migrations aplicadas com sucesso"

# ─────────────────────────────────────────────
# 7. Seed do banco (opcional)
# ─────────────────────────────────────────────
print_step "Populando banco com dados de exemplo (seed)..."

if docker compose exec -T backend npx prisma db seed 2>/dev/null; then
  print_ok "Seed executado com sucesso"
else
  print_warn "Seed falhou ou não há dados para inserir — isso é normal se o banco já estiver populado"
fi

# ─────────────────────────────────────────────
# 8. Resultado final
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗"
echo -e "║        ✅  Setup concluído com sucesso!       ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Frontend:    ${BLUE}http://localhost:3000${NC}"
echo -e "  🔌 Backend API: ${BLUE}http://localhost:3333${NC}"
echo -e "  📖 Swagger:     ${BLUE}http://localhost:3333/api${NC}"
echo -e "  🗄️  pgAdmin:     ${BLUE}http://localhost:5050${NC}  (admin@karibe.com / admin123)"
echo ""
echo -e "  Para ver os logs: ${YELLOW}docker compose logs -f${NC}"
echo -e "  Para parar tudo:  ${YELLOW}docker compose down${NC}"
echo ""
