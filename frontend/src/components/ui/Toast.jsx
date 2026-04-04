import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ id, type = 'info', title, message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-700'
    }
  };

  const style = config[type];
  const IconComponent = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 flex items-start space-x-3 animate-slideIn`}>
      <IconComponent size={20} className={`${style.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {title && <p className={`font-semibold ${style.titleColor}`}>{title}</p>}
        {message && <p className={`text-sm ${style.textColor}`}>{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className={`${style.textColor} hover:opacity-70 flex-shrink-0`}
      >
        <X size={18} />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-md">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
