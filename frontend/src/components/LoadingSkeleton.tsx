import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'table' | 'user-profile' | 'button';
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'table', rows = 5 }) => {
  const skeletonClass = 'animate-shimmer rounded bg-gradient-to-r from-border-light via-surface to-border-light';

  if (variant === 'button') {
    return <div className={`h-9 w-36 rounded-ten ${skeletonClass}`} />;
  }

  if (variant === 'user-profile') {
    return (
      <div className="flex items-center gap-2.5 p-2 rounded-ten w-full">
        <div className={`w-8 h-8 rounded-full ${skeletonClass}`} />
        <div className="flex flex-col gap-1 flex-1">
          <div className={`h-3 w-24 rounded ${skeletonClass}`} />
          <div className={`h-2.5 w-32 rounded ${skeletonClass}`} />
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="w-full flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className={`h-7 w-48 rounded-md ${skeletonClass}`} />
            <div className={`h-4 w-72 rounded-md ${skeletonClass}`} />
          </div>
          <div className={`h-9 w-40 rounded-ten ${skeletonClass}`} />
        </div>
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`h-24 rounded-ten border border-border-light p-4 ${skeletonClass}`} />
          <div className={`h-24 rounded-ten border border-border-light p-4 ${skeletonClass}`} />
          <div className={`h-24 rounded-ten border border-border-light p-4 ${skeletonClass}`} />
        </div>
        {/* Table Skeleton */}
        <LoadingSkeleton variant="table" rows={6} />
      </div>
    );
  }

  /* Table Rows Skeleton */
  return (
    <div className="w-full bg-surface border border-border rounded-ten overflow-hidden shadow-subtle">
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface-muted">
        <div className={`h-8 w-64 rounded-ten ${skeletonClass}`} />
        <div className={`h-8 w-32 rounded-ten ${skeletonClass}`} />
      </div>
      <div className="w-full divide-y divide-border">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 w-1/3">
              <div className={`w-8 h-8 rounded-full shrink-0 ${skeletonClass}`} />
              <div className="flex flex-col gap-1 w-full">
                <div className={`h-3.5 w-3/4 rounded ${skeletonClass}`} />
                <div className={`h-2.5 w-1/2 rounded ${skeletonClass}`} />
              </div>
            </div>
            <div className={`h-3.5 w-1/4 rounded ${skeletonClass}`} />
            <div className={`h-3.5 w-1/6 rounded ${skeletonClass}`} />
            <div className={`h-6 w-20 rounded-full ${skeletonClass}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
