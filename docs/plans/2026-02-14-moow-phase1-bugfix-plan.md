# Moow Phase 1 — Code Review Bugfix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical and important bugs discovered during Phase 1 code review, referencing old Egg.js implementation patterns.

**Scope:** 4 fixes across moow-api-express (backend only). All changes are in the `app/` directory.

**Design Doc:** `docs/plans/2026-02-14-moow-phase1-migration-design.md`

---

## Fix 1: Add `expect_growth_rate` to Strategy Model (C2)

**Priority:** Critical
**Root Cause:** `expect_growth_rate` field is used in both `processSell()` (line 516, has `|| 0.008` fallback) and `_valueAveraging()` (line 734, NO fallback → causes NaN). The field was never defined in the Mongoose schema, so it's always `undefined` for existing documents.

**Files:**
- Modify: `app/models/aipStrategyModel.js`

**Changes:**

Add `expect_growth_rate` field to the schema, after the `type` field (around line 43):

```javascript
    expect_growth_rate: { type: Number, default: 0.008 }, // Expected growth rate for value averaging (default 0.8%)
```

**Why 0.008:** The old code comment in `_valueAveraging()` says "如果是0.8%(0.008), 表示标的每日预期增长0.8%". The `processSell()` fallback also uses `0.008`. This ensures both existing documents (via schema default) and new documents have a valid value.

**Verification:**
- `_valueAveraging()` line 734: `(1 + strategy.expect_growth_rate)` will now resolve to `1.008` instead of `NaN`
- `processSell()` line 516: The `|| 0.008` fallback becomes redundant but harmless

---

## Fix 2: Value Averaging Sell — Partial Sell Instead of Full Sell (C1)

**Priority:** Critical
**Root Cause:** In `processSell()` (line 518-525), the intelligent strategy branch correctly computes `sellAmount` (the excess above expected value), but never passes it downstream. The call chain is:

```
processSell() → sellout(strategy)     ← sellAmount not passed
             → createAwait(conditions) ← no sell_amount field
             → sellAllOrders()
               → sellOnThirdParty(strategy, awaitOrder) ← sells strategy.now_quote_total (ALL holdings)
```

This means an intelligent strategy that should only sell the excess (e.g., 10% above expected) will instead sell ALL holdings — a catastrophic error.

**Old Code Reference:** The old Egg.js code did NOT implement value averaging sell at all (only standard stop_profit + drawdown). The TODO comment in `_valueAveraging()` (line 736) confirms this: "TODO In theory, value averaging sell strategy means selling the portion that exceeds the expected value". So this is a new feature that needs to be implemented correctly.

**Files:**
- Modify: `app/models/aipAwaitModel.js`
- Modify: `app/services/strategyService.js`
- Modify: `app/services/awaitService.js`

### Step 1: Add `sell_amount` field to AipAwaitModel

In `app/models/aipAwaitModel.js`, add a new field to the schema (after `sell_price` on line 11):

```javascript
    sell_amount: { type: Number, default: 0 }, // Partial sell amount (for intelligent strategy value averaging)
```

### Step 2: Modify `sellout()` to accept optional sell amount

In `app/services/strategyService.js`, change `sellout()` (line 584) from:

```javascript
  async sellout(strategy) {
    const conditions = {
      strategy_id: strategy._id,
      user: strategy.user,
      sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
      await_status: AipAwaitModel.STATUS_WAITING,
    };
```

To:

```javascript
  async sellout(strategy, sellAmount = 0) {
    const conditions = {
      strategy_id: strategy._id,
      user: strategy.user,
      sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
      await_status: AipAwaitModel.STATUS_WAITING,
      sell_amount: sellAmount,
    };
```

### Step 3: Pass `sellAmount` in processSell() intelligent branch

In `app/services/strategyService.js`, change line 525 from:

```javascript
        return await this.sellout(strategy);
```

To:

```javascript
        return await this.sellout(strategy, sellAmount);
```

### Step 4: Modify `sellOnThirdParty()` to support partial sell

In `app/services/awaitService.js`, change the sell amount logic (line 75-80) from:

```javascript
    const type = 'market';
    const side = 'sell';
    const orderRes = await exchange.createOrder(
      strategy.symbol,
      type,
      side,
      strategy.now_quote_total
    );
```

To:

```javascript
    const type = 'market';
    const side = 'sell';
    // Use partial sell amount if specified (intelligent strategy), otherwise sell all
    const amount = awaitOrder.sell_amount > 0 ? awaitOrder.sell_amount : strategy.now_quote_total;
    const orderRes = await exchange.createOrder(
      strategy.symbol,
      type,
      side,
      amount,
    );
```

