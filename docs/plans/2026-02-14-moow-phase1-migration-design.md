# Moow Phase 1 迁移设计文档

**日期:** 2026-02-14
**范围:** 搬砖 (Arbitrage) + 定投 (DCA) 补齐
**方案:** 按层并行迁移 (方案 B)

---

## 1. 项目背景

### 1.1 旧项目

| 项目 | 技术栈 | 说明 |
|------|--------|------|
| moow-web | Vue 2 + Vuex + Bulma + Highcharts | 前端 SPA |
| moow-api | Egg.js + MongoDB + CCXT | 后端 API + 定时任务 |

### 1.2 新项目

| 项目 | 技术栈 | 说明 |
|------|--------|------|
| moow-web-next | Next.js 15 + React 19 + Zustand + Bulma + Highcharts | 前端 (App Router, CSR) |
| moow-api-express | Express 5 + Mongoose 8 + CCXT 4 + node-cron | 后端 API + 定时任务 |

### 1.3 当前迁移进度

| 模块 | 后端 | 前端 | 说明 |
|------|------|------|------|
| 用户认证 | 90% | 90% | 基本完整 |
| 定投 (DCA) | 90% | 90% | 核心功能可用，部分细节待补齐 |
| **搬砖 (Arbitrage)** | **0%** | **0%** | **本次迁移重点** |
| 指数基金 | 0% | stub | 不在 Phase 1 范围 |
| 资产管理 | 0% | 部分 | 不在 Phase 1 范围 |

---

## 2. Phase 1 迁移范围

### 2.1 搬砖模块 (从 0% → 100%)

从 moow-api (Egg.js) 迁移到 moow-api-express (Express)，从 moow-web (Vue `/hq/arbitrage`) 迁移到 moow-web-next (Next.js `/arbitrage`)。

**后端迁移清单：**
- 3 个 MongoDB Model (tickers, configs, caches)
- 1 个 Service (ArbitrageService)
- 1 个 Controller (arbitrageController)
- 1 个 Route 文件 (arbitrageRoutes)
- 1 个 Validator (arbitrageValidator)
- 1 个 Scheduler (tickerScheduler, 每 5 分钟)

**前端迁移清单：**
- `/arbitrage` 页面（套利机会列表 + 筛选）
- 配置管理面板（选择交易所/交易对，需登录）
- Navbar 导航更新（从外部链接改为内部路由）

### 2.2 定投模块补齐 (从 90% → 100%)

**后端补齐清单：**
- Value averaging sell 逻辑 (strategyService.js TODO)
- 用户权限校验修复 (strategyService.js 注释代码)
- `GET /strategies/:id/balance` API
- `GET /strategies/summary` API
- `GET /strategies/statistics` API

**前端补齐清单：**
- 首页定投 chart 接入真实 API (替换 DEMO_ORDERS)
- 旧 API 路径对齐 (`/pub/` → `/v1/`)

---

## 3. 搬砖模块详细设计

### 3.1 数据库 Models

**源文件映射：**
| 旧 Model (Egg.js) | 新 Model (Express) | Collection |
|-------------------|-------------------|------------|
| `app/model/arbitrage_ticker.js` | `app/models/arbitrageTickerModel.js` | `arbitrage_tickers` |
| `app/model/arbitrage_config.js` | `app/models/arbitrageConfigModel.js` | `arbitrage_configs` |
| `app/model/arbitrage_cache.js` | `app/models/arbitrageCacheModel.js` | `arbitrage_caches` |

**ArbitrageTickerModel Schema:**
```javascript
{
  exchange: { type: String, required: true },    // CCXT exchange id (如 "binance")
  symbol: { type: String, required: true },      // 交易对 (如 "BTC/USDT")
  ticker: {
    exchange: { type: String },
    symbol: { type: String },
    timestamp: { type: Number },
    datetime: { type: String },
    high: { type: Number },
    low: { type: Number },
    bid: { type: Number },       // 买一价
    bidVolume: { type: Number },
    ask: { type: Number },       // 卖一价
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
    info: { type: Mixed }
  }
}
// Indexes: { exchange: 1, symbol: 1 } unique, { updated_at: -1 }
// Collection: arbitrage_tickers
```

**ArbitrageConfigModel Schema:**
```javascript
{
  user_id: { type: ObjectId, ref: 'PortalUser', default: null }, // null = 全局配置
  exchanges: [{ type: String }],   // 选中的交易所列表
  symbols: [{ type: String }],     // 选中的交易对列表
}
// Index: { user_id: 1 }
// Collection: arbitrage_configs
```

**ArbitrageCacheModel Schema:**
```javascript
{
  name: { type: String, required: true, unique: true },  // 缓存名称 (如 "allSymbols")
  content: [{ type: String }],                           // 缓存内容
}
// Collection: arbitrage_caches
```

