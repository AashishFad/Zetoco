import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = 'Loading content...',
  className = '',
  size = 'md',
}) {
  const spinnerSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <Loader2 className={`${spinnerSizes[size]} text-brand-500 animate-spin mb-3`} />
      <p className="text-xs sm:text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
