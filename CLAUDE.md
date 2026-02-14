# CLAUDE.md

## Project Overview

**moow-api-express** is a cryptocurrency automated investment platform backend API (moow.cc). It enables users to manage exchange API keys, configure DCA (Dollar Cost Averaging) and intelligent investment strategies, and automate buy/sell operations across crypto exchanges via CCXT.

## Tech Stack

- **Runtime:** Node.js 22 LTS (nvm, `.nvmrc`)
- **Framework:** Express 5 (native async error handling, no asyncHandler needed)
- **Database:** MongoDB via Mongoose 8
- **Exchange Integration:** CCXT 4.x (unified crypto exchange API)
- **Auth:** JWT + session-based token management
- **Validation:** express-validator with schema definitions
- **Logging:** Winston (daily rotating files) + Morgan (HTTP requests)
- **Scheduling:** node-cron (buy/sell/price sync tasks)
- **Date:** dayjs (not moment.js)
- **API Docs:** Swagger (JSDoc annotations in route files)

## Architecture

Layered MVC + Service pattern:

```
Request → Route (+ validation middleware) → Controller → Service → Model/DB
                                                ↓
                                          ResponseHandler → JSON Response
```

### Directory Structure

```
app/
  routes/          # Endpoint definitions + Swagger annotations
  controllers/     # HTTP request/response handling
  services/        # Business logic (singleton classes)
  models/          # Mongoose schemas + static constants
  validators/      # express-validator schema objects
  middlewares/     # Auth verification, request validation
  schedulers/      # Cron jobs (auto-registered from files)
  utils/           # ResponseHandler, CustomError, logger, crypto, statusCodes
  views/           # EJS email templates
config/            # App config, DB connection, middleware setup, session
keys/              # RSA key pair (damoon.pem/pub)
logs/              # Winston log output (gitignored)
tests/
  unit/            # Service, middleware, util unit tests
  integration/     # API endpoint tests with mongodb-memory-server
  helpers/         # Fixtures, mock utilities, DB helper, test app
```

### Key Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| Portal | `portal_` | User auth, tokens, email, markets |
| AIP | `aip_` | Strategies, orders, exchange keys, await |
| Data | `data_` | Exchange symbols, rates |
| Common | `common_` | Config, sequence counters |

### Module Dependency Graph

```
Portal (auth/user)
  ├── AIP (strategies/orders) — authenticated users create strategies
  │     ├── Data (symbols) — strategies reference trading pairs
  │     └── Common (sequences) — auto-increment IDs
  └── Common (sequences) — user seq_id generation

Schedulers (cron)
  ├── StrategyService.executeAllBuys()   — every minute
  ├── StrategyService.executeAllSells()  — daily 6 AM
  ├── SymbolService (price sync)         — periodic
  └── AwaitService (third-party sells)   — periodic
```

### Module Interaction Rules

- **Portal → AIP:** User must exist and be authenticated before creating strategies/keys.
- **AIP → Data:** Strategy creation and execution queries `data_exchange_symbols` for price data.
- **AIP → Common:** `sequenceService.getNextSequenceValue()` generates auto-increment IDs.
- **Strategy → ExchangeKey:** Strategy stores exchange credentials. Should reference key by `user_market_id`, then decrypt at execution time.
- **Strategy → Order:** Each buy/sell execution creates an order record in `aip_orders`.
- **Strategy → Await:** Sell triggers create await records, processed by `sellThirdPartyScheduler`.
- **Controller → Service:** Controllers NEVER contain business logic. They only extract params, call service, and return response.
- **Service → Model:** Services contain ALL business logic. Models only define schema and statics.

## Business Logic

### Core Concept: Automated Investment (DCA)

Users configure strategies that automatically buy crypto at scheduled intervals:
1. User registers and activates account
2. User adds exchange API key (validated via CCXT `fetchBalance`)
3. User creates strategy (symbol, amount, frequency, profit target)
4. Scheduler executes buy orders per strategy schedule
5. System monitors profit and triggers sell when target reached

### Strategy Lifecycle

```
Created (NORMAL) → Buying (scheduled) → Profit Target Hit → Sell Triggered → Closed
                                                                    ↓
                                                         auto_create='Y' → Reset & Continue
```

