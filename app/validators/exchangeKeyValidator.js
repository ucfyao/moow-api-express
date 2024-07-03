const createKeyValidatorSchema = {
  exchange: {
    notEmpty: { errorMessage: 'Exchange is required' },
  },
  access_key: {
    notEmpty: { errorMessage: 'Access Key is required' },
  },
  secret_key: {
    notEmpty: { errorMessage: 'Secret Key is required' },
  },
  desc: {
    trim: true,
    notEmpty: { errorMessage: 'Describtion is required' },
  },
};
module.exports = { createKeyValidatorSchema };
