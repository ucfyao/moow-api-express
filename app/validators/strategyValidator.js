const AipStrategyModel = require('../models/aipStrategyModel');

const createStrategyValidatorSchema = {
  user_market_id: {
    notEmpty: { errorMessage: 'user_market_id is required and cannot be empty' },
    isString: { errorMessage: 'user_market_id must be a string' },
  },
  exchange: {
    notEmpty: { errorMessage: 'exchange is required and cannot be empty' },
    isString: { errorMessage: 'exchange must be a string' },
  },
  key: {
    notEmpty: { errorMessage: 'key is required and cannot be empty' },
    isString: { errorMessage: 'key must be a string' },
  },
  secret: {
    notEmpty: { errorMessage: 'secret is required and cannot be empty' },
    isString: { errorMessage: 'secret must be a string' },
  },
  symbol: {
    notEmpty: { errorMessage: 'symbol is required and cannot be empty' },
    isString: { errorMessage: 'symbol must be a string' },
  },
  base: {
    notEmpty: { errorMessage: 'base is required and cannot be empty' },
    isString: { errorMessage: 'base must be a string' },
  },
  base_limit: {
    notEmpty: { errorMessage: 'base_limit is required and cannot be empty' },
    isNumeric: { errorMessage: 'base_limit must be a number' },
  },
  quote: {
    notEmpty: { errorMessage: 'quote is required and cannot be empty' },
    isString: { errorMessage: 'quote must be a string' },
  },
  type: {
    notEmpty: { errorMessage: 'type is required and cannot be empty' },
    isString: { errorMessage: 'type must be a string' },
  },
  period: {
    notEmpty: { errorMessage: 'period is required and cannot be empty' },
    isString: { errorMessage: 'period must be a string' },
  }, // Period type. 1: month, 2: day,3: week
  period_value: {
    notEmpty: { errorMessage: 'period_value is required and cannot be empty' },
    isArray: { errorMessage: 'period_value must be an array' },
    custom: {
      options: (value) => {
        if (value.length === 0) {
          return true; // Allow empty array
        }
        return value.every((item) => typeof item === 'number');
      },
      errorMessage: 'All items in period_value must be numbers',
    },
  }, // investment period
  stop_profit_percentage: {
    optional: true,
    custom: {
      options: (value) => value === undefined || typeof value === 'number',
      errorMessage: 'stop_profit_percentage must be a number if provided',
    },
  }, // can be empty
  drawdown: {
    optional: true,
    custom: {
      options: (value) => value === undefined || typeof value === 'number',
      errorMessage: 'drawdown must be a number if provided',
    },
  }, // can be empty
};

// Only allow these fields to be updated
const allowedUpdateFields = ['base_limit', 'period', 'period_value', 'stop_profit_percentage', 'drawdown', 'status'];
const updateStrategyValidatorSchema = {
  base_limit: {
    notEmpty: { errorMessage: 'base_limit is required and cannot be empty' },
    isNumeric: { errorMessage: 'base_limit must be a number' },
  },
  period: {
    notEmpty: { errorMessage: 'period is required and cannot be empty' },
    isString: { errorMessage: 'period must be a string' },
  }, // Period type. 1: month, 2: day,3: week
  period_value: {
    notEmpty: { errorMessage: 'period_value is required and cannot be empty' },
    isArray: { errorMessage: 'period_value must be an array' },
    custom: {
      options: (value) => {
        if (value.length === 0) {
          return true; // Allow empty array
        }
        return value.every((item) => typeof item === 'number');
      },
      errorMessage: 'All items in period_value must be numbers',
    },
  }, // investment period
  stop_profit_percentage: {
    optional: true,
    custom: {
      options: (value) => value === undefined || typeof value === 'number',
      errorMessage: 'stop_profit_percentage must be a number if provided',
    },
  }, // can be empty
  drawdown: {
    optional: true,
    custom: {
      options: (value) => value === undefined || typeof value === 'number',
      errorMessage: 'drawdown must be a number if provided',
    },
  }, // can be empty
  status: {
    optional: true,
    isIn: {
      options: [[AipStrategyModel.STRATEGY_STATUS_NORMAL,  AipStrategyModel.STRATEGY_STATUS_CLOSED]],
      errorMessage: `status must be ${AipStrategyModel.STRATEGY_STATUS_NORMAL} or ${AipStrategyModel.STRATEGY_STATUS_CLOSED} if provided`,
    },
  },
  customValidation: {
    custom: {
      options: (value, { req }) => {
        const keys = Object.keys(req.body);
        keys.forEach(key => {
          if (!allowedUpdateFields.includes(key)) {
            throw new Error(`Field ${key} is not allowed to be updated`);
          }
        });
        return true;
      },
    },
  },
};

module.exports = { createStrategyValidatorSchema, updateStrategyValidatorSchema };
