const createMarketValidatorSchema = {
    name: {
      notEmpty: { errorMessage: 'Name is required' }
    },
    exchange: {
      notEmpty: { errorMessage: 'Exchange is required' }
    },
    desc: {
      trim: true,
      notEmpty: { errorMessage: 'Describtion is required' }
    },
    url: {
      trim: true,
      isURL: {
        errorMessage: 'URL must be valid'
      }
    },
    
  };
module.exports = { createMarketValidatorSchema };