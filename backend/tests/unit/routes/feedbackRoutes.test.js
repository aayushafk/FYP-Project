import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const feedbackSaveMock = jest.fn();
const feedbackFindOneMock = jest.fn();
const feedbackFindMock = jest.fn();

const FeedbackMock = jest.fn(function FeedbackModel(feedbackData) {
  Object.assign(this, feedbackData);
  this._id = 'feedback-1';
  this.save = feedbackSaveMock;
  this.populate = jest.fn().mockResolvedValue(this);
});
FeedbackMock.findOne = feedbackFindOneMock;
FeedbackMock.find = feedbackFindMock;

const eventFindByIdMock = jest.fn();
const userFindByIdMock = jest.fn();

const authMiddlewareMock = jest.fn((req, _res, next) => {
  req.user = {
    _id: req.headers['x-user-id'] || 'user-1',
    role: req.headers['x-role'] || 'citizen'
  };
  next();
});

jest.unstable_mockModule('../../../models/Feedback.js', () => ({
  default: FeedbackMock
}));

jest.unstable_mockModule('../../../models/Event.js', () => ({
  default: {
    findById: eventFindByIdMock
  }
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: userFindByIdMock
  }
}));

jest.unstable_mockModule('../../../middlewares/authMiddleware.js', () => ({
  authMiddleware: authMiddlewareMock
}));

const { default: feedbackRoutes } = await import('../../../routes/feedbackRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', feedbackRoutes);
  return app;
};

describe('feedback routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    feedbackSaveMock.mockResolvedValue(undefined);
    feedbackFindOneMock.mockResolvedValue(null);
  });

  it('POST /event/:eventId/volunteer/:volunteerId rejects invalid rating', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/event/event-1/volunteer/vol-1')
      .send({ rating: 0, comment: 'Bad' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Rating must be between 1 and 5' });
  });

  it('POST /event/:eventId/volunteer/:volunteerId rejects unauthorized roles', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/event/event-1/volunteer/vol-1')
      .set('x-role', 'volunteer')
      .send({ rating: 4, comment: 'Good work' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Only organizers and citizens can submit feedback' });
  });

  it('POST /event/:eventId/volunteer/:volunteerId rejects non-completed events', async () => {
    eventFindByIdMock.mockResolvedValueOnce({
      _id: 'event-1',
      trackingStatus: 'Assigned',
      organizer: 'org-1',
      createdBy: 'cit-1',
      assignedVolunteers: ['vol-1']
    });

    const app = buildApp();

    const response = await request(app)
      .post('/event/event-1/volunteer/vol-1')
      .set('x-role', 'organizer')
      .set('x-user-id', 'org-1')
      .send({ rating: 5, comment: 'Great support' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Feedback can only be submitted for completed events' });
  });

  it('POST /event/:eventId/volunteer/:volunteerId rejects duplicate feedback', async () => {
    eventFindByIdMock.mockResolvedValueOnce({
      _id: 'event-2',
      trackingStatus: 'Completed',
      organizer: 'org-1',
      createdBy: 'cit-2',
      assignedVolunteers: ['vol-1']
    });
    userFindByIdMock.mockResolvedValueOnce({ _id: 'vol-1', role: 'volunteer' });
    feedbackFindOneMock.mockResolvedValueOnce({ _id: 'existing-feedback' });

    const app = buildApp();

    const response = await request(app)
      .post('/event/event-2/volunteer/vol-1')
      .set('x-role', 'organizer')
      .set('x-user-id', 'org-1')
      .send({ rating: 4, comment: 'Already rated' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'You have already submitted feedback for this volunteer'
    });
  });

  it('POST /event/:eventId/volunteer/:volunteerId submits feedback successfully', async () => {
    eventFindByIdMock.mockResolvedValueOnce({
      _id: 'event-3',
      trackingStatus: 'Completed',
      organizer: 'org-1',
      createdBy: 'cit-3',
      assignedVolunteers: ['vol-1']
    });
    userFindByIdMock.mockResolvedValueOnce({ _id: 'vol-1', role: 'volunteer' });
    feedbackFindOneMock.mockResolvedValueOnce(null);

    const app = buildApp();

    const response = await request(app)
      .post('/event/event-3/volunteer/vol-1')
      .set('x-role', 'organizer')
      .set('x-user-id', 'org-1')
      .send({ rating: 5, comment: 'Excellent commitment' });

    expect(response.status).toBe(201);
    expect(FeedbackMock).toHaveBeenCalledWith({
      eventId: 'event-3',
      volunteerId: 'vol-1',
      ratedBy: 'org-1',
      ratedByRole: 'organizer',
      rating: 5,
      comment: 'Excellent commitment'
    });
    expect(response.body).toEqual(expect.objectContaining({
      message: 'Feedback submitted successfully',
      feedback: expect.any(Object)
    }));
  });

  it('GET /volunteer/:volunteerId/stats returns volunteer rating statistics', async () => {
    userFindByIdMock.mockResolvedValueOnce({ _id: 'vol-5', role: 'volunteer' });
    feedbackFindMock.mockResolvedValueOnce([
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
      { rating: 2 }
    ]);

    const app = buildApp();

    const response = await request(app)
      .get('/volunteer/vol-5/stats')
      .set('x-role', 'organizer')
      .set('x-user-id', 'org-5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      volunteerId: 'vol-5',
      totalRatings: 4,
      averageRating: 3.75,
      ratingDistribution: {
        1: 0,
        2: 1,
        3: 0,
        4: 2,
        5: 1
      }
    });
  });
});
