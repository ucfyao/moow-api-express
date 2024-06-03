const dotenv = require('dotenv');
const crypto = require('crypto');
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase',
  session_secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  tokenTimeOut: 1000,
  // Add other configuration variables as needed
};

module.exports = config;
