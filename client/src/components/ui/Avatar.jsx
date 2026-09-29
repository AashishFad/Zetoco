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
  'bg-gradient-to-tr from-indigo-600 to-indigo-400',
  'bg-gradient-to-tr from-cyan-600 to-blue-400',
  'bg-gradient-to-tr from-purple-600 to-pink-400',
  'bg-gradient-to-tr from-emerald-600 to-teal-400',
  'bg-gradient-to-tr from-amber-600 to-orange-400',
  'bg-gradient-to-tr from-rose-600 to-red-400',
];

const getInitials = (name) => {
  if (!name) return 'FS';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getColorIndex = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
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
  const initials = getInitials(name);
  const colorBg = bgColors[getColorIndex(name)];

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
