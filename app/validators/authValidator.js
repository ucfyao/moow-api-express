const signinValidatorSchema = {
  email: {
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email format' },
  },
  password: {
    notEmpty: { errorMessage: 'Password is required' },
    isLength: { options: { min: 6 }, errorMessage: 'Password must be at least 6 characters long' }
  }
};

const signoutValidatorSchema = {
  user_id: { 
    notEmpty: { errorMessage: 'id is required' },
    isMongoId: { errorMessage: 'User ID must be a valid MongoDB ObjectId' }
  }
};

const sendActivateEmailValidatorSchema = {
  email: { 
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email format' }
  }
};

module.exports = { signinValidatorSchema, signoutValidatorSchema, sendActivateEmailValidatorSchema };
