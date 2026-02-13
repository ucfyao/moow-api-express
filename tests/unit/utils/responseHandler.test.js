const ResponseHandler = require('../../../app/utils/responseHandler');

describe('ResponseHandler', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('success()', () => {
    it('should return default success response', () => {
      ResponseHandler.success(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        code: 0,
        message: 'Success',
        data: {},
      });
    });

    it('should return success response with custom data', () => {
      const data = { id: 1, name: 'test' };
      ResponseHandler.success(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        code: 0,
        message: 'Success',
        data,
      });
    });

    it('should return success response with custom HTTP status code', () => {
      ResponseHandler.success(res, {}, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        code: 0,
        message: 'Success',
        data: {},
      });
    });

    it('should return success response with custom business code', () => {
      ResponseHandler.success(res, {}, 200, 0, 'Custom message');

      expect(res.json).toHaveBeenCalledWith({
        code: 0,
        message: 'Custom message',
        data: {},
      });
    });
  });

  describe('fail()', () => {
    it('should return default error response', () => {
      ResponseHandler.fail(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: 50000,
        message: 'Internal Server Error',
        data: {},
      });
    });

    it('should return error response with custom HTTP status and business code', () => {
      ResponseHandler.fail(res, 400, 1004, 'Invalid parameters');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 1004,
        message: 'Invalid parameters',
        data: {},
      });
    });

    it('should return error response with data', () => {
      const data = { field: 'email' };
      ResponseHandler.fail(res, 400, 1004, 'Validation error', data);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 1004,
        message: 'Validation error',
        data,
      });
    });

    it('should use STATUS_MESSAGE for known business codes', () => {
      // 11010 is PORTAL_USER_NOT_FOUND
      ResponseHandler.fail(res, 404, 11010);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        code: 11010,
        message: 'User not found',
        data: {},
      });
    });
  });
});
