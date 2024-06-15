const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB at ${config.MONGO_URI}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // 结束进程
  }
};

module.exports = connectDB;