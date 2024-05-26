const createMarketValidatorSchema = {
    name: {
      notEmpty: { errorMessage: 'Name is required' },
      isString: { errorMessage: 'Name must be a string' },
      isLength: { options: { min: 1 }, errorMessage: 'Name must be at least 1 character long' }
    },
    exchange: {
      notEmpty: { errorMessage: 'Exchange is required' },
      isString: { errorMessage: 'Exchange must be a string' },
      isLength: { options: { min: 1 }, errorMessage: 'Exchange must be at least 1 character long' }
    },
    desc: {
      optional: true,
      isString: { errorMessage: 'Description must be a string' },
      isLength: { options: { max: 500 }, errorMessage: 'Description must be at most 500 characters long' }
    },
    url: {
      optional: true,
      isString: { errorMessage: 'URL must be a string' },
      isURL: { errorMessage: 'Invalid URL format' }
    },
    is_deleted: {
      optional: true,
      isBoolean: { errorMessage: 'is_deleted must be a boolean' }
    }
  };
  
  module.exports = { createMarketValidatorSchema };
  