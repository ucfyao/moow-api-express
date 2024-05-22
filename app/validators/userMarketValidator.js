const createUserMarketValidatorSchema = {
    name: {
      notEmpty: { errorMessage: 'Name is required' }
    },
    exchange: {
      notEmpty: { errorMessage: 'Exchange is required' }
    },
    accessKey: {
      notEmpty: { errorMessage: 'AccessKey is required' }
    },
    secretKey: {
      notEmpty: { errorMessage: 'SecretKey is required' }
    },
    remarks: {
      trim: true,
      notEmpty: { errorMessage: 'Remarks is required' }
    },
    url: {
      trim: true,
      optional: true,
      isURL: {
        errorMessage: 'URL must be valid'
      }
    },
    
  };
module.exports = { createUserMarketValidatorSchema };