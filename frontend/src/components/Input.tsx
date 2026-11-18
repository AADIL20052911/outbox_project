import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  inputSize?: 'sm' | 'md';
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  helperText, 
  error, 
  className = '', 
  id,
  inputSize = 'md',
  ...props 
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  const sizeClass = inputSize === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full ${sizeClass} bg-surface text-text-primary border ${
          error ? 'border-danger focus:ring-danger/20' : 'border-border focus:ring-accent/20'
        } rounded-ten transition-smooth outline-none focus:border-accent focus:ring-2 disabled:bg-surface-muted disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-danger font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-text-secondary">{helperText}</span>
      ) : null}
    </div>
  );
};
