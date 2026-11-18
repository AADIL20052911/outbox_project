import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { FileDropzone } from './FileDropzone';
import { SenderAccount, EmailScheduleFormData, ComposeModalState } from '../types';
import { Send, Clock, Sliders, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  senders: SenderAccount[];
  onScheduleSubmit: (formData: EmailScheduleFormData) => Promise<void>;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  senders,
  onScheduleSubmit,
}) => {
  const defaultStartTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderId, setSenderId] = useState(senders[0]?.id || 'snd_01');
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [delayBetweenSecs, setDelayBetweenSecs] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(50);
  
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  
  const [modalState, setModalState] = useState<ComposeModalState>('empty');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileLoaded = (valid: string[], invalid: string[], name: string) => {
    setValidEmails(valid);
    setInvalidEmails(invalid);
    setFileName(name);
    if (valid.length > 0) {
      setModalState('uploaded');
      setErrorMessage(null);
    } else {
      setModalState('validation_error');
      setErrorMessage('No valid email addresses were found in the uploaded file.');
    }
  };

  const handleClearFile = () => {
    setValidEmails([]);
    setInvalidEmails([]);
    setFileName(undefined);
    setModalState('empty');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject line.');
      setModalState('validation_error');
      return;
    }

    if (!body.trim()) {
      setErrorMessage('Please enter the email body content.');
      setModalState('validation_error');
      return;
    }

    if (validEmails.length === 0) {
      setErrorMessage('Please upload a CSV or TXT file containing lead recipients.');
      setModalState('validation_error');
      return;
    }

    setModalState('scheduling_loading');
    setErrorMessage(null);

    try {
      await onScheduleSubmit({
        subject,
        body,
        senderId,
        startTime,
        delayBetweenSecs,
        hourlyLimit,
        recipients: validEmails,
        invalidEmails,
        fileName,
      });

      setModalState('success');
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1200);
    } catch (err) {
      setModalState('validation_error');
      setErrorMessage('Failed to schedule emails. Please check your network and try again.');
    }
  };

  const resetForm = () => {
    setSubject('');
    setBody('');
    setStartTime(defaultStartTime);
    setDelayBetweenSecs(2);
    setHourlyLimit(50);
    setValidEmails([]);
    setInvalidEmails([]);
    setFileName(undefined);
    setModalState('empty');
    setErrorMessage(null);
  };

  // Deduplicate senders by email and create options
  const senderOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const uniqueSenders = senders.filter((sender) => {
      if (seen.has(sender.email)) {
        return false;
      }
      seen.add(sender.email);
      return true;
    });

    return uniqueSenders.map((s) => ({
      value: s.id,
      label: s.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      sublabel: `${s.email} • Max ${s.hourlyLimit}/hr`,
    }));
  }, [senders]);

  // Set default sender on mount
  React.useEffect(() => {
    if (senders.length > 0 && !senderId) {
      setSenderId(senders[0].id);
    }
  }, [senders, senderId]);

  const footerActions = (
    <>
      <Button variant="outline" size="md" onClick={onClose} disabled={modalState === 'scheduling_loading'}>
        Cancel
      </Button>
      <Button
        variant="primary"
        size="md"
        icon={Send}
        onClick={handleSubmit}
        isLoading={modalState === 'scheduling_loading'}
        disabled={validEmails.length === 0 || modalState === 'scheduling_loading'}
      >
        {modalState === 'success'
          ? 'Scheduled Successfully!'
          : `Schedule ${validEmails.length} Email${validEmails.length === 1 ? '' : 's'}`}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose New Email Batch"
      subtitle="Schedule emails with granular delivery controls and rate limiting"
      footer={footerActions}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Success State */}
        {modalState === 'success' && (
          <div className="p-4 bg-success-light border border-success rounded-ten text-success text-sm flex items-center gap-3 animate-slide-in-down">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Campaign scheduled successfully!</span>
              <span className="text-xs text-success/80">{validEmails.length} recipients queued for delivery</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="p-4 bg-danger-light border border-danger rounded-ten text-danger text-sm flex items-center gap-3 animate-slide-in-down">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Validation error</span>
              <span className="text-xs text-danger/80">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Section 1: Email Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Send className="w-4 h-4 text-accent" />
            <span>Email Content</span>
          </div>

          <Select
            label="From Account"
            options={senderOptions}
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
          />

          <Input
            label="Email Subject"
            placeholder="e.g., Scaling Outbound Without Domain Throttling"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Email Body
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email message here..."
              className="w-full px-4 py-3 text-sm bg-surface text-text-primary border border-border rounded-ten transition-smooth outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
        </div>

        {/* Section 2: Recipients */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Mail className="w-4 h-4 text-accent" />
            <span>Recipients</span>
          </div>

          <FileDropzone
            onFileLoaded={handleFileLoaded}
            onClear={handleClearFile}
            fileName={fileName}
            detectedCount={validEmails.length}
            invalidEmails={invalidEmails}
            isUploading={modalState === 'uploading'}
          />
        </div>

        {/* Section 3: Scheduling & Rate Control */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Clock className="w-4 h-4 text-accent" />
            <span>Scheduling</span>
          </div>

          <div className="bg-surface-muted/40 border border-border/50 p-4 rounded-ten space-y-3">
            <Input
              type="datetime-local"
              label="Start Dispatch Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              inputSize="sm"
            />

            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-info" />
              <span>Emails will be sent starting at this time</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Delay Between Emails
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={delayBetweenSecs}
                  onChange={(e) => setDelayBetweenSecs(Number(e.target.value))}
                  inputSize="sm"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-text-tertiary font-medium pointer-events-none">
                  seconds
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Hourly Rate Limit
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={5}
                  max={500}
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  inputSize="sm"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-text-tertiary font-medium pointer-events-none">
                  /hour
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-text-secondary bg-info-light border border-info/20 p-3 rounded-lg">
            <Sliders className="w-3.5 h-3.5 text-info shrink-0 mt-0.5" />
            <span>
              {validEmails.length > hourlyLimit
                ? `⚠️ You have ${validEmails.length} recipients but only ${hourlyLimit}/hour limit. Will throttle over ~${Math.ceil(validEmails.length / hourlyLimit)} hours.`
                : '✓ All emails will be sent within the first hour.'}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
