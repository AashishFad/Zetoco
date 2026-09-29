import React from 'react';

/**
 * Reusable Avatar Component
 * Supports initials fallback, image src, online/busy/away status dot, and sizes
 */
export default function Avatar({
  name = 'User',
  src,
  size = 'md',
  status, // 'online' | 'offline' | 'busy' | 'away'
  className = '',
}) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg font-bold',
  };

  const statusSizeMap = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    busy: 'bg-rose-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-500',
  };

  // Generate consistent gradient initials background from name
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const getGradient = (n) => {
    const gradients = [
      'from-brand-600 to-indigo-800',
      'from-accent-600 to-teal-800',
      'from-purple-600 to-pink-800',
      'from-emerald-600 to-teal-900',
      'from-amber-600 to-orange-800',
      'from-rose-600 to-pink-900',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover ring-1 ring-slate-700/60`}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full bg-gradient-to-tr ${getGradient(
            name
          )} flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-white/10`}
          title={name}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-slate-900 ${
            statusSizeMap[size] || statusSizeMap.md
          } ${statusColors[status] || statusColors.offline}`}
          title={`${name} is ${status}`}
        />
      )}
    </div>
  );
}