### 3.2 API 路由设计

文件: `app/routes/arbitrageRoutes.js`

**公开路由 (无需登录):**
| Method | Path | Controller | 说明 |
|--------|------|-----------|------|
| GET | `/api/v1/arbitrage/tickers` | `getTickers` | 获取最近 5 分钟 ticker 数据 |
| GET | `/api/v1/arbitrage/opportunities` | `getOpportunities` | 获取套利机会 (diff > 1%) |
| GET | `/api/v1/arbitrage/tickers/by-exchange` | `getTickersByExchange` | 按交易所分组 ticker |
| GET | `/api/v1/arbitrage/tickers/by-symbol` | `getTickersBySymbol` | 按交易对分组 ticker |

**需登录路由 (authMiddleware):**
| Method | Path | Controller | 说明 |
|--------|------|-----------|------|
| GET | `/api/v1/arbitrage/config` | `getConfig` | 获取用户配置 |
| PUT | `/api/v1/arbitrage/config` | `saveConfig` | 保存交易所/交易对配置 |
| GET | `/api/v1/arbitrage/exchanges` | `getAllExchanges` | 获取 CCXT 支持的交易所 |
| GET | `/api/v1/arbitrage/symbols` | `getAllSymbols` | 获取缓存的交易对 |
| POST | `/api/v1/arbitrage/symbols/refresh` | `refreshSymbols` | 刷新交易对缓存 |

**Query 参数:**
- `GET /tickers`: `?minutes=5` (可选, 默认 5)
- `GET /opportunities`: `?minProfit=1` (可选, 默认 1)

### 3.3 Service 设计

文件: `app/services/arbitrageService.js`

```
class ArbitrageService {
  // === 公开方法 ===

  fetchTickers(minutes = 5)
    // 查询 arbitrage_tickers 中 updated_at > now - minutes
    // 返回: { tickers: [{ exchange, symbol, ticker }] }

  queryOpportunities(minProfit = 1)
    // 1. 查询最近 5 分钟 tickers
    // 2. 按 symbol 分组 (MongoDB aggregate)
    // 3. 对每个 symbol: 找 max(bid) 和 min(ask)
    // 4. 计算 diff = (maxBid - minAsk) / minAsk * 100
    // 5. 过滤 diff > minProfit, 且买卖在不同交易所
    // 返回: { list: [{ symbol, from, to, diff, rawdiff }] } 按 rawdiff 降序

  queryTickersByExchange()
    // MongoDB aggregate 按 exchange 分组
    // 返回: { list: [{ _id: exchange, tickers: [...] }] }

  queryTickersBySymbol()
    // MongoDB aggregate 按 symbol 分组
    // 返回: { list: [{ _id: symbol, tickers: [...] }] }

  // === 配置方法 (需登录) ===

  getConfig(userId)
    // 查询 arbitrage_configs where user_id = userId
    // 若无记录, 返回 { exchanges: [], symbols: [] }

  saveConfig(userId, { exchanges, symbols })
    // upsert arbitrage_configs where user_id = userId

  getAllExchanges()
    // 返回 ccxt.exchanges 列表 (同步方法)

  getAllSymbols()
    // 查询 arbitrage_caches where name = 'allSymbols'

  refreshSymbols()
    // 1. 读取全局配置的 exchanges
    // 2. 对每个 exchange 创建 CCXT 实例, loadMarkets()
    // 3. 收集所有 symbols, 去重
    // 4. 更新 arbitrage_caches
}
```

### 3.4 Ticker Scheduler

文件: `app/schedulers/tickerScheduler.js`

```
tickerScheduler:
  name: "tickerScheduler"
  cron: "*/5 * * * *"  (每 5 分钟执行)

  执行逻辑:
    1. 从 arbitrage_configs 读取全局配置 (user_id = null)
       - 获取 exchanges 列表和 symbols 列表
       - 若无全局配置, 使用默认列表 (binance, huobi, okx + BTC/USDT, ETH/USDT)
    2. 对每个 exchange:
       a. 检查 errorCount >= 3, 跳过
       b. 创建/复用 CCXT 实例 (无需 API key, 只读公共数据)
       c. 遍历每个 symbol:
          - 若 symbol 不在该交易所的 markets 中, 跳过
          - 调用 exchange.fetchTicker(symbol)
          - findOneAndUpdate upsert 到 arbitrage_tickers
       d. 成功: errorCount = 0
       e. 失败: errorCount++, 超过 3 次则删除实例
    3. 清理 30 分钟前的旧 ticker 数据

  错误处理:
    - DDoSProtection: 跳过, 计数
    - RequestTimeout: 跳过, 计数
    - AuthenticationError: 跳过, 计数
    - 其他: log, 计数
```

