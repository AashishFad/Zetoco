import React from 'react';
import { Layers } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Layers,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-surface-700/80 bg-surface-900/30 ${className}`}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 text-brand-400">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            size="sm"
            onClick={onAction}
            leftIcon={actionIcon}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