### Step 5: Handle partial sell post-order logic

In `app/services/awaitService.js`, the post-sell logic (lines 132-154) needs a new branch for partial sells. Change the auto-sell branch from:

```javascript
      if (awaitOrder.sell_type === AipAwaitModel.SELL_TYPE_AUTO_SELL) {
        // auto_create filed is not in the strategy module
        if (strategy.auto_create === 'Y') {
          strategy.now_base_total = 0;
          strategy.now_buy_times = 0;
          strategy.value_total = 0;
          logger.info(
            `Automatically restart after selling:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `
          );
        } else {
          strategy.status = AipStrategyModel.STRATEGY_STATUS_CLOSED;
          strategy.stop_reason = 'profit auto sell';
          logger.info(
            `Automatically close after selling:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `
          );
        }
      }
```

To:

```javascript
      if (awaitOrder.sell_type === AipAwaitModel.SELL_TYPE_AUTO_SELL) {
        // Partial sell (intelligent strategy value averaging) — keep strategy open
        if (awaitOrder.sell_amount > 0) {
          strategy.quote_total -= orderInfo.amount;
          strategy.now_quote_total -= orderInfo.amount;
          logger.info(
            `Partial sell completed (value averaging):\n Investment ID: \t${strategy._id}\n Sold Amount: \t${orderInfo.amount}\n Remaining: \t${strategy.quote_total}\n`,
          );
        } else if (strategy.auto_create === 'Y') {
          // auto_create filed is not in the strategy module
          strategy.now_base_total = 0;
          strategy.now_buy_times = 0;
          strategy.value_total = 0;
          logger.info(
            `Automatically restart after selling:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `,
          );
        } else {
          strategy.status = AipStrategyModel.STRATEGY_STATUS_CLOSED;
          strategy.stop_reason = 'profit auto sell';
          logger.info(
            `Automatically close after selling:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `,
          );
        }
      }
```

**Key Design Decisions:**
- Partial sell only deducts from `quote_total` and `now_quote_total` — does NOT close the strategy or reset counters
- The strategy remains `STRATEGY_STATUS_NORMAL` so it can continue buying and potentially sell excess again
- `orderInfo.amount` (actual amount filled by exchange) is used instead of the requested `sell_amount`, because the exchange may fill a slightly different amount due to precision/fees

### Step 6: Update sell order record for partial sell

In `app/services/awaitService.js`, the `newOrder` object (lines 97-124) computes `funds` and `value_total` using `strategy.now_quote_total`. For partial sells, these should use the actual sell amount. Change:

```javascript
        funds: strategy.now_quote_total * orderInfo.average,
```

To:

```javascript
        funds: orderInfo.amount * orderInfo.average,
```

This is correct for both full and partial sells since `orderInfo.amount` is the actual amount sold.

**Verification:**
- Intelligent strategy with excess above expected value → only the excess amount gets sold
- Regular strategy sell behavior is unchanged (`sell_amount` defaults to 0, falls through to `strategy.now_quote_total`)
- Delete-sell behavior is unchanged (uses `SELL_TYPE_DEL_INVEST`, not affected by this logic)

---

## Fix 3: `getSummary()` — Use Live Prices Instead of Stale `sell_price` (I2)

**Priority:** Important
**Root Cause:** `getSummary()` (line 688) computes portfolio value as `(s.quote_total || 0) * (s.sell_price || 0)`. The `sell_price` field defaults to 0 and is only set when a sell is executed. For active strategies that have never sold, this always produces `totalValue = 0`, making the summary useless.

**Old Code Reference:** The old Egg.js `getSummary()` in `moow-api/app/service/dingtou.js` fetched live prices from the `DataExchangeSymbol` table:
```javascript
// Old code pattern:
const price = await ctx.model.DataExchangeSymbol.findOne({ exchange, symbol }).sort({ percent: -1 });
s.price_native = price.price_native;
```

The new `getAllStrategies()` (lines 56-69) already implements this exact pattern with batch lookup. We should reuse it.

**Files:**
- Modify: `app/services/strategyService.js`

**Changes:**

Replace the `getSummary()` method (lines 677-701) with:

