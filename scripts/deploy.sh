#!/usr/bin/env bash
# 🦆 deploy.sh — Deploy the Email Client using Docker Compose.
set -euo pipefail

# ── ANSI colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
RESET='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT_SCANNER="${REPO_ROOT}/scripts/select-backend-port.sh"
FRONTEND_PORT_SCANNER="${REPO_ROOT}/scripts/select-frontend-port.sh"
BACKEND_PORT=5000
FRONTEND_PORT=3000
HEALTH_URL=""
MAX_RETRIES=12
RETRY_INTERVAL=5

# Determine compose command (plugin preferred, standalone fallback)
if docker compose version &>/dev/null; then
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

section() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${WHITE}  $*${RESET}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

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

is_port_in_use() {
    local port="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -ltnH "sport = :${port}" 2>/dev/null | grep -q .
        return
    fi
    if command -v lsof >/dev/null 2>&1; then
        lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
        return
    fi
    if command -v netstat >/dev/null 2>&1; then
        netstat -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)${port}$"
        return
    fi
    return 1
}

persist_env_value() {
    local key="$1"
    local value="$2"
    local env_file="${REPO_ROOT}/.env"
    local tmp_file
    tmp_file="$(mktemp)"

    awk -v key="$key" -v value="$value" '
        BEGIN { updated=0 }
        $0 ~ ("^" key "=") {
            if (!updated) {
                print key "=" value
                updated=1
            }
            next
        }
        { print }
        END {
            if (!updated) {
                print key "=" value
            }
        }
    ' "$env_file" > "$tmp_file"

    mv "$tmp_file" "$env_file"
}

prompt_port() {
    local label="$1"
    local default_port="$2"
    local entered=""

    while true; do
        if command -v whiptail >/dev/null 2>&1; then
            entered="$(whiptail --title "Email Client Installer" --inputbox "Choose ${label} host port:" 10 60 "$default_port" 3>&1 1>&2 2>&3)" || error "Installation cancelled by user."
        else
            read -r -p "Choose ${label} host port [${default_port}]: " entered
            entered="${entered:-$default_port}"
        fi

        if ! [[ "$entered" =~ ^[0-9]+$ ]] || [ "$entered" -lt 1 ] || [ "$entered" -gt 65535 ]; then
            warn "Invalid ${label} port '${entered}'. Please choose a value between 1 and 65535."
            continue
        fi

        if is_port_in_use "$entered"; then
            warn "Port ${entered} is already in use. Choose another ${label} port."
            continue
        fi

        echo "$entered"
        return 0
    done
}

select_backend_port() {
    if [ ! -f "$BACKEND_PORT_SCANNER" ]; then
        error "Backend port scanner script not found: ${BACKEND_PORT_SCANNER}"
    fi
    if [ ! -x "$BACKEND_PORT_SCANNER" ]; then
        error "Backend port scanner script is not executable: ${BACKEND_PORT_SCANNER}. Run: chmod +x ${BACKEND_PORT_SCANNER}"
    fi
    BACKEND_PORT="$("$BACKEND_PORT_SCANNER")"
}

select_frontend_port() {
    if [ ! -f "$FRONTEND_PORT_SCANNER" ]; then
        error "Frontend port scanner script not found: ${FRONTEND_PORT_SCANNER}"
    fi
    if [ ! -x "$FRONTEND_PORT_SCANNER" ]; then
        error "Frontend port scanner script is not executable: ${FRONTEND_PORT_SCANNER}. Run: chmod +x ${FRONTEND_PORT_SCANNER}"
    fi
    FRONTEND_PORT="$("$FRONTEND_PORT_SCANNER")"
}

select_ports() {
    select_backend_port
    select_frontend_port

    if [ -t 0 ] && [ -t 1 ]; then
        info "Interactive installer detected — you can choose custom host ports."
        BACKEND_PORT="$(prompt_port "backend API" "$BACKEND_PORT")"
        while true; do
            FRONTEND_PORT="$(prompt_port "frontend UI" "$FRONTEND_PORT")"
            if [ "$FRONTEND_PORT" = "$BACKEND_PORT" ]; then
                warn "Frontend and backend ports must be different."
                continue
            fi
            break
        done
    fi

    persist_env_value "BACKEND_PORT" "$BACKEND_PORT"
    persist_env_value "FRONTEND_PORT" "$FRONTEND_PORT"
    persist_env_value "FRONTEND_URL" "http://localhost:${FRONTEND_PORT}"

    HEALTH_URL="http://localhost:${BACKEND_PORT}/api/health"
    success "Selected backend host port: ${BACKEND_PORT}"
    success "Selected frontend host port: ${FRONTEND_PORT}"
}

# ── Docker build & up ─────────────────────────────────────────────────────────

build_and_start() {
    section "Building and starting containers"
    info "Building Docker images..."
    $COMPOSE_CMD -f "${REPO_ROOT}/docker-compose.yml" build

    info "Starting services..."
    BACKEND_PORT="${BACKEND_PORT}" FRONTEND_PORT="${FRONTEND_PORT}" $COMPOSE_CMD -f "${REPO_ROOT}/docker-compose.yml" up -d
}

# ── Health check with retry ───────────────────────────────────────────────────

health_check() {
    section "Health check"
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

clear
duck_say "Deploying Email Client 🚀"

section "Preflight checks"
check_deps
section "Environment setup"
setup_env
section "Port selection"
select_ports
build_and_start
health_check

echo ""
duck_say "Deployment complete! 🦆"
echo -e "${BOLD}"
echo "  Frontend : http://localhost:${FRONTEND_PORT}"
echo "  Backend  : http://localhost:${BACKEND_PORT}"
echo ""
echo "  Useful commands:"
echo "    make logs          — follow logs"
echo "    make down          — stop services"
echo "    make uninstall     — remove local deployment"
echo "    make check-update  — check for updates"
echo -e "${RESET}"
