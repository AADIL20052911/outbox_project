import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  emailStatus?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'PROCESSING';
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  emailStatus,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const getMessage = () => {
    if (emailStatus === 'SENT') {
      return 'Deleting this record removes it from ReachInbox history. It cannot unsend an email that has already been delivered.';
    }
    if (emailStatus === 'SCHEDULED') {
      return 'Deleting this email will cancel the scheduled job and prevent it from being sent.';
    }
    if (emailStatus === 'FAILED') {
      return 'Deleting this email will remove it from your history.';
    }
    if (emailStatus === 'PROCESSING') {
      return 'This email is currently being processed and cannot be deleted right now.';
    }
    return 'This action cannot be undone.';
  };

  const footer = (
    <>
      <Button variant="outline" size="md" onClick={onClose} disabled={isDeleting}>
        Cancel
      </Button>
      <Button
        variant="outline"
        size="md"
        onClick={handleConfirm}
        disabled={isDeleting}
        className="text-danger hover:bg-danger-light border-danger"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Email?"
      footer={footer}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-danger-light text-danger shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">Are you sure?</p>
            <p className="text-sm text-text-secondary">{getMessage()}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
