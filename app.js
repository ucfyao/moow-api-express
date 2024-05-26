const express = require('express');
// const path = require('path');
// var cookieParser = require('cookie-parser');
const morgan = require('morgan');
// const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

const { STATUS_TYPE } = require('./app/constants/statusCodes');
const ResponseHandler = require('./app/utils/responseHandler');

const connectDB = require('./config/db');

// Load environment variables
dotenv.config();
const env = process.env.NODE_ENV || 'development'

// connect MongoDB
connectDB();

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(helmet());
// app.use(bodyParser.json());
app.use(cors());


if (env === 'development') {
  app.use(morgan('dev'));
} else if (env === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('tiny'));
}
// if (env === 'development') {
//   return morgan('dev');
// } else if (env === 'production') {
//   return morgan('combined');
// } else {
//   return morgan('tiny');
// }
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// route
const registerRoutes = require('./app/routes');
registerRoutes(app);
const strategyRoutes = require('./app/routes/strategyRoutes')
app.use('/api', strategyRoutes)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, '');
});

// error handler
app.use((error, req, res, next) => {
  const httpCode = error.status || STATUS_TYPE.internalServerError;
  const businessCode = error.businessCode || httpCode;
  ResponseHandler.fail(res, httpCode, businessCode, error.message || 'Internal Server Error');
});

// serve
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://127.0.0.1:${PORT}`);

});

module.exports = app;
