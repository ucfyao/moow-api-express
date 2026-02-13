const mongoose = require('mongoose');

/**
 * Connect to the in-memory MongoDB instance.
 * The URI is set by the global setup via process.env.MONGO_URI.
 */
const connect = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
};

/**
 * Drop all collections and close the connection.
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

/**
 * Remove all documents from all collections.
 */
const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  const keys = Object.keys(collections);
  for (let i = 0; i < keys.length; i++) {
    await collections[keys[i]].deleteMany({}); // eslint-disable-line no-await-in-loop
  }
};

module.exports = { connect, closeDatabase, clearDatabase };
