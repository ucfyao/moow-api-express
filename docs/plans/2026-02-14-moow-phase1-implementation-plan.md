# Moow Phase 1 Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the arbitrage (搬砖) module from Egg.js to Express and complete the remaining 10% of the DCA (定投) module, running both tracks in parallel.

**Architecture:** Two parallel tracks — Track A (Arbitrage, 0→100%) and Track B (DCA completion, 90→100%). Each track follows backend-first: Models → Status Codes → Service → Validator → Controller → Routes → Scheduler → Tests → Frontend. All backend code lives in moow-api-express (Express 5 + Mongoose 8), frontend in moow-web-next (Next.js 15 + React 19).

**Tech Stack:** Express 5, Mongoose 8, CCXT 4, node-cron, Jest 30, Next.js 15, React 19, Bulma, Emotion CSS, Highcharts, react-i18next

**Design Doc:** `docs/plans/2026-02-14-moow-phase1-migration-design.md`

---

## Track A: Arbitrage Module (搬砖)

### Task A1: Add Arbitrage Status Codes

**Files:**
- Modify: `app/utils/statusCodes.js`

**Step 1: Add arbitrage status codes to STATUS_TYPE**

Add after the `// Custom status codes for data module` section (after line 81):

```javascript
  // Custom status codes for arbitrage module (15001-16000)
  ARBITRAGE_CONFIG_NOT_FOUND: 15001, // Arbitrage config not found
  ARBITRAGE_EXCHANGE_LOAD_FAILED: 15002, // Failed to load exchange markets
  ARBITRAGE_CACHE_NOT_FOUND: 15003, // Symbol cache not found
```

**Step 2: Add Chinese messages to STATUS_MESSAGE_ZH**

After the asset module messages block:

```javascript
  // Arbitrage module messages
  [STATUS_TYPE.ARBITRAGE_CONFIG_NOT_FOUND]: '套利配置未找到',
  [STATUS_TYPE.ARBITRAGE_EXCHANGE_LOAD_FAILED]: '交易所市场数据加载失败',
  [STATUS_TYPE.ARBITRAGE_CACHE_NOT_FOUND]: '交易对缓存未找到',
```

**Step 3: Add English messages to STATUS_MESSAGE**

After the asset module messages block:

```javascript
  // Arbitrage module messages
  [STATUS_TYPE.ARBITRAGE_CONFIG_NOT_FOUND]: 'Arbitrage config not found',
  [STATUS_TYPE.ARBITRAGE_EXCHANGE_LOAD_FAILED]: 'Failed to load exchange markets',
  [STATUS_TYPE.ARBITRAGE_CACHE_NOT_FOUND]: 'Symbol cache not found',
```

**Step 4: Commit**

```bash
git add app/utils/statusCodes.js
git commit -m "feat: add arbitrage module status codes (15001-16000)"
```

---

### Task A2: Create Arbitrage MongoDB Models

**Files:**
- Create: `app/models/arbitrageTickerModel.js`
- Create: `app/models/arbitrageConfigModel.js`
- Create: `app/models/arbitrageCacheModel.js`

**Step 1: Create ArbitrageTickerModel**

```javascript
const mongoose = require('mongoose');

const ArbitrageTickerSchema = new mongoose.Schema(
  {
    exchange: { type: String, required: true, trim: true }, // CCXT exchange id (e.g. "binance")
    symbol: { type: String, required: true, trim: true }, // Trading pair (e.g. "BTC/USDT")
    ticker: {
      exchange: { type: String, trim: true },
      symbol: { type: String, trim: true },
      timestamp: { type: Number },
      datetime: { type: String, trim: true },
      high: { type: Number },
      low: { type: Number },
      bid: { type: Number }, // current best bid (buy) price
      bidVolume: { type: Number },
      ask: { type: Number }, // current best ask (sell) price
      askVolume: { type: Number },
      vwap: { type: Number },
      open: { type: Number },
      close: { type: Number },
      last: { type: Number },
      previousClose: { type: Number },
      change: { type: Number },
      percentage: { type: String },
      average: { type: Number },
      baseVolume: { type: Number },
      quoteVolume: { type: Number },
      info: { type: mongoose.Schema.Types.Mixed },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'arbitrage_tickers',
  },
);

ArbitrageTickerSchema.index({ exchange: 1, symbol: 1 }, { unique: true });
ArbitrageTickerSchema.index({ updated_at: -1 });

module.exports = mongoose.model('ArbitrageTicker', ArbitrageTickerSchema);
```

**Step 2: Create ArbitrageConfigModel**

```javascript
const mongoose = require('mongoose');

const ArbitrageConfigSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser', default: null },
    exchanges: [{ type: String, trim: true }],
    symbols: [{ type: String, trim: true }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'arbitrage_configs',
  },
);

ArbitrageConfigSchema.index({ user_id: 1 });

module.exports = mongoose.model('ArbitrageConfig', ArbitrageConfigSchema);
```

**Step 3: Create ArbitrageCacheModel**

```javascript
const mongoose = require('mongoose');

const ArbitrageCacheSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    content: [{ type: String }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'arbitrage_caches',
  },
);

module.exports = mongoose.model('ArbitrageCache', ArbitrageCacheSchema);
```

**Step 4: Commit**

