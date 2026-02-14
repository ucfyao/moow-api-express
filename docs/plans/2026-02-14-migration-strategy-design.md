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
| S4 | 505-526 | Create/edit strategy page: form, validation, submission |
| S5 | 529 | Create strategy frontend-backend integration |
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

(No sessions completed yet)

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
