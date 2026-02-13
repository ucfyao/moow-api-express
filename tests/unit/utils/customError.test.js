const CustomError = require('../../../app/utils/customError');
const { STATUS_TYPE } = require('../../../app/utils/statusCodes');

describe('CustomError', () => {
  it('should be an instance of Error', () => {
    const error = new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CustomError);
  });

  it('should set businessCode from first argument', () => {
    const error = new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    expect(error.businessCode).toBe(11010);
  });

  it('should default statusCode to 500', () => {
    const error = new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    expect(error.statusCode).toBe(500);
  });

  it('should accept custom statusCode', () => {
    const error = new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND, 404);
    expect(error.statusCode).toBe(404);
  });

  it('should use STATUS_MESSAGE for message when no custom message is provided', () => {
    const error = new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    expect(error.message).toBe('User not found');
  });

  it('should accept custom message', () => {
    const error = new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND, 404, 'Custom not found');
    expect(error.message).toBe('Custom not found');
  });

  it('should have a stack trace', () => {
    const error = new CustomError(STATUS_TYPE.GLOBAL_INTERNAL_ERROR);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('customError.test.js');
  });

  it('should handle AIP business codes', () => {
    const error = new CustomError(STATUS_TYPE.AIP_INSUFFICIENT_BALANCE);
    expect(error.businessCode).toBe(12006);
    expect(error.message).toBe('Insufficient balance for transaction');
  });

  it('should fallback to STATUS_MESSAGE for statusCode when businessCode has no message', () => {
    const error = new CustomError(99999, 500);
    // businessCode 99999 not in STATUS_MESSAGE, falls through to statusCode 500
    expect(error.message).toBe('Internal Server Error');
  });

  it('should fallback to "Error" when neither code has a message', () => {
    const error = new CustomError(99999, 99999);
    expect(error.message).toBe('Error');
  });
});
