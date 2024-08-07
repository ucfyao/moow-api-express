const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const session = require('./session');
const config = require('./index');
const logger = require('../app/utils/logger');

const setupMiddleware = (app) => {
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(cors());
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
