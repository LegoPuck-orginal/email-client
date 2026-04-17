const nodemailer = require('nodemailer');

/**
 * Create a Nodemailer transport from an EmailAccount record.
 * @param {object} account - EmailAccount model instance
 * @returns {nodemailer.Transporter}
 */
function createTransport(account) {
  return nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    auth: {
      user: account.email,
      pass: account.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send an email via SMTP.
 * @param {object} account - EmailAccount model instance
 * @param {object} mailOptions - Nodemailer mail options
 * @returns {Promise<object>} Nodemailer send result
 */
async function sendEmail(account, mailOptions) {
  const transport = createTransport(account);

  try {
    await transport.verify();
  } catch (verifyErr) {
    throw new Error(`SMTP connection failed: ${verifyErr.message}`);
  }

  const info = await transport.sendMail({
    from: mailOptions.from || account.email,
    to: mailOptions.to,
    cc: mailOptions.cc,
    bcc: mailOptions.bcc,
    subject: mailOptions.subject || '(No Subject)',
    html: mailOptions.html,
    text: mailOptions.text,
    attachments: mailOptions.attachments,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
}

module.exports = { createTransport, sendEmail };
