# 🦆 Email Client — Makefile
# Run `make help` to see all available commands.

.PHONY: build up down restart logs clean check-update update \
        apt-build apt-install apt-check apt-update \
        duck-demo shell-backend shell-frontend help

## ── Docker ──────────────────────────────────────────────────────────────────

# Build all Docker images
build:
	docker-compose build

# Start all services in the background
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# Follow logs for all services (Ctrl-C to exit)
logs:
	docker-compose logs -f

# Stop services, remove volumes and all images (full reset)
clean:
	docker-compose down -v --rmi all

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

## ── Debug shells ─────────────────────────────────────────────────────────────

# Open a shell inside the running backend container
shell-backend:
	docker-compose exec backend sh

# Open a shell inside the running frontend container
shell-frontend:
	docker-compose exec frontend sh

## ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  🦆  Email Client — available make targets"
	@echo ""
	@echo "  Docker"
	@echo "    make build          Build all Docker images"
	@echo "    make up             Start all services (detached)"
	@echo "    make down           Stop all services"
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
	@echo "    make duck-demo      Show duck animations"
	@echo ""
	@echo "  Shells"
	@echo "    make shell-backend  Shell into backend container"
	@echo "    make shell-frontend Shell into frontend container"
	@echo ""
