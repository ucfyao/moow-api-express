const getEachStrategyValidatorSchema = {
  id: {
    notEmpty: { errorMessage: 'Strategy ID is required' },
    isString: {
      errorMessage: 'Strategy ID must be a string'
    }
  },
};

module.exports = { getEachStrategyValidatorSchema };