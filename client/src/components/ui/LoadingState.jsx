import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner Container
 */
export default function LoadingState({
  message = 'Loading data...',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-300">{message}</p>
    </div>
  );
}
