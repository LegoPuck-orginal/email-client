# 🦆 APT / Debian Package Installation

Install Email Client as a native Debian/Ubuntu package with full `systemd` integration.

---

## Prerequisites

- Debian 11+ or Ubuntu 22.04+
- `dpkg-dev` for building the package (`sudo apt-get install dpkg-dev`)
- Node.js ≥ 18 (`nodejs`) and `npm` on the target machine
- Docker is **not** required for this installation method

---

## Build the Package

```bash
# From the repository root
make apt-build
# or directly:
bash scripts/build-deb-with-duck.sh
```

The package is written to `dist/email-client_1.0.0_all.deb`.

---

## Install

```bash
make apt-install
# or:
sudo dpkg -i dist/email-client_1.0.0_all.deb

# Fix any missing dependencies automatically
sudo apt-get install -f
```

---

## What Gets Installed

| Path                                        | Description                        |
|---------------------------------------------|------------------------------------|
| `/opt/email-client/backend/`               | Node.js backend source             |
| `/opt/email-client/frontend/dist/`         | Pre-built React frontend           |
| `/opt/email-client/.env`                   | Runtime config (copied from example)|
| `/lib/systemd/system/email-client.service` | systemd service unit               |
| `/usr/bin/email-client`                    | CLI management wrapper             |

---

## Managing the Service

```bash
# Start / stop / restart
email-client start
email-client stop
email-client restart

# Check status
email-client status

# Follow logs
email-client logs

# Or use systemctl directly
sudo systemctl status email-client
sudo journalctl -u email-client -f
```

---

## First-Time Configuration

After installation the `.env` file is created at `/opt/email-client/.env` from the example. **Edit it before starting the service:**

```bash
sudo nano /opt/email-client/.env
```

At minimum set:
- `JWT_SECRET` — a long random string
- `ENCRYPTION_KEY` — exactly 32 hex characters

Then restart the service:
```bash
sudo systemctl restart email-client
```

---

## Checking for APT Updates via the API

```bash
# Status
make apt-check
# or:
curl http://localhost:5000/api/apt/check

# Trigger update
make apt-update
# or:
curl -X POST http://localhost:5000/api/apt/update
```

---

## Uninstall

```bash
# Remove the package but keep data
sudo dpkg -r email-client

# Remove everything including data
sudo dpkg --purge email-client
```

---

## Notes

- The `postinst` script runs `npm ci --only=production` automatically.
- The service runs as the user that owns `/opt/email-client`; consider creating a dedicated `email-client` system user for production.
- The frontend `dist/` folder must be built **before** running `build-deb-with-duck.sh` (`cd frontend && npm run build`).
