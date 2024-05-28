const session = require('express-session');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Generate secret key (in actual use, you can read it directly from the environment variable)
const secretKey = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

const sessionConfig = {
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
};

module.exports = session(sessionConfig);