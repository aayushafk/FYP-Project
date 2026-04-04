import { useState, useCallback } from 'react';

/**
 * Hook for managing toast notifications throughout the app
 * 
 * Usage:
 * const { toasts, showToast, removeToast } = useToast();
 * 
 * showToast({
 *   type: 'success', // 'success', 'error', 'warning', 'info'
 *   title: 'Success!',
 *   message: 'Event created successfully',
 *   duration: 5000 // ms
 * });
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((options) => {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000
    } = options;

    const id = Date.now();

    setToasts(prev => [...prev, {
      id,
      type,
      title,
      message,
      duration
    }]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearAll
  };
};

export { useToast };
export default useToast;
