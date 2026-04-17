const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'default_32_char_key_change_me!!').slice(0, 32).padEnd(32, '0');
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return null;
  }
}

const EmailAccount = sequelize.define('EmailAccount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imapHost: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imapPort: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 993,
  },
  imapSecure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  smtpHost: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  smtpPort: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 587,
  },
  smtpSecure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return decrypt(this.getDataValue('password'));
    },
    set(value) {
      this.setDataValue('password', encrypt(value));
    },
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'email_accounts',
  indexes: [
    { fields: ['userId'] },
    { fields: ['email'] },
  ],
});

module.exports = EmailAccount;
