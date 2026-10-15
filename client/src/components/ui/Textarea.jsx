import React from 'react';

export default function Textarea({
  label,
  error,
  helperText,
  rows = 3,
  className = '',
  id,
  disabled = false,
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-medium text-[#A1A1AA] select-none"
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full text-xs sm:text-sm rounded-md bg-[#111114] border text-[#F5F5F7] placeholder-[#71717A] transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-[#080808] px-3 py-2.5 resize-none ${
          error
            ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
            : 'border-[#292930] hover:border-[#383842]'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-[11px] font-medium text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
