wimport { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const messageSaveMock = jest.fn();
const messageFindByIdMock = jest.fn();
const messageFindMock = jest.fn();

const MessageMock = jest.fn(function MessageModel(messageData) {
  Object.assign(this, messageData);
  this._id = 'msg-1';
  this.save = messageSaveMock;
  this.populate = jest.fn().mockResolvedValue(this);
});
MessageMock.findById = messageFindByIdMock;
MessageMock.find = messageFindMock;

const userFindByIdMock = jest.fn();
const eventFindByIdMock = jest.fn();

const eventMessageSaveMock = jest.fn();
const eventMessageFindMock = jest.fn();

const EventMessageMock = jest.fn(function EventMessageModel(messageData) {
  Object.assign(this, messageData);
  this._id = 'event-msg-1';
  this.save = eventMessageSaveMock;
});
EventMessageMock.find = eventMessageFindMock;

const authMiddlewareMock = jest.fn((req, _res, next) => {
  req.user = {
    _id: req.headers['x-user-id'] || 'user-1',
    role: req.headers['x-role'] || 'citizen',
    fullName: req.headers['x-user-name'] || 'Test User'
  };
  next();
});

jest.unstable_mockModule('../../../models/Message.js', () => ({
  default: MessageMock
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: userFindByIdMock
  }
}));

jest.unstable_mockModule('../../../models/Event.js', () => ({
  default: {
    findById: eventFindByIdMock
  }
}));

jest.unstable_mockModule('../../../models/EventMessage.js', () => ({
  default: EventMessageMock
}));

jest.unstable_mockModule('../../../middlewares/authMiddleware.js', () => ({
  authMiddleware: authMiddlewareMock
}));

const { default: chatRoutes } = await import('../../../routes/chatRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', chatRoutes);
  return app;
};

const createSortLimitChain = (rows) => ({
  sort: jest.fn().mockReturnValue({
    limit: jest.fn().mockResolvedValue(rows)
  })
});

describe('chat routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    messageSaveMock.mockResolvedValue(undefined);
    eventMessageSaveMock.mockResolvedValue(undefined);
  });

  it('POST /send returns 400 for missing receiver/content', async () => {
    const app = buildApp();

    const response = await request(app).post('/send').send({ content: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Receiver ID and content are required'
    });
  });

  it('POST /send returns 404 when receiver is not found', async () => {
    userFindByIdMock.mockResolvedValueOnce(null);
    const app = buildApp();

    const response = await request(app)
      .post('/send')
      .send({ receiverId: 'user-2', content: 'Hello there' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Receiver not found' });
  });

  it('POST /send returns 404 when provided event does not exist', async () => {
    userFindByIdMock.mockResolvedValueOnce({ _id: 'user-2' });
    eventFindByIdMock.mockResolvedValueOnce(null);
    const app = buildApp();

    const response = await request(app)
      .post('/send')
      .send({ receiverId: 'user-2', content: 'Hello', eventId: 'event-x' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Event not found' });
  });

  it('POST /send sends message successfully', async () => {
    userFindByIdMock.mockResolvedValueOnce({ _id: 'user-2', fullName: 'Receiver' });
    const app = buildApp();

    const response = await request(app)
      .post('/send')
      .set('x-user-id', 'user-1')
      .send({ receiverId: 'user-2', content: 'Need assistance' });

    expect(response.status).toBe(201);
    expect(MessageMock).toHaveBeenCalledWith(expect.objectContaining({
      sender: 'user-1',
      receiver: 'user-2',
      content: 'Need assistance',
      eventId: null
    }));
    expect(response.body).toEqual(expect.objectContaining({
      message: 'Message sent successfully',
      data: expect.any(Object)
    }));
  });

  it('GET /event/:eventId denies unauthorized participant', async () => {
    eventFindByIdMock.mockResolvedValueOnce({
      _id: 'event-1',
      organizer: 'org-1',
      assignedVolunteers: ['vol-1']
    });
    const app = buildApp();

    const response = await request(app)
      .get('/event/event-1')
      .set('x-role', 'volunteer')
      .set('x-user-id', 'vol-2');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Access denied. You are not part of this event.'
    });
  });

  it('GET /event/:eventId returns transformed event messages for allowed user', async () => {
    eventFindByIdMock.mockResolvedValueOnce({
      _id: 'event-2',
      organizer: 'org-1',
      assignedVolunteers: ['vol-1']
    });

    eventMessageFindMock.mockReturnValueOnce(createSortLimitChain([
      {
        _id: 'em-1',
        eventId: 'event-2',
        message: 'We are on the way',
        senderId: 'vol-1',
        senderName: 'Volunteer One',
        senderRole: 'volunteer',
        timestamp: new Date('2026-04-04T10:00:00.000Z'),
        image: null,
        location: null
      }
    ]));

    const app = buildApp();

    const response = await request(app)
      .get('/event/event-2')
      .set('x-role', 'citizen')
      .set('x-user-id', 'cit-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      success: true,
      eventId: 'event-2',
      messageCount: 1,
      messages: [
        expect.objectContaining({
          _id: 'em-1',
          message: 'We are on the way',
          sender: {
            id: 'vol-1',
            name: 'Volunteer One',
            role: 'volunteer'
          }
        })
      ]
    }));
  });

  it('POST /event/:eventId requires message, image, or location', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/event/event-3')
      .send({ message: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Message content, image, or location is required'
    });
  });

  it('POST /event/:eventId sends event message for allowed user', async () => {
    eventFindByIdMock.mockResolvedValueOnce({
      _id: 'event-3',
      organizer: 'org-1',
      assignedVolunteers: []
    });

    const app = buildApp();

    const response = await request(app)
      .post('/event/event-3')
      .set('x-role', 'citizen')
      .set('x-user-id', 'cit-2')
      .set('x-user-name', 'Citizen Two')
      .send({ message: 'Please update progress' });

    expect(response.status).toBe(201);
    expect(EventMessageMock).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-3',
      senderId: 'cit-2',
      senderName: 'Citizen Two',
      senderRole: 'citizen',
      message: 'Please update progress'
    }));
    expect(response.body).toEqual(expect.objectContaining({
      success: true,
      message: 'Message sent',
      data: expect.any(Object)
    }));
  });
});
