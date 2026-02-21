const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../app/utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
    });
    logger.info(`Connected to MongoDB at ${config.mongoUri}`);
  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
    process.exit(1); // 结束进程
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};

module.exports = connectDB;
