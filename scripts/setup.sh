#!/usr/bin/env bash
# Nexo Personal OS — setup script for macOS/Linux.
# Checks prerequisites, installs dependencies, prepares .env.local, and
# runs an initial verification. Safe to re-run: never overwrites an
# existing .env.local.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
info() { printf '  %s\n' "$1"; }
warn() { printf '  \033[33m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m%s\033[0m\n' "$1"; }

bold "Nexo Personal OS — setup"

# 1. Check prerequisites -----------------------------------------------------
bold "1. Comprobando dependencias del sistema"

if ! command -v node >/dev/null 2>&1; then
  warn "Node.js no esta instalado. Instala Node.js 20 o superior: https://nodejs.org/"
  exit 1
fi
NODE_VERSION="$(node -v | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
if [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Se encontro Node.js $NODE_VERSION, pero se necesita 20 o superior."
  exit 1
fi
ok "Node.js $NODE_VERSION"

if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm no esta instalado. Instalandolo via corepack..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@10 --activate
  else
    warn "corepack no esta disponible. Instala pnpm manualmente: https://pnpm.io/installation"
    exit 1
  fi
fi
ok "pnpm $(pnpm -v)"

if command -v git >/dev/null 2>&1; then
  ok "git $(git --version | awk '{print $3}')"
else
  warn "git no esta instalado (no es obligatorio para correr la app, pero si para contribuir)."
fi

# 2. Install dependencies -----------------------------------------------------
bold "2. Instalando dependencias"
pnpm install
ok "Dependencias instaladas"

# 3. Prepare .env.local --------------------------------------------------------
bold "3. Preparando variables de entorno"
if [ -f .env.local ]; then
  ok ".env.local ya existe — no se sobrescribe"
else
  cp .env.example .env.local
  ok "Se creo .env.local a partir de .env.example (modo demo por defecto, sin credenciales)"
fi

info ""
info "Variables opcionales que podes completar en .env.local para funciones adicionales:"
info "  - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY"
info "    (solo si vas a usar NEXT_PUBLIC_DATA_MODE=supabase en vez del modo demo)"
info "  - ANTHROPIC_API_KEY (si no se completa, el asistente/planificador/preguntas"
info "    funcionan en su modo heuristico local, sin costo)"

# 4. Initial verification -----------------------------------------------------
bold "4. Ejecutando comprobaciones iniciales"
pnpm lint
pnpm typecheck
pnpm test
ok "Lint, typecheck y tests unitarios pasaron correctamente"

bold "Listo. Para iniciar la aplicacion:"
info "  pnpm dev"
info ""
info "Luego abri http://localhost:3000 y elegi \"Continuar en modo demo\"."
