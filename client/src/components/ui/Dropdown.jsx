import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Dropdown Menu Component
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right', // 'right' | 'left'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-elevated py-1.5 z-50 animate-slide-down`}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  icon: Icon,
  onClick,
  variant = 'default', // 'default' | 'danger'
  className = '',
}) {
  const variantStyles = {
    default: 'text-slate-300 hover:text-white hover:bg-slate-800/80',
    danger: 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="h-px bg-slate-800 my-1" />;
}