### 3.5 前端页面设计

文件: `src/app/arbitrage/page.tsx`

```
ArbitragePage ('use client')
│
├── 状态:
│   ├── opportunities: [] (从 API 获取)
│   ├── minProfit: 1 (筛选条件)
│   ├── lastUpdated: '' (最后更新时间)
│   └── loading: true
│
├── FilterBar (顶部筛选栏)
│   ├── 最小利润% 输入框
│   ├── 刷新按钮
│   └── 最后更新时间 + 自动刷新提示
│
├── OpportunityTable (套利机会列表)
│   ├── 列: Symbol | Buy From | Buy Price | Sell To | Sell Price | Diff%
│   ├── 按 Diff% 降序排列
│   ├── Diff% >= 3% 绿色高亮
│   └── 自动刷新 (30 秒 setInterval)
│
└── 样式: Bulma table + Emotion scoped CSS
    (保持与现有 /aip 页面一致)
```

**Navbar 更新:**
- 将 `<a href="/hq/arbitrage">` 外部链接改为 `<Link href="/arbitrage">` 内部路由

---

## 4. 定投补齐详细设计

### 4.1 Value Averaging Sell 逻辑

文件: `moow-api-express/app/services/strategyService.js`

```
executeSell(strategy) 补齐:
  当 strategy.type === INTELLIGENT (2):
    1. 获取当前价格 (fetchTicker → bidPrice)
    2. 计算预期价值:
       expectedValue = base_limit * buy_times * (1 + expect_growth_rate) ^ buy_times
    3. 计算当前价值:
       currentValue = quote_total * bidPrice
    4. 若 currentValue > expectedValue:
       excessValue = currentValue - expectedValue
       sellAmount = excessValue / bidPrice
       调用 sellout(strategy, sellAmount, bidPrice)
    5. 若 currentValue <= expectedValue:
       不卖出, 等待下次检查
    6. return (智能定投用价值卖出, 不走 stop_profit 逻辑)
```

注意: 智能定投的卖出逻辑与普通定投的 stop_profit 机制互斥。

### 4.2 用户权限校验修复

文件: `moow-api-express/app/services/strategyService.js` (line 148-150)

```
修复方案:
  1. 取消注释 userId 校验代码
  2. 在以下方法中添加 userId 参数并校验:
     - getStrategyById(id, userId): 校验 strategy.user.toString() !== userId → 403
     - partiallyUpdateStrategy: 校验 owner
     - deleteStrategy: 校验 owner
  3. 更新 strategyController.js 传入 req.userId
```

### 4.3 补齐 API 端点

**GET /api/v1/strategies/:id/balance**

```
来源: moow-api POST /member/dingtou/getBalance
逻辑:
  1. 查询 strategy, 校验 user ownership
  2. 查询关联的 exchange key
  3. 解密 API key/secret (RSA cryptoUtils)
  4. 创建 CCXT 实例
  5. 调用 fetchBalance()
  6. 返回 { free, used, total, currency } 的 quote currency 余额
```

**GET /api/v1/strategies/summary**

```
来源: moow-api POST /member/dingtou/getSummary
逻辑:
  1. 查询用户所有 NORMAL 状态的 strategies
  2. 聚合计算:
     - totalInvested: SUM(base_total)
     - totalValue: SUM(quote_total * sell_price)
     - totalProfit: totalValue - totalInvested
     - profitRate: totalProfit / totalInvested * 100
  3. 返回汇总数据
```

### 4.4 前端路径对齐

| 当前 (旧路径) | 目标 (新路径) | 文件 |
|--------------|-------------|------|
| `POST /pub/auth/retrievePassword` | `POST /api/v1/auth/passwordRecovery` | `src/app/forgetPassword/page.tsx` |
| `POST /pub/auth/resetPassword` | `PATCH /api/v1/auth/passwordReset` | `src/app/resetPassword/page.tsx` |
| `GET /api/pub/auth/svgCaptcha` | `GET /api/v1/captcha` | 两个页面都需修改 |
| `import axios` | `import HTTP from '@/lib/http'` | 两个页面都需改用统一 HTTP 客户端 |

### 4.5 首页 Chart 接入

文件: `moow-web-next/src/app/page.tsx`

```
当前状态: 已有 API 调用 + DEMO_ORDERS fallback
  HTTP.post('/v1/public/dingtou/orders', {})
    成功 → 用真实数据
    失败 → 用 DEMO_ORDERS

需要做:
  在 moow-api-express 添加对应的公开路由:
  POST /api/v1/public/dingtou/orders → 返回近期买入订单用于 chart 展示
```

---

## 5. 并行执行计划

