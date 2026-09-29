import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-surface-900/80 border border-surface-800/80 shadow-card backdrop-blur-sm ${
        hover ? 'hover:border-surface-700/90 hover:shadow-glow-brand/20 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pb-3 ${className}`} {...props}>
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
    <p className={`text-xs sm:text-sm text-slate-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-5 sm:p-6 pt-3 border-t border-surface-800/70 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
