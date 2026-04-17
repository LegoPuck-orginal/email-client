const sequelize = require('../config/database');
const User = require('./User');
const Email = require('./Email');
const EmailAccount = require('./EmailAccount');

// User associations
User.hasMany(Email, { foreignKey: 'userId', as: 'emails', onDelete: 'CASCADE' });
Email.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(EmailAccount, { foreignKey: 'userId', as: 'emailAccounts', onDelete: 'CASCADE' });
EmailAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Email,
  EmailAccount,
};
