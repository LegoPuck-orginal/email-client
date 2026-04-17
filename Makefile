# 🦆 Email Client — Makefile
# Run `make help` to see all available commands.

# Support both the Compose plugin (Docker ≥ 24) and the standalone binary.
COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || (docker-compose version > /dev/null 2>&1 && echo "docker-compose" || (echo "ERROR: Neither 'docker compose' nor 'docker-compose' found. Install Docker >= 24." >&2; exit 1)))

.PHONY: build up down restart logs clean uninstall check-update update \
        apt-build apt-install apt-check apt-update \
        duck-demo install shell-backend shell-frontend help

## ── Docker ──────────────────────────────────────────────────────────────────

# Build all Docker images
build:
	$(COMPOSE) build

# Start all services in the background
up:
	@set -e; \
	BACKEND_PORT="$$(scripts/select-backend-port.sh)"; \
	echo "🦆 Using backend host port $$BACKEND_PORT"; \
	BACKEND_PORT="$$BACKEND_PORT" $(COMPOSE) up -d

# Stop all services
down:
	$(COMPOSE) down

# Uninstall local Docker deployment (stops and removes stack + volumes)
uninstall:
	$(COMPOSE) down -v --remove-orphans

# Restart all services
restart:
	$(COMPOSE) restart

# Follow logs for all services (Ctrl-C to exit)
logs:
	$(COMPOSE) logs -f

# Stop services, remove volumes and all images (full reset)
clean:
	$(COMPOSE) down -v --rmi all

## ── Application updates ──────────────────────────────────────────────────────

# Check whether a new GitHub release is available
check-update:
	curl -s -X POST http://localhost:5000/api/updates/check | python3 -m json.tool

# Download and apply the latest release automatically
update:
	curl -s -X POST http://localhost:5000/api/updates/auto-update | python3 -m json.tool

## ── Debian package ───────────────────────────────────────────────────────────

# Build the .deb package (output written to dist/)
apt-build:
	bash scripts/build-deb-with-duck.sh

# Install the previously built .deb package
apt-install:
	sudo dpkg -i dist/email-client_*.deb

# Check APT package status via the API
apt-check:
	curl -s http://localhost:5000/api/apt/check | python3 -m json.tool

# Trigger APT update via the API
apt-update:
	curl -s -X POST http://localhost:5000/api/apt/update | python3 -m json.tool

## ── Duck installer ───────────────────────────────────────────────────────────

# Run the duck installer in demo mode (shows all animations)
duck-demo:
	bash scripts/duck-installer.sh --demo

# Run the duck installer
install:
	bash scripts/duck-installer.sh

## ── Debug shells ─────────────────────────────────────────────────────────────

# Open a shell inside the running backend container
shell-backend:
	$(COMPOSE) exec backend sh

# Open a shell inside the running frontend container
shell-frontend:
	$(COMPOSE) exec frontend sh

## ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  🦆  Email Client — available make targets"
	@echo ""
	@echo "  Docker"
	@echo "    make build          Build all Docker images"
	@echo "    make up             Start all services (detached)"
	@echo "    make down           Stop all services"
	@echo "    make uninstall      Stop and remove services + volumes"
	@echo "    make restart        Restart all services"
	@echo "    make logs           Tail logs (Ctrl-C to exit)"
	@echo "    make clean          Full reset (removes volumes + images)"
	@echo ""
	@echo "  Application updates"
	@echo "    make check-update   Check for a new GitHub release"
	@echo "    make update         Apply the latest release"
	@echo ""
	@echo "  Debian package"
	@echo "    make apt-build      Build the .deb package"
	@echo "    make apt-install    Install the .deb package"
	@echo "    make apt-check      Check APT package status (API)"
	@echo "    make apt-update     Trigger APT update (API)"
	@echo ""
	@echo "  Duck installer"
	@echo "    make install        Run the duck installer"
	@echo "    make duck-demo      Show duck animations"
	@echo ""
	@echo "  Shells"
	@echo "    make shell-backend  Shell into backend container"
	@echo "    make shell-frontend Shell into frontend container"
	@echo ""
