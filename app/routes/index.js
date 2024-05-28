const userRoutes = require("./userRoutes");
const marketRoutes = require("./marketRoutes");
const authRoutes = require("./authRoutes");
const keyRoutes = require('./keyRoutes');

const registerRoutes = (app) => {
  app.use("/api/v1", userRoutes);
  app.use("/api/v1", marketRoutes);
  app.use("/api/v1", authRoutes);
  app.use('/api/v1', keyRoutes);
};

module.exports = registerRoutes;
