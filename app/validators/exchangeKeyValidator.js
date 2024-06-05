const createKeyValidatorSchema = {
    exchange: {
      notEmpty: { errorMessage: 'Exchange is required' }
    },
    access_key: {
      notEmpty: { errorMessage: 'Access_key is required' }
    },
    secret_key: {
      notEmpty: { errorMessage: 'Secret_key is required' }
    },
    desc: {
      trim: true,
      notEmpty: { errorMessage: 'Describtion is required' }
    },
    
  };
module.exports = { createKeyValidatorSchema };