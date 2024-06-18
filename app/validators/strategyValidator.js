const createStrategyValidatorSchema = {

    type: { 
        notEmpty: { errorMessage: 'type is required and cannot be empty' },
        isString: { errorMessage: 'type must be a string' }
    },
    period: { 
        notEmpty: { errorMessage: 'period is required and cannot be empty' },
        isString: { errorMessage: 'period must be a string' }
    }, // Period type. 1: month, 2: day,3: week
    period_value: { 
        optional: { nullable: true }, //allow empty and optional
        isArray: { errorMessage: 'period_value must be an array' },
        custom: {
            options: (value) => {
                if (value.length === 0) {
                    return true; // Allow empty array
                }
                return value.every(item => typeof item === 'number');
            },
            errorMessage: 'All items in period_value must be numbers'
        }
    }, // investment period
    user_market_id: { 
        notEmpty: { errorMessage: 'user_market_id is required and cannot be empty' },
        isString: { errorMessage: 'user_market_id must be a string' }
    },
    key: { 
        optional: true,
        isString: { errorMessage: 'key must be a string' }
    },
    secret: { 
        optional: true,
        isString: { errorMessage: 'secret must be a string' }
    },

    symbol: { 
        notEmpty: { errorMessage: 'symbol is required and cannot be empty' },
        isString: { errorMessage: 'symbol must be a string' }
    },
    exchange: { 
        optional: true,
        isString: { errorMessage: 'exchange must be a string' }
    },

    status: { 
        optional: true,
        isString: { errorMessage: 'status must be a string' }
    },
    stop_reason: { 
        optional: { nullable: true }, //allow empty and optional
        isString: { errorMessage: 'stop reason must be a string' }
    },
    start_at: {
        optional: { nullable: true },
        isString: { errorMessage: 'start time must be a string' }
    },
    end_at: { 
        optional: { nullable: true },
        isString: { errorMessage: 'end time must be a string' }
    }
};

const updateStrategyValidatorSchema = {
    type: {
        optional: true,
        isString: { errorMessage: 'type must be s string' }
    },
    period: {
        optional: true,
        isString: { errorMessage: 'period must be s string' }
    },
    period_value: {
        optional: { nullable: true }, //allow empty and optional
        isArray: { errorMessage: 'period_value must be an array' },
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
        isString: { errorMessage: 'user_market_id must be s string' }
    },
    key: {
        optional: true,
        isString: { errorMessage: 'key must be s string' }
    },
    secret: {
        optional: true,
        isString: { errorMessage: 'secret must be s string' }
    },
    symbol: {
        optional: true,
        isString: { errorMessage: 'symbol must be s string' }
    },
    exchange: {
        optional: true,
        isString: { errorMessage: 'exchange must be s string' }
    },
    status: {
        optional: true,
        isString: { errorMessage: 'status must be s string' }
    },
    stop_reason: {
        optional: { nullable: true },
        isString: { errorMessage: 'stop reason must be s string' }
    },
    start_at: {
        optional: { nullable: true },
        isString: { errorMessage: 'start time must be s string' }
    },
    end_at: {
        optional: { nullable: true },
        isString: { errorMessage: 'end time must be s string' }
    }
}

module.exports = { createStrategyValidatorSchema, updateStrategyValidatorSchema };