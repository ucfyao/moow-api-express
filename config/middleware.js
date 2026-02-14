const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('./session');
const config = require('./index');
const logger = require('../app/utils/logger');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const setupMiddleware = (app) => {
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(
    cors({
      origin: config.env === 'production' ? config.siteUrl : true,
      credentials: true,
    })
  );
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1', apiLimiter);
  app.use(session);

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else if (config.env === 'production') {
    app.use(morgan('combined', { stream: logger.stream }));
  } else {
    app.use(morgan('tiny', { stream: logger.stream }));
  }
};

module.exports = setupMiddleware;
