const ArbitrageService = require('../services/arbitrageService');
const ResponseHandler = require('../utils/responseHandler');

class ArbitrageController {
  async getTickers(req, res) {
    const minutes = parseInt(req.query.minutes, 10) || 5;
    const data = await ArbitrageService.fetchTickers(minutes);
    return ResponseHandler.success(res, data);
  }

  async getOpportunities(req, res) {
    const minProfit = parseFloat(req.query.minProfit) || 1;
    const data = await ArbitrageService.queryOpportunities(minProfit);
    return ResponseHandler.success(res, data);
  }

  async getTickersByExchange(req, res) {
    const data = await ArbitrageService.queryTickersByExchange();
    return ResponseHandler.success(res, data);
  }

  async getTickersBySymbol(req, res) {
    const data = await ArbitrageService.queryTickersBySymbol();
    return ResponseHandler.success(res, data);
  }

  async getConfig(req, res) {
    const data = await ArbitrageService.getConfig(req.userId);
    return ResponseHandler.success(res, data);
  }

  async saveConfig(req, res) {
    const { exchanges, symbols } = req.body;
    const data = await ArbitrageService.saveConfig(req.userId, { exchanges, symbols });
    return ResponseHandler.success(res, data);
  }

  async getAllExchanges(req, res) {
    const data = ArbitrageService.getAllExchanges();
    return ResponseHandler.success(res, data);
  }

  async getAllSymbols(req, res) {
    const data = await ArbitrageService.getAllSymbols();
    return ResponseHandler.success(res, data);
  }

  async refreshSymbols(req, res) {
    const data = await ArbitrageService.refreshSymbols();
    return ResponseHandler.success(res, data);
  }

  async getCustomOpportunities(req, res) {
    const minProfit = parseFloat(req.query.minProfit) || 1;
    const exchanges = req.query.exchanges ? req.query.exchanges.split(',') : [];
    const symbols = req.query.symbols ? req.query.symbols.split(',') : [];
    const data = await ArbitrageService.queryCustomOpportunities(minProfit, exchanges, symbols);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new ArbitrageController();
