import React from 'react';

interface MetricStripProps {
  scheduledCount: number;
  sentCount: number;
  failedCount: number;
  queuedCount: number;
}

export const MetricStrip: React.FC<MetricStripProps> = ({
  scheduledCount,
  sentCount,
  failedCount,
  queuedCount,
}) => {
  const metrics = [
    { label: 'Scheduled', value: scheduledCount, color: 'text-info', dotColor: 'bg-info' },
    { label: 'Sent', value: sentCount, color: 'text-success', dotColor: 'bg-success' },
    { label: 'Failed', value: failedCount, color: 'text-danger', dotColor: 'bg-danger' },
    { label: 'Queued', value: queuedCount, color: 'text-warning', dotColor: 'bg-warning' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-0 bg-surface border border-border rounded-lg overflow-hidden divide-x divide-border">
      {metrics.map((metric, idx) => (
        <div
          key={metric.label}
          className="flex flex-col items-start justify-center px-6 py-4 flex-1"
        >
          {/* Metric number */}
          <div className={`text-2xl font-bold ${metric.color}`}>
            {metric.value}
          </div>
          {/* Metric label */}
          <div className="text-xs text-text-secondary font-medium uppercase tracking-wider mt-1">
            {metric.label}
          </div>
          {/* Dot indicator */}
          <div className={`w-1.5 h-1.5 rounded-full ${metric.dotColor} mt-2`} />
        </div>
      ))}
    </div>
  );
};
