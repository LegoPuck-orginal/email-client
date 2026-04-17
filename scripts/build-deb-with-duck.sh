#!/usr/bin/env bash
# 🦆 build-deb-with-duck.sh — Build a Debian .deb package for Email Client.
set -euo pipefail

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Config ────────────────────────────────────────────────────────────────────
PKG_NAME="email-client"
PKG_VERSION="1.0.0"
PKG_ARCH="all"
PKG_MAINTAINER="LegoPuck-orginal <noreply@github.com>"
PKG_DESCRIPTION="A self-hosted email client with a quacking good UI"
INSTALL_DIR="/opt/email-client"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${REPO_ROOT}/dist/deb-build"
DEB_ROOT="${BUILD_DIR}/${PKG_NAME}_${PKG_VERSION}_${PKG_ARCH}"
OUTPUT_DIR="${REPO_ROOT}/dist"

# ── Helpers ───────────────────────────────────────────────────────────────────

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

progress() {
    local label="$1"
    local total=15
    local bar_width=20
    echo -e "${BOLD}${label}${RESET}"
    for (( i=0; i<=total; i++ )); do
        local filled=$(( i * bar_width / total ))
        local pct=$(( i * 100 / total ))
        local bar=""
        for (( f=0; f<filled; f++ )); do bar+="█"; done
        printf "\r  [${GREEN}%s${YELLOW}🦆${RESET}%*s] ${WHITE}%3d%%${RESET}" \
            "$bar" "$((bar_width - filled))" "" "$pct"
        sleep 0.05
    done
    echo -e "\n"
}

# ── Pre-flight ────────────────────────────────────────────────────────────────

if ! command -v dpkg-deb &>/dev/null; then
    echo -e "${YELLOW}Warning: dpkg-deb not found. Install with: sudo apt-get install dpkg-dev${RESET}"
    exit 1
fi

duck_say "Building .deb package v${PKG_VERSION}"

# ── Directory structure ───────────────────────────────────────────────────────

rm -rf "$DEB_ROOT"
mkdir -p \
    "${DEB_ROOT}/DEBIAN" \
    "${DEB_ROOT}${INSTALL_DIR}/backend" \
    "${DEB_ROOT}${INSTALL_DIR}/frontend" \
    "${DEB_ROOT}${INSTALL_DIR}/scripts" \
    "${DEB_ROOT}/lib/systemd/system" \
    "${DEB_ROOT}/usr/bin"

progress "Creating package skeleton"

# ── DEBIAN/control ────────────────────────────────────────────────────────────

cat > "${DEB_ROOT}/DEBIAN/control" <<EOF
Package: ${PKG_NAME}
Version: ${PKG_VERSION}
Architecture: ${PKG_ARCH}
Maintainer: ${PKG_MAINTAINER}
Depends: nodejs (>= 18), npm, docker.io | docker-ce
Description: ${PKG_DESCRIPTION}
 A modern self-hosted email client built with Node.js (backend)
 and React (frontend), packaged for easy Debian/Ubuntu deployment.
EOF

# ── DEBIAN/preinst ────────────────────────────────────────────────────────────

cat > "${DEB_ROOT}/DEBIAN/preinst" <<'EOF'
#!/bin/bash
set -e
echo "🦆 Preparing to install Email Client..."
# Stop existing service if running
if systemctl is-active --quiet email-client 2>/dev/null; then
    systemctl stop email-client
fi
EOF
chmod 755 "${DEB_ROOT}/DEBIAN/preinst"

# ── DEBIAN/postinst ───────────────────────────────────────────────────────────

cat > "${DEB_ROOT}/DEBIAN/postinst" <<EOF
#!/bin/bash
set -e
echo "🦆 Configuring Email Client..."

# Copy .env.example if no .env exists
if [ ! -f "${INSTALL_DIR}/.env" ]; then
    cp "${INSTALL_DIR}/.env.example" "${INSTALL_DIR}/.env"
    echo "  Created .env from .env.example — please edit it before starting."
fi

# Install backend production dependencies
cd "${INSTALL_DIR}/backend"
npm ci --only=production --silent

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable email-client
systemctl start email-client

