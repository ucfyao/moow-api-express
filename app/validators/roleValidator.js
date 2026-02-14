const createRoleValidatorSchema = {
  role_name: {
    notEmpty: { errorMessage: 'role_name is required' },
    isString: { errorMessage: 'role_name must be a string' },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'role_name must be 2-100 characters',
    },
  },
};

const updateRoleValidatorSchema = {
  role_name: {
    optional: true,
    isString: { errorMessage: 'role_name must be a string' },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'role_name must be 2-100 characters',
    },
  },
  resource: {
    optional: true,
    isArray: { errorMessage: 'resource must be an array' },
  },
};

module.exports = { createRoleValidatorSchema, updateRoleValidatorSchema };
