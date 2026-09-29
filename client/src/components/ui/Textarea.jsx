import React from 'react';

/**
 * Reusable Textarea Component
 */
export default function Textarea({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  disabled = false,
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-xl bg-slate-900/90 border text-slate-100 placeholder-slate-500 text-xs sm:text-sm p-3 transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20 hover:border-slate-700'
        } ${className}`}
        {...props}
      />

      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}
