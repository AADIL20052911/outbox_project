import React from 'react';
import { CalendarClock, Send, Inbox, Search } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  type: 'scheduled' | 'sent' | 'generic';
  title?: string;
  description?: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

const EMPTY_STATE_CONFIG = {
  scheduled: {
    icon: CalendarClock,
    title: 'No scheduled emails',
    description: 'Your queued campaigns will appear here once scheduled.',
  },
  sent: {
    icon: Send,
    title: 'No sent emails yet',
    description: 'Successfully delivered messages will appear here.',
  },
  generic: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  onActionClick,
  actionLabel,
}) => {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-tertiary mb-4">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2 text-center">
        {title || config.title}
      </h3>
      <p className="text-sm text-text-secondary text-center max-w-xs mb-6">
        {description || config.description}
      </p>
      {onActionClick && actionLabel && (
        <Button variant="primary" size="sm" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
