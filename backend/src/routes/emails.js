const express = require('express');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const { Email, EmailAccount } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { syncEmails } = require('../services/imapService');
const { sendEmail } = require('../services/smtpService');

const router = express.Router();

const emailsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// All email routes require authentication and rate limiting
router.use(emailsLimiter);
router.use(verifyToken);

// GET /api/emails/folders
router.get('/folders', async (req, res) => {
  try {
    const folders = ['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM'];
    const folderCounts = await Promise.all(
      folders.map(async (folder) => {
        const total = await Email.count({ where: { userId: req.userId, folder } });
        const unread = await Email.count({ where: { userId: req.userId, folder, isRead: false } });
        return { folder, total, unread };
      })
    );
    return res.status(200).json({ folders: folderCounts });
  } catch (err) {
    console.error('Get folders error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/emails
router.get(
  '/',
  [
    query('folder').optional().isIn(['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('starred').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const folder = req.query.folder || 'INBOX';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search;
      const starred = req.query.starred;

      const where = { userId: req.userId, folder };

      if (starred === 'true') {
        where.isStarred = true;
      }

      if (search) {
        where[Op.or] = [
          { subject: { [Op.like]: `%${search}%` } },
          { from: { [Op.like]: `%${search}%` } },
          { to: { [Op.like]: `%${search}%` } },
          { body: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Email.findAndCountAll({
        where,
        order: [['date', 'DESC']],
        limit,
        offset,
        attributes: { exclude: ['body'] },
      });

      return res.status(200).json({
        emails: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      console.error('List emails error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/emails/:id
router.get('/:id', [param('id').isInt()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = await Email.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!email) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    if (!email.isRead) {
      await email.update({ isRead: true });
    }

    return res.status(200).json({ email });
  } catch (err) {
    console.error('Get email error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/emails (compose/send)
router.post(
  '/',
  [
    body('to').notEmpty().withMessage('Recipient (to) is required'),
    body('subject').optional().isString(),
    body('body').optional().isString(),
    body('folder').optional().isIn(['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { to, subject, body: emailBody, cc, bcc, folder, isDraft } = req.body;
      const targetFolder = folder || (isDraft ? 'DRAFTS' : 'SENT');

      let senderEmail = req.user.email;

      if (!isDraft) {
        const account = await EmailAccount.findOne({
          where: { userId: req.userId, isDefault: true },
        }) || await EmailAccount.findOne({ where: { userId: req.userId } });

        if (account) {
          senderEmail = account.email;
          await sendEmail(account, {
            from: account.email,
            to,
            cc,
            bcc,
            subject: subject || '(No Subject)',
            html: emailBody,
          });
        }
      }

      const email = await Email.create({
        userId: req.userId,
        folder: targetFolder,
        subject: subject || '(No Subject)',
        from: senderEmail,
        to,
        cc: cc || null,
        bcc: bcc || null,
        body: emailBody || '',
        isRead: true,
        date: new Date(),
      });

      return res.status(201).json({ email, message: isDraft ? 'Draft saved.' : 'Email sent successfully.' });
    } catch (err) {
      console.error('Send email error:', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    }
  }
);

// PUT /api/emails/:id
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('isRead').optional().isBoolean(),
    body('isStarred').optional().isBoolean(),
    body('folder').optional().isIn(['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const email = await Email.findOne({ where: { id: req.params.id, userId: req.userId } });
      if (!email) {
        return res.status(404).json({ error: 'Email not found.' });
      }

      const updates = {};
      if (req.body.isRead !== undefined) updates.isRead = req.body.isRead;
      if (req.body.isStarred !== undefined) updates.isStarred = req.body.isStarred;
      if (req.body.folder) updates.folder = req.body.folder;
      if (req.body.subject !== undefined) updates.subject = req.body.subject;
      if (req.body.body !== undefined) updates.body = req.body.body;

      await email.update(updates);
      return res.status(200).json({ email });
    } catch (err) {
      console.error('Update email error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// DELETE /api/emails/:id
router.delete('/:id', [param('id').isInt()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = await Email.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!email) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    if (email.folder === 'TRASH') {
      await email.destroy();
      return res.status(200).json({ message: 'Email permanently deleted.' });
    }

    await email.update({ folder: 'TRASH' });
    return res.status(200).json({ message: 'Email moved to trash.' });
  } catch (err) {
    console.error('Delete email error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/emails/sync
router.post('/sync', async (req, res) => {
  try {
    const account = await EmailAccount.findOne({
      where: { userId: req.userId, isDefault: true },
    }) || await EmailAccount.findOne({ where: { userId: req.userId } });

    if (!account) {
      return res.status(404).json({ error: 'No email account configured.' });
    }

    const result = await syncEmails(req.userId, account);
    return res.status(200).json({ message: 'Sync completed.', ...result });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: 'Sync failed.', details: err.message });
  }
});

module.exports = router;
