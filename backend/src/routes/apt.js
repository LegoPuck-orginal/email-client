const express = require('express');
const rateLimit = require('express-rate-limit');
const { checkAptUpdates, applyAptUpdates } = require('../services/aptUpdaterService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const aptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many APT update requests, please try again later.' },
});

// GET /api/apt/check
router.get('/check', aptLimiter, verifyToken, async (req, res) => {
  try {
    const result = await checkAptUpdates();
    return res.status(200).json(result);
  } catch (err) {
    console.error('APT check error:', err);
    return res.status(500).json({ error: 'Failed to check APT updates.', details: err.message });
  }
});

// POST /api/apt/update
router.post('/update', aptLimiter, verifyToken, async (req, res) => {
  try {
    const result = await applyAptUpdates();
    return res.status(200).json(result);
  } catch (err) {
    console.error('APT update error:', err);
    return res.status(500).json({ error: 'Failed to apply APT updates.', details: err.message });
  }
});

module.exports = router;
