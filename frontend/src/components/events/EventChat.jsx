import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import socketService from '../../utils/socketService';
import { Send, AlertCircle } from 'lucide-react';

const EventChat = ({ eventId, currentUser, event }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Load existing messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/chat/event/${eventId}`);
        setMessages(response.data.messages || []);
        setError('');
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Could not load messages. You may not have access to this chat.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [eventId]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect(currentUser._id, currentUser.fullName, currentUser.role);
    }

    // Set connected state
    setIsConnected(socketService.isConnected());

    socketService.joinEventChat(eventId, currentUser._id, currentUser.fullName, currentUser.role);

    // Listen for incoming messages
    const handleReceiveMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleUserJoined = (data) => {
      console.log('User joined:', data.message);
      setMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        senderName: 'System',
        senderRole: 'system',
        message: data.message,
        timestamp: data.timestamp,
        isSystemMessage: true
      }]);
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data.message);
      setMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        senderName: 'System',
        senderRole: 'system',
        message: data.message,
        timestamp: data.timestamp,
        isSystemMessage: true
      }]);
    };

    const handleMessageError = (data) => {
      setError(data.error);
      setTimeout(() => setError(''), 5000);
    };

    // Update connection status
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onMessageError(handleMessageError);

    // Listen for connection changes
    if (socketService.socket) {
      socketService.socket.on('connect', handleConnect);
      socketService.socket.on('disconnect', handleDisconnect);
    }

    return () => {
      socketService.removeMessageListener();
      socketService.removeUserJoinedListener();
      socketService.removeUserLeftListener();
      socketService.removeMessageErrorListener();
      socketService.leaveEventChat();
      
      if (socketService.socket) {
        socketService.socket.off('connect', handleConnect);
        socketService.socket.off('disconnect', handleDisconnect);
      }
    };
  }, [eventId, currentUser]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    setIsSending(true);
    try {
      // Ensure socket is connected
      await socketService.ensureConnected();
      
      socketService.sendMessage(eventId, newMessage.trim());
      setNewMessage('');
      setError('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'organizer':
        return 'bg-purple-100 text-purple-800';
      case 'volunteer':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Event Chat</h3>
            <p className="text-sm opacity-90">{messages.length} messages</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-500/30 text-white' : 'bg-red-500/30 text-white'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-300 animate-pulse' : 'bg-red-300'
              }`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-center">
            <div>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystemMessage = msg.isSystemMessage || msg.sender?.role === 'system' || msg.senderRole === 'system';
            const isCurrentUser = (msg.sender?.id || msg.senderId) === currentUser._id;

            return (
              <div
                key={msg.id || index}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                  isSystemMessage ? 'justify-center' : ''
                }`}
              >
                {isSystemMessage ? (
                  <div className="bg-gray-200 text-gray-700 px-3 py-2 rounded-full text-xs text-center max-w-xs">
                    {msg.message}
                  </div>
                ) : (
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    {isCurrentUser ? (
                      <div className="mb-1">
                        <span className="font-semibold text-sm">You</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">{msg.sender?.name || msg.senderName}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleColor(
                            msg.sender?.role || msg.senderRole
                          )}`}
                        >
                          {msg.sender?.role || msg.senderRole}
                        </span>
                      </div>
                    )}
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-3 bg-white flex space-x-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isSending || isLoading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        />
        <button
          type="submit"
          disabled={isSending || !newMessage.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default EventChat;
