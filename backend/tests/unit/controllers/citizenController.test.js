import { jest } from '@jest/globals';

const eventSaveMock = jest.fn();
const EventMock = jest.fn(function EventModel(eventData) {
  Object.assign(this, eventData);
  this._id = this._id || 'event-1';
  this.save = eventSaveMock;
});

const notifyVolunteersBySkillsMock = jest.fn();
const getAIRecommendedVolunteersMock = jest.fn();
const getAIRecommendedVolunteersForRequestsMock = jest.fn();

jest.unstable_mockModule('../../../models/Event.js', () => ({
  default: EventMock
}));

jest.unstable_mockModule('../../../models/Notification.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../../../services/skillService.js', () => ({
  notifyVolunteersBySkills: notifyVolunteersBySkillsMock,
  getAIRecommendedVolunteers: getAIRecommendedVolunteersMock,
  getAIRecommendedVolunteersForRequests: getAIRecommendedVolunteersForRequestsMock
}));

const { createHelpRequest } = await import('../../../controllers/citizenController.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('citizenController.createHelpRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventSaveMock.mockResolvedValue(undefined);
    notifyVolunteersBySkillsMock.mockResolvedValue([]);
    getAIRecommendedVolunteersMock.mockResolvedValue({
      title: 'AI Recommended Volunteers',
      recommendations: [
        { volunteerId: 'vol-1' },
        { volunteerId: 'vol-2' }
      ]
    });
    getAIRecommendedVolunteersForRequestsMock.mockResolvedValue({});
  });

  it('creates a normal help request and notifies filtered volunteers', async () => {
    const req = {
      body: {
        title: 'Need food support',
        description: 'Need food packets for affected families',
        category: 'Food',
        location: 'Central District',
        requiredSkills: ['Food Distribution']
      },
      user: {
        _id: 'citizen-1'
      }
    };
    const res = createMockRes();

    await createHelpRequest(req, res);

    expect(EventMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Need food support',
      type: 'citizen',
      createdBy: 'citizen-1',
      requiredSkills: ['Food Distribution'],
      trackingStatus: 'Pending',
      status: 'upcoming',
      isEmergency: false,
      priority: 'NORMAL',
      requestType: 'Normal'
    }));

    expect(getAIRecommendedVolunteersMock).toHaveBeenCalledWith({
      requiredSkills: ['Food Distribution'],
      location: 'Central District',
      limit: 5,
      includeAvailability: true
    });

    expect(notifyVolunteersBySkillsMock).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'event-1' }),
      {
        restrictToVolunteerIds: ['vol-1', 'vol-2']
      }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Help request created successfully',
      request: expect.any(Object),
      aiRecommendedVolunteers: expect.any(Array)
    }));
  });

  it('marks request as emergency and notifies all volunteers without restriction', async () => {
    const req = {
      body: {
        title: 'URGENT medical support needed',
        description: 'Critical situation, immediate help required',
        category: 'Medical',
        location: 'North Zone',
        requiredSkills: ['First Aid']
      },
      user: {
        _id: 'citizen-2'
      }
    };
    const res = createMockRes();

    await createHelpRequest(req, res);

    expect(EventMock).toHaveBeenCalledWith(expect.objectContaining({
      isEmergency: true,
      priority: 'HIGH',
      requestType: 'Emergency'
    }));

    expect(getAIRecommendedVolunteersMock).toHaveBeenCalledWith({
      requiredSkills: ['First Aid'],
      location: 'North Zone',
      limit: 10,
      includeAvailability: true
    });

    expect(notifyVolunteersBySkillsMock).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'event-1' }),
      {
        restrictToVolunteerIds: null
      }
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not notify volunteers when no skills are provided and request is not emergency', async () => {
    const req = {
      body: {
        title: 'Need assistance',
        description: 'Help needed for a local task',
        category: 'Other',
        location: 'East Wing',
        requiredSkills: []
      },
      user: {
        _id: 'citizen-3'
      }
    };
    const res = createMockRes();

    await createHelpRequest(req, res);

    expect(notifyVolunteersBySkillsMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 with validation details when request save fails', async () => {
    const validationError = {
      message: 'Event validation failed',
      errors: {
        title: { message: 'Event title is required' },
        location: { message: 'Location is required' }
      }
    };
    eventSaveMock.mockRejectedValueOnce(validationError);

    const req = {
      body: {
        description: 'Missing title and location',
        category: 'Other'
      },
      user: {
        _id: 'citizen-4'
      }
    };
    const res = createMockRes();

    await createHelpRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creating help request',
      error: 'Event validation failed',
      details: [
        { field: 'title', message: 'Event title is required' },
        { field: 'location', message: 'Location is required' }
      ]
    });
  });
});
