# Node 22 & Dependency Upgrade Design

## Overview

Upgrade the moow-api-express project from Node 20 to Node 22 LTS, Express 4 to Express 5, migrate moment.js to dayjs, and modernize all dependencies.

## Goals

- Upgrade Node.js runtime to 22 LTS (supported until April 2027)
- Upgrade Express to v5 for native async error handling and modern routing
- Replace moment.js with dayjs (actively maintained, 1/30 the size)
- Remove unnecessary dependencies (crypto, body-parser, thread-sleep)
- Upgrade all remaining dependencies to latest compatible versions
- Upgrade dev toolchain (ESLint 9, Husky 9)

## Step 1: Remove Unnecessary Dependencies

### crypto (npm package)

`crypto` is a Node.js built-in module. The npm package is unnecessary.

- Remove from `package.json`
- Verify all `require('crypto')` calls work with the built-in module (they should)

### body-parser

Express 4.16+ includes `express.json()` and `express.urlencoded()` built-in.

- Remove from `package.json`
- Replace any `require('body-parser')` with direct `express.json()` / `express.urlencoded()` usage
- Check `config/middleware.js` for body-parser references

### thread-sleep

Native C++ addon that breaks across Node major versions. Replace with async alternatives.

- Find all usages of `thread-sleep` in the codebase
- Replace with `await new Promise(resolve => setTimeout(resolve, ms))` or `Atomics.wait`
- Remove from `package.json`

## Step 2: Upgrade Node.js to 22 LTS

- Update `package.json` volta config:
  ```json
  "volta": {
    "node": "22.x.x",
    "npm": "10.x.x"
  }
  ```
- Run `npm install` to regenerate `package-lock.json`
- Verify project starts with `npm run dev`
- Note: Node 22 provides native `fetch`, `WebSocket`, `crypto.randomUUID()`

## Step 3: Upgrade Express 4 to Express 5

### Breaking changes to handle:

1. **Async error handling**: Express 5 auto-catches rejected Promises in middleware/routes. The `asyncHandler` wrapper in `app/utils/asyncHandler.js` can be removed, and all route handlers unwrapped.

2. **Route path syntax**: Regex-based route parameters change:
   - `(.*)` must become `{*wildcard}` or named splat
   - Check all route files for regex patterns

3. **Removed APIs**:
   - `app.del()` removed (project uses `router.delete()`, should be fine)
   - `req.host` returns full hostname (no port stripping)
   - `req.query` uses new query parser

4. **`res.json()` signature**: `res.json(obj, status)` no longer works; must use `res.status(x).json(obj)`. Check `app/utils/responseHandler.js`.

### Files to check:
- `app/routes/*.js` - all route definitions
- `app/controllers/*.js` - all controller handlers
- `app/middlewares/*.js` - middleware signatures
- `app/utils/asyncHandler.js` - remove after Express 5
- `config/middleware.js` - middleware setup

## Step 4: Migrate moment.js to dayjs

### Approach:
1. Install dayjs and required plugins
2. Find all moment usage: `grep -r "require('moment')" app/`
3. Create a shared dayjs setup file with plugins
4. Replace imports and verify API compatibility

### Common translations:
| moment | dayjs | Plugin needed |
|--------|-------|---------------|
| `moment()` | `dayjs()` | - |
| `moment().format()` | `dayjs().format()` | - |
| `moment().diff()` | `dayjs().diff()` | - |
| `moment().add()` | `dayjs().add()` | - |
| `moment().subtract()` | `dayjs().subtract()` | - |
| `moment.utc()` | `dayjs.utc()` | `utc` plugin |
| `moment().startOf()` | `dayjs().startOf()` | - |
| `moment().unix()` | `dayjs().unix()` | - |

### Files to check:
- `app/services/strategyService.js` - likely heaviest usage
- `app/services/symbolService.js` - price data with dates
- `app/schedulers/*.js` - scheduled tasks
- Any other file importing moment

## Step 5: Upgrade Remaining Dependencies

All minor/patch upgrades (low risk):

| Package | Current | Target |
|---------|---------|--------|
| mongoose | ^8.4.0 | latest 8.x |
| ccxt | ^4.3.55 | latest 4.x |
| axios | ^1.6.8 | latest 1.x |
| helmet | ^7.1.0 | latest 7.x or 8.x |
| jsonwebtoken | ^9.0.2 | latest 9.x |
| nodemailer | ^6.9.13 | latest 6.x |
| winston | ^3.13.0 | latest 3.x |
| winston-daily-rotate-file | ^5.0.0 | latest 5.x |
| swagger-jsdoc | ^6.2.8 | latest 6.x |
| swagger-ui-express | ^5.0.1 | latest 5.x |
| uuid | ^9.0.1 | latest (or replace with crypto.randomUUID()) |
| node-cron | ^3.0.3 | latest 3.x |
| express-validator | ^7.1.0 | latest 7.x |
| cors | ^2.8.5 | latest 2.x |
| ejs | ^3.1.10 | latest 3.x |
| hashids | ^2.3.0 | latest 2.x |
| dotenv | ^16.4.5 | latest 16.x |
| csv-parser | ^3.0.0 | latest 3.x |
| express-session | ^1.18.0 | latest 1.x |
| svg-captcha | ^1.4.0 | latest |
| lodash | ^4.17.21 | latest 4.x |
| morgan | ^1.10.0 | latest 1.x |

## Step 6: Dev Toolchain Upgrade

### ESLint 8 to 9

- ESLint 9 uses "flat config" (`eslint.config.js` instead of `.eslintrc`)
- `eslint-config-airbnb-base` may not support ESLint 9 yet; evaluate alternatives
- Can use `@eslint/eslintrc` compatibility layer for gradual migration
- Update related plugins: `eslint-config-prettier`, `eslint-plugin-import`, `eslint-plugin-prettier`

### Husky 8 to 9

- Husky 9 simplifies setup: scripts go directly in `.husky/` as shell scripts
- `husky install` is replaced by `husky` in prepare script
- Update `.husky/` hook files

### Other dev deps

| Package | Current | Target |
|---------|---------|--------|
| nodemon | ^3.1.0 | latest 3.x (or replace with `node --watch`) |
| prettier | ^3.3.2 | latest 3.x |
| commitlint | ^19.3.0 | latest 19.x |
| lint-staged | ^15.2.7 | latest 15.x |

## Step 7: Smoke Testing

After all upgrades, verify:

1. **Server starts** without errors
2. **Auth flow**: signup, login, logout, password reset
3. **Strategy CRUD**: create, read, update, delete strategies
4. **Exchange key management**: add, list, delete keys
5. **Trading execution**: buy/sell operations (test environment)
6. **Schedulers**: cron jobs register without errors
7. **Swagger docs**: `/api-docs` loads correctly

## Risk Matrix

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Express 5 route behavior changes cause 404s | High | Medium | Check every route file individually |
| asyncHandler removal misses error handling | High | Low | Express 5 auto-catches async errors |
| dayjs missing moment methods | Medium | Low | Audit all moment usage before migrating |
| ccxt API changes break trading | High | Low | Test in sandbox/testnet first |
| ESLint 9 config incompatible with airbnb | Low | Medium | Use compatibility layer |
| thread-sleep removal breaks scheduler timing | Medium | Low | Async setTimeout is a safe replacement |

## Implementation Order

```
Step 1 (cleanup) → Step 2 (Node 22) → Step 3 (Express 5) → Step 4 (dayjs) → Step 5 (deps) → Step 6 (dev tools) → Step 7 (test)
```

Each step should be a separate commit for easy rollback.
