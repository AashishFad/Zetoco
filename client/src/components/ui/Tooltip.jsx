import React, { useState } from 'react';

/**
 * Reusable Tooltip Component
 */
export default function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const posStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          className={`absolute ${posStyles[position]} z-50 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700 shadow-lg whitespace-nowrap pointer-events-none animate-fade-in`}
        >
          {text}
        </div>
      )}
    </div>
  );
}
