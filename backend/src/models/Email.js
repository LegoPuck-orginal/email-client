const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Email = sequelize.define('Email', {
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
  folder: {
    type: DataTypes.ENUM('INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM'),
    allowNull: false,
    defaultValue: 'INBOX',
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '(No Subject)',
  },
  from: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  to: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bcc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('attachments');
      try {
        return JSON.parse(raw || '[]');
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('attachments', JSON.stringify(value || []));
    },
  },
  uid: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'emails',
  indexes: [
    { fields: ['userId'] },
    { fields: ['folder'] },
    { fields: ['isRead'] },
    { fields: ['isStarred'] },
    { fields: ['date'] },
    { fields: ['userId', 'uid'], unique: true, where: { uid: { [require('sequelize').Op.ne]: null } } },
  ],
});

module.exports = Email;
