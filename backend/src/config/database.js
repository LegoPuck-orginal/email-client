const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/email-client.db';
const resolvedPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(process.cwd(), dbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: resolvedPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

module.exports = sequelize;