**Status Constants:**
- `STRATEGY_STATUS_NORMAL (1)` — Active, executing buys
- `STRATEGY_STATUS_CLOSED (2)` — Completed or manually stopped
- `STRATEGY_STATUS_SOFT_DELETED (3)` — User deleted

**Investment Types:**
- `INVESTMENT_TYPE_REGULAR (1)` — Fixed amount each period (standard DCA)
- `INVESTMENT_TYPE_INTELLIGENT (2)` — Value averaging (adjusts amount based on growth target)

### Buy Execution Flow

```
buyScheduler (every minute)
  → StrategyService.executeAllBuys()
    → Find strategies where minute == current minute AND status == NORMAL
    → For each strategy, check period:
        daily:   execute every day
        weekly:  execute if current weekday in period_value[]
        monthly: execute if current day-of-month in period_value[]
    → processBuy(strategy):
        1. Create CCXT exchange instance with strategy credentials
        2. Fetch ticker price (ask price)
        3. Calculate amount:
           - Regular DCA: amount = base_limit / price
           - Value averaging: amount = _valueAveraging(strategy, price)
        4. Execute market buy order on exchange
        5. Create order record in DB
        6. Update strategy counters (buy_times, base_total, quote_total)
```

### Sell Execution Flow

```
sellScheduler (daily 6 AM)
  → StrategyService.executeAllSells()
    → For each NORMAL strategy:
      → processSell(strategy):
          1. Fetch ticker price (bid price)
          2. Calculate profit% = (quote_total * price - base_total) / base_total
          3. If profit% < stop_profit_percentage: skip (no sell)
          4. Check drawdown settings:
             - Drawdown disabled → sell immediately
             - Drawdown enabled, first time → record peak price, sell
             - Drawdown enabled, subsequent → if price dropped by drawdown% from peak → sell
          5. sellout() → create await record (AUTO_SELL type)
      → sellAllOrders():
          → AwaitService.sellOnThirdParty(strategy, awaitOrder)
            1. Execute market sell order on exchange
            2. Wait 5s, fetch filled order details
            3. Calculate realized profit
            4. Create sell order record
            5. If auto_create='Y': reset counters, keep strategy NORMAL
            6. Else: close strategy (CLOSED status)
```

### Value Averaging Algorithm

```
Vt = C * t * (1 + R)^t       // Expected portfolio value at time t
currentValue = quote_total * currentPrice
expectedValue = base_limit * buy_times * (1 + expect_growth_rate)^buy_times
amountToBuy = max(0, (expectedValue - currentValue) / currentPrice)
```

Purpose: Buy more when price is below expected growth, buy less when above.

### Authentication Flow

**Signup:**
```
1. Validate captcha (local env: '888' always passes)
2. Check email not registered
3. Hash password: PBKDF2(password, randomSalt, 1000 iterations, 32 bytes, SHA512)
4. If referral code → decode hashids → find inviter → link
5. Generate seq_id via sequenceService
6. Generate invitation_code = hashidsEncode(seq_id)
7. Set vip_time_out_at = now + 10 days
8. Send activation email
```

**Signin:**
```
1. Validate captcha
2. Find user by email
3. Verify password with PBKDF2
4. Delete all previous session tokens
5. Generate new session token (UUIDv1)
6. Return token + sanitized user info
```

**Token Validation (authMiddleware):**
```
1. Extract token + user_id from request headers
2. Lookup token in portal_tokens collection
3. Check token age < 100000 seconds (27.7 hours)
4. Verify user_id matches token.user_id
5. Update last_access_time
6. Attach userId to req for downstream use
```

**Email Activation:**
```
1. Generate code token (UUIDv1, type='code')
2. Render EJS template (welcome_mail.html)
3. Send via nodemailer (Aliyun SMTP)
4. User clicks link → activateUser(code)
5. Mark is_activated=true, extend VIP 10 days
6. If inviter exists → extend inviter VIP 1 day
```

### Order Lifecycle

