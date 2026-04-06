import { jest } from '@jest/globals';

const findByIdMock = jest.fn();
const EventMock = {
  findById: findByIdMock
};

const notificationCreateMock = jest.fn();
const getIoMock = jest.fn();

jest.unstable_mockModule('../../../models/Event.js', () => ({
  default: EventMock
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../../../models/Notification.js', () => ({
  default: {
    create: notificationCreateMock
  }
}));

jest.unstable_mockModule('../../../services/skillService.js', () => ({
  getSkillMatchedEvents: jest.fn()
}));

jest.unstable_mockModule('../../../utils/socketManager.js', () => ({
  getIo: getIoMock
}));

const { acceptEvent, updateEventStatus } = await import('../../../controllers/volunteerController.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createPopulateChain = (value = {}) => {
  const chain = { ...value };
  chain.populate = jest.fn().mockReturnValue(chain);
  return chain;
};

describe('volunteerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getIoMock.mockReturnValue(null);
    notificationCreateMock.mockResolvedValue(undefined);
  });

  describe('acceptEvent', () => {
    it('updates tracking from Pending to Assigned when volunteer accepts', async () => {
      const event = {
        _id: 'event-1',
        title: 'Need rescue support',
        type: 'citizen',
        requiredSkills: ['First Aid'],
        volunteerAssignments: [],
        assignedVolunteers: [],
        volunteersNeeded: 2,
        trackingStatus: 'Pending',
        createdBy: 'citizen-1',
        save: jest.fn().mockResolvedValue(undefined)
      };

      findByIdMock
        .mockResolvedValueOnce(event)
        .mockReturnValueOnce(createPopulateChain({ _id: 'event-1', title: event.title }));

      const req = {
        params: { eventId: 'event-1' },
        user: {
          _id: 'vol-1',
          fullName: 'Volunteer One',
          skills: ['First Aid']
        }
      };
      const res = createMockRes();

      await acceptEvent(req, res);

      expect(event.volunteerAssignments).toHaveLength(1);
      expect(event.volunteerAssignments[0]).toEqual(expect.objectContaining({
        volunteerId: 'vol-1',
        participationStatus: 'Accepted',
        status: 'Assigned'
      }));
      expect(event.assignedVolunteers).toContain('vol-1');
      expect(event.trackingStatus).toBe('Assigned');
      expect(notificationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        user: 'citizen-1',
        type: 'volunteer_accepted',
        relatedId: 'event-1'
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Successfully accepted event'
      }));
    });

    it('rejects volunteer when required skills do not match', async () => {
      const event = {
        _id: 'event-2',
        requiredSkills: ['Medical Assistance'],
        volunteerAssignments: [],
        assignedVolunteers: [],
        volunteersNeeded: 3,
        trackingStatus: 'Pending',
        save: jest.fn()
      };

      findByIdMock.mockResolvedValueOnce(event);

      const req = {
        params: { eventId: 'event-2' },
        user: {
          _id: 'vol-2',
          fullName: 'Volunteer Two',
          skills: ['First Aid']
        }
      };
      const res = createMockRes();

      await acceptEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You do not have the required skills for this event',
        requiredSkills: ['Medical Assistance'],
        yourSkills: ['First Aid']
      });
      expect(event.save).not.toHaveBeenCalled();
      expect(notificationCreateMock).not.toHaveBeenCalled();
    });
  });

  describe('updateEventStatus', () => {
    it('updates status from Assigned to In Progress', async () => {
      const volunteerAssignment = {
        volunteerId: 'vol-3',
        status: 'Assigned'
      };

      const event = {
        _id: 'event-3',
        title: 'Distribution support',
        assignedVolunteers: ['vol-3'],
        volunteerAssignments: [volunteerAssignment],
        trackingStatus: 'Assigned',
        createdBy: 'organizer-1',
        save: jest.fn().mockResolvedValue(undefined)
      };

      findByIdMock
        .mockResolvedValueOnce(event)
        .mockReturnValueOnce(createPopulateChain({ _id: 'event-3' }));

      const req = {
        params: { eventId: 'event-3' },
        body: { status: 'In Progress' },
        user: {
          _id: 'vol-3',
          fullName: 'Volunteer Three'
        }
      };
      const res = createMockRes();

      await updateEventStatus(req, res);

      expect(volunteerAssignment.status).toBe('In Progress');
      expect(volunteerAssignment.startedAt).toBeInstanceOf(Date);
      expect(event.trackingStatus).toBe('In Progress');
      expect(notificationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        user: 'organizer-1',
        type: 'status_updated'
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Status updated successfully'
      }));
    });

    it('updates status from In Progress to Completed', async () => {
      const volunteerAssignment = {
        volunteerId: 'vol-4',
        status: 'In Progress',
        startedAt: new Date('2026-04-01T10:00:00.000Z')
      };

      const event = {
        _id: 'event-4',
        title: 'Shelter setup',
        assignedVolunteers: ['vol-4'],
        volunteerAssignments: [volunteerAssignment],
        trackingStatus: 'In Progress',
        createdBy: 'organizer-2',
        save: jest.fn().mockResolvedValue(undefined)
      };

      findByIdMock
        .mockResolvedValueOnce(event)
        .mockReturnValueOnce(createPopulateChain({ _id: 'event-4' }));

      const req = {
        params: { eventId: 'event-4' },
        body: { status: 'Completed' },
        user: {
          _id: 'vol-4',
          fullName: 'Volunteer Four'
        }
      };
      const res = createMockRes();

      await updateEventStatus(req, res);

      expect(volunteerAssignment.status).toBe('Completed');
      expect(volunteerAssignment.completedAt).toBeInstanceOf(Date);
      expect(event.trackingStatus).toBe('Completed');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Status updated successfully'
      }));
    });

    it('prevents invalid backward status transitions', async () => {
      const event = {
        _id: 'event-5',
        assignedVolunteers: ['vol-5'],
        volunteerAssignments: [{ volunteerId: 'vol-5', status: 'In Progress' }],
        trackingStatus: 'In Progress',
        save: jest.fn()
      };

      findByIdMock.mockResolvedValueOnce(event);

      const req = {
        params: { eventId: 'event-5' },
        body: { status: 'Assigned' },
        user: {
          _id: 'vol-5',
          fullName: 'Volunteer Five'
        }
      };
      const res = createMockRes();

      await updateEventStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot move status backwards from In Progress to Assigned'
      });
      expect(event.save).not.toHaveBeenCalled();
    });
  });
});
