const userRoutes = require("./userRoutes");
const marketRoutes = require("./marketRoutes");
const authRoutes = require("./authRoutes");

const registerRoutes = (app) => {
  app.use("/api/v1", userRoutes);
  app.use("/api/v1", marketRoutes);
  app.use("/api/v1", authRoutes);
};

module.exports = registerRoutes;
