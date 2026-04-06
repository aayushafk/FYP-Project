import { jest } from '@jest/globals';

const verifyMock = jest.fn();
const findByIdMock = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: verifyMock
  }
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: findByIdMock
  }
}));

const { authMiddleware } = await import('../../../middlewares/authMiddleware.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const tokenError = new Error('Bad token');
    tokenError.name = 'JsonWebTokenError';
    verifyMock.mockImplementation(() => {
      throw tokenError;
    });

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = createMockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when user from token does not exist', async () => {
    const selectMock = jest.fn().mockResolvedValue(null);
    verifyMock.mockReturnValue({ userId: 'user-1' });
    findByIdMock.mockReturnValue({ select: selectMock });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createMockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(findByIdMock).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user account is disabled', async () => {
    const selectMock = jest.fn().mockResolvedValue({
      _id: 'user-1',
      isDisabled: true
    });
    verifyMock.mockReturnValue({ userId: 'user-1' });
    findByIdMock.mockReturnValue({ select: selectMock });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createMockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Your account has been disabled. Please contact the administrator.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user and calls next on success', async () => {
    const mockUser = {
      _id: 'user-1',
      role: 'volunteer',
      isDisabled: false
    };
    const selectMock = jest.fn().mockResolvedValue(mockUser);

    verifyMock.mockReturnValue({ userId: 'user-1' });
    findByIdMock.mockReturnValue({ select: selectMock });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createMockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.userId).toBe('user-1');
    expect(req.user).toBe(mockUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
