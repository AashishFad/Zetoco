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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-[#080808] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1 gap-1.5 h-7',
    sm: 'text-xs px-3 py-1.5 gap-2 h-8',
    md: 'text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
  };

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm border border-indigo-500/40',
    secondary: 'bg-[#17171C] hover:bg-[#202027] text-[#F5F5F7] border border-[#292930] hover:border-[#383842] shadow-sm',
    outline: 'bg-transparent hover:bg-[#17171C] text-[#A1A1AA] hover:text-[#F5F5F7] border border-[#292930] hover:border-[#383842]',
    ghost: 'bg-transparent hover:bg-[#202027] text-[#A1A1AA] hover:text-[#F5F5F7]',
    danger: 'bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/30 text-red-400 border border-red-500/30 shadow-sm',
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 shadow-sm',
    subtle: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25',
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
