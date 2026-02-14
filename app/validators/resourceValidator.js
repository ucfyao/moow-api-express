const createResourceValidatorSchema = {
  resource_code: {
    notEmpty: { errorMessage: 'resource_code is required' },
    isString: { errorMessage: 'resource_code must be a string' },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'resource_code must be 2-100 characters',
    },
  },
  resource_name: {
    notEmpty: { errorMessage: 'resource_name is required' },
    isString: { errorMessage: 'resource_name must be a string' },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'resource_name must be 2-100 characters',
    },
  },
  resource_type: {
    notEmpty: { errorMessage: 'resource_type is required' },
    isIn: {
      options: [['group', 'menu', 'interface']],
      errorMessage: 'resource_type must be group, menu, or interface',
    },
  },
};

const updateResourceValidatorSchema = {
  resource_code: {
    optional: true,
    isString: { errorMessage: 'resource_code must be a string' },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'resource_code must be 2-100 characters',
    },
  },
  resource_name: {
    optional: true,
    isString: { errorMessage: 'resource_name must be a string' },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'resource_name must be 2-100 characters',
    },
  },
  resource_type: {
    optional: true,
    isIn: {
      options: [['group', 'menu', 'interface']],
      errorMessage: 'resource_type must be group, menu, or interface',
    },
  },
};

module.exports = { createResourceValidatorSchema, updateResourceValidatorSchema };
