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
```

### Key Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| Portal | `portal_` | User auth, tokens, email, markets |
| AIP | `aip_` | Strategies, orders, exchange keys, await |
| Data | `data_` | Exchange symbols, rates |
| Common | `common_` | Config, sequence counters |

## API Design

All endpoints follow: `GET/POST/PATCH/DELETE /api/v1/{resource}`

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

Business code ranges: Global 1-1000, Common 1001-10000, Portal 11001-12000, AIP 12001-13000, Data 13001-14000.

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

### Adding a New Route

1. Create route file in `app/routes/{module}Routes.js`
2. Add Swagger JSDoc annotations above each endpoint
3. Apply `validateParams(schema)` middleware for input validation
4. Point to controller method directly (no asyncHandler wrapper)

```javascript
router.post(
  '/api/v1/resource',
  validateParams(createResourceValidatorSchema),
  ResourceController.create,
);
```

### Adding a New Model

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResourceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  status: { type: Number, default() { return this.constructor.STATUS_NORMAL; } },
}, {
  collection: 'module_resources',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

ResourceSchema.statics.STATUS_NORMAL = 1;
ResourceSchema.statics.STATUS_DELETED = 3;

module.exports = mongoose.model('ModuleResource', ResourceSchema);
```

### Service Pattern

Services are singleton classes exported as `new ServiceClass()`:

```javascript
class ResourceService {
  async index(params) { /* ... */ }
  async create(data) { /* ... */ }
}
module.exports = new ResourceService();
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

## Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Trailing commas:** In multiline expressions
- **Line width:** 100 characters
- **Linter:** ESLint 9 (flat config) + Airbnb base + Prettier
- **Formatter:** Prettier (config in `.prettierrc`)

## Git Workflow

- **Commits:** Conventional commits (enforced by commitlint)
  - `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`
- **Pre-commit:** lint-staged runs ESLint + Prettier on staged `.js` files
- **Worktrees:** Use `.worktrees/` directory (gitignored)

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

## Environment

Copy `.env.default` to `.env` and configure:
- `MONGO_URI` — MongoDB connection string
- `SECRET_KEY` — JWT secret
- `PORT` — Server port (default 3000)
- `MAIL_*` — SMTP config for email notifications

## Important Notes

- Express 5 catches async errors natively. Do NOT wrap handlers in asyncHandler.
- `crypto` is Node.js built-in. Do NOT install it as an npm package.
- dayjs replaces moment.js. Use dayjs for all date operations.
- Models define business constants as statics. Use them in validators and services.
- Soft delete: Set `status` to `*_SOFT_DELETED` constant, never hard delete user data.
- Exchange keys are stored encrypted via RSA (keys/ directory).
