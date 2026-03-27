import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId, userName, userRole) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    try {
      const token = localStorage.getItem('token');
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token || ''
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.connected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('Error connecting socket:', error);
      return null;
    }
  }

  joinEventChat(eventId, userId, userName, userRole) {
    if (!this.socket) {
      console.warn('Socket not initialized, initializing now');
      this.connect(userId, userName, userRole);
    }

    if (!this.socket?.connected) {
      console.warn('Socket not connected, waiting for connection...');
      // Try again after a short delay
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit('joinEventChat', {
            eventId,
            userId,
            userName,
            userRole
          });
        }
      }, 1000);
      return;
    }

    console.log('Joining event chat:', eventId);
    this.socket.emit('joinEventChat', {
      eventId,
      userId,
      userName,
      userRole
    });
  }

  sendMessage(eventId, message) {
    if (!this.socket) {
      console.error('Socket not initialized');
      throw new Error('Socket not initialized');
    }

    if (!this.socket.connected) {
      console.warn('Socket not connected, retrying...');
      // Wait a bit and try again
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket not connected after retry'));
        }, 2000);

        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            this.socket.emit('sendMessage', {
              eventId,
              message
            });
            console.log('Message sent after retry');
            resolve();
          }
        }, 100);
      });
    }

    console.log('Sending message to event:', eventId);
    this.socket.emit('sendMessage', {
      eventId,
      message
    });
  }

  leaveEventChat() {
    if (this.socket?.connected) {
      this.socket.emit('leaveEventChat');
    }
  }

  // Direct messaging
  joinDirectChat(userId, recipientId) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected for direct chat');
      return;
    }
    this.socket.emit('joinDirectChat', { userId, recipientId });
  }

  sendDirectMessage(recipientId, message) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('sendDirectMessage', { recipientId, message });
  }

  leaveDirectChat() {
    if (this.socket?.connected) {
      this.socket.emit('leaveDirectChat');
    }
  }

  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receiveMessage', callback);
    }
  }

  onDirectMessage(callback) {
    if (this.socket) {
      this.socket.on('receiveDirectMessage', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('userJoined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('userLeft', callback);
    }
  }

  onMessageError(callback) {
    if (this.socket) {
      this.socket.on('messageError', callback);
    }
  }

  removeMessageListener() {
    if (this.socket) {
      this.socket.off('receiveMessage');
    }
  }

  removeUserJoinedListener() {
    if (this.socket) {
      this.socket.off('userJoined');
    }
  }

  removeUserLeftListener() {
    if (this.socket) {
      this.socket.off('userLeft');
    }
  }

  removeMessageErrorListener() {
    if (this.socket) {
      this.socket.off('messageError');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.socket = null;
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
