import React, { useEffect } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-vs-500 text-white';
      case 'error':
        return 'bg-red-vs-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
        return 'bg-green-vs-500 text-white';
      default:
        return 'bg-gray-vs-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in ${getTypeStyles()}`}>
      <span className="mr-3 text-lg font-bold">{getIcon()}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-3 text-lg font-bold hover:opacity-70 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;