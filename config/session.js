const session = require('express-session');
const config = require('./index');

const sessionConfig = {
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: config.env === 'production' },
};

module.exports = session(sessionConfig);
