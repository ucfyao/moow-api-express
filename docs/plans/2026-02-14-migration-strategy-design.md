# Moow Migration Strategy Design

## Date: 2026-02-14

## Overview

Migration strategy for completing the Moow cryptocurrency investment platform transition from legacy projects to modern stack.

### Project Landscape

| Role | Legacy | New | Status |
|------|--------|-----|--------|
| Backend | moow-api (Egg.js 3 / Koa) | moow-api-express (Express 5 / Node 22) | ~90% complete |
| Frontend | moow-web (Vue 2 / Bulma) | moow-web-next (Next.js 15 / React 19 / TS) | ~60-70% complete |

### Key Differences

- API endpoints: Legacy `/pub/`, `/member/` prefix → RESTful `/api/v1/{resource}`
- Frontend: Complete rewrite from Vue 2 to Next.js 15 + TypeScript
- Backend: Egg.js → Express 5 (mostly done)

## Strategy: Feature Slices

Work is organized by business feature modules, each completed end-to-end (backend fix if needed, then frontend) in a single Claude session. Progress is tracked via this document across sessions.

### Core Principles

1. **One session = one PR** — Each Claude session produces one mergeable PR
2. **Backend first** — If a feature needs backend changes, fix backend before frontend
3. **One repo per session** — Only modify one repository per session
4. **Reference old code** — Always point Claude to the corresponding old Vue/Egg.js code
5. **Track progress here** — Update this document at end of each session

## Session Workflow

### Starting a Session

```
请阅读 docs/plans/2026-02-14-migration-strategy-design.md，继续下一个功能模块。
老项目参考：
- 前端：/Users/.../moow-web/src/views/[相关目录]
- 后端：/Users/.../moow-api/app/[相关目录]
```

### Session Granularity

| Size | Example | Fits one session? |
|------|---------|-------------------|
| Small | Fix one API bug | Yes, can do 2-3 |
| Medium | Complete one page's data integration | Yes, ideal size |
| Large | Entire strategy module front+back | No, split into 2-3 |

### Cross-Repo Coordination

Claude can read all four project directories simultaneously:
- Backend (work): `/Users/.../moow-api-express/`
- Frontend (work): `/Users/.../moow-web-next/`
- Old frontend (reference): `/Users/.../moow-web/`
- Old backend (reference): `/Users/.../moow-api/`

## Current Status Audit

### Infrastructure (Tickets 101-200, 201-300) — COMPLETE

All foundation work is done in both projects:
- Express 5 project structure, routing, controllers, services
- Swagger, JWT, email service, cron jobs, logger, formatting
- Next.js 15 initialization, Layout, TypeScript, i18n, App Router

### User Module (Tickets 401-500) — MOSTLY COMPLETE

| Ticket | Status | Notes |
|--------|--------|-------|
| Backend 403-414, 419, 426 | Done | Signup, login, captcha, activation, password reset, profile, logout |
| Frontend 401-410, 413, 418, 425 | Done | All auth pages exist in moow-web-next |
| Frontend 417 (assets page) | Skeleton | Page exists but no data integration |
| Frontend 423-424 (invite/poster) | Skeleton | Page exists but not functional |

### Strategy Module (Tickets 501-600) — PARTIALLY COMPLETE

| Ticket | Status | Notes |
|--------|--------|-------|
| Backend 503, 504, 508-511, 513 | Done | Strategy CRUD + order endpoints implemented |
| Backend 512-513 (cron jobs) | Done w/ bugs | Hardcoded order params in strategyService.js line 314 |
| Frontend 501-504 (list page) | Partial | List exists but incomplete data display |
| Frontend 505-531 (detail/create) | Skeleton | Page scaffolds exist, form logic + API integration incomplete |
| Frontend 532 (i18n) | Not done | Hardcoded Chinese text in some pages |

### Exchange Keys (Tickets 601-700) — PARTIALLY COMPLETE

| Ticket | Status | Notes |
|--------|--------|-------|
| Backend 604, 606, 609, 611, 612 | Done | Key CRUD + CCXT validation implemented |
| Frontend 603-613 | Skeleton | Pages exist but functionality incomplete |

### Orders (Tickets 701-800) — PARTIALLY COMPLETE

| Ticket | Status | Notes |
|--------|--------|-------|
| Backend | Done | Order endpoints implemented |
| Frontend | Not done | No standalone order pages (only partial display in strategy detail) |

### Homepage (Tickets 301-400) — NOT STARTED

| Ticket | Status | Notes |
|--------|--------|-------|
| Frontend 301, 304 | Not done | Real-time chart, static page rebuild |
| Backend 302, 303 | Not done | Data query with cache, BTC history cron |

