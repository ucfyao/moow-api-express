const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({

    strategy_id: { type: String, trim: true }, // Strategy id
    order_id: { type: String, trim: true }, // Order id
    type: { type: String, trim: true }, // Order category
    price: { type: String, trim: true }, // Order price
    side: { type: String, trim: true }, // Transaction type: sell, buy
    amount: { type: String, trim: true }, // Order quantity
    funds: { type: String, trim: true }, // Order amount
    avg_price: { type: String, trim: true }, // Average transaction price
    deal_amount: { type: String, trim: true }, // Actual transaction quantity
    cost: { type: String, trim: true }, // Total transaction cost
    status: { type: String, trim: true }, // Order status
    symbol: { type: String, trim: true }, // Trading symbol
    orders_id: { type: String, trim: true }, // Order sub-id
    mid: { type: String, trim: true }, // Market id
    record_amount: { type: String, trim: true }, // Recorded coin amount
    record_cost: { type: String, trim: true }, // Recorded cost
    pl_create_at: { type: String, trim: true }, // Order time
    buy_times: { type: Number, default: 0 }, // Number of times purchased
    now_buy_times: { type: Number, default: 0 }, // Number of times purchased in this round
    sell_times:{ type: Number, default: 0 }, // Number of times sold
    base_total: { type: Number, default: 0 }, // Total fiat amount after cumulative purchases
    quote_total: { type: Number, default: 0 }, //Total coin amount after cumulative purchases
    value_total: { type: Number, default: 0 }, // Total value after this purchase
    now_base_total: { type: Number, default: 0 }, // Current total fiat amount
    now_quote_total: { type: Number, default: 0 }, // Current total coin amount
    profit: { type: Number, default: 0 }, // Current profit after purchase
    profit_percentage: { type: Number, default: 0 }, // Current profit percentage after purchase

  }, {
      timestamps: true, // Automatically adds createdAt and updatedAt fields
      collection: 'aip_orders',
  });

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;

