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
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`relative ${className || 'inline-block'} text-left`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignStyles[align] || 'left-0'} mt-2 ${width} rounded-xl bg-[#17171C] border border-[#292930] shadow-2xl py-1 z-50 focus:outline-none animate-slide-down`}
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
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-left transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
          : 'text-[#A1A1AA] hover:bg-[#202027] hover:text-[#F5F5F7]'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-75" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-[#1F1F24]" />;
}
