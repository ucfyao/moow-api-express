jest.mock('ccxt');
jest.mock('../../../app/models/aipExchangeKeyModel');
jest.mock('../../../app/utils/cryptoUtils');

const ccxt = require('ccxt');
const AipExchangeKeyModel = require('../../../app/models/aipExchangeKeyModel');
const { decrypt, encrypt } = require('../../../app/utils/cryptoUtils');
const ExchangeKeyService = require('../../../app/services/exchangeKeyService');
const { createMockExchange, setupCcxtMock } = require('../../helpers/mockCcxt');

// Set model statics
AipExchangeKeyModel.KEY_STATUS_NORMAL = 1;
AipExchangeKeyModel.KEY_STATUS_CLOSED = 2;
AipExchangeKeyModel.KEY_STATUS_SOFT_DELETED = 3;

describe('ExchangeKeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllKeys()', () => {
    it('should return paginated keys with desensitized access/secret', async () => {
      const mockKeys = [
        {
          _id: 'key-1',
          exchange: 'binance',
          access_key: 'encrypted-access',
          secret_key: 'encrypted-secret',
          is_deleted: false,
        },
      ];

      AipExchangeKeyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockKeys),
            }),
          }),
        }),
      });
      // Separate find for count
      AipExchangeKeyModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockKeys),
            }),
          }),
        }),
      });
      AipExchangeKeyModel.find.mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(1),
      });

      decrypt.mockImplementation((val) => {
        if (val === 'encrypted-access') return 'abcdef123456789';
        if (val === 'encrypted-secret') return 'xyz987654321abc';
        return val;
      });

      const result = await ExchangeKeyService.getAllKeys({
        pageNumber: 1,
        pageSize: 10,
      });

      expect(result.list).toHaveLength(1);
      // Should show first 3 and last 3 chars
      expect(result.list[0].access_key).toBe('abc******789');
      expect(result.list[0].secret_key).toBe('xyz******abc');
      expect(result.total).toBe(1);
    });

    it('should filter deleted keys when showDeleted is true', async () => {
      AipExchangeKeyModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      AipExchangeKeyModel.find.mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(0),
      });

      await ExchangeKeyService.getAllKeys({ showDeleted: true });

      expect(AipExchangeKeyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ is_deleted: true })
      );
    });
  });

  describe('createKey()', () => {
    it('should validate key via CCXT and save encrypted', async () => {
      const mockExchange = createMockExchange();
      setupCcxtMock(ccxt, mockExchange);

      encrypt.mockImplementation((val) => `enc_${val}`);

      const mockSave = jest.fn().mockResolvedValue(true);
      AipExchangeKeyModel.mockImplementation((data) => ({
        ...data,
        _id: 'new-key-id',
        save: mockSave,
      }));

      const keyData = {
        exchange: 'binance',
        access_key: 'my-access-key',
        secret_key: 'my-secret-key',
        desc: 'Test key',
      };

      const result = await ExchangeKeyService.createKey(keyData);

      expect(mockExchange.fetchBalance).toHaveBeenCalled();
      expect(encrypt).toHaveBeenCalledWith('my-access-key');
      expect(encrypt).toHaveBeenCalledWith('my-secret-key');
      expect(keyData.secret_show).toBe('my-******key');
      expect(result.exchangeKey).toBeDefined();
      expect(result.validation).toBeDefined();
    });
  });

  describe('deleteKey()', () => {
    it('should soft delete key by setting is_deleted and status', async () => {
      AipExchangeKeyModel.findByIdAndUpdate.mockResolvedValue({ _id: 'key-1' });

      await ExchangeKeyService.deleteKey('key-1');

      expect(AipExchangeKeyModel.findByIdAndUpdate).toHaveBeenCalledWith('key-1', {
        is_deleted: true,
        status: AipExchangeKeyModel.KEY_STATUS_SOFT_DELETED,
      });
    });
  });

  describe('getKeyById()', () => {
    it('should return desensitized key', async () => {
      const mockKey = {
        _id: 'key-1',
        exchange: 'binance',
        access_key: 'enc-access',
        secret_key: 'enc-secret',
      };
      AipExchangeKeyModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockKey),
      });

      decrypt.mockImplementation((val) => {
        if (val === 'enc-access') return 'abcdefghijk';
        if (val === 'enc-secret') return 'xyz123456789';
        return val;
      });

      const result = await ExchangeKeyService.getKeyById('key-1');

      expect(result.access_key).toBe('abc******ijk');
      expect(result.secret_key).toBe('xyz******789');
    });

    it('should handle null key', async () => {
      AipExchangeKeyModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await ExchangeKeyService.getKeyById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
