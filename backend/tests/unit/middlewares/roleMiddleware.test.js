import { jest } from '@jest/globals';
import { checkRole } from '../../../middlewares/roleMiddleware.js';

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkRole middleware', () => {
  it('returns 401 when user context is missing', () => {
    const middleware = checkRole('admin');
    const req = {};
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized. User context missing.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows request when user has the required single role', () => {
    const middleware = checkRole('organizer');
    const req = { user: { role: 'organizer' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows request when user has one of the allowed roles', () => {
    const middleware = checkRole(['admin', 'volunteer']);
    const req = { user: { role: 'volunteer' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not allowed', () => {
    const middleware = checkRole(['admin', 'organizer']);
    const req = { user: { role: 'citizen' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden. Role matching one of [admin,organizer] is required.'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
