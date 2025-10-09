import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'warning' | 'error';
  message: string;
  className?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, message, className = '' }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
  };


  const { icon: Icon, bgColor, textColor, iconColor } = config[type];

  return (
    <div className={`${bgColor} border border-opacity-20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
        <p className={`${textColor} font-medium`}>{message}</p>
      </div>
    </div>
  );
};

export default StatusMessage;