echo "🦆 Email Client installed! Visit http://localhost:5000"
EOF
chmod 755 "${DEB_ROOT}/DEBIAN/postinst"

# ── DEBIAN/prerm ──────────────────────────────────────────────────────────────

cat > "${DEB_ROOT}/DEBIAN/prerm" <<'EOF'
#!/bin/bash
set -e
echo "🦆 Stopping Email Client service..."
if systemctl is-active --quiet email-client 2>/dev/null; then
    systemctl stop email-client
fi
if systemctl is-enabled --quiet email-client 2>/dev/null; then
    systemctl disable email-client
fi
EOF
chmod 755 "${DEB_ROOT}/DEBIAN/prerm"

# ── DEBIAN/postrm ─────────────────────────────────────────────────────────────

cat > "${DEB_ROOT}/DEBIAN/postrm" <<'EOF'
#!/bin/bash
set -e
if [ "$1" = "purge" ]; then
    echo "🦆 Purging Email Client data..."
    rm -rf /opt/email-client
fi
systemctl daemon-reload || true
EOF
chmod 755 "${DEB_ROOT}/DEBIAN/postrm"

progress "Writing DEBIAN control scripts"

# ── systemd service ───────────────────────────────────────────────────────────

cat > "${DEB_ROOT}/lib/systemd/system/email-client.service" <<EOF
[Unit]
Description=Email Client Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}/backend
EnvironmentFile=${INSTALL_DIR}/.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=email-client

[Install]
WantedBy=multi-user.target
EOF

# ── /usr/bin/email-client CLI wrapper ────────────────────────────────────────

cat > "${DEB_ROOT}/usr/bin/email-client" <<EOF
#!/bin/bash
# CLI entry point for the Email Client service.
INSTALL_DIR="${INSTALL_DIR}"

case "\${1:-help}" in
    start)   systemctl start email-client ;;
    stop)    systemctl stop email-client ;;
    restart) systemctl restart email-client ;;
    status)  systemctl status email-client ;;
    logs)    journalctl -u email-client -f ;;
    help|*)
        echo "Usage: email-client {start|stop|restart|status|logs}"
        ;;
esac
EOF
chmod 755 "${DEB_ROOT}/usr/bin/email-client"

progress "Writing service files"

# ── Copy application files ────────────────────────────────────────────────────

echo -e "${BOLD}Copying application files...${RESET}"
cp -r "${REPO_ROOT}/backend/src"           "${DEB_ROOT}${INSTALL_DIR}/backend/"
cp    "${REPO_ROOT}/backend/package.json"  "${DEB_ROOT}${INSTALL_DIR}/backend/"
cp    "${REPO_ROOT}/backend/package-lock.json" "${DEB_ROOT}${INSTALL_DIR}/backend/" 2>/dev/null || true
cp    "${REPO_ROOT}/.env.example"          "${DEB_ROOT}${INSTALL_DIR}/"
cp -r "${REPO_ROOT}/scripts"               "${DEB_ROOT}${INSTALL_DIR}/"

# Copy built frontend if it exists
if [ -d "${REPO_ROOT}/frontend/dist" ]; then
    cp -r "${REPO_ROOT}/frontend/dist" "${DEB_ROOT}${INSTALL_DIR}/frontend/"
fi

progress "Copying application files"

# ── Build .deb ────────────────────────────────────────────────────────────────

mkdir -p "$OUTPUT_DIR"
duck_say "Running dpkg-deb --build..."
dpkg-deb --build "$DEB_ROOT" "${OUTPUT_DIR}/${PKG_NAME}_${PKG_VERSION}_${PKG_ARCH}.deb"

echo -e "${GREEN}${BOLD}"
echo "  ✔ Package built: ${OUTPUT_DIR}/${PKG_NAME}_${PKG_VERSION}_${PKG_ARCH}.deb"
echo -e "${RESET}"
duck_say "Install with: sudo dpkg -i dist/${PKG_NAME}_${PKG_VERSION}_${PKG_ARCH}.deb"