```bash
git add app/models/arbitrageTickerModel.js app/models/arbitrageConfigModel.js app/models/arbitrageCacheModel.js
git commit -m "feat: add arbitrage MongoDB models (ticker, config, cache)"
```

---

### Task A3: Create ArbitrageService

**Files:**
- Create: `app/services/arbitrageService.js`

**Step 1: Write the service**

```javascript
const _ = require('lodash');
const ccxt = require('ccxt');
const ArbitrageTickerModel = require('../models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../models/arbitrageConfigModel');
const ArbitrageCacheModel = require('../models/arbitrageCacheModel');
const logger = require('../utils/logger');

class ArbitrageService {
  /**
   * Get tickers updated within the last N minutes
   * @param {number} minutes - Time window in minutes (default: 5)
   */
  async fetchTickers(minutes = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const tickers = await ArbitrageTickerModel.find({ updated_at: { $gt: cutoff } }).lean();
    return { tickers };
  }

  /**
   * Find arbitrage opportunities where diff > minProfit%
   * Algorithm: For each symbol, find max(bids) and min(asks) across exchanges.
   * diff = (maxBid - minAsk) / minAsk * 100
   */
  async queryOpportunities(minProfit = 1) {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const list = await ArbitrageTickerModel.aggregate([
      { $match: { updated_at: { $gt: cutoff } } },
      { $group: { _id: '$symbol', tickers: { $push: '$ticker' } } },
    ]);

    const arbitrageList = [];
    list.forEach((item) => {
      if (!item.tickers || item.tickers.length < 2) return;

      let lowest = item.tickers[0]; // min(asks) — buy from here
      let highest = item.tickers[0]; // max(bids) — sell to here

      for (const t of item.tickers) {
        if (t.ask > 0 && (lowest.ask <= 0 || t.ask < lowest.ask)) {
          lowest = t;
        }
        if (t.bid > 0 && t.bid > highest.bid) {
          highest = t;
        }
      }

      if (lowest.ask <= 0) return;
      const diff = ((highest.bid - lowest.ask) / lowest.ask) * 100;

      if (highest.exchange !== lowest.exchange && diff > minProfit) {
        arbitrageList.push({
          symbol: item._id,
          from: lowest,
          to: highest,
          rawdiff: diff,
          diff: diff.toFixed(2),
        });
      }
    });

    return {
      list: arbitrageList.sort((a, b) => b.rawdiff - a.rawdiff),
    };
  }

  /**
   * Group tickers by exchange
   */
  async queryTickersByExchange() {
    const list = await ArbitrageTickerModel.aggregate([
      { $group: { _id: '$exchange', tickers: { $push: '$ticker' } } },
    ]);
    return { list };
  }

  /**
   * Group tickers by symbol
   */
  async queryTickersBySymbol() {
    const list = await ArbitrageTickerModel.aggregate([
      { $group: { _id: '$symbol', tickers: { $push: '$ticker' } } },
    ]);
    return { list };
  }

  /**
   * Get arbitrage config. If userId provided, return user config; otherwise global config (user_id=null).
   */
  async getConfig(userId = null) {
    const config = await ArbitrageConfigModel.findOne({ user_id: userId }).lean();
    return { config: config || { exchanges: [], symbols: [] } };
  }

  /**
   * Save arbitrage config (upsert by user_id)
   */
  async saveConfig(userId = null, { exchanges, symbols }) {
    const config = await ArbitrageConfigModel.findOneAndUpdate(
      { user_id: userId },
      { exchanges, symbols },
      { upsert: true, new: true },
    );
    return { config };
  }

  /**
   * Return all CCXT supported exchange ids
   */
  getAllExchanges() {
    return { allExchanges: ccxt.exchanges };
  }

  /**
   * Get cached symbols from arbitrage_caches
   */
  async getAllSymbols() {
    const cache = await ArbitrageCacheModel.findOne({ name: 'allSymbols' }).lean();
    return { allSymbols: cache ? cache.content : [] };
  }

  /**
   * Refresh symbols by loading markets from all configured exchanges
   */
  async refreshSymbols() {
    const config = await ArbitrageConfigModel.findOne({ user_id: null }).lean();
    if (!config || !config.exchanges || config.exchanges.length === 0) {
      return { allSymbols: [] };
    }

    const allSymbols = [];
    for (const exchangeId of config.exchanges) {
      try {
        const exchange = new ccxt[exchangeId]({ timeout: 10000 });
        await exchange.loadMarkets();
        allSymbols.push(...exchange.symbols);
        logger.info(`[refreshSymbols] ${exchangeId} loaded ${exchange.symbols.length} symbols`);
      } catch (e) {
        logger.error(`[refreshSymbols] ${exchangeId} failed: ${e.message}`);
      }
    }

    const uniqueSymbols = _.uniq(allSymbols);
    await ArbitrageCacheModel.findOneAndUpdate(
      { name: 'allSymbols' },
      { content: uniqueSymbols },
      { upsert: true },
    );

    return { allSymbols: uniqueSymbols };
  }
}

module.exports = new ArbitrageService();
```

**Step 2: Commit**

```bash
git add app/services/arbitrageService.js
git commit -m "feat: add ArbitrageService with opportunity detection and config management"
```

---

### Task A4: Create Arbitrage Validator

**Files:**
- Create: `app/validators/arbitrageValidator.js`

