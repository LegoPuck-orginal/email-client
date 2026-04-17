const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');
const { Email } = require('../models');
const { Op } = require('sequelize');

/**
 * Build imap-simple config from an EmailAccount record.
 */
function buildImapConfig(account) {
  return {
    imap: {
      user: account.email,
      password: account.password,
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapSecure,
      tlsOptions: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
      authTimeout: 10000,
      connTimeout: 30000,
    },
  };
}

/**
 * Connect to an IMAP server.
 * @param {object} account - EmailAccount model instance
 * @returns {Promise<imapSimple.ImapSimple>}
 */
async function connectImap(account) {
  const config = buildImapConfig(account);
  const connection = await imapSimple.connect(config);
  return connection;
}

/**
 * Fetch emails from an IMAP folder.
 * @param {object} account - EmailAccount model instance
 * @param {string} folder - IMAP folder name (e.g. 'INBOX')
 * @param {number} limit - Maximum number of emails to fetch
 * @returns {Promise<Array>} Parsed email objects
 */
async function fetchEmails(account, folder = 'INBOX', limit = 50) {
  let connection;
  try {
    connection = await connectImap(account);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const sliced = messages.slice(-limit);

    const emails = [];
    for (const message of sliced) {
      try {
        const fullBody = message.parts.find((p) => p.which === '');
        if (!fullBody) continue;

        const parsed = await simpleParser(fullBody.body);
        emails.push({
          uid: String(message.attributes.uid),
          subject: parsed.subject || '(No Subject)',
          from: parsed.from ? parsed.from.text : '',
          to: parsed.to ? parsed.to.text : '',
          cc: parsed.cc ? parsed.cc.text : '',
          date: parsed.date || new Date(),
          body: parsed.html || parsed.text || '',
          messageId: parsed.messageId || null,
          attachments: (parsed.attachments || []).map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size,
          })),
        });
      } catch (parseErr) {
        console.error('Error parsing message:', parseErr.message);
      }
    }

    return emails;
  } finally {
    if (connection) {
      try {
        connection.end();
      } catch (_) {}
    }
  }
}

/**
 * Sync emails from IMAP into the local database.
 * @param {number} userId
 * @param {object} account - EmailAccount model instance
 * @returns {Promise<{synced: number, skipped: number, folder: string}>}
 */
async function syncEmails(userId, account) {
  const imapFolderMap = {
    INBOX: 'INBOX',
    SENT: '[Gmail]/Sent Mail',
    DRAFTS: '[Gmail]/Drafts',
    TRASH: '[Gmail]/Trash',
    SPAM: '[Gmail]/Spam',
  };

  let totalSynced = 0;
  let totalSkipped = 0;

  for (const [appFolder, imapFolder] of Object.entries(imapFolderMap)) {
    let emails;
    try {
      emails = await fetchEmails(account, imapFolder, 50);
    } catch (err) {
      // Some folders may not exist on the server; skip gracefully
      console.warn(`Skipping IMAP folder "${imapFolder}": ${err.message}`);
      continue;
    }

    for (const emailData of emails) {
      try {
        const existing = emailData.uid
          ? await Email.findOne({ where: { userId, uid: emailData.uid, folder: appFolder } })
          : null;

        if (existing) {
          totalSkipped++;
          continue;
        }

        await Email.create({
          userId,
          folder: appFolder,
          subject: emailData.subject,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc || null,
          body: emailData.body,
          isRead: false,
          isStarred: false,
          attachments: emailData.attachments,
          uid: emailData.uid,
          messageId: emailData.messageId,
          date: emailData.date,
        });
        totalSynced++;
      } catch (dbErr) {
        console.error('Error saving email to DB:', dbErr.message);
        totalSkipped++;
      }
    }
  }

  return { synced: totalSynced, skipped: totalSkipped };
}

module.exports = { connectImap, fetchEmails, syncEmails };