```javascript
  /**
   * Get summary of all user's active strategies
   * @param {string} userId - The user id
   * @returns {Object} Summary statistics
   */
  async getSummary(userId) {
    const strategies = await AipStrategyModel.find({
      user: userId,
      status: AipStrategyModel.STRATEGY_STATUS_NORMAL,
    }).lean();

    // Batch-fetch live symbol prices (same pattern as getAllStrategies)
    const uniquePairs = [];
    const pairSet = new Set();
    for (const s of strategies) {
      const key = `${s.exchange}:${s.symbol}`;
      if (!pairSet.has(key)) {
        pairSet.add(key);
        uniquePairs.push({ exchange: s.exchange, symbol: s.symbol });
      }
    }

    const symbolLookup = {};
    if (uniquePairs.length > 0) {
      const symbolDocs = await DataExchangeSymbolModel.find({
        $or: uniquePairs.map((p) => ({ exchange: p.exchange, symbol: p.symbol })),
      })
        .sort({ percent: -1 })
        .lean();
      for (const doc of symbolDocs) {
        const lookupKey = `${doc.exchange}:${doc.symbol}`;
        if (!symbolLookup[lookupKey]) {
          symbolLookup[lookupKey] = doc;
        }
      }
    }

    let totalInvested = 0;
    let totalValue = 0;

    for (const s of strategies) {
      totalInvested += s.base_total || 0;
      const lookupKey = `${s.exchange}:${s.symbol}`;
      const symbolPrice = symbolLookup[lookupKey];
      const livePrice = symbolPrice ? parseFloat(symbolPrice.price_native) : 0;
      totalValue += (s.quote_total || 0) * livePrice;
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

**Verification:**
- Active strategies now show real-time portfolio value based on live market prices
- Strategies with no matching symbol data get price 0 (same fallback as `getAllStrategies`)
- `DataExchangeSymbolModel` is already imported at line 7 — no new imports needed

---

## Fix 4: `getPublicOrders()` — Restrict Exposed Fields (I1)

**Priority:** Important
**Root Cause:** `getPublicOrders()` (line 707-713) returns full order documents including `strategy_id`, `mid` (exchange key ID), internal counters (`base_total`, `quote_total`, `buy_times`, etc.), and all fields via `.lean()`. This is a public endpoint (no auth) meant for the homepage chart — it should only expose what's needed for display.

**Files:**
- Modify: `app/services/strategyService.js`

**Changes:**

Replace `getPublicOrders()` (lines 707-713) with:

```javascript
  /**
   * Get public DCA order data for homepage chart
   * @returns {Object} Recent buy orders list
   */
  async getPublicOrders() {
    const orders = await AipOrderModel.find({ side: 'buy' })
      .select('symbol price amount side created_at')
      .sort({ created_at: -1 })
      .limit(20)
      .lean();
    return { list: orders };
  }
```

**Verification:**
- Only `symbol`, `price`, `amount`, `side`, `created_at` (and `_id` by default) are returned
- Internal fields like `strategy_id`, `mid`, `base_total`, `quote_total`, `profit`, `profit_percentage` are excluded
- Frontend homepage chart only needs symbol + price + amount + time — this is sufficient

---

## Execution Order

These fixes have dependencies and should be applied in this order:

1. **Fix 1** (C2: `expect_growth_rate` in model) — standalone, no dependencies
2. **Fix 2** (C1: partial sell flow) — depends on Fix 1 being in place (so value averaging sell works correctly)
3. **Fix 3** (I2: `getSummary` live prices) — standalone, no dependencies
4. **Fix 4** (I1: `getPublicOrders` projection) — standalone, no dependencies

Fixes 1, 3, and 4 can be applied in parallel. Fix 2 should go after Fix 1.

---

## Test Updates

After applying fixes, update existing tests:

### Unit tests to add/update:
- `tests/unit/services/strategyService.test.js`:
  - Add test for `processSell()` intelligent strategy: verify `sellout()` is called with `sellAmount`
  - Update `getSummary()` tests to mock `DataExchangeSymbolModel.find()` instead of `sell_price`
  - Update `getPublicOrders()` test to verify `.select()` is called

- `tests/unit/services/awaitService.test.js`:
  - Add test for `sellOnThirdParty()` partial sell: verify `amount` uses `awaitOrder.sell_amount`
  - Add test for partial sell post-order logic: verify strategy remains `NORMAL` and `quote_total` is decremented

### Verification commands:
```bash
cd /path/to/moow-api-express
npm test -- --testPathPatterns=strategyService
npm test -- --testPathPatterns=awaitService
npm test
```

---

## Deferred to Phase 2

The following issues from the code review are NOT addressed in this fix:

| ID | Issue | Reason |
|----|-------|--------|
| I3 | Missing integration tests for protected arbitrage endpoints | Phase 2 test expansion |
| I4 | Ticker scheduler error count resets on single success | Low risk, requires design discussion |
| I5 | Frontend minProfit input restarts interval (needs debounce) | Frontend, separate PR |
| M1-M7 | Minor issues (toFixed precision, CSS selector, aria-labels, etc.) | Low priority |