**Step 1: Write the validator**

```javascript
const saveConfigValidatorSchema = {
  exchanges: {
    isArray: { errorMessage: 'exchanges must be an array' },
    notEmpty: { errorMessage: 'exchanges is required and cannot be empty' },
  },
  symbols: {
    isArray: { errorMessage: 'symbols must be an array' },
    notEmpty: { errorMessage: 'symbols is required and cannot be empty' },
  },
};

module.exports = { saveConfigValidatorSchema };
```

**Step 2: Commit**

```bash
git add app/validators/arbitrageValidator.js
git commit -m "feat: add arbitrage input validators"
```

---

### Task A5: Create Arbitrage Controller

**Files:**
- Create: `app/controllers/arbitrageController.js`

**Step 1: Write the controller**

```javascript
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
}

module.exports = new ArbitrageController();
```

**Step 2: Commit**

```bash
git add app/controllers/arbitrageController.js
git commit -m "feat: add ArbitrageController for all arbitrage endpoints"
```

---

### Task A6: Create Arbitrage Routes

**Files:**
- Create: `app/routes/arbitrageRoutes.js`

**Step 1: Write the routes**

```javascript
const express = require('express');
const ArbitrageController = require('../controllers/arbitrageController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateParams } = require('../middlewares/validateMiddleware');
const { saveConfigValidatorSchema } = require('../validators/arbitrageValidator');

const router = express.Router();

// --- Public routes (no auth required) ---

/**
 * @swagger
 * /api/v1/arbitrage/tickers:
 *   get:
 *     summary: Get recent ticker data
 *     tags:
 *       - Arbitrage
 *     parameters:
 *       - in: query
 *         name: minutes
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Time window in minutes
 *     responses:
 *       200:
 *         description: Ticker data
 */
router.get('/api/v1/arbitrage/tickers', ArbitrageController.getTickers);

/**
 * @swagger
 * /api/v1/arbitrage/opportunities:
 *   get:
 *     summary: Get arbitrage opportunities
 *     tags:
 *       - Arbitrage
 *     parameters:
 *       - in: query
 *         name: minProfit
 *         schema:
 *           type: number
 *           default: 1
 *         description: Minimum profit percentage
 *     responses:
 *       200:
 *         description: Arbitrage opportunity list sorted by diff% descending
 */
router.get('/api/v1/arbitrage/opportunities', ArbitrageController.getOpportunities);

/**
 * @swagger
 * /api/v1/arbitrage/tickers/by-exchange:
 *   get:
 *     summary: Get tickers grouped by exchange
 *     tags:
 *       - Arbitrage
 */
router.get('/api/v1/arbitrage/tickers/by-exchange', ArbitrageController.getTickersByExchange);

/**
 * @swagger
 * /api/v1/arbitrage/tickers/by-symbol:
 *   get:
 *     summary: Get tickers grouped by symbol
 *     tags:
 *       - Arbitrage
 */
router.get('/api/v1/arbitrage/tickers/by-symbol', ArbitrageController.getTickersBySymbol);

// --- Protected routes (auth required) ---

/**
 * @swagger
 * /api/v1/arbitrage/config:
 *   get:
 *     summary: Get user's arbitrage config
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.get('/api/v1/arbitrage/config', authMiddleware, ArbitrageController.getConfig);

/**
 * @swagger
 * /api/v1/arbitrage/config:
 *   put:
 *     summary: Save user's arbitrage config
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.put(
  '/api/v1/arbitrage/config',
  authMiddleware,
  validateParams(saveConfigValidatorSchema),
  ArbitrageController.saveConfig,
);

/**
 * @swagger
 * /api/v1/arbitrage/exchanges:
 *   get:
 *     summary: Get all CCXT supported exchanges
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.get('/api/v1/arbitrage/exchanges', authMiddleware, ArbitrageController.getAllExchanges);

/**
 * @swagger
 * /api/v1/arbitrage/symbols:
 *   get:
 *     summary: Get cached symbols
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.get('/api/v1/arbitrage/symbols', authMiddleware, ArbitrageController.getAllSymbols);

/**
 * @swagger
 * /api/v1/arbitrage/symbols/refresh:
 *   post:
 *     summary: Refresh symbol cache from exchanges
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.post('/api/v1/arbitrage/symbols/refresh', authMiddleware, ArbitrageController.refreshSymbols);

module.exports = router;
```

**Step 2: Add Arbitrage tag to routes/index.js Swagger tags**

In `app/routes/index.js`, add to the JSDoc tags list:

```javascript
 *   - name: Arbitrage
 *     description: API endpoints for arbitrage opportunity detection and configuration
```

**Step 3: Commit**

```bash
git add app/routes/arbitrageRoutes.js app/routes/index.js
git commit -m "feat: add arbitrage API routes (public tickers + protected config)"
```

---

### Task A7: Create Ticker Scheduler

**Files:**
- Create: `app/schedulers/tickerScheduler.js`

**Step 1: Write the scheduler**

