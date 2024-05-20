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
module.exports = { createUserValidatorSchema };
