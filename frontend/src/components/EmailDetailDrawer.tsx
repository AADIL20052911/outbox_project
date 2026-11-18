import React, { useState } from 'react';
import { ScheduledEmailItem } from '../types';
import { Button } from './Button';
import { Mail, User, Clock, AlertCircle, RotateCw, Trash2, Edit2, X } from 'lucide-react';

export interface EmailDetailDrawerProps {
  email: ScheduledEmailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRetry?: () => void;
}

export const EmailDetailDrawer: React.FC<EmailDetailDrawerProps> = ({
  email,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRetry,
}) => {
  if (!isOpen || !email) return null;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'SENT':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-2xl bg-surface border-l border-border flex flex-col shadow-lg z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Email Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-muted transition-smooth"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Subject */}
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">{email.subject || '(No subject)'}</h3>
              <p className="text-sm text-text-secondary">Subject</p>
            </div>

            {/* Recipient Info */}
            <div className="space-y-4 p-4 bg-surface-elevated rounded-lg border border-border">
              {/* To */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">To</span>
                </div>
                <p className="text-sm text-text-primary font-medium">{email.recipientEmail}</p>
                {email.recipientName && (
                  <p className="text-xs text-text-secondary">{email.recipientName}</p>
                )}
              </div>

              {/* From */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">From</span>
                </div>
                <p className="text-sm text-text-primary font-medium">{email.senderEmail}</p>
              </div>

              {/* Status */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</span>
                </div>
                <div className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(email.status)}`}>
                  {email.status}
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t border-border pt-3 space-y-3">
                {email.status === 'SCHEDULED' && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-text-secondary" />
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Scheduled</span>
                    </div>
                    <p className="text-sm text-text-primary">{formatDateTime(email.scheduledTime)}</p>
                  </div>
                )}

                {email.status === 'SENT' && email.sentTime && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-text-secondary" />
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Sent</span>
                    </div>
                    <p className="text-sm text-text-primary">{formatDateTime(email.sentTime)}</p>
                  </div>
                )}

                {email.status === 'FAILED' && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-danger" />
                      <span className="text-xs font-semibold text-danger uppercase tracking-wide">Error</span>
                    </div>
                    <p className="text-sm text-danger">{email.errorMessage || 'Unknown error'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Message</span>
              </div>
              <div className="p-4 bg-surface-elevated rounded-lg border border-border">
                <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {email.body || '(No message)'}
                </div>
              </div>
            </div>

            {/* Metadata */}
            {email.errorMessage && email.status === 'FAILED' && (
              <div className="p-4 bg-danger-light border border-danger rounded-lg">
                <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">Failure Reason</p>
                <p className="text-sm text-danger">{email.errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-6 flex items-center gap-3 justify-end bg-surface-elevated">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          {email.status === 'FAILED' && onRetry && (
            <Button
              variant="primary"
              size="md"
              icon={RotateCw}
              onClick={onRetry}
            >
              Retry
            </Button>
          )}

          {/* Allow editing for SCHEDULED, SENT, and FAILED emails */}
          {(email.status === 'SCHEDULED' || email.status === 'PROCESSING' || email.status === 'SENT' || email.status === 'FAILED') && (
            <Button
              variant="outline"
              size="md"
              icon={Edit2}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}

          {/* Cannot delete PROCESSING emails */}
          {email.status !== 'PROCESSING' && (
            <Button
              variant="outline"
              size="md"
              icon={Trash2}
              onClick={onDelete}
              className="text-danger hover:bg-danger-light"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
