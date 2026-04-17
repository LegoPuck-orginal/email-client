const express = require('express');
const { checkForUpdates, downloadUpdate, applyUpdate } = require('../services/updaterService');

const router = express.Router();

const CURRENT_VERSION = process.env.CURRENT_VERSION || '1.0.0';

// GET /api/updates/status
router.get('/status', (req, res) => {
  return res.status(200).json({
    currentVersion: CURRENT_VERSION,
    repo: `${process.env.GITHUB_OWNER || 'LegoPuck-orginal'}/${process.env.GITHUB_REPO || 'email-client'}`,
    updateCheckUrl: `https://api.github.com/repos/${process.env.GITHUB_OWNER || 'LegoPuck-orginal'}/${process.env.GITHUB_REPO || 'email-client'}/releases/latest`,
    checkedAt: null,
  });
});

// POST /api/updates/check
router.post('/check', async (req, res) => {
  try {
    const updateInfo = await checkForUpdates();
    return res.status(200).json(updateInfo);
  } catch (err) {
    console.error('Update check error:', err);
    return res.status(500).json({ error: 'Failed to check for updates.', details: err.message });
  }
});

// POST /api/updates/auto-update
router.post('/auto-update', async (req, res) => {
  try {
    const updateInfo = await checkForUpdates();
    if (!updateInfo.updateAvailable) {
      return res.status(200).json({ message: 'Already on latest version.', version: updateInfo.currentVersion });
    }

    const downloadPath = await downloadUpdate(updateInfo.downloadUrl);
    const result = await applyUpdate(downloadPath);

    return res.status(200).json({
      message: 'Update applied successfully.',
      previousVersion: updateInfo.currentVersion,
      newVersion: updateInfo.latestVersion,
      ...result,
    });
  } catch (err) {
    console.error('Auto-update error:', err);
    return res.status(500).json({ error: 'Update failed.', details: err.message });
  }
});

module.exports = router;