```
时间线 →

线程 A (搬砖):
  A1. 后端: Status Codes
  A2. 后端: Models (3 个)
  A3. 后端: Service
  A4. 后端: Validator
  A5. 后端: Controller
  A6. 后端: Routes
  A7. 后端: tickerScheduler
  A8. 后端: Tests (unit + integration)
  A9. 前端: /arbitrage 页面
  A10. 前端: Navbar 更新
  A11. 前端: i18n 翻译

线程 B (定投补齐):
  B1. 后端: 用户权限校验修复
  B2. 后端: Value averaging sell 逻辑
  B3. 后端: balance/summary API
  B4. 前端: 旧 API 路径对齐
  B5. 前端/后端: 首页 chart 接入真实 API

依赖关系:
  A 内部: A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → A10 → A11
  B 内部: B1 → B2 → B3 → B4 → B5
  A 和 B 之间无依赖, 可完全并行
```

---

## 6. 文件变更清单

### 6.1 moow-api-express (后端)

**新增文件:**
| 文件 | 说明 |
|------|------|
| `app/models/arbitrageTickerModel.js` | Ticker 数据 Model |
| `app/models/arbitrageConfigModel.js` | 配置 Model |
| `app/models/arbitrageCacheModel.js` | 交易对缓存 Model |
| `app/services/arbitrageService.js` | 搬砖业务逻辑 |
| `app/controllers/arbitrageController.js` | 搬砖请求处理 |
| `app/routes/arbitrageRoutes.js` | 搬砖路由定义 |
| `app/validators/arbitrageValidator.js` | 搬砖输入校验 |
| `app/schedulers/tickerScheduler.js` | Ticker 定时任务 |
| `tests/unit/services/arbitrageService.test.js` | 搬砖单元测试 |
| `tests/integration/arbitrage.test.js` | 搬砖集成测试 |

**修改文件:**
| 文件 | 修改内容 |
|------|---------|
| `app/utils/statusCodes.js` | 新增 arbitrage 模块状态码 (15001-16000) |
| `app/routes/index.js` | 新增 Arbitrage Swagger tag |
| `app/services/strategyService.js` | Value averaging sell + 用户权限校验 + balance/summary/publicOrders |
| `app/controllers/strategyController.js` | 新增 getBalance/getSummary/getPublicOrders handler |
| `app/routes/strategyRoutes.js` | 新增 balance/summary/publicOrders 路由 |

### 6.2 moow-web-next (前端)

**新增文件:**
| 文件 | 说明 |
|------|------|
| `src/app/arbitrage/page.tsx` | 搬砖主页面 |

**修改文件:**
| 文件 | 修改内容 |
|------|---------|
| `src/components/Navbar.tsx` | 搬砖链接从外部 `<a>` 改为内部 `<Link>` |
| `public/locales/zh.json` | 新增搬砖相关翻译 |
| `public/locales/en.json` | 新增搬砖相关翻译 |
| `src/app/forgetPassword/page.tsx` | API 路径对齐 + 改用 HTTP 客户端 |
| `src/app/resetPassword/page.tsx` | API 路径对齐 + 改用 HTTP 客户端 |

---

## 7. 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 搬砖前端位置 | 集成到 Next.js `/arbitrage` | 不再维护独立 /hq/ 子应用 |
| 搬砖迁移范围 | 只迁移核心套利功能 | coin/exchange/news 不在 Phase 1 |
| 后端架构 | 保持 ticker watcher scheduler | 与旧逻辑一致, 复用 node-cron |
| 搬砖权限 | 查看公开, 配置需登录 | 与旧逻辑一致 |
| 迁移方案 | 按层并行 (方案 B) | 搬砖 + 定投并行, 每条线内后端优先 |
| CSS 方案 | Bulma + Emotion | 与现有 Next.js 页面一致 |
| Ticker 存储 | upsert 模式 (exchange+symbol unique) | 避免数据膨胀, 只保留最新快照 |
| 旧 ticker 清理 | 30 分钟自动清理 | 防止 MongoDB 数据无限增长 |

---

## 8. 不在 Phase 1 范围内

以下模块确认不在本次迁移中，记录为后续 Phase:

| 模块 | 当前状态 | 优先级 |
|------|---------|--------|
| 指数基金 (Fund) | 前端 stub, 后端无 | Phase 2 |
| 用户资产管理 (Assets) | 前端部分, 后端无 | Phase 2 |
| 文章/新闻系统 | 旧项目有, 新项目无 | Phase 3 |
| WeChat 集成 | 旧项目有, 新项目无 | Phase 3 |
| 管理后台 (Role/Permission) | 旧项目有, 新项目无 | Phase 3 |
| Coin/Exchange 数据页面 | 旧项目 /hq/ 子应用 | Phase 2 |
| 邀请奖励 Token 发放 | authService TODO | Phase 2 (依赖 Assets 模块) |
