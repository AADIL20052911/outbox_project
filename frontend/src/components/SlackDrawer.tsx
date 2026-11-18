import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { SlackIntegrationState } from '../types';
import { Slack, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

export interface SlackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slackState: SlackIntegrationState;
  onToggleConnection: (connect: boolean) => Promise<void>;
}

export const SlackDrawer: React.FC<SlackDrawerProps> = ({
  isOpen,
  onClose,
  slackState,
  onToggleConnection,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggleConnection(!slackState.isConnected);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Slack Notifications Integration"
      subtitle="Receive real-time alerts when hourly sending limits or domain delays occur"
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 py-2">
        {slackState.isConnected ? (
          
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-ten flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
                  <Slack className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Connected Workspace</span>
                  <span className="text-base font-bold text-emerald-950">
                    {slackState.workspaceName || 'ReachInbox Operations'}
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="text-xs text-[var(--text-secondary)] space-y-2 border border-[var(--border)] p-3.5 rounded-ten bg-zinc-50/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)]">Notification Triggers:</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Hourly sending capacity thresholds reached</li>
                <li>Batch completion & deliverability rate alerts</li>
                <li>SMTP failure retries and queue deferrals</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="danger"
                size="sm"
                onClick={handleToggle}
                isLoading={isLoading}
              >
                Disconnect Slack
              </Button>
              <span className="text-[11px] text-[var(--text-secondary)]">Webhook active</span>
            </div>
          </div>
        ) : (
          
          <div className="flex flex-col gap-4 text-center items-center py-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-card">
              <Slack className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Slack notifications</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mt-1">
                Connect your team Slack workspace to automatically receive rate limit alerts and deferred dispatch updates.
              </p>
            </div>

            <div className="w-full bg-zinc-50 border border-[var(--border)] p-3 rounded-ten text-left text-xs text-[var(--text-secondary)] space-y-1">
              <span className="font-semibold text-[var(--text-primary)] block">What happens when connected:</span>
              <p>• Emergency rate limit alerts sent to selected channel</p>
              <p>• Automated next-window delivery ETA summaries</p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Slack}
              onClick={handleToggle}
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Connect Slack
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
