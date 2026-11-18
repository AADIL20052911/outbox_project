import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { EmailTable } from '../components/EmailTable';
import { ComposeModal } from '../components/ComposeModal';
import { SlackDrawer } from '../components/SlackDrawer';
import { Toast } from '../components/Toast';
import { MetricStrip } from '../components/MetricStrip';
import { EmailDetailDrawer } from '../components/EmailDetailDrawer';
import { EmailEditForm } from '../components/EmailEditForm';
import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { apiService } from '../services/api';
import {
  User,
  ScheduledEmailItem,
  SenderAccount,
  SlackIntegrationState,
  RateLimitToastPayload,
  EmailScheduleFormData,
} from '../types';
import { Plus, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeNavTab, setActiveNavTab] = useState<'scheduled' | 'sent'>('scheduled');

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ScheduledEmailItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [successToastMsg, setSuccessToastMsg] = useState<string | null>(null);

  
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmailItem[]>([]);
  const [sentEmails, setSentEmails] = useState<ScheduledEmailItem[]>([]);
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [slackState, setSlackState] = useState<SlackIntegrationState>({ isConnected: false, workspaceName: null });

  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSlackDrawerOpen, setIsSlackDrawerOpen] = useState(false);
  const [rateLimitToastPayload, setRateLimitToastPayload] = useState<RateLimitToastPayload | null>(null);

  // Email detail/edit/delete states
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmailItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEmailOperationLoading, setIsEmailOperationLoading] = useState(false);
  const [emailOperationError, setEmailOperationError] = useState<string | null>(null);

  // Deduplicate senders by email to prevent duplicates in dropdown
  const uniqueSenders = useMemo(() => {
    const seen = new Set<string>();
    return senders.filter((sender) => {
      if (seen.has(sender.email)) {
        return false;
      }
      seen.add(sender.email);
      return true;
    });
  }, [senders]);

  // Clear all state when user changes (logout/login)
  const clearAllState = () => {
    setScheduledEmails([]);
    setSentEmails([]);
    setSenders([]);
    setSlackState({ isConnected: false, workspaceName: null });
    setSearchResults(null);
    setGlobalSearch('');
    setConnectionError(null);
    setSuccessToastMsg(null);
    setRateLimitToastPayload(null);
    setActiveNavTab('scheduled');
    setSelectedEmail(null);
    setIsDetailDrawerOpen(false);
    setIsEditFormOpen(false);
    setIsDeleteConfirmOpen(false);
    setEmailOperationError(null);
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const [scheduledData, sentData, senderData, slackData] = await Promise.all([
        apiService.getScheduledEmails(),
        apiService.getSentEmails(),
        apiService.getSenderAccounts(),
        apiService.getSlackStatus(),
      ]);

      setScheduledEmails(scheduledData);
      setSentEmails(sentData);
      setSenders(senderData);
      setSlackState(slackData);
    } catch (err: any) {
      console.error('[Dashboard] API Connection Error:', err);
      setConnectionError(err.message || 'Unable to connect to ReachInbox backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    clearAllState();
    loadDashboardData();
  }, [user.id]); // Re-fetch when user changes

  
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await apiService.searchEmails(globalSearch.trim());
        setSearchResults(results);
      } catch (err: any) {
        console.warn('[Dashboard] Search query error:', err.message);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  const handleComposeSubmit = async (formData: EmailScheduleFormData) => {
    const response = await apiService.createSchedule(formData);

    
    await loadDashboardData();

    
    setSuccessToastMsg(`Successfully scheduled ${response.createdCount || formData.recipients.length} emails!`);
    setTimeout(() => setSuccessToastMsg(null), 6000);

    
    if (formData.recipients.length > formData.hourlyLimit) {
      const sender = senders.find((s) => s.id === formData.senderId) || senders[0] || { email: 'outreach@reachinbox.ai' };
      const nextWindowTime = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      setRateLimitToastPayload({
        id: `toast_${Date.now()}`,
        sender: sender.email,
        limit: formData.hourlyLimit,
        nextWindow: nextWindowTime,
        slackStatus: slackState.isConnected ? 'Sent' : 'Not configured',
      });
    }
  };

  const handleToggleSlack = async (connect: boolean) => {
    try {
      const updated = await apiService.toggleSlackConnection(connect);
      setSlackState(updated);
    } catch (err: any) {
      setConnectionError(`Slack Integration Error: ${err.message}`);
    }
  };

  const triggerTestRateLimitToast = () => {
    const primarySender = senders[0] || { email: 'outreach@reachinbox.ai', hourlyLimit: 50 };
    const nextWindowTime = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setRateLimitToastPayload({
      id: `toast_${Date.now()}`,
      sender: primarySender.email,
      limit: primarySender.hourlyLimit,
      nextWindow: nextWindowTime,
      slackStatus: slackState.isConnected ? 'Sent' : 'Not configured',
    });
  };

  const handleSelectNavTab = (tab: 'scheduled' | 'sent') => {
    setActiveNavTab(tab);
    setSearchResults(null);
  };

  // Email management handlers
  const handleRowClick = (email: ScheduledEmailItem) => {
    setSelectedEmail(email);
    setIsDetailDrawerOpen(true);
    setEmailOperationError(null);
  };

  const handleEditEmail = async (updates: {
    recipient: string;
    subject: string;
    body: string;
    scheduledAt?: string;
  }) => {
    if (!selectedEmail) return;

    setIsEmailOperationLoading(true);
    setEmailOperationError(null);

    try {
      const updatedEmail = await apiService.updateEmail(selectedEmail.id, updates);
      setSuccessToastMsg('Email updated successfully');
      
      // Refresh the email list
      await loadDashboardData();
      
      // Close modals
      setIsDetailDrawerOpen(false);
      setIsEditFormOpen(false);
      setSelectedEmail(null);
      
      setTimeout(() => setSuccessToastMsg(null), 6000);
    } catch (err: any) {
      setEmailOperationError(err.message || 'Failed to update email');
    } finally {
      setIsEmailOperationLoading(false);
    }
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;

    setIsEmailOperationLoading(true);
    setEmailOperationError(null);

    try {
      await apiService.deleteEmail(selectedEmail.id);
      setSuccessToastMsg('Email deleted successfully');
      
      // Refresh the email list
      await loadDashboardData();
      
      // Close modals
      setIsDetailDrawerOpen(false);
      setIsDeleteConfirmOpen(false);
      setSelectedEmail(null);
      
      setTimeout(() => setSuccessToastMsg(null), 6000);
    } catch (err: any) {
      setEmailOperationError(err.message || 'Failed to delete email');
    } finally {
      setIsEmailOperationLoading(false);
    }
  };

  const handleRetryEmail = async () => {
    if (!selectedEmail) return;

    setIsEmailOperationLoading(true);
    setEmailOperationError(null);

    try {
      const retriedEmail = await apiService.retryEmail(selectedEmail.id);
      setSuccessToastMsg('Email re-queued successfully');
      
      // Update selected email with new status
      setSelectedEmail(retriedEmail);
      
      // Refresh the email list
      await loadDashboardData();
      
      setTimeout(() => setSuccessToastMsg(null), 6000);
    } catch (err: any) {
      setEmailOperationError(err.message || 'Failed to retry email');
    } finally {
      setIsEmailOperationLoading(false);
    }
  };

  
  const currentItems = searchResults !== null
    ? searchResults
    : activeNavTab === 'scheduled'
    ? scheduledEmails
    : sentEmails;
  const deliveredCount = sentEmails.filter((email) => email.status === 'SENT').length;
  const failedCount = sentEmails.filter((email) => email.status === 'FAILED').length;
  const processingCount = scheduledEmails.filter((email) => email.status === 'PROCESSING').length;

  // Get page title based on active tab
  const getPageTitle = () => {
    if (activeNavTab === 'scheduled') return 'Scheduled Emails';
    return 'Sent Emails';
  };

  return (
    <AppShell
      activeTab={activeNavTab}
      onSelectTab={handleSelectNavTab}
      slackState={slackState}
      onOpenSlackDrawer={() => setIsSlackDrawerOpen(true)}
      user={user}
      onLogout={onLogout}
      globalSearch={globalSearch}
      onSearchChange={setGlobalSearch}
      scheduledCount={scheduledEmails.length}
      sentCount={sentEmails.length}
    >
      <div className="flex flex-col gap-6">
        {/* Connection Error Alert */}
        {connectionError && (
          <div className="p-4 bg-danger-light border border-danger rounded-ten shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-danger animate-slide-in-down">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 text-danger rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Backend Connection Failed</span>
                <span className="text-xs text-danger/80 mt-0.5">{connectionError}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadDashboardData}
              className="bg-white hover:bg-danger/5 text-danger border-danger/30 shrink-0"
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Success Toast */}
        {successToastMsg && (
          <div className="p-3.5 bg-success-light border border-success rounded-ten text-success text-sm font-medium flex items-center justify-between shadow-subtle animate-slide-in-down">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <span>{successToastMsg}</span>
            </div>
            <button
              onClick={() => setSuccessToastMsg(null)}
              className="text-xs font-semibold text-success/80 hover:text-success underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="animate-slide-in-up" style={{ animationDelay: '0ms' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">{getPageTitle()}</h1>
              <p className="text-sm text-text-secondary mt-1">
                {activeNavTab === 'scheduled' 
                  ? 'Manage your scheduled and queued email deliveries.'
                  : 'View sent and failed email delivery history.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                icon={ShieldAlert}
                onClick={triggerTestRateLimitToast}
                title="Test rate limit toast alert"
              >
                Test Alert
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setIsComposeOpen(true)}
              >
                + New Email
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="animate-slide-in-up" style={{ animationDelay: '75ms' }}>
          <MetricStrip
            scheduledCount={scheduledEmails.length}
            sentCount={deliveredCount}
            failedCount={failedCount}
            queuedCount={processingCount}
          />
        </div>

        {/* Email Table */}
        <div className="animate-slide-in-up" style={{ animationDelay: '150ms' }}>
          <div className="space-y-4">
            {/* Table Header with Refresh */}
            <div className="flex items-center justify-end">
              <button
                onClick={loadDashboardData}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-lg transition-colors shrink-0"
                title="Refresh table data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Email Table */}
            <EmailTable
              type={activeNavTab}
              items={currentItems}
              isLoading={isLoading}
              onRefresh={loadDashboardData}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* Slack Integration Section */}
        <div className="animate-slide-in-up" style={{ animationDelay: '225ms' }}>
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Slack Notifications</h3>
                <p className="text-xs text-text-secondary mt-1">Get instant alerts for delivery updates and errors</p>
              </div>
              <button
                onClick={() => setIsSlackDrawerOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-surface border border-border rounded-lg text-text-secondary hover:bg-surface-muted transition-smooth"
              >
                {slackState.isConnected ? 'Manage' : 'Configure'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${slackState.isConnected ? 'bg-success animate-pulse-subtle' : 'bg-text-tertiary'}`} />
              <span className="text-sm text-text-secondary">
                {slackState.isConnected 
                  ? `Connected to ${slackState.workspaceName || 'Slack workspace'}`
                  : 'Not connected. Connect your Slack workspace to receive notifications.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        senders={uniqueSenders}
        onScheduleSubmit={handleComposeSubmit}
      />

      {/* Slack Integration Drawer */}
      <SlackDrawer
        isOpen={isSlackDrawerOpen}
        onClose={() => setIsSlackDrawerOpen(false)}
        slackState={slackState}
        onToggleConnection={handleToggleSlack}
      />

      {/* Email Detail Drawer */}
      <EmailDetailDrawer
        email={selectedEmail}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedEmail(null);
          setEmailOperationError(null);
        }}
        onEdit={() => {
          setIsDetailDrawerOpen(false);
          setIsEditFormOpen(true);
        }}
        onDelete={() => {
          setIsDetailDrawerOpen(false);
          setIsDeleteConfirmOpen(true);
        }}
        onRetry={handleRetryEmail}
      />

      {/* Email Edit Form */}
      <EmailEditForm
        email={selectedEmail}
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedEmail(null);
          setEmailOperationError(null);
        }}
        onSave={handleEditEmail}
        isSaving={isEmailOperationLoading}
        error={emailOperationError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEmailOperationError(null);
        }}
        onConfirm={handleDeleteEmail}
        isDeleting={isEmailOperationLoading}
        emailStatus={selectedEmail?.status as any}
      />

      {/* Rate Limit Toast */}
      <Toast toast={rateLimitToastPayload} onClose={() => setRateLimitToastPayload(null)} />
    </AppShell>
  );
};
