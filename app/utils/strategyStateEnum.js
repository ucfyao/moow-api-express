const STRATEGY_TYPE = {
    NORMAL: '1',
    CLOSED: '2',
    SOFT_DELETED: '3'
};

const DRAWDOWN_STATUS = {
    ENABLED: 'Y',
    DISABLED: 'N'
}

const AWAIT_STATUS = {
    WAITING: '1',
    COMPLETED: '2',
    PROCESSING: '3'
}

const AWAIT_SELL_TYPE = {
    AUTO_SELL: '1',
    DEL_INVEST: '2'
}

module.exports = { STRATEGY_TYPE, DRAWDOWN_STATUS, AWAIT_STATUS, AWAIT_SELL_TYPE };