```
Strategy executes buy
  → CCXT createOrder() on exchange
  → Save to aip_orders: { strategy_id, order_id, side:'buy', price, amount, ... }
  → Update strategy: buy_times++, base_total += cost, quote_total += amount

Sell triggered
  → Create aip_awaits: { strategy_id, sell_type, await_status: WAITING }
  → Scheduler processes await → CCXT createOrder(sell)
  → Save to aip_orders: { side:'sell', profit, profit_percentage, ... }
  → Update await status → COMPLETED
  → Update or close strategy
```

### Exchange Key Management

```
Create key:
  1. Instantiate CCXT exchange with provided credentials
  2. Call fetchBalance() to validate (throws if invalid)
  3. Encrypt access_key and secret_key via RSA (cryptoUtils)
  4. Store encrypted + desensitized version (first3***last3)

Use key (in strategy execution):
  → Decrypt key/secret from DB
  → Create CCXT instance with decrypted credentials
  → Execute trades
```

## API Design

All endpoints follow: `GET/POST/PATCH/DELETE /api/v1/{resource}`

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/signup` | No | Register |
| POST | `/api/v1/auth/signin` | No | Login |
| DELETE | `/api/v1/auth/signout` | Yes | Logout |
| GET | `/api/v1/auth/captcha` | No | Get SVG captcha |
| POST | `/api/v1/auth/send-activate-email` | No | Send activation |
| GET | `/api/v1/auth/activate` | No | Activate account |
| POST | `/api/v1/auth/send-retrieve-email` | No | Send password reset |
| POST | `/api/v1/auth/reset-password` | No | Reset password |
| GET | `/api/v1/strategies` | Yes | List strategies |
| GET | `/api/v1/strategies/:id` | Yes | Strategy detail |
| POST | `/api/v1/strategies` | Yes | Create strategy |
| PATCH | `/api/v1/strategies/:id` | Yes | Update strategy |
| DELETE | `/api/v1/strategies/:id` | Yes | Delete strategy |
| POST | `/api/v1/strategies/buy/all` | Yes | Trigger all buys |
| POST | `/api/v1/strategies/buy/:id` | Yes | Trigger single buy |
| POST | `/api/v1/strategies/sell/all` | Yes | Trigger all sells |
| POST | `/api/v1/strategies/sell/:id` | Yes | Trigger single sell |
| GET | `/api/v1/keys` | Yes | List exchange keys |
| GET | `/api/v1/keys/:id` | Yes | Key detail |
| POST | `/api/v1/keys` | Yes | Create key |
| DELETE | `/api/v1/keys/:id` | Yes | Delete key |
| GET | `/api/v1/orders` | Yes | List orders |
| GET | `/api/v1/openOrders` | Yes | List open orders |
| DELETE | `/api/v1/orders/:id` | Yes | Cancel order |
| GET | `/api/v1/markets` | Yes | List markets |
| POST | `/api/v1/markets` | Yes | Create market |
| PATCH | `/api/v1/markets/:id` | Yes | Update market |
| GET | `/api/v1/symbols` | Yes | List symbols |
| GET | `/api/v1/symbols/:id` | Yes | Symbol detail |
| GET | `/api/v1/symbols/price` | Yes | Historical price |
| GET | `/api/v1/users/:id` | Yes | User profile |
| PATCH | `/api/v1/users/:id` | Yes | Update profile |

### Response Format

```json
{
  "code": 0,
  "message": "Success",
  "data": {}
}
```

Use `ResponseHandler.success(res, data)` and `ResponseHandler.fail(res, httpCode, businessCode, message)`.

### Error Handling

Throw `CustomError` with a business code from `statusCodes.js`. Express 5 auto-catches async errors and forwards to the global error handler in `app.js`.

```javascript
throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
```

### Business Code Ranges

| Range | Module | Key Codes |
|-------|--------|-----------|
| 1-1000 | Global | `GLOBAL_INTERNAL_ERROR (500)`, `HTTP_NOT_FOUND (404)`, `HTTP_UNAUTHORIZED (401)` |
| 1001-10000 | Common | `GLOBAL_PARAMS_ERROR (1004)` |
| 11001-12000 | Portal | `PORTAL_TOKEN_ILLEGAL (11001)`, `PORTAL_TOKEN_EXPIRED (11002)`, `PORTAL_EMAIL_ALREADY_REGISTERED (11007)`, `PORTAL_USER_NOT_FOUND (11010)`, `PORTAL_INCORRECT_PASSWORD (11011)`, `PORTAL_CAPTCHA_INVAILD (11016)` |
| 12001-13000 | AIP | `AIP_INSUFFICIENT_BALANCE (12006)`, `AIP_INSUFFICIENT_PURCHASE_AMOUNT (12007)` |
| 13001-14000 | Data | (symbols/rates) |

### Pagination Pattern

Services that return lists follow this pattern:

```javascript
async getAllItems(params) {
  const { pageNumber = 1, pageSize = 20, ...filters } = params;
  const conditions = { /* build from filters */ };
  const total = await Model.countDocuments(conditions);
  const list = await Model.find(conditions)
    .sort({ created_at: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();
  return { list, pageNumber, pageSize, total };
}
```

## Database Patterns

### Query Patterns

**Find with lean (read-only, faster):**
```javascript
const user = await PortalUserModel.findOne({ email }).lean();
```

**Find for update (returns Mongoose document with save()):**
```javascript
const user = await PortalUserModel.findById(id);
user.password = newHash;
await user.save();
```

**Soft delete:**
```javascript
await Model.findByIdAndUpdate(id, {
  status: Model.STATUS_SOFT_DELETED,
  is_deleted: true,
});
```

**Aggregation (profit calculation in strategy list):**
```javascript
const strategies = await AipStrategyModel.aggregate([
  { $match: conditions },
  { $sort: { created_at: -1 } },
  { $skip: (pageNumber - 1) * pageSize },
  { $limit: pageSize },
]);
// Then enrich with current prices via CCXT
```

### Soft Delete Convention

- NEVER hard delete user data.
- Set `status` to the model's `*_SOFT_DELETED` constant.
- Some models also use `is_deleted: true` as a secondary flag.
- Queries should filter `status != SOFT_DELETED` unless `showDeleted` is requested.

### Auto-Increment IDs

```javascript
const seqId = await SequenceService.getNextSequenceValue('portal_user');
// Uses common_sequence_counters collection with findOneAndUpdate + $inc
```

## Naming Conventions

### Files

| Layer | Pattern | Example |
|-------|---------|---------|
| Route | `{module}Routes.js` | `strategyRoutes.js` |
| Controller | `{module}Controller.js` | `strategyController.js` |
| Service | `{module}Service.js` | `strategyService.js` |
| Model | `{module}{Entity}Model.js` | `aipStrategyModel.js` |
| Validator | `{module}Validator.js` | `strategyValidator.js` |
| Scheduler | `{purpose}Scheduler.js` | `buyScheduler.js` |

### Database

- Collections: `{module}_{entities}` (snake_case, plural) e.g. `aip_strategies`
- Fields: `snake_case` e.g. `base_total`, `buy_times`
- Timestamps: `created_at`, `updated_at` (configured in schema options)

### Code

- Classes: `PascalCase` — `StrategyService`, `AipStrategyModel`
- Functions/variables: `camelCase` — `executeAllBuys`, `baseLimit`
- Constants (model statics): `UPPER_SNAKE_CASE` — `STRATEGY_STATUS_NORMAL`
- Module system: CommonJS (`require`/`module.exports`)

## Patterns to Follow

### Adding a New Feature (End-to-End Checklist)

When adding a new module or feature, create files in this order:

1. **Model** — `app/models/{module}{Entity}Model.js`
   - Define schema with all fields, types, defaults
   - Add statics for status constants
   - Set collection name and timestamps
   - Export via `mongoose.model()`

2. **Status Codes** — Update `app/utils/statusCodes.js`
   - Add new `STATUS_TYPE` entries in the module's code range
   - Add corresponding `STATUS_MESSAGE` entries

3. **Validator** — `app/validators/{module}Validator.js`
   - Define `checkSchema` objects for each endpoint
   - Reference model statics for allowed values
   - Export named schema objects

4. **Service** — `app/services/{module}Service.js`
   - Implement business logic as a singleton class
   - Use `CustomError` for all error conditions
   - Return plain data (not HTTP responses)
   - Export as `new ServiceClass()`

5. **Controller** — `app/controllers/{module}Controller.js`
   - Extract params from `req.body` / `req.params` / `req.headers`
   - Call service methods
   - Return via `ResponseHandler.success()` or let errors propagate
   - NO business logic here

6. **Route** — `app/routes/{module}Routes.js`
   - Define endpoints with Swagger JSDoc annotations
   - Apply `authMiddleware` for protected routes
   - Apply `validateParams(schema)` for input validation
   - Point to controller methods
   - Route files are auto-discovered — no manual registration needed

7. **Tests** — Write tests for each layer:
   - `tests/unit/services/{service}.test.js` — Mock models, test logic
   - `tests/integration/{module}.test.js` — Full HTTP flow with mongodb-memory-server

8. **Scheduler** (if needed) — `app/schedulers/{purpose}Scheduler.js`
   - Export a function that calls `cron.schedule()`
   - Scheduler files are auto-discovered

### Adding a New Route

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { validateParams } = require('../middlewares/validateMiddleware');
const { createSchema } = require('../validators/resourceValidator');
const ResourceController = require('../controllers/resourceController');

/**
 * @swagger
 * /api/v1/resources:
 *   post:
 *     tags: [Resource Management]
 *     summary: Create a new resource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/api/v1/resources',
  authMiddleware,
  validateParams(createSchema),
  ResourceController.create,
);

module.exports = router;
```

### Adding a New Model

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResourceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'PortalUser' },
  name: { type: String, required: true, trim: true },
  status: { type: Number, default() { return this.constructor.STATUS_NORMAL; } },
}, {
  collection: 'module_resources',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

ResourceSchema.statics.STATUS_NORMAL = 1;
ResourceSchema.statics.STATUS_SOFT_DELETED = 3;

module.exports = mongoose.model('ModuleResource', ResourceSchema);
```

### Service Pattern

Services are singleton classes exported as `new ServiceClass()`:

```javascript
const Model = require('../models/moduleResourceModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

class ResourceService {
  async index(params) {
    const { pageNumber = 1, pageSize = 20 } = params;
    const conditions = { status: { $ne: Model.STATUS_SOFT_DELETED } };
    const total = await Model.countDocuments(conditions);
    const list = await Model.find(conditions)
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    return { list, pageNumber, pageSize, total };
  }

  async create(data) {
    const resource = new Model(data);
    await resource.save();
    return { _id: resource._id };
  }

  async delete(id) {
    const resource = await Model.findById(id);
    if (!resource) {
      throw new CustomError(STATUS_TYPE.GLOBAL_INTERNAL_ERROR, 404, 'Resource not found');
    }
    resource.status = Model.STATUS_SOFT_DELETED;
    await resource.save();
    return { status: resource.status };
  }
}
module.exports = new ResourceService();
```

### Controller Pattern

```javascript
const ResourceService = require('../services/resourceService');
const ResponseHandler = require('../utils/responseHandler');

class ResourceController {
  async index(req, res) {
    const params = req.body || {};
    params.userId = req.userId;
    const data = await ResourceService.index(params);
    ResponseHandler.success(res, data);
  }

  async create(req, res) {
    const data = req.body;
    data.user = req.userId;
    const result = await ResourceService.create(data);
    ResponseHandler.success(res, result, 201);
  }

  async destroy(req, res) {
    const { id } = req.params;
    const result = await ResourceService.delete(id);
    ResponseHandler.success(res, result);
  }
}
module.exports = new ResourceController();
```

### Validator Pattern

Export named schema objects using express-validator's `checkSchema` format:

```javascript
const createResourceValidatorSchema = {
  name: {
    notEmpty: { errorMessage: 'name is required' },
    isString: { errorMessage: 'name must be a string' },
  },
};
module.exports = { createResourceValidatorSchema };
```

### Scheduler Pattern

Export a function that calls `cron.schedule()`. Files in `app/schedulers/` are auto-registered.

```javascript
const cron = require('node-cron');
module.exports = () => {
  cron.schedule('0 0 * * *', async () => { /* daily task */ });
};
```

### CCXT Exchange Integration Pattern

```javascript
const ccxt = require('ccxt');
const config = require('../../config');

// Create exchange instance
const exchange = new ccxt[exchangeName]({
  apiKey: decryptedAccessKey,
  secret: decryptedSecretKey,
  timeout: config.exchangeTimeOut,
  enableRateLimit: true,
});

// Validate credentials
const balance = await exchange.fetchBalance();

// Get price
const ticker = await exchange.fetchTicker('BTC/USDT');
const askPrice = ticker.ask;  // buy price
const bidPrice = ticker.bid;  // sell price

// Execute trade
const order = await exchange.createOrder(
  'BTC/USDT',  // symbol
  'market',     // type: 'market' or 'limit'
  'buy',        // side: 'buy' or 'sell'
  amount,       // quantity
);
```

## Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Trailing commas:** In multiline expressions
- **Line width:** 100 characters
- **Linter:** ESLint 9 (flat config) + Airbnb base + Prettier
- **Formatter:** Prettier (config in `.prettierrc`)

## Git Workflow

- **Worktrees:** Use `.worktrees/` directory (gitignored)
- **Pre-commit:** lint-staged runs ESLint + Prettier on staged `.js` files
- **Commitlint:** Enforced via commitlint — check `.commitlintrc` for scope format

## Testing

- **Framework:** Jest 30 + supertest + mongodb-memory-server
- **Config:** `jest.config.js` (transforms ESM-only `uuid` package via babel)
- **Structure:**
  - `tests/unit/` — Unit tests (mock DB models, mock CCXT)
  - `tests/integration/` — API tests (real mongodb-memory-server, mock CCXT/email)
  - `tests/helpers/` — Fixtures, mock utilities, DB helper, test app

### Test Patterns

- Unit tests: `jest.mock()` Mongoose models, test service logic in isolation
- Integration tests: Use `tests/helpers/db.js` for real MongoDB, `tests/helpers/app.js` for test Express app
- CCXT: Always mock via `tests/helpers/mockCcxt.js` (never hit real exchanges)
- Email: Always mock `app/services/emailService`
- Logger: Mock in integration tests to reduce noise

### Adding Tests

| Layer | File pattern | Location |
|-------|-------------|----------|
| Service | `{service}.test.js` | `tests/unit/services/` |
| Middleware | `{middleware}.test.js` | `tests/unit/middlewares/` |
| Util | `{util}.test.js` | `tests/unit/utils/` |
| API endpoint | `{module}.test.js` | `tests/integration/` |

### Unit Test Template

```javascript
jest.mock('../../../app/models/moduleResourceModel');

const Model = require('../../../app/models/moduleResourceModel');
const Service = require('../../../app/services/resourceService');
const CustomError = require('../../../app/utils/customError');

describe('ResourceService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('index()', () => {
    it('should return paginated list', async () => {
      Model.countDocuments.mockResolvedValue(1);
      Model.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ _id: '1', name: 'test' }]),
            }),
          }),
        }),
      });

      const result = await Service.index({ pageNumber: 1, pageSize: 20 });

      expect(result.total).toBe(1);
      expect(result.list).toHaveLength(1);
    });
  });
});
```

### Integration Test Template

```javascript
const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../helpers/db');
const app = require('../helpers/app');

