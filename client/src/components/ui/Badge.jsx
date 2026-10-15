import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) {
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1 font-medium',
    sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const variantStyles = {
    brand: 'bg-indigo-500/12 text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/12 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/12 text-red-300 border-red-500/30',
    neutral: 'bg-[#1F1F24] text-[#A1A1AA] border-[#292930]',
    cyan: 'bg-sky-500/12 text-sky-300 border-sky-500/30',
    purple: 'bg-purple-500/12 text-purple-300 border-purple-500/30',
  };

  const dotColors = {
    brand: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    neutral: 'bg-[#71717A]',
    cyan: 'bg-sky-400',
    purple: 'bg-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded border ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-[#71717A]'}`} />}
      {children}
    </span>
  );
}
