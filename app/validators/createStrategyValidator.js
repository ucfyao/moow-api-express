const createStrategyValidatorSchema = {
    _id: { 
        format: app.regex.objectId 
    },
    type: { 
        type: 'string', required: false 
    },
    period: { 
        type: 'string', required: false 
    }, // Period type. 1: month, 2: day,3: week
    period_value: { 
        type: 'array', itemType: 'number', allowEmpty: true, required: false 
    }, // investment period
    user_market_id: { 
        type: 'string', required: false 
    },
    key: { 
        type: 'string', required: false 
    },
    secret: { 
        type: 'string', required: false 
    },

    symbol: { 
        type: 'string', required: false 
    },
    exchange: { 
        type: 'string', required: false 
    },
    status: { 
        type: 'string', required: false 
    },
    stop_reason: { 
        type: 'string', allowEmpty: true, required: false 
    },
    start_at: { 
        type: 'string', allowEmpty: true, required: false 
    },
    end_at: { 
        type: 'string', allowEmpty: true, required: false 
    },
}
module.exports = { createStrategyValidatorSchema };