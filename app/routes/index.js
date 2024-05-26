const userRoutes = require('./userRoutes');
const marketRoutes = require('./marketRoutes');

const registerRoutes = (app) => {
  app.use('/api/v1', userRoutes);
  app.use('/api/v1', marketRoutes);
};

module.exports = registerRoutes;