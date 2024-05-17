# moow-api-express

## Xiaobao.io - Your Crypto Concierge

Xiaobao.io is an intelligent investment advisory platform specifically developed for the cryptocurrency market. The platform offers users a range of practical functions, including one-click arbitrage, periodic investments, intelligent alerts, and volume-price analysis. Backed by a team of experienced quantitative investors and traders, Xiaobao.io also provides a variety of market-tested and effective quantitative trading strategies to choose from.

Investing with Xiaobao.io is easy, enabling you to earn money effortlessly.

## Key features

**1. Big Data Services**: Utilize extensive data analytics to inform your investment decisions and strategies.

**2. Indicator Screening**: Filter and select key indicators to make experienced trading choices.

**3. Intelligent Alerts**: Receive smart notifications and alerts based on market conditions and personal criteria.

**4. One-Click Investment**: Simplify your investment process with automated, periodic investments.

**5. Strategy Trading**: Use and apply different trading strategies that have been tested and proven to work in real market conditions.

**6. Cryptocurrency Fund Supermarket**: Explore and invest in a wide range of cryptocurrency funds.

## QuickStart

```
node.js v20.10.0
mongoDB v7.0.2
```

### Development

1. import initial datas(data/*.json) to mogodb

```
mongoimport --db xiaobao --collection portal_resource --file data/portal_resource.json --host 127.0.0.1:27017
mongoimport --db xiaobao --collection portal_user --file data/portal_user.json --host 127.0.0.1:27017
mongoimport --db xiaobao --collection common_config --file data/common_config.json --host 127.0.0.1:27017
mongoimport --db xiaobao --collection market --file data/markets.json --host 127.0.0.1:27017
```

2. start node backend

```bash
nvm use v20
$ npm i
$ npm run dev

$ open http://localhost:20003/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### test admin login user

yaozihao@yaozihao.com

### doc
```
cd doc
npm install gitbook-cli -g
gitbook serve

```

Open the browser and visit: http://localhost:4000/ to view the documentation.

