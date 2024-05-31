const userRoutes = require("./userRoutes");
const marketRoutes = require("./marketRoutes");
const authRoutes = require("./authRoutes");
const keyRoutes = require('./keyRoutes');
const strategyRoutes = require("./strategyRoutes");
const orderRoutes = require("./orderRoutes");

const registerRoutes = (app) => {
  app.use("/api/v1", userRoutes);
  app.use("/api/v1", marketRoutes);
  app.use("/api/v1", authRoutes);
  app.use('/api/v1', keyRoutes);
  app.use("/api/v1", strategyRoutes);
  app.use("/api/v1", orderRoutes);
};

module.exports = registerRoutes;
