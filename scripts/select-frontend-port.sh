#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
DEFAULT_PORT="${1:-3000}"
MAX_PORT=65535

ensure_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        cp "${REPO_ROOT}/.env.example" "$ENV_FILE"
    fi
}

current_configured_port() {
    local configured
    configured=$(grep -E '^FRONTEND_PORT=' "$ENV_FILE" 2>/dev/null | head -n1 | cut -d'=' -f2- || true)
    if [[ "$configured" =~ ^[0-9]+$ ]] && [ "$configured" -ge 1 ] && [ "$configured" -le 65535 ]; then
        echo "$configured"
    else
        echo "$DEFAULT_PORT"
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

persist_frontend_port() {
    local port="$1"
    local frontend_url="http://localhost:${port}"
    local tmp_file
    tmp_file="$(mktemp)"

    awk -v port="$port" -v frontend_url="$frontend_url" '
        BEGIN { frontend_port_updated=0; frontend_url_updated=0 }
        /^FRONTEND_PORT=/ {
            if (!frontend_port_updated) {
                print "FRONTEND_PORT=" port
                frontend_port_updated=1
            }
            next
        }
        /^FRONTEND_URL=/ {
            if (!frontend_url_updated) {
                print "FRONTEND_URL=" frontend_url
                frontend_url_updated=1
            }
            next
        }
        { print }
        END {
            if (!frontend_port_updated) {
                print "FRONTEND_PORT=" port
            }
            if (!frontend_url_updated) {
                print "FRONTEND_URL=" frontend_url
            }
        }
    ' "$ENV_FILE" > "$tmp_file"

    mv "$tmp_file" "$ENV_FILE"
}

main() {
    ensure_env_file

    local start_port
    start_port="$(current_configured_port)"

    local selected_port="$start_port"
    while [ "$selected_port" -le "$MAX_PORT" ]; do
        if ! is_port_in_use "$selected_port"; then
            break
        fi
        selected_port=$((selected_port + 1))
    done

    if [ "$selected_port" -gt "$MAX_PORT" ]; then
        echo "No free frontend host port found in range ${start_port}-${MAX_PORT}." >&2
        exit 1
    fi

    persist_frontend_port "$selected_port"
    echo "$selected_port"
}

main "$@"
