const createUsermarketValidatorSchema = {
    exchange: {
      notEmpty: { errorMessage: 'Exchange is required' }
    },
    accessKey: {
      notEmpty: { errorMessage: 'AccessKey is required' }
    },
    secretKey: {
      notEmpty: { errorMessage: 'SecretKey is required' }
    },
    desc: {
      trim: true,
      notEmpty: { errorMessage: 'Describtion is required' }
    },
    
  };
module.exports = { createUsermarketValidatorSchema };