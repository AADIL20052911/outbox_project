import React, { useState } from 'react';
import { ScheduledEmailItem } from '../types';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

export interface EmailEditFormProps {
  email: ScheduledEmailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    recipient: string;
    subject: string;
    body: string;
    scheduledAt?: string;
  }) => Promise<void>;
  isSaving?: boolean;
  error?: string | null;
}

export const EmailEditForm: React.FC<EmailEditFormProps> = ({
  email,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  error,
}) => {
  const [recipient, setRecipient] = useState(email?.recipientEmail || '');
  const [subject, setSubject] = useState(email?.subject || '');
  const [body, setBody] = useState(email?.body || '');
  const [scheduledAt, setScheduledAt] = useState(
    email?.scheduledTime ? new Date(email.scheduledTime).toISOString().slice(0, 16) : ''
  );

  const handleSave = async () => {
    try {
      await onSave({
        recipient,
        subject,
        body,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      onClose();
    } catch (err) {
      // Error is handled by parent component
    }
  };

  const footerActions = (
    <>
      <Button variant="outline" size="md" onClick={onClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        disabled={isSaving || !recipient || !subject || !body}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Email"
      subtitle="Update the email details and schedule"
      footer={footerActions}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-danger-light border border-danger rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recipient */}
        <Input
          label="Recipient Email"
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="john@example.com"
          disabled={isSaving}
          error={recipient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) ? 'Invalid email' : undefined}
        />

        {/* Subject */}
        <Input
          label="Subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          disabled={isSaving}
        />

        {/* Body */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
            Message
          </label>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email message here..."
            className="w-full px-4 py-3 text-sm bg-surface text-text-primary border border-border rounded-ten transition-smooth outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-surface-muted disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSaving}
          />
        </div>

        {/* Scheduled Time (only for scheduled emails) */}
        {email?.status === 'SCHEDULED' && (
          <Input
            label="Scheduled Time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={isSaving}
          />
        )}

        {/* Info message for SENT emails being edited */}
        {email?.status === 'SENT' && (
          <div className="p-3 bg-info-light border border-info rounded-lg text-info text-xs">
            <p className="font-semibold mb-1">Note</p>
            <p>Editing a sent email will create a new scheduled email. The original sent email will remain unchanged in your history.</p>
          </div>
        )}

        {/* Info message for FAILED emails being edited */}
        {email?.status === 'FAILED' && (
          <div className="p-3 bg-warning-light border border-warning rounded-lg text-warning text-xs">
            <p className="font-semibold mb-1">Failed Email</p>
            <p>Editing this failed email will create a new scheduled email with the updated content. The original failed email will remain in your history.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
