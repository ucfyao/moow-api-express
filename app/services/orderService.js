const Order = require('../models/orderModel');
const Strategy = require('../models/strategyModel');
const { decrypt } = require('../utils/cryptoUtils');
const ccxt = require('ccxt');

class OrderService {

    async getAllOrders(strategy_id) {
        const pageNumber = 1;
        const pageSize = 9999;
        const list = await Order.find({ strategy_id: strategy_id }).sort({ createdAt: 1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();
        return { list };
    }

    async buyNewOrder(strategy_id) {
        const strategy = await Strategy.findById(strategy_id);
        const secret = await decrypt(strategy.secret);
        const exchange = new ccxt[strategy.exchange]({
            'apiKey': strategy.key,
            'secret': secret,
            timeout: 60000,
        });
    
        const type = 'market';
        const side = 'buy';
        const ticker = await exchange.fetchTicker(strategy.symbol);
        const price = ticker.ask;

        const markets = await exchange.loadMarkets();
        const market = markets[strategy.symbol];
        const precision = market.market.precision.amount;
        //TODO: make sure to reach the minimum amount and prize

        let amount = 0;
        // Fetch the current price, calculate purchase amount this time by type
        if (strategy.type === '1') {
            amount = (strategy.base_limit / price).toFixed(precision);
        } else {
            amount = valueAveraging(strategy).toFixed(precision);
            if (amount <= 0) {
                return false;
            }
        }

        const balance = await exchange.fetchBalance();
        // console.log(balance);
        const in_params = {};
        const orderRes = exchange.createOrder(strategy.symbol, type, side, amount, price, in_params);

        const buy_times = strategy.buy_times + 1;
        const now_buy_times = strategy.now_buy_times + 1;
        const inOrder = {
            strategy_id: strategy._id,
            order_id: orderRes.id,
            type,
            side,
            price,
            amount,
            symbol:strategy.symbol,
            funds: strategy.base_limit,
            avg_price: 0,
            deal_amount: 0,
            cost: 0,
            status: 'open',
            mid: strategy.user_market_id,
            record_amount: 0,
            record_cost: 0,
            buy_times,
            now_buy_times,
            quote_total: strategy.quote_total,
            value_total: strategy.quote_total * price,
            base_total: strategy.base_total,
    
            now_base_total: strategy.now_base_total,
            now_quote_total: strategy.now_quote_total,
            pl_created_at: Date.now(),
            created_at: Date.now(),
        };

        await new Order(inOrder).save();
        strategy.buy_times = buy_times;
        strategy.now_buy_times = now_buy_times;
        await strategy.save();

        return { order_id: order_id }
    }

}

module.exports = new OrderService();