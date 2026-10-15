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
          className="block text-xs font-medium text-[#A1A1AA] select-none"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-md shadow-sm">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none text-xs sm:text-sm rounded-md bg-[#111114] border text-[#F5F5F7] pl-3 pr-9 py-2 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 cursor-pointer ${
            error
              ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
              : 'border-[#292930] hover:border-[#383842]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#17171C] text-[#F5F5F7]">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#71717A]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-surface-400">{helperText}</p>
      ) : null}
    </div>
  );
}
