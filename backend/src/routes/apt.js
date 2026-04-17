const express = require('express');
const { checkAptUpdates, applyAptUpdates } = require('../services/aptUpdaterService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/apt/check
router.get('/check', verifyToken, async (req, res) => {
  try {
    const result = await checkAptUpdates();
    return res.status(200).json(result);
  } catch (err) {
    console.error('APT check error:', err);
    return res.status(500).json({ error: 'Failed to check APT updates.', details: err.message });
  }
});

// POST /api/apt/update
router.post('/update', verifyToken, async (req, res) => {
  try {
    const result = await applyAptUpdates();
    return res.status(200).json(result);
  } catch (err) {
    console.error('APT update error:', err);
    return res.status(500).json({ error: 'Failed to apply APT updates.', details: err.message });
  }
});

module.exports = router;
