jest.mock('../../../app/models/purchaseModel');
jest.mock('../../../app/models/portalUserModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const PurchaseModel = require('../../../app/models/purchaseModel');
const PortalUserModel = require('../../../app/models/portalUserModel');
const PurchaseService = require('../../../app/services/purchaseService');
const CustomError = require('../../../app/utils/customError');

describe('PurchaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PurchaseModel.STATUS_WAITING = 'waiting';
    PurchaseModel.STATUS_SUCCESS = 'success';
    PurchaseModel.STATUS_FAIL = 'fail';
    PurchaseModel.STATUS_INVALID = 'invalid';
  });

  describe('submit()', () => {
    it('should create purchase with user info', async () => {
      const mockUser = { email: 'test@test.com', ref: 'ABC123' };
      PortalUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      PurchaseModel.mockImplementation((data) => ({
        ...data,
        _id: 'purchase123',
        save: mockSave,
      }));

      const result = await PurchaseService.submit('user123', {
        eth_address: '0xabc',
        tx_hash: '0xdef',
        amount: '1.5',
      });

      expect(result).toEqual({ _id: 'purchase123' });
      expect(mockSave).toHaveBeenCalled();
      expect(PortalUserModel.findById).toHaveBeenCalledWith('user123');
    });

    it('should handle missing user gracefully', async () => {
      PortalUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      PurchaseModel.mockImplementation((data) => ({
        ...data,
        _id: 'purchase456',
        save: mockSave,
      }));

      const result = await PurchaseService.submit('user123', {
        eth_address: '0xabc',
        tx_hash: '0xdef',
        amount: '1.5',
      });

      expect(result).toEqual({ _id: 'purchase456' });
    });
  });

  describe('getAllPurchases()', () => {
    it('should return paginated list', async () => {
      PurchaseModel.countDocuments.mockResolvedValue(2);
      PurchaseModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ _id: '1' }, { _id: '2' }]),
            }),
          }),
        }),
      });

      const result = await PurchaseService.getAllPurchases({ pageNumber: 1, pageSize: 10 });

      expect(result.total).toBe(2);
      expect(result.list).toHaveLength(2);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should apply keyword search filter', async () => {
      PurchaseModel.countDocuments.mockResolvedValue(1);
      PurchaseModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ _id: '1' }]),
            }),
          }),
        }),
      });

      await PurchaseService.getAllPurchases({ keyword: '0xabc' });

      expect(PurchaseModel.find).toHaveBeenCalledWith({
        $or: [
          { eth_address: { $regex: '0xabc', $options: 'i' } },
          { tx_hash: { $regex: '0xabc', $options: 'i' } },
          { email: { $regex: '0xabc', $options: 'i' } },
        ],
      });
    });

    it('should use default pagination when not provided', async () => {
      PurchaseModel.countDocuments.mockResolvedValue(0);
      PurchaseModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await PurchaseService.getAllPurchases();

      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('getPurchaseById()', () => {
    it('should return purchase when found', async () => {
      const mockPurchase = { _id: 'p1', eth_address: '0xabc', amount: '1.0' };
      PurchaseModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockPurchase),
        }),
      });

      const result = await PurchaseService.getPurchaseById('p1');

      expect(result).toEqual(mockPurchase);
    });

    it('should throw CustomError when not found', async () => {
      PurchaseModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(PurchaseService.getPurchaseById('nonexistent')).rejects.toThrow(CustomError);
    });
  });

  describe('updatePurchase()', () => {
    it('should update status and comment', async () => {
      const mockPurchase = {
        _id: 'p1',
        status: 'waiting',
        comment: '',
        save: jest.fn().mockResolvedValue(true),
      };
      PurchaseModel.findById.mockResolvedValue(mockPurchase);

      const result = await PurchaseService.updatePurchase('p1', {
        status: 'success',
        comment: 'Approved',
      });

      expect(mockPurchase.status).toBe('success');
      expect(mockPurchase.comment).toBe('Approved');
      expect(mockPurchase.save).toHaveBeenCalled();
      expect(result).toEqual({ _id: 'p1' });
    });

    it('should throw CustomError when purchase not found', async () => {
      PurchaseModel.findById.mockResolvedValue(null);

      await expect(PurchaseService.updatePurchase('nonexistent', {})).rejects.toThrow(CustomError);
    });
  });

  describe('promotePurchase()', () => {
    it('should calculate VIP duration with 20% bonus for >= 2 months', async () => {
      const now = new Date();
      const mockPurchase = {
        _id: 'p1',
        user: 'user1',
        amount: '1',
        status: 'waiting',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = {
        _id: 'user1',
        email: 'test@test.com',
        vip_time_out_at: null,
        save: jest.fn().mockResolvedValue(true),
      };

      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PortalUserModel.findById.mockResolvedValue(mockUser);

      const result = await PurchaseService.promotePurchase('p1');

      // amount=1, addMonths = 1*10 = 10, >= 2 so bonus: floor(10*1.2) = 12
      expect(mockPurchase.status).toBe('success');
      expect(mockPurchase.save).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result._id).toBe('p1');
      expect(result.vip_time_out_at).toBeInstanceOf(Date);
    });

    it('should not apply bonus when addMonths < 2', async () => {
      const mockPurchase = {
        _id: 'p2',
        user: 'user2',
        amount: '0.1',
        status: 'waiting',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = {
        _id: 'user2',
        email: 'test2@test.com',
        vip_time_out_at: null,
        save: jest.fn().mockResolvedValue(true),
      };

      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PortalUserModel.findById.mockResolvedValue(mockUser);

      const result = await PurchaseService.promotePurchase('p2');

      // amount=0.1, addMonths = 0.1*10 = 1, < 2 so no bonus
      expect(result._id).toBe('p2');
      expect(result.vip_time_out_at).toBeInstanceOf(Date);
    });

    it('should extend from existing VIP date if still valid', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const mockPurchase = {
        _id: 'p3',
        user: 'user3',
        amount: '0.5',
        status: 'waiting',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = {
        _id: 'user3',
        email: 'test3@test.com',
        vip_time_out_at: futureDate,
        save: jest.fn().mockResolvedValue(true),
      };

      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PortalUserModel.findById.mockResolvedValue(mockUser);

      const result = await PurchaseService.promotePurchase('p3');

      // Should extend from futureDate, not from now
      expect(result.vip_time_out_at.getTime()).toBeGreaterThan(futureDate.getTime());
    });

    it('should throw when purchase not found', async () => {
      PurchaseModel.findById.mockResolvedValue(null);

      await expect(PurchaseService.promotePurchase('nonexistent')).rejects.toThrow(CustomError);
    });

    it('should throw when user not found', async () => {
      const mockPurchase = { _id: 'p4', user: 'user4', amount: '1' };
      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PortalUserModel.findById.mockResolvedValue(null);

      await expect(PurchaseService.promotePurchase('p4')).rejects.toThrow(CustomError);
    });
  });
});
