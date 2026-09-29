import React from 'react';

/**
 * Reusable Badge Component
 * Variants: brand, accent, success, warning, danger, slate, violet
 * Sizes: sm, md
 */
export default function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  hasDot = false,
  className = '',
  icon: Icon,
}) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    accent: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    violet: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const dotColors = {
    brand: 'bg-brand-400',
    accent: 'bg-accent-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    slate: 'bg-slate-400',
    violet: 'bg-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {hasDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-current'}`} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      <span>{children}</span>
    </span>
  );
}
