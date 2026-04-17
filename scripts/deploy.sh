#!/usr/bin/env bash
# 🦆 deploy.sh — Deploy the Email Client using Docker Compose.
set -euo pipefail

# ── ANSI colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HEALTH_URL="http://localhost:5000/api/health"
MAX_RETRIES=12
RETRY_INTERVAL=5

# Determine compose command (plugin preferred, standalone fallback)
if docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Neither 'docker compose' nor 'docker-compose' found. Install Docker ≥ 24.${RESET}" >&2
    exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

info()    { echo -e "${CYAN}[INFO]  $*${RESET}"; }
success() { echo -e "${GREEN}[OK]    $*${RESET}"; }
warn()    { echo -e "${YELLOW}[WARN]  $*${RESET}"; }
error()   { echo -e "${RED}[ERROR] $*${RESET}" >&2; exit 1; }

duck_say() {
    local msg="$1"
    local len=${#msg}
    local border
    border=$(printf '%*s' "$((len+2))" '' | tr ' ' '-')
    echo -e "${YELLOW}"
    echo "  .-${border}-."
    echo "  | 🦆  ${msg} |"
    echo "  '-${border}-'"
    echo -e "${RESET}"
}

# ── Dependency checks ─────────────────────────────────────────────────────────

check_deps() {
    info "Checking dependencies..."
    local missing=()

    for cmd in docker node npm; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        else
            success "$cmd found: $(command -v "$cmd")"
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing required tools: ${missing[*]}. Please install them and retry."
    fi

    success "Using compose command: ${COMPOSE_CMD}"

    # Verify Docker daemon is reachable
    if ! docker info &>/dev/null; then
        error "Docker daemon is not running. Start it and retry."
    fi
    success "Docker daemon is running."
}

# ── .env setup ────────────────────────────────────────────────────────────────

setup_env() {
    if [ ! -f "${REPO_ROOT}/.env" ]; then
        warn ".env not found — copying from .env.example"
        cp "${REPO_ROOT}/.env.example" "${REPO_ROOT}/.env"
        warn "Please edit ${REPO_ROOT}/.env with your secrets before going to production!"
    else
        success ".env already exists."
    fi
}

# ── Docker build & up ─────────────────────────────────────────────────────────

build_and_start() {
    info "Building Docker images..."
    $COMPOSE_CMD -f "${REPO_ROOT}/docker-compose.yml" build

    info "Starting services..."
    $COMPOSE_CMD -f "${REPO_ROOT}/docker-compose.yml" up -d
}

# ── Health check with retry ───────────────────────────────────────────────────

health_check() {
    info "Waiting for backend to become healthy at ${HEALTH_URL}..."
    local attempt=0
    while (( attempt < MAX_RETRIES )); do
        if curl -sf "${HEALTH_URL}" &>/dev/null; then
            success "Backend is healthy!"
            return 0
        fi
        attempt=$(( attempt + 1 ))
        info "Attempt ${attempt}/${MAX_RETRIES} — retrying in ${RETRY_INTERVAL}s..."
        sleep "$RETRY_INTERVAL"
    done
    error "Backend did not become healthy after $(( MAX_RETRIES * RETRY_INTERVAL ))s. Check logs: ${COMPOSE_CMD} logs backend"
}

# ── Main ──────────────────────────────────────────────────────────────────────

cd "$REPO_ROOT"

duck_say "Deploying Email Client 🚀"

check_deps
setup_env
build_and_start
health_check

echo ""
duck_say "Deployment complete! 🦆"
echo -e "${BOLD}"
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:5000"
echo ""
echo "  Useful commands:"
echo "    make logs          — follow logs"
echo "    make down          — stop services"
echo "    make check-update  — check for updates"
echo -e "${RESET}"
