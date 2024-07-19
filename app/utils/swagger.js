const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const config = require('../../config');

function swaggerInitialise() {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'API of Moow',
        version: '1.0.0',
        description: 'API documentation for moow.cc',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
    },
    apis: [
      './app/routes/*.js',    
    ],
  };

  const swaggerSpecs = swaggerJsdoc(swaggerOptions);
  const swaggerJson = function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
  };

  const swaggerInstall = function (app) {
    if (!app) {
      app = express();
    }
    app.get('/swagger.json', swaggerJson);
    if (config.env === 'test' || config.env === 'dev') {
      app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs));
    }
  };
}

module.exports = swaggerInitialise;
  
