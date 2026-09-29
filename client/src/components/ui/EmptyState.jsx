import React from 'react';
import { Layers, Plus } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Empty State Component
 */
export default function EmptyState({
  icon: Icon = Layers,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-4 text-brand-400 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} leftIcon={Plus}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
