const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../app/utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    logger.info(`Connected to MongoDB at ${config.mongoUri}`);
  } catch (err) {
    logger.info('MongoDB connection error:', err.message);
    process.exit(1); // 结束进程
  }
};

module.exports = connectDB;
