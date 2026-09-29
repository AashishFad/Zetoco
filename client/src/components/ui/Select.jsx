import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select Component
 */
export default function Select({
  label,
  options = [],
  error,
  helperText,
  className = '',
  id,
  disabled = false,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none rounded-xl bg-slate-900/90 border text-slate-100 text-xs sm:text-sm pl-3.5 pr-10 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20 hover:border-slate-700'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value !== undefined ? opt.value : opt}
              value={opt.value !== undefined ? opt.value : opt}
              className="bg-slate-900 text-slate-100"
            >
              {opt.label || opt}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}
