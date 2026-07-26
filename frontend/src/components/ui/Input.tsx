import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center rounded-lg shadow-sm">
          {leftAddon && (
            <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full text-sm font-normal text-slate-900 bg-white border rounded-lg transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300'
            } ${leftAddon ? 'pl-9' : 'px-3.5'} ${rightAddon ? 'pr-9' : 'px-3.5'} py-2.5 ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-0 pr-3 flex items-center text-slate-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