## Execution Plan

### Phase 1: Backend Fixes (2 sessions)

| Session | Tickets | Work |
|---------|---------|------|
| S1 | 512 fix | Fix hardcoded order params in strategyService + add min amount/balance validation |
| S2 | 609 enhance | Integrate RSA encryption into strategy execution flow + fix API route typos |

### Phase 2: Frontend Core Pages (5-6 sessions)

| Session | Tickets | Work |
|---------|---------|------|
| S3 | 501, 504 | Strategy list page: profit display, pagination, real-time data |
| S4 | 505-526 | ~~Create/edit strategy page: form, validation, submission~~ DONE (PR #95) |
| S5 | 529 | ~~Create strategy frontend-backend integration~~ DONE (PR #99) |
| S6 | 507, 528, 531 | Strategy detail page + order display + integration |
| S7 | 603-613 | Exchange key management complete flow |
| S8 | 701-800 | Order history: list, detail, statistics |

### Phase 3: Supporting Pages + Polish (3-4 sessions)

| Session | Tickets | Work |
|---------|---------|------|
| S9 | 417 | User assets page |
| S10 | 423-424 | Invite system + poster generation |
| S11 | 301-304 | Homepage: live chart + static page rebuild |
| S12 | 532 + global | i18n completion + responsive layout + test coverage |

**Total: ~12 Claude sessions to complete migration.**

## Completed Sessions

<!-- Append after each Claude session -->
<!-- Format:
### S[N] — YYYY-MM-DD: [Feature Name]
- **Repo:** moow-api-express / moow-web-next
- **Tickets:** [list]
- **What was done:** [description]
- **PR:** #[number]
- **Remaining issues:** [if any]
-->

### S1 — 2026-02-14: Fix Strategy Execution
- **Repo:** moow-api-express
- **Tickets:** 512 fix
- **What was done:**
  - Fixed hardcoded buy order params in `strategyService.js` — now uses `strategy.symbol`, type, side, amount, price instead of `'EOS/USDT', 'limit', 'buy', 50, 0.15`
  - Fixed hardcoded sell order params in `awaitService.js` — now uses `strategy.symbol`, type, side, `strategy.now_quote_total` instead of `'EOS/USDT', 'limit', 'sell', 10, 2`
  - Added minimum order validation via `exchange.loadMarkets()` — checks both minimum cost and minimum amount against exchange limits
  - Added `AIP_BELOW_MINIMUM_ORDER (12008)` status code with EN/ZH messages
  - Fixed `app.logger.info` → `logger.info` bug in `awaitService.js` (leftover from Egg.js migration)
  - Fixed route typo `/api/v1/openOders` → `/api/v1/openOrders` in `orderRoutes.js`
  - Updated mock CCXT helper with realistic `loadMarkets` / `markets` data
  - Added comprehensive unit tests for `awaitService.sellOnThirdParty()` (5 test cases)
  - Updated `processBuy` tests to verify correct order parameters and minimum validation
  - All 122 tests passing (13 suites)
- **PR:** #106
- **Remaining issues:**
  - Exchange credentials still stored in plaintext (S2 scope — RSA encryption integration)
  - Value averaging sell strategy not implemented (future scope)
  - User ownership validation still commented out in `partiallyUpdateStrategy`

### S2 — 2026-02-14: RSA Encryption Integration
- **Repo:** moow-api-express
- **Tickets:** 609 enhance
- **What was done:**
  - Fixed `cryptoUtils.decrypt()` bug — was returning `base64` instead of `utf8`, which would produce garbled API keys
  - Integrated RSA encryption into `strategyService.createStrategy()` — key/secret are now encrypted before storing to DB
  - Integrated RSA decryption into `strategyService.processBuy()` and `processSell()` — credentials decrypted before creating CCXT instance
  - Integrated RSA decryption into `awaitService.sellOnThirdParty()` — same decryption pattern
  - Fixed `authService.js` error logging — replaced `console.error` with `logger.error` on email send failures (lines 182, 269)
  - Fixed `authService.js` moment.js usage — replaced `moment(fromTime).add(1, 'days')` with `dayjs(fromTime).add(1, 'day')` (line 309)
  - Removed stale `console.log(html)` in `authService.sendRetrieveEmail()`
  - Updated CLAUDE.md known issues — removed all resolved items from S1 and S2
  - Added encryption/decryption tests for strategyService and awaitService
  - Added activateUser inviter VIP extension test (validates dayjs fix)
  - Added sendActivateEmail error logging test
  - All 126 tests passing (13 suites)
- **PR:** #107
- **Remaining issues:**
  - Value averaging sell strategy not implemented (future scope)
  - User ownership validation still commented out in `partiallyUpdateStrategy`
  - Inviter reward token transfer not implemented (pending assets module)

### S4 — 2026-02-14: Create/Edit Strategy Page
- **Repo:** moow-web-next
- **Tickets:** 505-526
- **What was done:**
  - Rewrote `addstrategy/page.tsx` with form validation, i18n, and MUI notifications
  - Replaced raw axios with HTTP client, added Snackbar/Alert for feedback
  - Added period translation keys (hour_0-23, weekdays, day_1-28) to en.json and zh.json
  - Removed key/secret from form data (security concern)
  - Fixed CSS class references and duplicate validation errors
  - All 81 tests passing
- **PR:** #95
- **Remaining issues:**
  - Static symbol list (fetchExchangeSymbolList) — needs API integration (S5 scope)
  - Strategy detail response shape mismatch (S5 scope)

### S5 — 2026-02-14: Create Strategy Frontend-Backend Integration
- **Repo:** moow-web-next
- **Tickets:** 529
- **What was done:**
  - Replaced static `fetchExchangeSymbolList()` with dynamic `GET /v1/symbols` API call
  - Symbols fetched once on mount, cached in `useRef`, filtered by exchange on selection
  - Fixed strategy detail response shape: `res.data.info` instead of `res.data`
  - Added `key`/`secret` fields to form data for strategy creation payload
  - Separated create vs update payloads — update only sends editable fields per backend validator
  - Added `secret_key` to `UserMarketItem` and `exchange` to `SymbolItem` interfaces
  - Properly cast `type`/`period` as `String()` when loading from strategy detail
  - All 94 tests passing (12 suites)
- **PR:** #99
- **Remaining issues:**
  - Key masking mismatch: `GET /v1/keys` returns masked keys but `POST /v1/strategies` requires raw keys. Backend needs modification to look up keys by `user_market_id` during strategy creation (backend session needed)
  - Value averaging sell strategy not implemented (future scope)

### S6 — 2026-02-14: Strategy Detail Page Enhancement
- **Repo:** moow-web-next
- **Tickets:** 507, 528, 531
- **What was done:**
  - Added manual buy button (`POST /v1/strategies/:id/execute-buy`) with confirmation dialog
  - Added manual sell button (`POST /v1/strategies/:id/execute-sell`) with confirmation dialog
  - Added strategy status badge (running/stopped) with color-coded display
  - Added edit button linking to strategy edit page
  - Buttons disabled when strategy is stopped or action is in progress
  - Added loading state during buy/sell execution
  - Added `strategy.*` i18n keys to both zh.json and en.json (9 keys each)
  - Added action bar CSS with status badge styles
  - Changed `StrategyDetail.status` type from `string` to `number` for proper comparison
  - All 94 tests passing (12 suites)
- **PR:** #98
- **Remaining issues:**
  - Strategy detail page already had: info display, chart, order table, pagination, stats (from prior work)
  - No test for the new manual buy/sell buttons (page-level tests not in scope per test config)

## Best Practices for Working with Claude

### Prompt Template

```
## Task
Continue migration work, complete module [S3: Strategy List Page].

## Context
- Read docs/plans/2026-02-14-migration-strategy-design.md for current progress
- Old Vue code reference: /Users/.../moow-web/src/views/aip/plans.vue
- New frontend working directory: /Users/.../moow-web-next/

## Requirements
- Match old project functionality using new API format (/api/v1/...)
- Follow existing code style and component patterns
- Update migration-strategy-design.md when done
```

### Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Too much in one session | Stick to "one PR = one session" |
| Claude loses context | Always have it read this tracker first |
| Changing both repos | One repo per session |
| Merging without tests | Have Claude run tests before PR |
| Skipping old code reference | Always provide old project file paths |

### Session Continuity

```
Session N ends:
  1. Claude updates this document → records what was done
  2. Claude creates PR
  3. You review and merge

Session N+1 starts:
  1. Claude auto-reads CLAUDE.md → project knowledge
  2. You point it to this document → progress state
  3. Claude knows what to do next
```

## Known Backend Issues (from CLAUDE.md)

These should be addressed in Phase 1:

1. **Hardcoded test orders:** strategyService.js line 314, awaitService.js line 67
2. **Exchange credentials plaintext:** strategyService.js lines 258-260, awaitService.js line 52
3. **No minimum amount validation:** strategyService.js line 312
4. **No balance check:** strategyService.js line 295
5. **Route typo:** `/api/v1/openOders` should be `/api/v1/openOrders`
6. **Error logging missing:** authService.js lines 182, 269
7. **Inviter reward incomplete:** authService.js line 312
