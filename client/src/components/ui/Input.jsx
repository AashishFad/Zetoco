import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  disabled = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-300 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={`w-full text-xs sm:text-sm rounded-xl bg-surface-900/90 border text-slate-100 placeholder-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-950 disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-10' : 'pl-3.5'
          } ${RightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500/40 focus:border-rose-500'
              : 'border-surface-700/80 hover:border-surface-600'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
