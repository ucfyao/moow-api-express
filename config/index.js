const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase',

  // Security configuration
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  tokenTimeOut: 1000, // Token expiration time in seconds

  // Key file paths
  publicKeyPath: path.resolve(process.cwd(), process.env.PUBLIC_KEY_PATH || 'keys/damoon.pem'),
  privateKeyPath: path.resolve(process.cwd(), process.env.PRIVATE_KEY_PATH || 'keys/damoon.pub'),

  // Email configuration
  minEmailSendInterval: 300, // Minimum interval between email sends in seconds
  mail: {
    host: process.env.MAIL_HOST || 'smtp.qiye.aliyun.com',
    port: parseInt(process.env.MAIL_PORT || '465', 10),
    secure: true,
    auth: {
      user: process.env.MAIL_USER || 'no-reply@moow.cc',
      pass: process.env.MAIL_PASS
    },
    displayName: 'Moow',
  },

  // Site configuration
  siteName: 'moow',
  siteUrl: process.env.SITE_URL || 'http://localhost',

  // Logger configuration
  logger: {
    directory: path.resolve(process.cwd(), process.env.LOG_DIRECTORY || 'logs'),
    level: process.env.LOG_LEVEL || 'info',
    fileLevel: process.env.LOG_FILE_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    datePattern: 'YYYY-MM-DD',
  }
};

module.exports = config;