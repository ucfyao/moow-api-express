const express = require('express');
const fs = require('fs');
const path = require('path');

const registerRoutes = (router, routesPath) => {
    fs.readdirSync(routesPath).forEach(file => {
        if (file.endsWith('.js') && file !== 'index.js') {
            const route = require(path.join(routesPath, file));
            router.use('/', route);
        }
    });
};

const router = express.Router();
registerRoutes(router, __dirname);

module.exports = router;
