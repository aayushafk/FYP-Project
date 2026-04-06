import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const userFindMock = jest.fn();
const userFindOneMock = jest.fn();
const userFindByIdMock = jest.fn();
const userCountDocumentsMock = jest.fn();

const requestCountDocumentsMock = jest.fn();
const requestAggregateMock = jest.fn();
const requestDistinctMock = jest.fn();
const requestFindMock = jest.fn();

const eventCountDocumentsMock = jest.fn();
const eventFindMock = jest.fn();

const notificationCreateMock = jest.fn();
const notificationFindMock = jest.fn();

const authMiddlewareMock = jest.fn((req, _res, next) => {
  req.user = {
    _id: 'admin-1',
    role: 'admin'
  };
  next();
});

const checkRoleMock = jest.fn(() => (_req, _res, next) => next());

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    find: userFindMock,
    findOne: userFindOneMock,
    findById: userFindByIdMock,
    countDocuments: userCountDocumentsMock
  }
}));

jest.unstable_mockModule('../../../models/Request.js', () => ({
  default: {
    countDocuments: requestCountDocumentsMock,
    aggregate: requestAggregateMock,
    distinct: requestDistinctMock,
    find: requestFindMock
  }
}));

jest.unstable_mockModule('../../../models/Event.js', () => ({
  default: {
    countDocuments: eventCountDocumentsMock,
    find: eventFindMock,
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule('../../../models/Notification.js', () => ({
  default: {
    create: notificationCreateMock,
    find: notificationFindMock
  }
}));

jest.unstable_mockModule('../../../middlewares/authMiddleware.js', () => ({
  authMiddleware: authMiddlewareMock
}));

jest.unstable_mockModule('../../../middlewares/roleMiddleware.js', () => ({
  checkRole: checkRoleMock
}));

const { default: adminRoutes } = await import('../../../routes/adminRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', adminRoutes);
  return app;
};

describe('admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationCreateMock.mockResolvedValue(undefined);
  });

  it('PATCH /verify-organizer/:id returns 404 when organizer is not found', async () => {
    userFindOneMock.mockResolvedValueOnce(null);
    const app = buildApp();

    const response = await request(app).patch('/verify-organizer/org-x').send({});

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Organizer not found' });
  });

  it('PATCH /verify-organizer/:id verifies organizer and creates notification', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const organizer = {
      _id: 'org-1',
      role: 'organizer',
      isAdminVerified: false,
      save: saveMock
    };

    userFindOneMock.mockResolvedValueOnce(organizer);
    const app = buildApp();

    const response = await request(app).patch('/verify-organizer/org-1').send({});

    expect(response.status).toBe(200);
    expect(organizer.isAdminVerified).toBe(true);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(notificationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      user: 'org-1',
      type: 'event_verification',
      relatedId: 'admin-1'
    }));
    expect(response.body).toEqual(expect.objectContaining({
      message: 'Organizer verified and notified successfully'
    }));
  });

  it('PATCH /disable-user/:id blocks disabling admin accounts', async () => {
    userFindByIdMock.mockResolvedValueOnce({
      _id: 'admin-2',
      role: 'admin',
      save: jest.fn()
    });

    const app = buildApp();

    const response = await request(app)
      .patch('/disable-user/admin-2')
      .send({ isDisabled: true });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Cannot disable admin accounts' });
    expect(notificationCreateMock).not.toHaveBeenCalled();
  });

  it('PATCH /disable-user/:id disables user and sends notification', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const user = {
      _id: 'vol-2',
      role: 'volunteer',
      isDisabled: false,
      save: saveMock
    };

    userFindByIdMock.mockResolvedValueOnce(user);
    const app = buildApp();

    const response = await request(app)
      .patch('/disable-user/vol-2')
      .send({ isDisabled: true });

    expect(response.status).toBe(200);
    expect(user.isDisabled).toBe(true);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(notificationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      user: 'vol-2',
      type: 'account_status',
      relatedId: 'admin-1'
    }));
    expect(response.body).toEqual(expect.objectContaining({
      message: 'Account disabled successfully'
    }));
  });

  it('GET /analytics/help-requests returns aggregated dashboard data', async () => {
    requestCountDocumentsMock.mockResolvedValueOnce(12);

    requestAggregateMock
      .mockResolvedValueOnce([
        { _id: 'Pending', count: 3 },
        { _id: 'Completed', count: 9 }
      ])
      .mockResolvedValueOnce([
        { _id: 'Medical', count: 5 },
        { _id: 'Food', count: 7 }
      ])
      .mockResolvedValueOnce([
        { _id: 'City A', count: 6 },
        { _id: null, count: 2 }
      ])
      .mockResolvedValueOnce([
        { _id: { year: 2026, month: 2 }, count: 4 }
      ]);

    requestDistinctMock.mockResolvedValueOnce(['vol-1', 'vol-2']);

    requestFindMock.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue([
        {
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T03:00:00.000Z')
        },
        {
          createdAt: new Date('2026-03-02T00:00:00.000Z'),
          updatedAt: new Date('2026-03-02T05:00:00.000Z')
        }
      ])
    });

    const app = buildApp();

    const response = await request(app).get('/analytics/help-requests');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalRequests: 12,
      requestsByStatus: {
        Pending: 3,
        Completed: 9
      },
      requestsByCategory: [
        { category: 'Medical', count: 5 },
        { category: 'Food', count: 7 }
      ],
      requestsByLocation: [
        { location: 'City A', count: 6 },
        { location: 'Unknown', count: 2 }
      ],
      activeVolunteersCount: 2,
      avgCompletionTimeHours: 4,
      monthlyGrowth: [
        {
          year: 2026,
          month: 2,
          count: 4,
          label: '2026-02'
        }
      ]
    });
  });

  it('GET /metrics returns platform counts', async () => {
    userCountDocumentsMock
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(40);

    requestCountDocumentsMock
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(20);

    eventCountDocumentsMock.mockResolvedValueOnce(18);

    const app = buildApp();

    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalUsers: 100,
      totalRequests: 50,
      completedRequests: 20,
      totalEvents: 18,
      activeVolunteers: 40
    });
  });
});
