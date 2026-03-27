import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Home, Mail, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

const EventErrorState = ({ error, onRetry, onGoHome, eventId }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqItems = [
    {
      id: 1,
      question: "Why can't I see the event details?",
      answer: "The event might have been deleted, or there could be a temporary connection issue. Try refreshing the page or going back to the events list."
    },
    {
      id: 2,
      question: "What should I do if I keep getting this error?",
      answer: "First, try refreshing the page. If the problem persists, make sure you're logged in and have permission to view this event."
    },
    {
      id: 3,
      question: "How do I report this issue?",
      answer: "You can contact our support team at support@volunteerapp.com or use the chat feature on any accessible page."
    },
    {
      id: 4,
      question: "Can I still participate in events?",
      answer: "Yes! Go back to the main events page to browse other available events and join them."
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Main Error Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 md:px-8 py-8 text-white">
            <div className="flex items-start">
              <AlertCircle size={32} className="mr-4 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Oops! Something Went Wrong</h1>
                <p className="text-red-100">We couldn't load the event details at the moment.</p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          <div className="px-6 md:px-8 py-6 border-b border-gray-200 bg-red-50">
            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-600 font-medium mb-2">Error Details:</p>
              <p className="text-gray-800 break-words font-mono text-sm">{error}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 md:px-8 py-6 space-y-3 md:space-y-0 md:flex md:gap-3">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <RefreshCw size={20} className="mr-2" />
              Try Again
            </button>
            <button
              onClick={onGoHome}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <Home size={20} className="mr-2" />
              Go to Events
            </button>
          </div>

          {/* Helpful Information Section */}
          <div className="px-6 md:px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Tip 1 */}
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-blue-600 font-semibold mb-2">💡 Quick Tip</div>
                <p className="text-sm text-gray-700">
                  Make sure you're connected to the internet and try refreshing the page.
                </p>
              </div>

              {/* Tip 2 */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="text-green-600 font-semibold mb-2">✨ What to Try</div>
                <p className="text-sm text-gray-700">
                  Check that you're logged in and have permission to view this event.
                </p>
              </div>

              {/* Tip 3 */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="text-purple-600 font-semibold mb-2">🔄 Still Not Working?</div>
                <p className="text-sm text-gray-700">
                  Try logging out and back in, or contact our support team.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="px-6 md:px-8 py-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-blue-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800 text-left">{item.question}</span>
                    {expandedFAQ === item.id ? (
                      <ChevronUp size={20} className="flex-shrink-0 text-blue-600" />
                    ) : (
                      <ChevronDown size={20} className="flex-shrink-0 text-gray-400" />
                    )}
                  </button>
                  {expandedFAQ === item.id && (
                    <div className="px-4 py-4 bg-white border-t border-gray-200">
                      <p className="text-gray-700 text-sm leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div className="px-6 md:px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email Support */}
              <a
                href="mailto:support@volunteerapp.com"
                className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <Mail size={24} className="text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Email Support</p>
                  <p className="text-xs text-gray-600">support@volunteerapp.com</p>
                </div>
              </a>

              {/* Phone Support */}
              <a
                href="tel:+1-800-VOLUNTEER"
                className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <Phone size={24} className="text-green-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Call Us</p>
                  <p className="text-xs text-gray-600">1-800-VOLUNTEER</p>
                </div>
              </a>

              {/* Live Chat */}
              <button
                className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <MessageCircle size={24} className="text-purple-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Live Chat</p>
                  <p className="text-xs text-gray-600">Available 9AM-5PM EST</p>
                </div>
              </button>
            </div>
          </div>

          {/* Error ID for Reference */}
          <div className="px-6 md:px-8 py-4 bg-gray-100 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              Event ID: <span className="font-mono text-gray-700">{eventId || 'N/A'}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Please provide this ID when contacting support
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Want to explore other opportunities?
          </p>
          <button
            onClick={onGoHome}
            className="mt-3 inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            <Home size={18} className="mr-2" />
            Browse All Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventErrorState;
