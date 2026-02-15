const signinValidatorSchema = {
  email: {
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email format' },
  },
  password: {
    notEmpty: { errorMessage: 'Password is required' },
    isLength: { options: { min: 6 }, errorMessage: 'Password must be at least 6 characters long' },
  },
};

const signoutValidatorSchema = {
  user_id: {
    notEmpty: { errorMessage: 'id is required' },
    isMongoId: { errorMessage: 'User ID must be a valid MongoDB ObjectId' },
  },
};

const sendActivateEmailValidatorSchema = {
  email: {
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email format' },
  },
};

const retrievePasswordValidatorSchema = {
  email: {
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email format' },
  },
};

const createUserValidatorSchema = {
  name: {
    notEmpty: { errorMessage: 'Name is required' },
  },
  email: {
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email format' },
  },
  password: {
    notEmpty: { errorMessage: 'Password is required' },
    isLength: { options: { min: 6 }, errorMessage: 'Password must be at least 6 characters long' },
  },
};

const changePasswordValidatorSchema = {
  code: {
    notEmpty: { errorMessage: 'Verification code is required' },
    isString: { errorMessage: 'Verification code must be a string' },
    isLength: {
      options: { min: 6, max: 6 },
      errorMessage: 'Verification code must be 6 digits',
    },
  },
  newPassword: {
    notEmpty: { errorMessage: 'New password is required' },
    isLength: {
      options: { min: 6 },
      errorMessage: 'New password must be at least 6 characters long',
    },
  },
};

module.exports = {
  signinValidatorSchema,
  signoutValidatorSchema,
  sendActivateEmailValidatorSchema,
  retrievePasswordValidatorSchema,
  createUserValidatorSchema,
  changePasswordValidatorSchema,
};
