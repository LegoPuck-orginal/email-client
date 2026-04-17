const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'LegoPuck-orginal';
const GITHUB_REPO = process.env.GITHUB_REPO || 'email-client';
const CURRENT_VERSION = process.env.CURRENT_VERSION || '1.0.0';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/**
 * Compare two semver strings. Returns true if latest > current.
 */
function isNewer(current, latest) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [cMaj, cMin, cPatch] = parse(current);
  const [lMaj, lMin, lPatch] = parse(latest);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPatch > cPatch;
}

/**
 * Fetch the latest release info from GitHub.
 * @returns {Promise<object>}
 */
function checkForUpdates() {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': `${GITHUB_REPO}-updater`,
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https.get(RELEASES_API, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`GitHub API returned ${res.statusCode}: ${data}`));
          }
          const release = JSON.parse(data);
          const latestVersion = release.tag_name || release.name || 'unknown';
          const tarballUrl = release.tarball_url || null;
          const downloadUrl = tarballUrl;

          resolve({
            currentVersion: CURRENT_VERSION,
            latestVersion,
            updateAvailable: isNewer(CURRENT_VERSION, latestVersion),
            releaseNotes: release.body || '',
            publishedAt: release.published_at || null,
            downloadUrl,
            htmlUrl: release.html_url || null,
          });
        } catch (parseErr) {
          reject(new Error(`Failed to parse GitHub response: ${parseErr.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Download a release tarball to the local filesystem.
 * @param {string} releaseUrl - URL of the tarball
 * @returns {Promise<string>} Path to downloaded file
 */
function downloadUpdate(releaseUrl) {
  return new Promise((resolve, reject) => {
    if (!releaseUrl) {
      return reject(new Error('No download URL provided.'));
    }

    const downloadsDir = path.resolve(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    const destPath = path.join(downloadsDir, `update-${Date.now()}.tar.gz`);

    const follow = (url, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      const options = { headers: { 'User-Agent': `${GITHUB_REPO}-updater` } };
      https.get(url, options, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          return follow(res.headers.location, redirectCount + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Download failed with status ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => { file.close(() => resolve(destPath)); });
        file.on('error', reject);
      }).on('error', reject);
    };

    follow(releaseUrl);
  });
}

/**
 * Apply a downloaded update tarball with a backup of the current src.
 * @param {string} tarballPath - Local path to the downloaded tarball
 * @returns {Promise<object>}
 */
async function applyUpdate(tarballPath) {
  const backupDir = path.resolve(process.cwd(), `backup-${Date.now()}`);
  const srcDir = path.resolve(process.cwd(), 'src');
  const extractDir = path.resolve(process.cwd(), 'update-extract');

  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    execSync(`cp -r ${srcDir} ${backupDir}/src`);
  }

  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(extractDir, { recursive: true });

  execSync(`tar -xzf ${tarballPath} -C ${extractDir} --strip-components=1`);

  const extractedSrc = path.join(extractDir, 'backend', 'src');
  if (fs.existsSync(extractedSrc)) {
    if (fs.existsSync(srcDir)) {
      fs.rmSync(srcDir, { recursive: true, force: true });
    }
    execSync(`cp -r ${extractedSrc} ${srcDir}`);
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.rmSync(tarballPath, { force: true });

  return {
    backupPath: backupDir,
    appliedAt: new Date().toISOString(),
  };
}

module.exports = { checkForUpdates, downloadUpdate, applyUpdate };
