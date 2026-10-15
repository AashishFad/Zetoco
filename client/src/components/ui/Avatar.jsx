import React from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg font-bold',
};

const statusMap = {
  online: 'bg-emerald-500 ring-surface-950',
  offline: 'bg-slate-500 ring-surface-950',
  away: 'bg-amber-500 ring-surface-950',
  busy: 'bg-rose-500 ring-surface-950',
};

const bgColors = [
  'bg-[#17171C] text-[#F5F5F7] border border-[#292930]',
  'bg-[#202027] text-[#F5F5F7] border border-[#292930]',
  'bg-indigo-950/70 text-indigo-200 border border-indigo-500/30',
  'bg-slate-800 text-slate-200 border border-slate-700',
  'bg-zinc-800 text-zinc-200 border border-zinc-700',
  'bg-neutral-800 text-neutral-200 border border-neutral-700',
];

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'ZT';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || 'ZT';
};

const getColorIndex = (name = '') => {
  const safeStr = typeof name === 'string' ? name : (name ? String(name) : 'ZT');
  let hash = 0;
  for (let i = 0; i < safeStr.length; i++) {
    hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % bgColors.length);
};

export default function Avatar({
  src,
  name = '',
  size = 'md',
  status,
  className = '',
}) {
  const cleanName = typeof name === 'string' ? name : (name ? String(name) : '');
  const initials = getInitials(cleanName);
  const colorBg = bgColors[getColorIndex(cleanName)];

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-surface-800 shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} ${colorBg} rounded-full flex items-center justify-center font-semibold text-white shadow-sm ring-2 ring-surface-800`}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ${statusMap[status] || 'bg-slate-500'}`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ children, max = 4, size = 'sm', className = '' }) {
  const items = React.Children.toArray(children);
  const visibleItems = items.slice(0, max);
  const extraCount = items.length - max;

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`}>
      {visibleItems.map((child, index) => (
        <div key={index} className="inline-block ring-2 ring-surface-950 rounded-full">
          {child}
        </div>
      ))}
      {extraCount > 0 && (
        <div
          className={`${sizeMap[size]} rounded-full bg-surface-800 text-slate-300 ring-2 ring-surface-950 flex items-center justify-center font-semibold text-xs`}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}
