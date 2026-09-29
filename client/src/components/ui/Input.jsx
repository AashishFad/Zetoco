import React from 'react';

/**
 * Reusable Input Component
 */
export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  id,
  type = 'text',
  disabled = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={`w-full rounded-xl bg-slate-900/90 border text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : ''
          } ${RightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20 text-rose-200'
              : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20 hover:border-slate-700'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}
