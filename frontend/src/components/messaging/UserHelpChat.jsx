import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Image, X, AlertCircle, Clock } from 'lucide-react';
import socketService from '../../utils/socketService';
import api from '../../utils/api';

const UserHelpChat = ({ eventId, currentUserId, currentUserName, assignedVolunteers }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showLocationShare, setShowLocationShare] = useState(false);
  const [location, setLocation] = useState(null);
  const [imageCountdown, setImageCountdown] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load messages on mount or when volunteer changes
  useEffect(() => {
    loadMessages();
  }, [eventId, selectedVolunteer]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listener for incoming messages
  useEffect(() => {
    socketService.socket?.on('receiveHelpMessage', (data) => {
      // Only add message if it's for current conversation
      if (data.eventId === eventId && 
          (data.sender._id === currentUserId || data.sender._id === selectedVolunteer?._id)) {
        setMessages(prev => [...prev, data]);
      }
    });

    return () => {
      socketService.socket?.off('receiveHelpMessage');
    };
  }, [eventId, currentUserId, selectedVolunteer]);

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

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/user-volunteer-chat/messages/${eventId}`);
      
      // Filter messages to only show those involving selected volunteer
      const filteredMessages = selectedVolunteer
        ? response.data.messages.filter(m => 
            (m.senderId._id === selectedVolunteer._id || m.recipientId._id === selectedVolunteer._id)
          )
        : response.data.messages;
      setMessages(filteredMessages);
      setError('');
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVolunteer = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setMessages([]);
    setError('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setShowLocationShare(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, address: 'Your current location' });
        setShowLocationShare(false);
        
        // Auto-send location message
        sendMessage('location', null, { latitude, longitude, address: 'Your current location' });
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setShowLocationShare(false);
      }
    );
  };

  const sendMessage = async (messageType = 'text', imageUrl = null, locationData = null) => {
    if (!selectedVolunteer) {
      setError('Please select a volunteer first');
      return;
    }

    if (!inputValue && messageType === 'text') {
      setError('Message cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare message data
      const messageData = {
        eventId,
        recipientId: selectedVolunteer._id,
        messageType,
        content: inputValue || `Shared location`
      };

      if (messageType === 'location' && locationData) {
        messageData.locationData = locationData;
      }

      if (messageType === 'image' && imageUrl) {
        messageData.imageUrl = imageUrl;
      }

      // Send via Socket.IO
      socketService.socket?.emit('sendHelpMessage', {
        ...messageData,
        senderRole: 'user'
      });

      // Also save via REST API for persistence
      const response = await api.post('/user-volunteer-chat/send', messageData);

      if (response.status === 200 || response.status === 201) {
        setInputValue('');
        setSelectedImage(null);
        setImagePreview('');
        
        // Add message countdown for images
        if (messageType === 'image') {
          setImageCountdown(prev => ({
            ...prev,
            [new Date().getTime()]: 24
          }));
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleSendClick = async () => {
    if (selectedImage) {
      // Upload image first
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('eventId', eventId);

      try {
        const response = await api.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200) {
          await sendMessage('image', response.data.imageUrl);
        }
      } catch (err) {
        console.error('Error uploading image:', err);
        setError(err.response?.data?.message || 'Error uploading image');
      }
    } else {
      await sendMessage('text');
    }
  };

  if (!assignedVolunteers || assignedVolunteers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-lg border border-blue-200">
        <AlertCircle className="w-12 h-12 text-blue-600 mb-4" />
        <p className="text-gray-700 font-semibold mb-2">No assigned volunteers yet</p>
        <p className="text-gray-600 text-sm text-center">
          Volunteers will be assigned to this event soon. You'll be able to chat with them once assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Volunteer Selector */}
      <div className="p-4 bg-white border-b">
        <p className="text-sm font-semibold text-gray-700 mb-3">Contact a Volunteer:</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {assignedVolunteers.map((volunteer) => (
            <button
              key={volunteer._id}
              onClick={() => handleSelectVolunteer(volunteer)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedVolunteer?._id === volunteer._id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {volunteer.fullName}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      {selectedVolunteer && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-lg font-semibold mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation with {selectedVolunteer.fullName}</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.sender._id === currentUserId || msg.senderId === currentUserId;
                const imageExpiry = imageCountdown[msg._id];

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        isOwn
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
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
                          {imageExpiry && (
                            <div className="flex items-center gap-1 text-xs opacity-75">
                              <Clock className="w-3 h-3" />
                              <span>Expires in {Math.floor(imageExpiry)}h</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Location Message */}
                      {msg.messageType === 'location' && msg.locationData && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{msg.locationData.address}</span>
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${msg.locationData.latitude},${msg.locationData.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline opacity-75 hover:opacity-100"
                          >
                            View on map
                          </a>
                        </div>
                      )}

                      <p className={`text-xs mt-1 ${isOwn ? 'opacity-75' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
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

          {/* Image Preview */}
          {imagePreview && (
            <div className="mx-4 mb-4 relative bg-white p-2 rounded border border-gray-200">
              <img src={imagePreview} alt="preview" className="max-h-32 rounded" />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview('');
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Location Loading */}
          {showLocationShare && (
            <div className="mx-4 mb-4 p-3 bg-blue-100 border border-blue-400 rounded text-blue-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              Getting your location...
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendClick()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={handleSendClick}
                disabled={loading || (!inputValue && !selectedImage)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                title="Images auto-delete after 24 hours"
              >
                <Image className="w-4 h-4" />
                Image (24h expiry)
              </button>
              <button
                onClick={handleShareLocation}
                disabled={loading || showLocationShare}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                title="Location auto-deletes after 7 days"
              >
                <MapPin className="w-4 h-4" />
                Share Location (7d)
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <p className="text-xs text-gray-500 text-center">
              Messages and media will auto-delete after expiration for your privacy
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default UserHelpChat;
