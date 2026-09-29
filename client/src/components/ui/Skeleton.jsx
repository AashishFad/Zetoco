import React from 'react';

/**
 * Reusable Skeleton Loaders for clean loading UI
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/80 ${className}`} />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex -space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}

export default Skeleton;
