const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const responseTime = require('response-time');
const { v4: uuidv4 } = require('uuid');
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
  app.use(compression());

  // Response time header
  app.use(responseTime());

  // Request correlation IDs
  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Custom Morgan token for request ID
  morgan.token('request-id', (req) => req.requestId);

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
    app.use(
      morgan(
        ':request-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
        { stream: logger.stream }
      )
    );
  } else {
    app.use(morgan('tiny', { stream: logger.stream }));
  }
};

module.exports = setupMiddleware;
