const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const config = require('../../config').logger;

// Define log format
const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  let logMessage = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    logMessage += `\n${stack}`;
  }
  return logMessage;
});

// Create transports for different log levels
const transportsArray = [
  new DailyRotateFile({
    filename: path.join(config.directory, 'error-%DATE%.log'),
    datePattern: config.datePattern,
    maxSize: config.maxSize,
    maxFiles: config.maxFiles,
    level: 'error',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.align(),
      logFormat,
    ),
  }),
  new DailyRotateFile({
    filename: path.join(config.directory, 'combined-%DATE%.log'),
    datePattern: config.datePattern,
    maxSize: config.maxSize,
    maxFiles: config.maxFiles,
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.align(),
      logFormat,
    ),
  }),
];

if (process.env.NODE_ENV !== 'production') {
  transportsArray.push(
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.errors({ stack: true }),
        logFormat,
      ),
    }),
  );
}

// Create and configure logger
const logger = createLogger({
  // error < warn < info < http < verbose < debug < silly
  level: config.level,
  transports: transportsArray,
  exitOnError: false,
});

// Add a stream for Morgan middleware
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Error handling for file transport
transportsArray.forEach((transport) => {
  if (transport instanceof DailyRotateFile) {
    transport.on('error', (error) => {
      console.error('Error in transport', error);
    });
  }
});

module.exports = logger;
