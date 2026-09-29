import React, { useState } from 'react';

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const positionStyles = {
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
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute ${positionStyles[position]} z-50 px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-surface-800 border border-surface-700/80 rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-fade-in`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
