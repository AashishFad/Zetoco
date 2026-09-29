import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this content. Please try again or check your connection.",
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-rose-500/20 bg-rose-500/5 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRetry}
            leftIcon={RefreshCw}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
