const userRoutes = require('./userRoutes');

const registerRoutes = (app) => {
  app.use('/api/v1', userRoutes);
};

module.exports = registerRoutes;