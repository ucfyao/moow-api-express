// const { body } = require('express-validator');

// const createUserValidator = [
//     body('username')
//         .isString()
//         .isLength({ min: 3, max: 30 })
//         .withMessage('Username must be between 3 and 30 characters long'),
//     body('email')
//         .isEmail()
//         .withMessage('Email must be valid'),
//     body('password')
//         .isLength({ min: 6 })
//         .withMessage('Password must be at least 6 characters long'),
// ];

// module.exports = { createUserValidator };

const createUserValidatorSchema = {
    name: {
      notEmpty: { errorMessage: 'Name is required' }
    },
    email: {
      notEmpty: { errorMessage: 'Email is required' },
      isEmail: { errorMessage: 'Invalid email format' }
    },
    password: {
      notEmpty: { errorMessage: 'Password is required' },
      isLength: { options: { min: 6 }, errorMessage: 'Password must be at least 6 characters long' }
    }
};

const updateUserValidatorSchema = {
  realName: {
    optional: {},
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'Real name must be between 2 and 100 characters long' }
  },
  displayName: {
    optional: {},
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'Display name must be between 2 and 100 characters long' }
  },
  mobile: {
    optional: {},
    isLength: { options: { min: 9 }, errorMessage: 'Mobile must be at least 9 characters long' }
  },
  instagram: {
    optional: {},
    isLength: { options: { min: 6 }, errorMessage: 'instagram must be at least 6 characters long' }
  },
  role: {
    optional: {},
    isArray: { errorMessage: 'Role must be an array' }
  },
  password: {
    optional: {},
    isLength: { options: { min: 6 }, errorMessage: 'Password must be at least 6 characters long' }
  },
  new_password: {
    optional: {},
    isLength: { options: { min: 6 }, errorMessage: 'New password must be at least 6 characters long' }
  }
};

module.exports = { createUserValidatorSchema, updateUserValidatorSchema };
