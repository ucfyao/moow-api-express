const updateStrategyValidatorSchema = {
      
      _id: {
            notEmpty: { errorMessage: 'id is required' },
            isString: { errorMessage: 'id must be a tring' }
      },
      type: { 
            notEmpty: { errorMessage: 'type is optional' },
            isString: { errorMessage: 'type must be a tring' }
      },
      period: {
            notEmpty: { errorMessage: 'period is optional' },
            isString: { errorMessage: 'period must be a tring' }
      },
      period_value: {
            isArray: { errorMessage: 'period_value string must be an array' },
            custom: {
                  options: (value) => {
                        if (value.length === 0) {
                              return true; // Allow empty array
                        }
                        return value.every(item => typeof item === 'number');
                  },
                  errorMessage: 'All items in period_value must be numbers'
            }
      },
  user_market_id: { 
        optional: true,
        notEmpty: { errorMessage: 'user_market_id is optional' },
        isString: { errorMessage: 'user_market_id must be a tring' }
  },
  key: { 
        optional: true,
        notEmpty: { errorMessage: 'key is optional' },
        isString: { errorMessage: 'key must be a tring' }
  },
  secret: { 
        optional: true,
        notEmpty: { errorMessage: 'secret is optional' },
        isString: { errorMessage: 'secret must be a tring' }
  },
  symbol: { 
        optional: true,
        notEmpty: { errorMessage: 'symbol is optional' },
        isString: { errorMessage: 'symbol must be a tring' }
  },
  exchange: { 
        optional: true,
        notEmpty: { errorMessage: 'exchange is optional' },
        isString: { errorMessage: 'exchange must be a tring' }
  },
      status: { 
        notEmpty: { errorMessage: 'status is optional' },
        isString: { errorMessage: 'status must be a tring' }
  },
  stop_reason: { 
        optional: true,
        isString: { errorMessage: 'stop reason must be a tring' }
  },
  start_at: {
        optional: true,
        isDate: { errorMessage: 'start time must be a date' },
        isString: { errorMessage: 'start time must be a tring' }
  },
  end_at: { 
        optional: true,
        isDate: { errorMessage: 'end time must be a date' },
        isString: { errorMessage: 'end time must be a tring' }
    }
}

module.exports = { updateStrategyValidatorSchema };