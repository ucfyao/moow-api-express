const saveConfigValidatorSchema = {
  exchanges: {
    isArray: { errorMessage: 'exchanges must be an array' },
    notEmpty: { errorMessage: 'exchanges is required and cannot be empty' },
  },
  symbols: {
    isArray: { errorMessage: 'symbols must be an array' },
    notEmpty: { errorMessage: 'symbols is required and cannot be empty' },
  },
};

module.exports = { saveConfigValidatorSchema };
