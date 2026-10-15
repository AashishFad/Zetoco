import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-xl bg-[#111114] border border-[#292930] shadow-sm ${
        hover ? 'hover:bg-[#17171C] hover:border-[#383842] transition-colors duration-150' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 pb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-sm sm:text-base font-semibold text-[#F5F5F7] tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-[#A1A1AA] mt-1 leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-4 sm:p-5 pt-3 border-t border-[#1F1F24] flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
