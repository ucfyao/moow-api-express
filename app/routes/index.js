const userRoutes = require('./userRoutes');
const keyRoutes = require('./keyRoutes');
const registerRoutes = (app) => {
  app.use('/api/v1', userRoutes);
  app.use('/api/v1', keyRoutes);
};

module.exports = registerRoutes;