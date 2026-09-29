import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Error State Component
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this content. Please try again.",
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-500/20 bg-rose-950/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-rose-200/80 max-w-sm mt-1 mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={RotateCcw}>
          Try Again
        </Button>
      )}
    </div>
  );
}
