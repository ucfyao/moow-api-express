const express = require('express');
const connectDB = require('./config/db');
const setupMiddleware = require('./config/middleware');
const routes = require('./app/routes');
// const registerRoutes = require('./app/routes');
const { STATUS_TYPE } = require('./app/utils/statusCodes');
const ResponseHandler = require('./app/utils/responseHandler');
const CustomError = require('./app/utils/customError');

const config = require('./config');

const app = express();

// Connect to MongoDB
connectDB();

// Setup middleware
setupMiddleware(app);

// Use routes
// registerRoutes(app);
app.use(routes);


// Handle 404 errors
app.use((req, res, next) => {
  next(new CustomError(STATUS_TYPE.HTTP_NOT_FOUND));
});

// Global error handler
app.use((error, req, res, next) => {
  if (error instanceof CustomError) {
    return ResponseHandler.fail(res, error.statusCode, error.businessCode, error.message);
  }else{
    return ResponseHandler.fail(res, STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR, STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR, error.message || 'Internal Server Error');
  }
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`http://127.0.0.1:${config.port}`);
});

module.exports = app;