import React from 'react';

const EventLoadingState = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 md:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 animate-pulse">
          <div className="bg-gradient-to-r from-blue-200 to-blue-300 h-32 md:h-40"></div>
          <div className="p-6 md:p-8">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6 animate-pulse">
          {/* About Section */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-gray-300 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Button Skeleton */}
          <div className="h-12 bg-gray-300 rounded w-full"></div>
        </div>

        {/* Loading Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <span className="ml-2 text-gray-600 font-medium">Loading event details...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventLoadingState;
