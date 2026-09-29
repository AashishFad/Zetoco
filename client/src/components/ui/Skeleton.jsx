import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-800/80 ${className}`}
      {...props}
    />
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-xl bg-surface-900/80 border border-surface-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface-900/80 border border-surface-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function SkeletonTask() {
  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
