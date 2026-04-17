# 🦆 Email Client

> A self-hosted, privacy-first email client built with Node.js and React — powered by Duck Technology™.

[![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](backend/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](frontend/)

---

## Overview

Email Client is a full-stack, self-hosted webmail application that lets you read and send email via IMAP/SMTP from your own server, with zero third-party cloud dependencies.

### Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Node.js 18, Express 4   |
| Database  | SQLite 3 via Sequelize  |
| Frontend  | React 18, Vite, Axios   |
| Web server| Nginx (inside Docker)   |
| Container | Docker + Docker Compose |

---

## Quick Start

### Prerequisites
- Docker ≥ 24 and Docker Compose ≥ 2
- (Optional) Node.js ≥ 18 for local development

### 1. Clone and configure

```bash
git clone https://github.com/LegoPuck-orginal/email-client.git
cd email-client
cp .env.example .env
# Edit .env and set JWT_SECRET, ENCRYPTION_KEY, etc.
```

### 2. Deploy

```bash
# Option A — one-command deploy script
bash scripts/deploy.sh

# Option B — manual
make build
make up
```

The app will be available at:
- **Frontend** → `http://localhost:<frontend-port>` (default `3000`, auto-adjusted if busy)
- **Backend API** → `http://localhost:<backend-port>/api` (default `5000`, auto-adjusted if busy)

---

## Environment Variables

See [`.env.example`](.env.example) for all variables. Key ones:

| Variable         | Description                                 | Default                    |
|------------------|---------------------------------------------|----------------------------|
| `NODE_ENV`       | Runtime environment                         | `development`              |
| `PORT`           | Backend listening port                      | `5000`                     |
| `JWT_SECRET`     | Secret for signing JWTs (**change this!**)  | —                          |
| `ENCRYPTION_KEY` | 32-char hex key for email credential crypto | —                          |
| `DB_PATH`        | Path to SQLite database file                | `./data/email-client.db`   |
| `FRONTEND_PORT`  | Docker host port mapped to frontend (nginx) | `3000`                     |
| `BACKEND_PORT`   | Docker host port mapped to backend API      | `5000`                     |
| `FRONTEND_URL`   | Primary allowed CORS origin                 | `http://localhost:3000`    |
| `FRONTEND_URLS`  | Optional extra comma-separated CORS origins | —                          |
| `GITHUB_OWNER`   | GitHub owner for auto-updater               | `LegoPuck-orginal`         |
| `GITHUB_REPO`    | GitHub repo for auto-updater                | `email-client`             |

---

## API Endpoints

### Auth
| Method | Path                  | Description           |
|--------|-----------------------|-----------------------|
| POST   | `/api/auth/register`  | Register a new user   |
| POST   | `/api/auth/login`     | Login, returns JWT    |

### Email
| Method | Path                       | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/emails`              | List emails              |
| GET    | `/api/emails/:id`          | Get a single email       |
| POST   | `/api/emails/send`         | Send an email            |
| DELETE | `/api/emails/:id`          | Delete an email          |

### Accounts
| Method | Path                       | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/accounts`            | List configured accounts |
| POST   | `/api/accounts`            | Add an email account     |
| DELETE | `/api/accounts/:id`        | Remove an account        |

### System
| Method | Path                            | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/health`                   | Health check             |
| POST   | `/api/updates/check`            | Check for new release    |
| POST   | `/api/updates/auto-update`      | Apply latest release     |
| GET    | `/api/apt/check`                | APT package status       |
| POST   | `/api/apt/update`               | Trigger APT update       |

---

## Docker Setup

The project uses a two-service Compose stack:

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│  frontend (nginx:alpine)    │      │  backend (node:18-alpine)    │
│  port FRONTEND_PORT → 80    │─────▶│  port 5000                   │
│  serves React SPA           │      │  REST API + IMAP/SMTP        │
│  proxies /api → backend     │      │  SQLite database             │
└─────────────────────────────┘      └──────────────────────────────┘
              └──────────── email-network (bridge) ──────────────────┘
```

Persistent data is stored in `./backend/data/` (mounted as a Docker volume).

---

## Makefile Commands

```bash
make build           # Build all Docker images
make up              # Start services (detached, auto-selects free host ports)
make down            # Stop services
make uninstall       # Remove services, volumes and orphans
make restart         # Restart services
make logs            # Follow logs (Ctrl-C to exit)
make clean           # Full reset (removes volumes + images)

make check-update    # Check for a new GitHub release
make update          # Apply the latest release

make apt-build       # Build the .deb package
make apt-install     # Install the .deb package
make apt-check       # Check APT package status
make apt-update      # Trigger APT update via API

make install         # Run duck installer
make duck-demo       # Show duck animations 🦆
make shell-backend   # Shell into backend container
make shell-frontend  # Shell into frontend container
make help            # Print all commands
```

---

## Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Frontend dev server runs on http://localhost:5173 and proxies `/api` to the backend.

---

## Installation Methods

| Method             | Guide                                  |
|--------------------|----------------------------------------|
| Project Wiki       | [WIKI.md](WIKI.md)                     |
| Docker Compose     | This README (Quick Start above)        |
| Debian .deb package| [APT-INSTALLATION.md](APT-INSTALLATION.md) |
| Duck Installer     | [DUCK-INSTALLER.md](DUCK-INSTALLER.md) |
| Auto-updater       | [UPDATER.md](UPDATER.md)              |

---

## 🦆 Duck Technology

This project features world-class Duck Technology™:
- `make duck-demo` — watch the duck animate in your terminal
- `bash scripts/duck-installer.sh` — install dependencies with duck flair
- `bash scripts/build-deb-with-duck.sh` — build .deb packages with quacking progress bars

---

## License

MIT © LegoPuck-orginal

## Frontend
- Frontend code files go here

## Docker Setup
- Docker configurations go here

## APT Updater
- APT updater configurations go here

## Scripts
- Any scripts go here

## Documentation
- Documentation files go here
