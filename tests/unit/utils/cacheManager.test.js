const { priceCache, rateCache, symbolCache } = require('../../../app/utils/cacheManager');

describe('cacheManager', () => {
  afterEach(() => {
    priceCache.flushAll();
    rateCache.flushAll();
    symbolCache.flushAll();
  });

  it('should set and get values from priceCache', () => {
    priceCache.set('test-key', { price: 50000 });
    const result = priceCache.get('test-key');
    expect(result).toEqual({ price: 50000 });
  });

  it('should return undefined for missing keys', () => {
    const result = priceCache.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should set and get values from rateCache', () => {
    rateCache.set('rate:USD:CNY', 7.25);
    expect(rateCache.get('rate:USD:CNY')).toBe(7.25);
  });

  it('should set and get values from symbolCache', () => {
    symbolCache.set('symbols:test', { list: [{ symbol: 'BTC/USDT' }] });
    const result = symbolCache.get('symbols:test');
    expect(result.list).toHaveLength(1);
  });

  it('should respect TTL and expire entries', async () => {
    // Create a cache with 1 second TTL for testing
    const NodeCache = require('node-cache');
    const testCache = new NodeCache({ stdTTL: 1, checkperiod: 1 });

    testCache.set('temp', 'value');
    expect(testCache.get('temp')).toBe('value');

    // Wait for TTL to expire
    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });
    expect(testCache.get('temp')).toBeUndefined();
  });
});
