const { exec } = require('child_process');

/**
 * Run a shell command and return stdout/stderr as a promise.
 */
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 120000, ...options }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout, stderr }));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Check for available APT package updates (dry-run).
 * @returns {Promise<{updatesAvailable: boolean, packages: string[], rawOutput: string}>}
 */
async function checkAptUpdates() {
  try {
    await runCommand('apt-get update -qq');
  } catch (updateErr) {
    console.warn('apt-get update warning:', updateErr.message);
  }

  const { stdout } = await runCommand('apt-get -s upgrade');

  const lines = stdout.split('\n');
  const upgradeLine = lines.find((l) => /^\d+ upgraded/.test(l.trim()));
  const packageLines = lines
    .filter((l) => l.startsWith('Inst '))
    .map((l) => l.replace(/^Inst\s+/, '').split(' ')[0]);

  const countMatch = upgradeLine ? upgradeLine.match(/^(\d+) upgraded/) : null;
  const upgradeCount = countMatch ? parseInt(countMatch[1]) : 0;

  return {
    updatesAvailable: upgradeCount > 0,
    upgradeCount,
    packages: packageLines,
    summary: upgradeLine || 'No upgrade summary available.',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Apply all available APT updates.
 * @returns {Promise<{success: boolean, output: string, appliedAt: string}>}
 */
async function applyAptUpdates() {
  const { stdout: updateOut } = await runCommand('apt-get update');
  const { stdout: upgradeOut } = await runCommand(
    'DEBIAN_FRONTEND=noninteractive apt-get upgrade -y'
  );

  const combined = `${updateOut}\n${upgradeOut}`;
  const lines = combined.split('\n');
  const summaryLine = lines.find((l) => /^\d+ upgraded/.test(l.trim())) || 'Upgrade complete.';

  return {
    success: true,
    summary: summaryLine.trim(),
    output: combined.trim(),
    appliedAt: new Date().toISOString(),
  };
}

module.exports = { checkAptUpdates, applyAptUpdates };
