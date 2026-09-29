import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-xs px-3.5 py-2 gap-2',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25 focus:ring-brand-500 hover:shadow-glow-brand border border-brand-500/30',
    secondary: 'bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700/80 focus:ring-slate-500 shadow-sm',
    outline: 'bg-transparent hover:bg-surface-800/60 text-slate-300 hover:text-white border border-surface-700 focus:ring-brand-500',
    ghost: 'bg-transparent hover:bg-surface-800/60 text-slate-300 hover:text-white focus:ring-slate-500',
    danger: 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500 border border-rose-500/30',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500 border border-emerald-500/30',
    subtle: 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/20 focus:ring-brand-500',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
