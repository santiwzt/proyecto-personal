# Nexo Personal OS -- setup script for Windows PowerShell.
# Checks prerequisites, installs dependencies, prepares .env.local, and
# runs an initial verification. Safe to re-run: never overwrites an
# existing .env.local.

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

function Write-Bold($msg) { Write-Host $msg -ForegroundColor White }
function Write-Info($msg) { Write-Host "  $msg" }
function Write-Warn($msg) { Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Ok($msg)   { Write-Host "  $msg" -ForegroundColor Green }

Write-Bold "Nexo Personal OS -- setup"

# 1. Check prerequisites ------------------------------------------------------
Write-Bold "1. Comprobando dependencias del sistema"

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Warn "Node.js no esta instalado. Instala Node.js 20 o superior: https://nodejs.org/"
    exit 1
}
$nodeVersion = (node -v).TrimStart("v")
$nodeMajor = [int]($nodeVersion.Split(".")[0])
if ($nodeMajor -lt 20) {
    Write-Warn "Se encontro Node.js $nodeVersion, pero se necesita 20 o superior."
    exit 1
}
Write-Ok "Node.js $nodeVersion"

$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpm) {
    Write-Warn "pnpm no esta instalado. Instalandolo via corepack..."
    $corepack = Get-Command corepack -ErrorAction SilentlyContinue
    if ($corepack) {
        corepack enable
        corepack prepare pnpm@10 --activate
    } else {
        Write-Warn "corepack no esta disponible. Instala pnpm manualmente: https://pnpm.io/installation"
        exit 1
    }
}
Write-Ok "pnpm $(pnpm -v)"

$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
    Write-Ok "git $((git --version) -replace '[^\d.]+(\d+\.\d+\.\d+).*','$1')"
} else {
    Write-Warn "git no esta instalado (no es obligatorio para correr la app, pero si para contribuir)."
}

# 2. Install dependencies ------------------------------------------------------
Write-Bold "2. Instalando dependencias"
pnpm install
Write-Ok "Dependencias instaladas"

# 3. Prepare .env.local ---------------------------------------------------------
Write-Bold "3. Preparando variables de entorno"
if (Test-Path ".env.local") {
    Write-Ok ".env.local ya existe -- no se sobrescribe"
} else {
    Copy-Item ".env.example" ".env.local"
    Write-Ok "Se creo .env.local a partir de .env.example (modo demo por defecto, sin credenciales)"
}

Write-Info ""
Write-Info "Variables opcionales que podes completar en .env.local para funciones adicionales:"
Write-Info "  - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY"
Write-Info "    (solo si vas a usar NEXT_PUBLIC_DATA_MODE=supabase en vez del modo demo)"
Write-Info "  - ANTHROPIC_API_KEY (si no se completa, el asistente/planificador/preguntas"
Write-Info "    funcionan en su modo heuristico local, sin costo)"

# 4. Initial verification ------------------------------------------------------
Write-Bold "4. Ejecutando comprobaciones iniciales"
pnpm lint
pnpm typecheck
pnpm test
Write-Ok "Lint, typecheck y tests unitarios pasaron correctamente"

Write-Bold "Listo. Para iniciar la aplicacion:"
Write-Info "  pnpm dev"
Write-Info ""
Write-Info "Luego abri http://localhost:3000 y elegi `"Continuar en modo demo`"."
