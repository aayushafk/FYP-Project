import { jest } from '@jest/globals';

const signMock = jest.fn();
const userFindOneMock = jest.fn();
const userFindMock = jest.fn();
const userSaveMock = jest.fn();
const notificationCreateMock = jest.fn();

const UserMock = jest.fn(function UserModel(userData) {
  Object.assign(this, userData);
  this._id = 'mock-user-id';
  this.isVerified = false;
  this.isAdminVerified = false;
  this.save = userSaveMock;
});

UserMock.findOne = userFindOneMock;
UserMock.find = userFindMock;

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: signMock
  }
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: UserMock
}));

jest.unstable_mockModule('../../../models/Notification.js', () => ({
  default: {
    create: notificationCreateMock
  }
}));

const { generateToken, registerUser, loginUser } = await import('../../../controllers/authController.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signMock.mockReturnValue('signed-jwt-token');
    userFindOneMock.mockResolvedValue(null);
    userFindMock.mockResolvedValue([]);
    userSaveMock.mockResolvedValue(undefined);
    notificationCreateMock.mockResolvedValue(undefined);
  });

  describe('generateToken', () => {
    it('signs and returns a jwt token with 30 day expiry', () => {
      const token = generateToken('user-123');

      expect(token).toBe('signed-jwt-token');
      expect(signMock).toHaveBeenCalledWith(
        { userId: 'user-123' },
        expect.any(String),
        { expiresIn: '30d' }
      );
    });
  });

  describe('registerUser', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = {
        body: {
          email: 'john@example.com',
          role: 'citizen'
        }
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide all required fields'
      });
    });

    it('returns 400 when role is invalid', async () => {
      const req = {
        body: {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'manager'
        }
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid role selected'
      });
    });

    it('returns 400 when email already exists', async () => {
      userFindOneMock.mockResolvedValueOnce({ _id: 'existing-user-id' });

      const req = {
        body: {
          fullName: 'Existing User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'citizen'
        }
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User with this email already exists'
      });
    });

    it('returns 400 when volunteer skills are not an array', async () => {
      const req = {
        body: {
          fullName: 'Volunteer One',
          email: 'volunteer@example.com',
          password: 'password123',
          role: 'volunteer',
          phoneNumber: '9999999999',
          skills: 'First Aid'
        }
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Skills must be provided as an array',
        code: 'SKILLS_NOT_ARRAY',
        received: 'string'
      });
    });

    it('returns 400 when volunteer has invalid skill names', async () => {
      const req = {
        body: {
          fullName: 'Volunteer Two',
          email: 'volunteer2@example.com',
          password: 'password123',
          role: 'volunteer',
          phoneNumber: '9999999999',
          skills: ['First Aid', 'Unknown Skill']
        }
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid skills: Unknown Skill',
        code: 'INVALID_SKILLS',
        validSkills: expect.any(Array),
        invalidSkills: ['Unknown Skill']
      });
    });

    it('creates a citizen user and returns token on successful registration', async () => {
      const req = {
        body: {
          fullName: 'Citizen User',
          email: 'citizen@example.com',
          password: 'password123',
          role: 'citizen',
          phoneNumber: '8888888888'
        }
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(UserMock).toHaveBeenCalledWith({
        fullName: 'Citizen User',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen',
        phoneNumber: '8888888888'
      });
      expect(userSaveMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration successful',
        token: 'signed-jwt-token',
        user: expect.objectContaining({
          _id: 'mock-user-id',
          fullName: 'Citizen User',
          email: 'citizen@example.com',
          role: 'citizen',
          phoneNumber: '8888888888'
        })
      });
      expect(notificationCreateMock).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = {
        body: {
          email: 'volunteer@example.com',
          role: 'volunteer'
        }
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide email, password, and role'
      });
    });

    it('returns 401 when user does not exist', async () => {
      userFindOneMock.mockResolvedValueOnce(null);

      const req = {
        body: {
          email: 'unknown@example.com',
          password: 'password123',
          role: 'volunteer'
        }
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('returns 401 when role does not match', async () => {
      userFindOneMock.mockResolvedValueOnce({
        _id: 'user-1',
        email: 'volunteer@example.com',
        role: 'volunteer',
        comparePassword: jest.fn()
      });

      const req = {
        body: {
          email: 'volunteer@example.com',
          password: 'password123',
          role: 'citizen'
        }
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Role does not match. Please select the correct role.'
      });
    });

    it('returns 403 when account is disabled', async () => {
      userFindOneMock.mockResolvedValueOnce({
        _id: 'user-2',
        email: 'disabled@example.com',
        role: 'volunteer',
        isDisabled: true,
        comparePassword: jest.fn()
      });

      const req = {
        body: {
          email: 'disabled@example.com',
          password: 'password123',
          role: 'volunteer'
        }
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Your account has been disabled. Please contact the administrator.'
      });
    });

    it('returns 401 when password is incorrect', async () => {
      const comparePasswordMock = jest.fn().mockResolvedValue(false);
      userFindOneMock.mockResolvedValueOnce({
        _id: 'user-3',
        fullName: 'Volunteer Three',
        email: 'vol3@example.com',
        role: 'volunteer',
        skills: ['First Aid'],
        isVerified: true,
        isAdminVerified: true,
        isDisabled: false,
        comparePassword: comparePasswordMock
      });

      const req = {
        body: {
          email: 'vol3@example.com',
          password: 'wrong-password',
          role: 'volunteer'
        }
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(comparePasswordMock).toHaveBeenCalledWith('wrong-password');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('returns token and user payload for valid credentials', async () => {
      const comparePasswordMock = jest.fn().mockResolvedValue(true);
      userFindOneMock.mockResolvedValueOnce({
        _id: 'user-4',
        fullName: 'Volunteer Four',
        email: 'vol4@example.com',
        role: 'volunteer',
        skills: ['First Aid'],
        isVerified: true,
        isAdminVerified: true,
        isDisabled: false,
        comparePassword: comparePasswordMock,
        phoneNumber: '1234567890'
      });

      const req = {
        body: {
          email: 'vol4@example.com',
          password: 'password123',
          role: 'volunteer'
        }
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(comparePasswordMock).toHaveBeenCalledWith('password123');
      expect(signMock).toHaveBeenCalledWith(
        { userId: 'user-4' },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'signed-jwt-token',
        user: expect.objectContaining({
          _id: 'user-4',
          email: 'vol4@example.com',
          role: 'volunteer',
          phoneNumber: '1234567890'
        })
      });
    });
  });
});
