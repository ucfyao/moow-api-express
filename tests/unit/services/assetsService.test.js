jest.mock('../../../app/models/assetsUserOrderModel');
jest.mock('../../../app/models/portalUserModel');
jest.mock('uuid', () => ({
  v1: jest.fn(() => 'mock-uuid-v1'),
}));
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const AssetsUserOrderModel = require('../../../app/models/assetsUserOrderModel');
const PortalUserModel = require('../../../app/models/portalUserModel');
const AssetsService = require('../../../app/services/assetsService');

describe('AssetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendToken()', () => {
    it('should successfully transfer tokens between users', async () => {
      const mockSender = {
        _id: 'sender1',
        email: 'sender@test.com',
        XBT: '100',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockRecipient = {
        _id: 'recipient1',
        email: 'recipient@test.com',
        XBT: '50',
        save: jest.fn().mockResolvedValue(true),
      };

      PortalUserModel.findById.mockResolvedValue(mockSender);
      PortalUserModel.findOne.mockResolvedValue(mockRecipient);

      const mockOrderSave = jest.fn().mockResolvedValue(true);
      AssetsUserOrderModel.mockImplementation((data) => ({
        ...data,
        save: mockOrderSave,
      }));

      const result = await AssetsService.sendToken({
        from: 'sender1',
        email: 'recipient@test.com',
        amount: '10',
        token: 'XBT',
        describe: 'Transfer',
        invitee: 'inv1',
        invitee_email: 'inv@test.com',
      });

      expect(result).toBeTruthy();
      expect(mockSender.XBT).toBe('90');
      expect(mockRecipient.XBT).toBe('60');
      expect(mockSender.save).toHaveBeenCalled();
      expect(mockRecipient.save).toHaveBeenCalled();
      expect(mockOrderSave).toHaveBeenCalled();
    });

    it('should return false when sender not found', async () => {
      PortalUserModel.findById.mockResolvedValue(null);
      PortalUserModel.findOne.mockResolvedValue({ _id: 'r1', XBT: '50' });

      const mockOrderSave = jest.fn().mockResolvedValue(true);
      AssetsUserOrderModel.mockImplementation((data) => ({
        ...data,
        save: mockOrderSave,
      }));

      const result = await AssetsService.sendToken({
        from: 'nonexistent',
        email: 'recipient@test.com',
        amount: '10',
        token: 'XBT',
        describe: 'Transfer',
      });

      expect(result).toBe(false);
      expect(mockOrderSave).toHaveBeenCalled();
    });

    it('should return false when recipient not found', async () => {
      PortalUserModel.findById.mockResolvedValue({
        _id: 's1',
        XBT: '100',
      });
      PortalUserModel.findOne.mockResolvedValue(null);

      const mockOrderSave = jest.fn().mockResolvedValue(true);
      AssetsUserOrderModel.mockImplementation((data) => ({
        ...data,
        save: mockOrderSave,
      }));

      const result = await AssetsService.sendToken({
        from: 's1',
        email: 'nonexistent@test.com',
        amount: '10',
        token: 'XBT',
        describe: 'Transfer',
      });

      expect(result).toBe(false);
      expect(mockOrderSave).toHaveBeenCalled();
    });

    it('should return false when sender has insufficient balance', async () => {
      const mockSender = {
        _id: 'sender2',
        email: 'sender@test.com',
        XBT: '5',
      };
      const mockRecipient = {
        _id: 'recipient2',
        email: 'recipient@test.com',
        XBT: '50',
      };

      PortalUserModel.findById.mockResolvedValue(mockSender);
      PortalUserModel.findOne.mockResolvedValue(mockRecipient);

      const mockOrderSave = jest.fn().mockResolvedValue(true);
      AssetsUserOrderModel.mockImplementation((data) => ({
        ...data,
        save: mockOrderSave,
      }));

      const result = await AssetsService.sendToken({
        from: 'sender2',
        email: 'recipient@test.com',
        amount: '10',
        token: 'XBT',
        describe: 'Transfer',
      });

      expect(result).toBe(false);
      expect(mockOrderSave).toHaveBeenCalled();
    });
  });

  describe('_createOrder()', () => {
    it('should create order with UUID', async () => {
      const mockOrderSave = jest.fn().mockResolvedValue(true);
      AssetsUserOrderModel.mockImplementation((data) => ({
        ...data,
        save: mockOrderSave,
      }));

      const result = await AssetsService._createOrder({
        from: 'sender1',
        to: 'recipient1',
        amount: '10',
        token: 'XBT',
        status: 'success',
      });

      expect(result.order_id).toBe('mock-uuid-v1');
      expect(mockOrderSave).toHaveBeenCalled();
    });
  });
});
