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
  minEmailSendInterval: 300,

  // email service config
  mail: {
    host: process.env.MAIL_HOST || 'smtp.qiye.aliyun.com',
    port: process.env.MAIL_PORT || 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER || 'no-reply@moow.cc',
      pass: process.env.MAIL_PASS
    },
    displayName: 'Moow',
  },
  siteName: 'moow',
  siteUrl: 'http://localhost',
  // Add other configuration variables as needed
};

module.exports = config;
