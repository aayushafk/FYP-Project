import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Image, Check, AlertCircle, Clock } from 'lucide-react';
import socketService from '../../../utils/socketService';

const VolunteerHelpChat = ({ eventId, currentUserId, eventData }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState({});
  const messagesEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [eventId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listener for incoming messages
  useEffect(() => {
    socketService.socket?.on('receiveHelpMessage', (data) => {
      if (data.eventId === eventId) {
        // If this is for current conversation, add to messages
        if (selectedUser && data.sender._id === selectedUser._id) {
          setMessages(prev => [...prev, data]);
        }
        
        // Update conversation list
        updateConversationList(data);
      }
    });

    return () => {
      socketService.socket?.off('receiveHelpMessage');
    };
  }, [eventId, selectedUser]);

  // Socket listener for errors
  useEffect(() => {
    socketService.socket?.on('helpMessageError', (data) => {
      setError(data.error);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socketService.socket?.off('helpMessageError');
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/user-volunteer-chat/messages/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Group by unique users
        const userMap = new Map();
        const unread = {};

        data.messages.forEach(msg => {
          const userId = msg.senderId._id === currentUserId ? msg.recipientId._id : msg.senderId._id;
          const user = msg.senderId._id === currentUserId ? msg.recipientId : msg.senderId;
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              _id: userId,
              fullName: user.fullName,
              email: user.email,
              role: user.role || 'user',
              lastMessage: msg.content,
              lastMessageTime: msg.timestamp,
              messageType: msg.messageType
            });
          } else {
            const existing = userMap.get(userId);
            if (new Date(msg.timestamp) > new Date(existing.lastMessageTime)) {
              existing.lastMessage = msg.content;
              existing.lastMessageTime = msg.timestamp;
              existing.messageType = msg.messageType;
            }
          }

          // Count unread
          if (msg.recipientId._id === currentUserId && !msg.isRead) {
            unread[userId] = (unread[userId] || 0) + 1;
          }
        });

        setConversations(Array.from(userMap.values()).sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        ));
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const updateConversationList = (message) => {
    const userId = message.sender._id === currentUserId ? message.recipient._id : message.sender._id;
    
    setConversations(prev => {
      const existing = prev.find(c => c._id === userId);
      if (existing) {
        existing.lastMessage = message.content;
        existing.lastMessageTime = message.timestamp;
        existing.messageType = message.messageType;
        return [existing, ...prev.filter(c => c._id !== userId)];
      }
      return [{
        _id: userId,
        fullName: message.sender._id === currentUserId ? message.recipient.fullName : message.sender.fullName,
        email: message.sender._id === currentUserId ? message.recipient.email : message.sender.email,
        role: message.sender._id === currentUserId ? message.recipient.role : message.sender.role,
        lastMessage: message.content,
        lastMessageTime: message.timestamp,
        messageType: message.messageType
      }, ...prev];
    });
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setError('');
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/user-volunteer-chat/conversation/${eventId}/${user._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        
        // Clear unread for this user
        setUnreadCount(prev => {
          const updated = { ...prev };
          delete updated[user._id];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser) {
      setError('Please select a user first');
      return;
    }

    if (!inputValue.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const messageData = {
        eventId,
        recipientId: selectedUser._id,
        messageType: 'text',
        content: inputValue
      };

      // Send via Socket.IO
      socketService.socket?.emit('sendHelpMessage', {
        ...messageData,
        senderRole: 'volunteer'
      });

      // Also save via REST API
      const response = await fetch('/api/user-volunteer-chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        setInputValue('');
        // Add message to local state
        const savedMessage = await response.json();
        const messageWithDetails = {
          ...savedMessage.data,
          sender: {
            _id: currentUserId,
            fullName: 'You'
          },
          recipient: selectedUser
        };
        setMessages(prev => [...prev, messageWithDetails]);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessage = (msg) => {
    if (msg.messageType === 'image') {
      return '📸 Image shared';
    } else if (msg.messageType === 'location') {
      return '📍 Location shared';
    }
    return msg.substring(0, 50) + (msg.length > 50 ? '...' : '');
  };

  return (
    <div className="flex gap-4 h-full bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">Help Requests</h3>
          <p className="text-xs text-gray-500">{conversations.length} conversation(s)</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">No help requests yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const unread = unreadCount[conv._id] || 0;
              return (
                <button
                  key={conv._id}
                  onClick={() => handleSelectUser(conv)}
                  className={`w-full p-4 border-b border-gray-100 text-left transition-colors ${
                    selectedUser?._id === conv._id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  } ${unread > 0 ? 'bg-yellow-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-800 text-sm">{conv.fullName}</h4>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{conv.email}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatLastMessage(conv.lastMessage)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h4 className="font-semibold text-gray-800">{selectedUser.fullName}</h4>
            <p className="text-xs text-gray-500">{selectedUser.email}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-lg font-semibold mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.sender._id === currentUserId || msg.senderId === currentUserId;

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {/* Text Message */}
                      {msg.messageType === 'text' && (
                        <p className="text-sm">{msg.content}</p>
                      )}

                      {/* Image Message */}
                      {msg.messageType === 'image' && (
                        <div className="space-y-2">
                          <img
                            src={msg.imageUrl || msg.imageData?.url}
                            alt="shared"
                            className="max-w-xs max-h-64 rounded"
                          />
                          <p className="text-xs opacity-75">
                            📸 Image (expires in 24 hours)
                          </p>
                        </div>
                      )}

                      {/* Location Message */}
                      {msg.messageType === 'location' && msg.locationData && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{msg.locationData.address}</span>
                          </div>
                          <div className="text-xs opacity-75">
                            Lat: {msg.locationData.latitude?.toFixed(4)},
                            Lng: {msg.locationData.longitude?.toFixed(4)}
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${msg.locationData.latitude},${msg.locationData.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline opacity-75 hover:opacity-100 inline-block"
                          >
                            View on Google Maps
                          </a>
                        </div>
                      )}

                      <p className={`text-xs mt-1 ${isOwn ? 'opacity-75' : 'opacity-60'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                        {isOwn && msg.isRead && <Check className="w-3 h-3 inline ml-1" />}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              User can share location (7-day expiry) and images (24-hour expiry) for urgent help
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-500">
          <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-semibold">Select a conversation</p>
          <p className="text-sm">Click on a user to start responding to their help request</p>
        </div>
      )}
    </div>
  );
};

export default VolunteerHelpChat;
