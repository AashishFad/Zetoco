import React from 'react';
import { ChevronDown } from 'lucide-react';

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
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-300 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none text-xs sm:text-sm rounded-xl bg-surface-900/90 border text-slate-100 pl-3.5 pr-10 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 disabled:opacity-50 cursor-pointer ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500/40 focus:border-rose-500'
              : 'border-surface-700/80 hover:border-surface-600'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
