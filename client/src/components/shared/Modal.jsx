import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "default",
  className = "" 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    default: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        "bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto",
        sizes[size],
        className
      )}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
