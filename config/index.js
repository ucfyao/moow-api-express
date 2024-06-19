const dotenv = require('dotenv');
const crypto = require('crypto');
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase',
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  tokenTimeOut: 1000,
  publicKeyPath: process.env.PUBLIC_KEY_PATH || '../keys/damoon.pem',
  privateKeyPath: process.env.PRIVATE_KEY_PATH || '../keys/damoon.pub',
  // Add other configuration variables as needed
};

module.exports = config;