```javascript
const cron = require('node-cron');
const ccxt = require('ccxt');
const ArbitrageTickerModel = require('../models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../models/arbitrageConfigModel');
const logger = require('../utils/logger');

const DEFAULT_EXCHANGES = ['binance', 'huobi', 'okx'];
const DEFAULT_SYMBOLS = ['BTC/USDT', 'ETH/USDT'];
const MAX_ERRORS = 3;

let isRunning = false;

const tickerScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (isRunning) {
      logger.info('[tickerScheduler] Previous execution still running, skipping');
      return;
    }
    isRunning = true;
    try {
      logger.info(`[tickerScheduler] Starting ticker fetch at ${new Date().toISOString()}`);
      await fetchAllTickers();
    } catch (error) {
      logger.error(`[tickerScheduler] Error: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });
};

const exchangeInstances = {};
const errorCounts = {};

async function fetchAllTickers() {
  const start = Date.now();

  // Load config (global config where user_id is null)
  const config = await ArbitrageConfigModel.findOne({ user_id: null }).lean();
  const exchanges = config?.exchanges?.length ? config.exchanges : DEFAULT_EXCHANGES;
  const symbols = config?.symbols?.length ? config.symbols : DEFAULT_SYMBOLS;

  for (const exchangeId of exchanges) {
    // Skip exchanges that exceeded error threshold
    if ((errorCounts[exchangeId] || 0) >= MAX_ERRORS) {
      continue;
    }

    // Create or reuse exchange instance
    if (!exchangeInstances[exchangeId] || !exchangeInstances[exchangeId].markets) {
      try {
        exchangeInstances[exchangeId] = new ccxt[exchangeId]({ timeout: 5000 });
        await exchangeInstances[exchangeId].loadMarkets();
        logger.info(`[tickerScheduler] Loaded exchange: ${exchangeId}`);
      } catch (e) {
        logger.error(`[tickerScheduler] Failed to load ${exchangeId}: ${e.message}`);
        errorCounts[exchangeId] = (errorCounts[exchangeId] || 0) + 1;
        continue;
      }
    }

    const exchange = exchangeInstances[exchangeId];

    for (const symbol of symbols) {
      if (!(symbol in exchange.markets)) continue;

      try {
        const ticker = await exchange.fetchTicker(symbol);
        if (!ticker.open) ticker.open = 0;
        Object.assign(ticker, { exchange: exchange.id });

        await ArbitrageTickerModel.findOneAndUpdate(
          { exchange: exchange.id, symbol },
          { ticker },
          { upsert: true },
        );

        // Reset error count on success
        errorCounts[exchangeId] = 0;
      } catch (e) {
        errorCounts[exchangeId] = (errorCounts[exchangeId] || 0) + 1;
        logger.error(`[tickerScheduler] ${exchangeId} ${symbol}: ${e.message}`);

        if (errorCounts[exchangeId] >= MAX_ERRORS) {
          delete exchangeInstances[exchangeId];
          logger.error(`[tickerScheduler] ${exchangeId} exceeded ${MAX_ERRORS} errors, removed`);
          break;
        }
      }
    }
  }

  // Clean old tickers (older than 30 minutes)
  const cleanupCutoff = new Date(Date.now() - 30 * 60 * 1000);
  await ArbitrageTickerModel.deleteMany({ updated_at: { $lt: cleanupCutoff } });

  logger.info(`[tickerScheduler] Round completed in ${Date.now() - start}ms`);
}

module.exports = tickerScheduler;
```

**Step 2: Commit**

```bash
git add app/schedulers/tickerScheduler.js
git commit -m "feat: add ticker scheduler (every 5 min, fetches prices via CCXT)"
```

---

### Task A8: Write Arbitrage Backend Tests

**Files:**
- Create: `tests/unit/services/arbitrageService.test.js`
- Create: `tests/integration/arbitrage.test.js`

**Step 1: Write unit tests**

```javascript
jest.mock('../../../app/models/arbitrageTickerModel');
jest.mock('../../../app/models/arbitrageConfigModel');
jest.mock('../../../app/models/arbitrageCacheModel');

const ArbitrageTickerModel = require('../../../app/models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../../../app/models/arbitrageConfigModel');
const ArbitrageCacheModel = require('../../../app/models/arbitrageCacheModel');
const ArbitrageService = require('../../../app/services/arbitrageService');

