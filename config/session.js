const session = require('express-session');
const config = require('./index');

const sessionConfig = {
  secret: config.session_secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: config.env === 'production' },
};

module.exports = session(sessionConfig);
