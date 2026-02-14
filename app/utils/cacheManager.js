const NodeCache = require('node-cache');

const priceCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
const rateCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const symbolCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

module.exports = { priceCache, rateCache, symbolCache };
