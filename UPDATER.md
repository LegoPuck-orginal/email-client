# 🦆 Auto-Updater — GitHub Release Updates

The Email Client backend includes a built-in auto-updater that polls GitHub Releases and can apply updates without manual SSH access.

---

## How It Works

1. **Check** — the backend calls the GitHub Releases API (`/repos/{owner}/{repo}/releases/latest`) and compares the tag version against the running application version stored in `package.json`.
2. **Download** — if a newer version is found, the release tarball or zip asset is downloaded to a staging directory.
3. **Apply** — dependencies are re-installed (`npm ci --only=production`) and the process is gracefully restarted.

---

## API Endpoints

### Check for updates

```http
POST /api/updates/check
Authorization: Bearer <jwt>
```

**Response (update available)**
```json
{
  "updateAvailable": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "releaseUrl": "https://github.com/LegoPuck-orginal/email-client/releases/tag/v1.1.0",
  "changelog": "..."
}
```

**Response (up to date)**
```json
{
  "updateAvailable": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0"
}
```

### Apply update automatically

```http
POST /api/updates/auto-update
Authorization: Bearer <jwt>
```

**Response**
```json
{
  "success": true,
  "message": "Update to v1.1.0 applied. Service will restart momentarily."
}
```

---

## Using Make

```bash
# Check whether a new release is available
make check-update

# Download and apply the update
make update
```

---

## Environment Variables

| Variable        | Description                                    |
|-----------------|------------------------------------------------|
| `GITHUB_OWNER`  | GitHub organisation or username (`LegoPuck-orginal`) |
| `GITHUB_REPO`   | Repository name (`email-client`)               |

These are already set in `.env.example`.

---

## Creating a Release

1. Bump the version in `backend/package.json` and `frontend/package.json`.
2. Commit and push the changes.
3. Create a GitHub Release with the tag `v<version>` (e.g. `v1.1.0`).
4. Attach the built application tarball as a release asset (optional — the updater can also pull from the source archive).

---

## Notes

- Updates are applied **in-place** inside the running container. In a Docker deployment you should prefer rebuilding the image (`make build && make up`) for reproducibility.
- In the `.deb` / systemd deployment, the systemd service is restarted automatically after the update is applied.
- The auto-updater requires the backend to have outbound HTTPS access to `api.github.com`.
