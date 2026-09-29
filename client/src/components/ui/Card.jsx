import React from 'react';

/**
 * Reusable Modular Card Component
 */
export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-2xl border bg-slate-900/80 border-slate-800 shadow-card-subtle backdrop-blur-sm transition-all duration-200 ${
        hover ? 'hover:border-slate-700/80 hover:bg-slate-900 hover:shadow-elevated hover:translate-y-[-1px]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-800/80 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base sm:text-lg font-bold text-white tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-slate-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pt-0 sm:pt-0 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