describe('ArbitrageService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('fetchTickers()', () => {
    it('should return tickers within time window', async () => {
      const mockTickers = [
        { exchange: 'binance', symbol: 'BTC/USDT', ticker: { bid: 50000, ask: 50100 } },
      ];
      ArbitrageTickerModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTickers),
      });

      const result = await ArbitrageService.fetchTickers(5);

      expect(result.tickers).toHaveLength(1);
      expect(ArbitrageTickerModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ updated_at: expect.any(Object) }),
      );
    });
  });

  describe('queryOpportunities()', () => {
    it('should find arbitrage when diff > minProfit', async () => {
      ArbitrageTickerModel.aggregate.mockResolvedValue([
        {
          _id: 'BTC/USDT',
          tickers: [
            { exchange: 'binance', bid: 50000, ask: 49900 },
            { exchange: 'huobi', bid: 50600, ask: 50500 },
          ],
        },
      ]);

      const result = await ArbitrageService.queryOpportunities(1);

      expect(result.list.length).toBeGreaterThan(0);
      expect(result.list[0].symbol).toBe('BTC/USDT');
      expect(result.list[0].from.exchange).toBe('binance');
      expect(result.list[0].to.exchange).toBe('huobi');
    });

    it('should return empty list when diff < minProfit', async () => {
      ArbitrageTickerModel.aggregate.mockResolvedValue([
        {
          _id: 'BTC/USDT',
          tickers: [
            { exchange: 'binance', bid: 50000, ask: 49999 },
            { exchange: 'huobi', bid: 50001, ask: 50000 },
          ],
        },
      ]);

      const result = await ArbitrageService.queryOpportunities(1);

      expect(result.list).toHaveLength(0);
    });
  });

  describe('getConfig()', () => {
    it('should return user config', async () => {
      const mockConfig = { exchanges: ['binance'], symbols: ['BTC/USDT'] };
      ArbitrageConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockConfig),
      });

      const result = await ArbitrageService.getConfig('user123');

      expect(result.config.exchanges).toEqual(['binance']);
    });

    it('should return empty config if none exists', async () => {
      ArbitrageConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await ArbitrageService.getConfig('user123');

      expect(result.config).toEqual({ exchanges: [], symbols: [] });
    });
  });

  describe('saveConfig()', () => {
    it('should upsert config', async () => {
      const mockConfig = { exchanges: ['binance'], symbols: ['BTC/USDT'] };
      ArbitrageConfigModel.findOneAndUpdate.mockResolvedValue(mockConfig);

      const result = await ArbitrageService.saveConfig('user123', mockConfig);

      expect(ArbitrageConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { user_id: 'user123' },
        mockConfig,
        { upsert: true, new: true },
      );
    });
  });

  describe('getAllExchanges()', () => {
    it('should return ccxt exchanges list', () => {
      const result = ArbitrageService.getAllExchanges();
      expect(result.allExchanges).toBeInstanceOf(Array);
      expect(result.allExchanges.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run unit tests**

Run: `cd /Users/zyao0693/Desktop/www/moow-api-express && npm test -- --testPathPatterns=unit/services/arbitrageService`
Expected: All tests PASS

**Step 3: Write integration tests**

```javascript
const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../helpers/db');
const app = require('../helpers/app');
const ArbitrageTickerModel = require('../../app/models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../../app/models/arbitrageConfigModel');
const ArbitrageCacheModel = require('../../app/models/arbitrageCacheModel');

jest.mock('../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

beforeAll(async () => {
  await connect();
});
afterAll(async () => {
  await closeDatabase();
});
afterEach(async () => {
  await clearDatabase();
});

describe('Arbitrage Public API', () => {
  describe('GET /api/v1/arbitrage/tickers', () => {
    it('should return recent tickers', async () => {
      await ArbitrageTickerModel.create({
        exchange: 'binance',
        symbol: 'BTC/USDT',
        ticker: { exchange: 'binance', symbol: 'BTC/USDT', bid: 50000, ask: 50100 },
      });

      const res = await request(app).get('/api/v1/arbitrage/tickers');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.tickers).toHaveLength(1);
    });
  });

  describe('GET /api/v1/arbitrage/opportunities', () => {
    it('should return opportunities sorted by diff descending', async () => {
      await ArbitrageTickerModel.create([
        {
          exchange: 'binance',
          symbol: 'BTC/USDT',
          ticker: { exchange: 'binance', bid: 50000, ask: 49900 },
        },
        {
          exchange: 'huobi',
          symbol: 'BTC/USDT',
          ticker: { exchange: 'huobi', bid: 50600, ask: 50500 },
        },
      ]);

      const res = await request(app).get('/api/v1/arbitrage/opportunities?minProfit=1');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 4: Run integration tests**

Run: `cd /Users/zyao0693/Desktop/www/moow-api-express && npm test -- --testPathPatterns=integration/arbitrage`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add tests/unit/services/arbitrageService.test.js tests/integration/arbitrage.test.js
git commit -m "test: add arbitrage unit and integration tests"
```

---

### Task A9: Create Arbitrage Frontend Page

**Files:**
- Create: `moow-web-next/src/app/arbitrage/page.tsx`

**Step 1: Write the arbitrage page**

```tsx
/** @jsxImportSource @emotion/react */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import HTTP from '@/lib/http';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const arbitrageStyle = css`
  .container {
    margin-top: 40px;
    margin-bottom: 60px;
    max-width: 1344px;
  }

  .filter-bar {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .filter-bar .field {
    margin-bottom: 0;
  }

  .table {
    font-size: 0.85rem;
  }

  thead,
  th {
    background-color: #fafafa;
    color: #4f6475;
    font-weight: 400;
  }

  td {
    vertical-align: middle;
  }

  .diff-high {
    color: #23d160;
    font-weight: 600;
  }

  .diff-low {
    color: #ff3860;
  }

  .auto-refresh-label {
    font-size: 0.8rem;
    color: #999;
  }

  .loading-container {
    text-align: center;
    padding: 60px 0;
    color: #999;
  }
`;

interface Ticker {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
}

interface Opportunity {
  symbol: string;
  from: Ticker;
  to: Ticker;
  diff: string;
  rawdiff: number;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function ArbitragePage() {
  const { t } = useTranslation();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [minProfit, setMinProfit] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const fetchOpportunities = useCallback(async () => {
    try {
      const res: any = await HTTP.get('/v1/arbitrage/opportunities', {
        params: { minProfit },
      });
      if (res?.data?.list) {
        setOpportunities(res.data.list);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error: any) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error?.message || t('prompt.operation_failed'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [minProfit, t]);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  function getDiffClass(rawdiff: number): string {
    if (rawdiff >= 3) return 'diff-high';
    if (rawdiff < 0) return 'diff-low';
    return '';
  }

  return (
    <div css={arbitrageStyle} className="container">
      <section className="section">
        <div className="box">
          <h4 className="title is-4">{t('title.arbitrage_opportunities')}</h4>

          <div className="filter-bar">
            <div className="field">
              <label className="label is-small">{t('label.min_profit')} %</label>
              <div className="control">
                <input
                  className="input is-small"
                  type="number"
                  value={minProfit}
                  min={0}
                  step={0.5}
                  onChange={(e) => setMinProfit(parseFloat(e.target.value) || 0)}
                  style={{ width: '100px' }}
                />
              </div>
            </div>
            <div className="field">
              <label className="label is-small">&nbsp;</label>
              <button
                className="button is-small is-info"
                onClick={() => {
                  setLoading(true);
                  fetchOpportunities();
                }}
              >
                {t('action.refresh')}
              </button>
            </div>
            {lastUpdated && (
              <span className="auto-refresh-label">
                {t('label.last_updated')}: {lastUpdated} ({t('label.auto_refresh_30s')})
              </span>
            )}
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loading-container">{t('prompt.loading')}</div>
            ) : opportunities.length > 0 ? (
              <table className="table is-fullwidth is-striped is-hoverable">
                <thead>
                  <tr>
                    <th>{t('title.symbol')}</th>
                    <th>{t('title.buy_from')}</th>
                    <th>{t('title.buy_price')}</th>
                    <th>{t('title.sell_to')}</th>
                    <th>{t('title.sell_price')}</th>
                    <th>{t('title.diff_percent')}</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp, idx) => (
                    <tr key={`${opp.symbol}-${idx}`}>
                      <td><strong>{opp.symbol}</strong></td>
                      <td>{opp.from.exchange}</td>
                      <td>{opp.from.ask?.toFixed(2)}</td>
                      <td>{opp.to.exchange}</td>
                      <td>{opp.to.bid?.toFixed(2)}</td>
                      <td className={getDiffClass(opp.rawdiff)}>
                        {opp.diff}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="notification is-light">
                {t('prompt.no_arbitrage_opportunities')}
              </div>
            )}
          </div>
        </div>
      </section>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
```

**Step 2: Commit**

```bash
cd /Users/zyao0693/Desktop/www/moow-web-next
git add src/app/arbitrage/page.tsx
git commit -m "feat: add arbitrage opportunities page with auto-refresh"
```

---

### Task A10: Update Navbar — Change Arbitrage Link

**Files:**
- Modify: `moow-web-next/src/components/Navbar.tsx`

**Step 1: Change external arbitrage link to internal Next.js route**

Find this line:
```tsx
<a href="/hq/arbitrage" className="navbar-item" target="_self">{t('link.arbitrage')}</a>
```

Replace with:
```tsx
<Link href="/arbitrage" className="navbar-item">{t('link.arbitrage')}</Link>
```

**Step 2: Commit**

```bash
cd /Users/zyao0693/Desktop/www/moow-web-next
git add src/components/Navbar.tsx
git commit -m "feat: change arbitrage nav link from external /hq/ to internal /arbitrage"
```

---

### Task A11: Add i18n Keys for Arbitrage

**Files:**
- Modify: `moow-web-next/public/locales/zh.json`
- Modify: `moow-web-next/public/locales/en.json`

**Step 1: Add Chinese translations**

Add to `zh.json`:
```json
"title.arbitrage_opportunities": "套利机会",
"title.buy_from": "买入交易所",
"title.buy_price": "买入价",
"title.sell_to": "卖出交易所",
"title.sell_price": "卖出价",
"title.diff_percent": "价差%",
"label.min_profit": "最小利润",
"label.last_updated": "最后更新",
"label.auto_refresh_30s": "每30秒自动刷新",
"prompt.no_arbitrage_opportunities": "暂无符合条件的套利机会"
```

**Step 2: Add English translations**

Add to `en.json`:
```json
"title.arbitrage_opportunities": "Arbitrage Opportunities",
"title.buy_from": "Buy From",
"title.buy_price": "Buy Price",
"title.sell_to": "Sell To",
"title.sell_price": "Sell Price",
"title.diff_percent": "Diff%",
"label.min_profit": "Min Profit",
"label.last_updated": "Last Updated",
"label.auto_refresh_30s": "Auto-refresh every 30s",
"prompt.no_arbitrage_opportunities": "No arbitrage opportunities found"
```

**Step 3: Commit**

```bash
cd /Users/zyao0693/Desktop/www/moow-web-next
git add public/locales/zh.json public/locales/en.json
git commit -m "feat: add i18n translations for arbitrage page"
```

---

## Track B: DCA Module Completion (定投补齐)

### Task B1: Fix User Ownership Validation in Strategy Service

**Files:**
- Modify: `moow-api-express/app/services/strategyService.js`

**Step 1: Find the commented-out ownership check**

Look for around line 148-150 where userId validation is commented out. Uncomment and ensure these methods validate user ownership:

In `getStrategyById(id, userId)` — add userId parameter and check:
```javascript
const strategy = await AipStrategyModel.findById(id).lean();
if (!strategy) {
  throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Strategy not found');
}
if (userId && strategy.user.toString() !== userId) {
  throw new CustomError(STATUS_TYPE.HTTP_FORBIDDEN, 403, 'Access denied');
}
```

Apply the same pattern to `partiallyUpdateStrategy` and `deleteStrategy`.

**Step 2: Update controller to pass userId**

In `strategyController.js`, ensure `req.userId` is passed to all service calls that need ownership validation:
```javascript
const data = await StrategyService.getStrategyById(req.params.id, req.userId);
```

**Step 3: Run existing tests**

Run: `cd /Users/zyao0693/Desktop/www/moow-api-express && npm test -- --testPathPatterns=strategy`
Expected: Tests should still pass (update mocks if needed)

**Step 4: Commit**

```bash
git add app/services/strategyService.js app/controllers/strategyController.js
git commit -m "fix: enable user ownership validation for strategy CRUD"
```

---

### Task B2: Implement Value Averaging Sell Logic

**Files:**
- Modify: `moow-api-express/app/services/strategyService.js`

**Step 1: Find the TODO at line 621**

The current `_valueAveraging` method (line 606-624) only handles the buy side. The TODO at line 621 says:
> "In theory, value averaging sell strategy means selling the portion that exceeds the expected value"

**Step 2: Add sell calculation to processSell**

In `processSell(strategy)`, add handling for `INVESTMENT_TYPE_INTELLIGENT`:

```javascript
// Inside processSell, after fetching current price (bidPrice):
if (strategy.type === AipStrategyModel.INVESTMENT_TYPE_INTELLIGENT) {
  const nowWorth = strategy.quote_total * bidPrice;
  const expectWorth =
    strategy.base_limit *
    strategy.buy_times *
    (1 + (strategy.expect_growth_rate || 0.008)) ** strategy.buy_times;

  if (nowWorth > expectWorth) {
    const excessValue = nowWorth - expectWorth;
    const sellAmount = excessValue / bidPrice;
    logger.info(
      `[processSell] Intelligent strategy ${strategy._id}: nowWorth=${nowWorth}, expectWorth=${expectWorth}, selling ${sellAmount}`,
    );
    await this.sellout(strategy, sellAmount, bidPrice);
  }
  return; // Intelligent strategies use value-based sell, not stop_profit
}
```

**Step 3: Run tests**

Run: `cd /Users/zyao0693/Desktop/www/moow-api-express && npm test -- --testPathPatterns=strategy`
Expected: PASS

**Step 4: Commit**

```bash
git add app/services/strategyService.js
git commit -m "feat: implement value averaging sell logic for intelligent strategies"
```

---

### Task B3: Add Balance, Summary, and Statistics Endpoints

**Files:**
- Modify: `moow-api-express/app/services/strategyService.js`
- Modify: `moow-api-express/app/controllers/strategyController.js`
- Modify: `moow-api-express/app/routes/strategyRoutes.js`

**Step 1: Add service methods**

In `strategyService.js`, add:

```javascript
/**
 * Get exchange balance for a strategy's trading pair
 */
async getBalance(strategyId, userId) {
  const strategy = await AipStrategyModel.findById(strategyId);
  if (!strategy || strategy.user.toString() !== userId) {
    throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Strategy not found');
  }

  const exchangeKey = await AipExchangeKeyModel.findById(strategy.user_market_id);
  if (!exchangeKey) {
    throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Exchange key not found');
  }

  const decryptedKey = cryptoUtils.decrypt(exchangeKey.access_key);
  const decryptedSecret = cryptoUtils.decrypt(exchangeKey.secret_key);

  const exchange = new ccxt[strategy.exchange]({
    apiKey: decryptedKey,
    secret: decryptedSecret,
    timeout: config.exchangeTimeOut,
  });

  const balance = await exchange.fetchBalance();
  const [, quote] = strategy.symbol.split('/');

  return {
    free: balance.free[quote] || 0,
    used: balance.used[quote] || 0,
    total: balance.total[quote] || 0,
    currency: quote,
  };
}

/**
 * Get summary of all user's active strategies
 */
async getSummary(userId) {
  const strategies = await AipStrategyModel.find({
    user: userId,
    status: AipStrategyModel.STRATEGY_STATUS_NORMAL,
  }).lean();

  let totalInvested = 0;
  let totalValue = 0;

  for (const s of strategies) {
    totalInvested += s.base_total || 0;
    totalValue += (s.quote_total || 0) * (s.sell_price || 0);
  }

  const totalProfit = totalValue - totalInvested;
  const profitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return {
    strategyCount: strategies.length,
    totalInvested,
    totalValue,
    totalProfit,
    profitRate: profitRate.toFixed(2),
  };
}
```

**Step 2: Add controller methods**

In `strategyController.js`, add:

```javascript
async getBalance(req, res) {
  const data = await StrategyService.getBalance(req.params.id, req.userId);
  return ResponseHandler.success(res, data);
}

async getSummary(req, res) {
  const data = await StrategyService.getSummary(req.userId);
  return ResponseHandler.success(res, data);
}
```

**Step 3: Add routes**

In `strategyRoutes.js`, add before existing routes:

```javascript
router.get('/api/v1/strategies/summary', authMiddleware, StrategyController.getSummary);
router.get('/api/v1/strategies/:id/balance', authMiddleware, StrategyController.getBalance);
```

Note: `/strategies/summary` must be defined BEFORE `/strategies/:id` to avoid `:id` matching "summary".

**Step 4: Run tests**

Run: `cd /Users/zyao0693/Desktop/www/moow-api-express && npm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add app/services/strategyService.js app/controllers/strategyController.js app/routes/strategyRoutes.js
git commit -m "feat: add balance and summary API endpoints for strategies"
```

---

### Task B4: Fix Frontend API Path Alignment

**Files:**
- Modify: `moow-web-next/src/app/forgetPassword/page.tsx`
- Modify: `moow-web-next/src/app/resetPassword/page.tsx`

**Step 1: Fix forgetPassword page**

In `src/app/forgetPassword/page.tsx`:

Replace:
```tsx
setCaptchaSrc('/api/pub/auth/svgCaptcha?' + Math.random());
```
With:
```tsx
setCaptchaSrc('/api/v1/captcha?' + Math.random());
```

Replace:
```tsx
let response = await axios.post('/pub/auth/retrievePassword', formData);
```
With:
```tsx
let response = await HTTP.post('/v1/auth/passwordRecovery', formData);
```

Also update the import — replace `import axios from 'axios';` with `import HTTP from '@/lib/http';`

**Step 2: Fix resetPassword page**

In `src/app/resetPassword/page.tsx`:

Replace:
```tsx
setCaptchaSrc('/api/pub/auth/svgCaptcha?' + Math.random());
```
With:
```tsx
setCaptchaSrc('/api/v1/captcha?' + Math.random());
```

Replace:
```tsx
let response = await axios.post('/pub/auth/resetPassword', {
```
With:
```tsx
let response = await HTTP.patch('/v1/auth/passwordReset', {
```

Also update the import — replace `import axios from 'axios';` with `import HTTP from '@/lib/http';`

**Step 3: Commit**

```bash
cd /Users/zyao0693/Desktop/www/moow-web-next
git add src/app/forgetPassword/page.tsx src/app/resetPassword/page.tsx
git commit -m "fix: align forgetPassword and resetPassword API paths to v1"
```

---

### Task B5: Connect Home Page DCA Chart to Real API

**Files:**
- Modify: `moow-web-next/src/app/page.tsx`

**Step 1: Verify the API call exists**

The current code at `src/app/page.tsx` already has:

```tsx
HTTP.post('/v1/public/dingtou/orders', {})
  .then((res: any) => {
    if (res?.data?.list?.length) {
      setOrders(res.data.list);
    } else {
      setOrders(DEMO_ORDERS);
    }
    return res;
  })
  .catch(() => {
    setOrders(DEMO_ORDERS);
  });
```

This is already correct — it tries the API first and falls back to demo data. The only action needed is to ensure the backend route exists.

**Step 2: Verify/add the public orders endpoint in backend**

Check if `POST /api/v1/public/dingtou/orders` exists in moow-api-express routes. If not, add to `strategyRoutes.js`:

```javascript
/**
 * @swagger
 * /api/v1/public/dingtou/orders:
 *   post:
 *     summary: Get public DCA order data for homepage chart
 *     tags:
 *       - Trading strategy management
 */
router.post('/api/v1/public/dingtou/orders', StrategyController.getPublicOrders);
```

And add the controller method:

```javascript
async getPublicOrders(req, res) {
  const data = await StrategyService.getPublicOrders();
  return ResponseHandler.success(res, data);
}
```

And the service method:

```javascript
async getPublicOrders() {
  // Return recent orders from any active strategy for homepage demo chart
  const orders = await AipOrderModel.find({ side: 'buy' })
    .sort({ created_at: -1 })
    .limit(20)
    .lean();
  return { list: orders };
}
```

**Step 3: Commit**

```bash
cd /Users/zyao0693/Desktop/www/moow-api-express
git add app/services/strategyService.js app/controllers/strategyController.js app/routes/strategyRoutes.js
git commit -m "feat: add public DCA orders endpoint for homepage chart"
```

---

## Final: Run All Tests & Verify

### Task F1: Run Full Test Suite

**Step 1: Run backend tests**

Run: `cd /Users/zyao0693/Desktop/www/moow-api-express && npm test`
Expected: All tests PASS

**Step 2: Run frontend build**

Run: `cd /Users/zyao0693/Desktop/www/moow-web-next && npm run build`
Expected: Build succeeds with no errors

**Step 3: Run frontend tests (if any)**

Run: `cd /Users/zyao0693/Desktop/www/moow-web-next && npm test`
Expected: Tests PASS

---

## Task Dependency Graph

```
Track A (Arbitrage):
  A1 (status codes) → A2 (models) → A3 (service) → A4 (validator)
                                            ↓
                                     A5 (controller) → A6 (routes) → A7 (scheduler) → A8 (tests)
                                                                                         ↓
                                                                              A9 (frontend page) → A10 (navbar) → A11 (i18n)

Track B (DCA Completion):
  B1 (ownership fix) → B2 (value avg sell) → B3 (balance/summary APIs) → B4 (API path fix) → B5 (homepage chart)

Final:
  F1 depends on ALL A* and B* tasks
```

**Track A and Track B have no mutual dependencies and can run fully in parallel.**
