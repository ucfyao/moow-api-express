const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Store the server instance and URI for teardown and test use
  globalThis.__MONGOD__ = mongod;
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
};
