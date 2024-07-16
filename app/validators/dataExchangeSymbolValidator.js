// TODO complete symbol validator
const dataExchangeSymbolValidatorSchema = {
  exchange: {
    notEmpty: { errorMessage: 'exchange is required and cannot be empty' },
    isString: { errorMessage: 'exchange must be a string' },
  },
  symbol: {
    notEmpty: { errorMessage: 'symbol is required and cannot be empty' },
    isString: { errorMessage: 'symbol must be a string' },
  },
  price_usd: {
    notEmpty: { errorMessage: 'price_usd is required' },
    isNumeric: { errorMessage: 'price_usd must be a number' },
  },
  price_native: {
    notEmpty: { errorMessage: 'price_native is required' },
    isNumeric: { errorMessage: 'price_native must be a number' },
  },
};
  
module.exports = { dataExchangeSymbolValidatorSchema };