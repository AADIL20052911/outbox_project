import React from 'react';
import { ScheduleStatus } from '../types';

export interface BadgeProps {
  status: ScheduleStatus | string;
  className?: string;
}

type BadgeStyle = {
  container: string;
  dot: string;
  label: string;
};

const STATUS_STYLES: Record<string, BadgeStyle> = {
  SCHEDULED: {
    container: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
    label: 'text-blue-700',
  },
  PROCESSING: {
    container: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500 animate-pulse-subtle',
    label: 'text-amber-700',
  },
  SENT: {
    container: 'bg-success-light border-success',
    dot: 'bg-success',
    label: 'text-success',
  },
  FAILED: {
    container: 'bg-danger-light border-danger',
    dot: 'bg-danger',
    label: 'text-danger',
  },
  DELAYED: {
    container: 'bg-warning-light border-warning',
    dot: 'bg-warning',
    label: 'text-warning',
  },
  RATE_LIMITED: {
    container: 'bg-info-light border-info',
    dot: 'bg-info',
    label: 'text-info',
  },
};

const DEFAULT_STYLE: BadgeStyle = {
  container: 'bg-surface-muted border-border',
  dot: 'bg-text-tertiary',
  label: 'text-text-secondary',
};

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
  const style = STATUS_STYLES[normalizedStatus] || DEFAULT_STYLE;

  return (
    <span
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        text-xs font-semibold
        rounded-lg border
        transition-smooth
        ${style.container}
        ${style.label}
        ${className}
      `}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{status}</span>
    </span>
  );
};
