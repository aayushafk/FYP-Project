import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const eventSaveMock = jest.fn();
const EventMock = jest.fn(function EventModel(eventData) {
  Object.assign(this, eventData);
  this._id = 'event-123';
  this.title = eventData.title;
  this.save = eventSaveMock;
});

const userFindMock = jest.fn();
const notificationInsertManyMock = jest.fn();
const notifyVolunteersBySkillsMock = jest.fn();
const validateSkillsMock = jest.fn();

const authMiddlewareMock = jest.fn((req, _res, next) => {
  req.user = {
    _id: 'org-1',
    role: 'organizer',
    isAdminVerified: req.headers['x-admin-verified'] === 'true'
  };
  next();
});

const checkRoleMock = jest.fn(() => (_req, _res, next) => next());

jest.unstable_mockModule('../../../models/Event.js', () => ({
  default: EventMock
}));

jest.unstable_mockModule('../../../models/Request.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    find: userFindMock
  }
}));

jest.unstable_mockModule('../../../models/Notification.js', () => ({
  default: {
    insertMany: notificationInsertManyMock,
    deleteMany: jest.fn()
  }
}));

jest.unstable_mockModule('../../../models/EventMessage.js', () => ({
  default: {
    deleteMany: jest.fn()
  }
}));

jest.unstable_mockModule('../../../middlewares/authMiddleware.js', () => ({
  authMiddleware: authMiddlewareMock
}));

jest.unstable_mockModule('../../../middlewares/roleMiddleware.js', () => ({
  checkRole: checkRoleMock
}));

jest.unstable_mockModule('../../../services/skillService.js', () => ({
  notifyVolunteersBySkills: notifyVolunteersBySkillsMock,
  getSkillAnalytics: jest.fn()
}));

jest.unstable_mockModule('../../../utils/skills.js', () => ({
  validateSkills: validateSkillsMock
}));

jest.unstable_mockModule('../../../controllers/organizerController.js', () => ({
  getMyEvents: jest.fn((_req, res) => res.json({ events: [] })),
  getEventDetails: jest.fn((_req, res) => res.json({ event: null })),
  updateEvent: jest.fn((_req, res) => res.json({ event: null }))
}));

const { default: organizerRoutes } = await import('../../../routes/organizerRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', organizerRoutes);
  return app;
};

const validEventBody = {
  title: 'Community Cleanup',
  description: 'Organized local cleanup activity',
  startDateTime: '2026-04-10T10:00:00.000Z',
  endDateTime: '2026-04-10T15:00:00.000Z',
  location: 'Downtown Park',
  requiredSkills: ['General Support'],
  volunteersNeeded: 10,
  contactInfo: 'organizer@example.com'
};

describe('organizer routes - event creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventSaveMock.mockImplementation(function save() {
      return Promise.resolve(this);
    });
    userFindMock.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'cit-1' }, { _id: 'cit-2' }])
    });
    notificationInsertManyMock.mockResolvedValue(undefined);
    notifyVolunteersBySkillsMock.mockResolvedValue([{}, {}]);
    validateSkillsMock.mockReturnValue(true);
  });

  it('rejects unverified organizer from creating event', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/event')
      .set('x-admin-verified', 'false')
      .send(validEventBody);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Access denied. Your account is pending administrator verification.'
    });
    expect(EventMock).not.toHaveBeenCalled();
  });

  it('allows verified organizer to create event successfully', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/event')
      .set('x-admin-verified', 'true')
      .send(validEventBody);

    expect(response.status).toBe(201);
    expect(EventMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Community Cleanup',
      organizer: 'org-1',
      createdBy: 'org-1',
      location: 'Downtown Park'
    }));
    expect(notifyVolunteersBySkillsMock).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual(expect.objectContaining({
      message: 'Event created and 2 volunteers notified'
    }));
  });

  it('rejects event creation when provided skills are invalid', async () => {
    validateSkillsMock.mockReturnValueOnce(false);
    const app = buildApp();

    const response = await request(app)
      .post('/event')
      .set('x-admin-verified', 'true')
      .send({
        ...validEventBody,
        requiredSkills: ['Invalid Skill']
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Some skills are invalid',
      providedSkills: ['Invalid Skill']
    });
    expect(EventMock).not.toHaveBeenCalled();
  });

  it('returns validation error for missing required fields', async () => {
    eventSaveMock.mockRejectedValueOnce({
      name: 'ValidationError',
      message: 'Event validation failed',
      errors: {
        title: { message: 'Event title is required' }
      }
    });

    const app = buildApp();

    const response = await request(app)
      .post('/event')
      .set('x-admin-verified', 'true')
      .send({
        description: 'Missing title should fail',
        location: 'Downtown Park',
        startDateTime: '2026-04-10T10:00:00.000Z',
        endDateTime: '2026-04-10T15:00:00.000Z'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      details: ['Event title is required'],
      error: 'Event validation failed'
    });
  });
});
