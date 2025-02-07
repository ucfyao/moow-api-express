const express = require('express');
const ejs = require('ejs');
const connectDB = require('./config/db');
const setupMiddleware = require('./config/middleware');
const routes = require('./app/routes');
const { STATUS_TYPE } = require('./app/utils/statusCodes');
const ResponseHandler = require('./app/utils/responseHandler');
const logger = require('./app/utils/logger');
const CustomError = require('./app/utils/customError');
const config = require('./config');
const initializeSchedulers = require('./app/schedulers');
const swaggerInitialise = require('./app/utils/swagger');

const app = express();

// Connect to MongoDB
connectDB();

// Setup middleware
setupMiddleware(app);

// Use Swagger
swaggerInitialise(app);

// Use routes
// registerRoutes(app);
app.use(routes);

// Set templating engines
app.set('view engine', 'html'); // set default engine as "html"
app.engine('html', ejs.renderFile); // use ejs.renderFile to handle .html files

// Handle 404 errors
app.use((req, res, next) => {
  next(new CustomError(STATUS_TYPE.HTTP_NOT_FOUND));
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error(error.message);

  if (error instanceof CustomError) {
    return ResponseHandler.fail(res, error.statusCode, error.businessCode, error.message);
  }
  return ResponseHandler.fail(
    res,
    STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR,
    STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR,
    error.message || 'Internal Server Error',
  );
});

// Start the server
app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
  logger.info(`http://127.0.0.1:${config.port}`);
});

// Initialize scheduled tasks
initializeSchedulers();

module.exports = app;
