import React from 'react';
import { cn } from '@/lib/utils';

const FormField = ({ 
  label, 
  children, 
  error, 
  required = false,
  className = "" 
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const Input = React.forwardRef(({ 
  className = "", 
  type = "text", 
  error,
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...props}
    />
  );
});

const Select = React.forwardRef(({ 
  children, 
  className = "", 
  error,
  ...props 
}, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

const TextArea = React.forwardRef(({ 
  className = "", 
  error,
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...props}
    />
  );
});

FormField.Input = Input;
FormField.Select = Select;
FormField.TextArea = TextArea;

export default FormField;
