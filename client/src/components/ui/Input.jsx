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
          className="block text-xs font-medium text-[#A1A1AA] select-none"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-md shadow-sm">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={`w-full text-xs sm:text-sm rounded-md bg-[#111114] border text-[#F5F5F7] placeholder-[#71717A] transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-[#080808] disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-9' : 'pl-3'
          } ${RightIcon ? 'pr-9' : 'pr-3'} py-2 ${
            error
              ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
              : 'border-[#292930] hover:border-[#383842]'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-surface-400">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-surface-400">{helperText}</p>
      ) : null}
    </div>
  );
}
