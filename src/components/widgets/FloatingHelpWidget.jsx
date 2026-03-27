import React, { useState } from 'react';
import { MessageCircle, X, Send, AlertCircle, HelpCircle, Zap } from 'lucide-react';

const FloatingHelpWidget = ({ eventId, isVisible, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi there! 👋 Welcome to Event Support. How can we help you today?'
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  // Quick suggestions
  const suggestions = [
    'Event won\'t load',
    'Can\'t join event',
    'Technical issues',
    'Contact support'
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: message
    }]);

    setIsSending(true);
    setMessage('');

    // Simulate bot response with better AI
    setTimeout(() => {
      let botResponse = '';
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('load') || lowerMsg.includes('error') || lowerMsg.includes('loading')) {
        botResponse = '🔄 If the event won\'t load, try these steps:\n1. Refresh the page (Ctrl+R or Cmd+R)\n2. Clear your browser cache\n3. Check your internet connection\n4. Try a different browser\nIf it still doesn\'t work, our support team can help!';
      } else if (lowerMsg.includes('join') || lowerMsg.includes('sign up') || lowerMsg.includes('register')) {
        botResponse = '✅ To join an event:\n1. Click the "Join Event" button (green button)\n2. Confirm your participation\n3. You\'ll receive updates via email\nHaving trouble? Let me know the specific error!';
      } else if (lowerMsg.includes('delete') || lowerMsg.includes('remove') || lowerMsg.includes('cancel')) {
        botResponse = '❌ Only event organizers can delete events. If you\'re the organizer, look for the "Delete Event" button (red). Volunteers can only leave events from their dashboard.';
      } else if (lowerMsg.includes('permission') || lowerMsg.includes('access') || lowerMsg.includes('can\'t see')) {
        botResponse = '🔐 If you can\'t access an event:\n1. Make sure you\'re logged in\n2. Check if you have an account\n3. The event might have been deleted\n4. You might not have permission\nTry logging out and back in!';
      } else if (lowerMsg.includes('contact') || lowerMsg.includes('support') || lowerMsg.includes('help') || lowerMsg.includes('call')) {
        botResponse = '📞 Contact our support team:\n📧 Email: support@volunteerapp.com\n📱 Phone: 1-800-VOLUNTEER\n💬 Live Chat: Available 9AM-5PM EST\nWe\'re here to help! 😊';
      } else if (lowerMsg.includes('chat') || lowerMsg.includes('message')) {
        botResponse = '💬 Once you join an event, you can chat with other volunteers and the organizer in the Event Chat section. Messages are real-time and private to the event!';
      } else if (lowerMsg.includes('skill')) {
        botResponse = '⭐ Skills help match you with the right events. Update your skills in your profile to see better event recommendations!';
      } else {
        botResponse = '🤔 Great question! For more detailed help, I\'d recommend:\n1. Checking our FAQ\n2. Contacting support (support@volunteerapp.com)\n3. Calling us at 1-800-VOLUNTEER\nWe\'re happy to help! 😊';
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: botResponse
      }]);
      setIsSending(false);
    }, 800);
  };

  const handleSuggestion = (suggestion) => {
    setMessage(suggestion);
  };

  if (!isVisible && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-40 group"
        title="Need help? Chat with us!"
      >
        <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
        <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Help & Support
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[600px] z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 rounded-t-xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Zap size={20} className="animate-pulse" />
          <div>
            <span className="font-semibold block">Help & Support</span>
            <span className="text-xs text-blue-100">Always here to help</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-600 p-1 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-3 rounded-lg text-sm whitespace-pre-wrap ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-lg rounded-bl-none text-sm shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <p className="text-xs text-gray-600 font-medium mb-2">Quick Help:</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestion(suggestion)}
                className="text-xs bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 px-3 py-2 rounded transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white flex-shrink-0 flex space-x-2 rounded-b-xl">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything..."
          disabled={isSending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default FloatingHelpWidget;
