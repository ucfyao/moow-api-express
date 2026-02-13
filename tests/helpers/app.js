const express = require('express');
const { STATUS_TYPE } = require('../../app/utils/statusCodes');
const ResponseHandler = require('../../app/utils/responseHandler');
const CustomError = require('../../app/utils/customError');

/**
 * Creates a test Express app with the same middleware and error handling
 * as the real app, but without DB connection or schedulers.
 */
const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // Mock session middleware
  app.use((req, res, next) => {
    if (!req.session) {
      req.session = {};
    }
    next();
  });

  // Load routes
  const routes = require('../../app/routes');
  app.use(routes);

  // Handle 404 errors
  app.use((req, res, next) => {
    next(new CustomError(STATUS_TYPE.HTTP_NOT_FOUND));
  });

  // Global error handler (same as app.js)
  app.use((error, req, res, next) => {
    if (error instanceof CustomError) {
      return ResponseHandler.fail(res, error.statusCode, error.businessCode, error.message);
    }
    return ResponseHandler.fail(
      res,
      STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR,
      STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR,
      error.message || 'Internal Server Error'
    );
  });

  return app;
};

module.exports = createTestApp;
