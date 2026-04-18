let ioInstance = null;
const activeConnectionsByUser = new Map();
const ORGANIZER_DASHBOARD_ROOM = 'organizer_dashboard';

export const setIo = (io) => {
  ioInstance = io;
};

export const getIo = () => ioInstance;

export const getOrganizerDashboardRoom = () => ORGANIZER_DASHBOARD_ROOM;

export const registerActiveConnection = ({ userId, role, socketId }) => {
  if (!userId || !socketId) return;

  const existing = activeConnectionsByUser.get(userId) || {
    role: role || 'user',
    socketIds: new Set()
  };

  existing.role = role || existing.role || 'user';
  existing.socketIds.add(socketId);
  activeConnectionsByUser.set(userId, existing);
};

export const removeActiveConnection = ({ userId, socketId }) => {
  if (!userId || !socketId) return;

  const existing = activeConnectionsByUser.get(userId);
  if (!existing) return;

  existing.socketIds.delete(socketId);
  if (existing.socketIds.size === 0) {
    activeConnectionsByUser.delete(userId);
    return;
  }

  activeConnectionsByUser.set(userId, existing);
};

export const getActiveVolunteerCount = () => {
  let total = 0;
  for (const connection of activeConnectionsByUser.values()) {
    if (connection.role === 'volunteer' && connection.socketIds.size > 0) {
      total += 1;
    }
  }
  return total;
};

export const emitOrganizerVolunteerStatsUpdated = (payload = {}) => {
  if (!ioInstance) return;

  ioInstance
    .to(ORGANIZER_DASHBOARD_ROOM)
    .emit('organizerVolunteerStatsUpdated', payload);
};
