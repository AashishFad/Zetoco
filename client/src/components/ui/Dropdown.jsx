import React, { useState, useRef, useEffect } from 'react';

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignStyles = {
    right: 'right-0',
    left: 'left-0',
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignStyles[align]} mt-2 ${width} rounded-xl bg-surface-900 border border-surface-750 border-surface-700/80 shadow-2xl shadow-black/60 py-1.5 z-50 focus:outline-none animate-slide-down`}
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
  onClick,
  icon: Icon,
  danger = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors ${
        danger
          ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
          : 'text-slate-300 hover:bg-surface-800 hover:text-white'
      } ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 opacity-75" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1.5 border-t border-surface-800" />;
}