jest.mock('../../app/services/emailService');
jest.mock('../../app/utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });
afterEach(async () => { await clearDatabase(); });

describe('POST /api/v1/resources', () => {
  it('should create resource', async () => {
    const res = await request(app)
      .post('/api/v1/resources')
      .set('token', validToken)
      .set('user_id', userId)
      .send({ name: 'test' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
  });
});
```

## Configuration Reference

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection | `mongodb://localhost:27017/mydatabase` |
| `SECRET_KEY` | JWT secret | (required) |
| `SESSION_SECRET` | Session encryption | (required) |
| `PUBLIC_KEY_PATH` | RSA public key | `keys/damoon.pub` |
| `PRIVATE_KEY_PATH` | RSA private key | `keys/damoon.pem` |
| `MAIL_HOST` | SMTP server | `smtp.qiye.aliyun.com` |
| `MAIL_PORT` | SMTP port | `465` |
| `MAIL_USER` | Sender email | (required) |
| `MAIL_PASS` | Email password | (required) |
| `SITE_URL` | Frontend URL | `http://localhost` |
| `LOG_LEVEL` | Console log level | `info` |
| `LOG_FILE_LEVEL` | File log level | `info` |
| `LOG_DIRECTORY` | Log directory | `logs` |
| `LOG_MAX_SIZE` | Log file size limit | `20m` |
| `LOG_MAX_FILES` | Log retention | `14d` |

**Hardcoded in config/index.js:**
- Token timeout: `1000` seconds (16.6 min) — for email codes
- Auth middleware token expiry: `100000` seconds (27.7 hours) — for session tokens
- Exchange timeout: `6000` ms
- Email rate limit: `300` seconds (5 min)
- Currency rate API: `api.exchangerate-api.com`

## Commands

```bash
npm run dev          # Start dev server (nodemon)
npm start            # Start production server
npm test             # Run all tests
npm test -- --coverage                      # Run tests + coverage
npm test -- --testPathPatterns=unit         # Only unit tests
npm test -- --testPathPatterns=integration  # Only integration tests
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Run Prettier
```

## App Initialization Sequence

```
app.js:
  1. connectDB()              — MongoDB connection via Mongoose
  2. setupMiddleware(app)     — Session, bodyParser, CORS, Morgan
  3. swaggerInitialise(app)   — OpenAPI docs at /api-docs
  4. app.use(routes)          — Auto-discover and mount all route files
  5. app.engine('html', ejs)  — EJS template rendering for emails
  6. 404 handler              — CustomError(HTTP_NOT_FOUND)
  7. Global error handler     — Catches CustomError or generic Error
  8. app.listen()             — Start HTTP server
  9. initializeSchedulers()   — Auto-discover and register all cron jobs
```

## Known Issues and TODOs

These are documented incomplete features in the codebase. When working on related code, be aware:

### Security (High Priority)

- **Exchange credentials plaintext:** `strategyService.js` lines 258-260 and `awaitService.js` line 52 — strategy stores key/secret without encryption. RSA encryption exists in `cryptoUtils.js` but is NOT integrated into the strategy execution flow.

### Core Trading Logic (Critical)

- **Hardcoded test orders:** `strategyService.js` line 314 uses `'EOS/USDT', 'limit', 'buy', 50, 0.15` instead of actual strategy parameters. `awaitService.js` line 67 similarly hardcoded.
- **No minimum amount validation:** `strategyService.js` line 312 — should enforce exchange minimum (e.g., 5 USDT) via `exchange.loadMarkets()`.
- **No balance check:** `strategyService.js` line 295 — should verify sufficient balance before ordering.
- **Value averaging sell not implemented:** `strategyService.js` lines 507-508 — reducing holdings above expected value not built.

### Auth & User

- **Error logging missing:** `authService.js` lines 182, 269 — catch blocks lack error logging.
- **Inviter reward incomplete:** `authService.js` line 312 — token reward for referrer not implemented.
- **moment.js usage:** `authService.js` line 309 — should use dayjs instead.

### Other

- **Route typo:** `/api/v1/openOders` in `orderRoutes.js` should be `/api/v1/openOrders`.
- **User ownership validation:** `strategyService.js` line 124 — commented out, strategies not verified against requesting user.

## Important Notes

- Express 5 catches async errors natively. Do NOT wrap handlers in asyncHandler.
- `crypto` is Node.js built-in. Do NOT install it as an npm package.
- dayjs replaces moment.js. Use dayjs for all date operations.
- Models define business constants as statics. Use them in validators and services.
- Soft delete: Set `status` to `*_SOFT_DELETED` constant, never hard delete user data.
- Exchange keys should be stored encrypted via RSA (keys/ directory).
- CCXT must always be mocked in tests — never hit real exchanges.
- Route files and scheduler files are auto-discovered — no manual registration needed.
- Controllers must NOT contain business logic — delegate everything to services.
- Services are singletons — do not store request-scoped state as instance properties.
