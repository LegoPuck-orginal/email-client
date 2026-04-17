# Email Client Wiki

Dieses Wiki beschreibt die wichtigsten Abläufe für Installation, Login, Betrieb und Updates.

## 1) Schnellstart (Docker)

### Voraussetzungen
- Docker 24+
- Docker Compose 2+

### Installation
1. Repository klonen:
   ```bash
   git clone https://github.com/LegoPuck-orginal/email-client.git
   cd email-client
   ```
2. Umgebungsdatei anlegen:
   ```bash
   cp .env.example .env
   ```
3. Wichtige Werte in `.env` setzen:
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
4. Starten:
   ```bash
   make build
   make up
   ```

### Zugriff
- Frontend: `http://localhost:<FRONTEND_PORT>`
- Backend API: `http://localhost:<BACKEND_PORT>/api`

## 2) Login und Benutzer

### Erster Benutzer
1. Öffne `/register` im Frontend.
2. Konto erstellen.
3. Danach mit `/login` anmelden.

### Login-Verhalten
- Nach erfolgreichem Login wird ein JWT verwendet.
- Beim Start prüft die App automatisch, ob die Session noch gültig ist.
- Bei Logout wird die Session lokal beendet und am Backend abgemeldet.

### Typische Login-Probleme
- **"Invalid email or password"**: Zugangsdaten prüfen.
- **"Token expired" / "Invalid token"**: Neu einloggen.
- **CORS-Fehler**: `FRONTEND_URL` in Backend-Umgebung prüfen.

## 3) Update und Wartung

### Update prüfen
```bash
make check-update
```

### Automatisches Update ausführen
```bash
make update
```

### Logs prüfen
```bash
make logs
```

### Dienste neu starten
```bash
make restart
```

### Dienste stoppen
```bash
make down
```

## 4) Alternative Installation (Debian/Ubuntu)

Siehe:
- `APT-INSTALLATION.md`
- `DUCK-INSTALLER.md`

## 5) Entwickler-Modus

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## 6) Nützliche Dateien

- Hauptübersicht: `README.md`
- Updater-Details: `UPDATER.md`
- APT-Installation: `APT-INSTALLATION.md`
- Duck-Installer: `DUCK-INSTALLER.md`
