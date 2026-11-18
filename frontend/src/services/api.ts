import axios from 'axios';
import {
  ScheduledEmailItem,
  SenderAccount,
  SlackIntegrationState,
  User,
  EmailScheduleFormData,
  ScheduleStatus,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export interface ScheduleResponseData {
  success: boolean;
  createdCount: number;
  rejectedCount: number;
  emails: any[];
}

function mapBackendEmailToFrontend(raw: any): ScheduledEmailItem {
  const statusUpper = (raw.status || 'SCHEDULED').toUpperCase() as ScheduleStatus;
  const recipientEmail = raw.recipient || raw.recipientEmail || 'unknown@domain.com';

  return {
    id: raw.id,
    recipientEmail,
    recipientName: recipientEmail.split('@')[0],
    subject: raw.subject || '',
    body: raw.body || '',
    scheduledTime: raw.scheduledAt || raw.scheduledTime || new Date().toISOString(),
    sentTime: raw.sentAt || raw.sentTime || undefined,
    status: statusUpper,
    senderEmail: raw.sender?.email || raw.senderEmail || 'outreach@reachinbox.ai',
    senderName: raw.sender?.name || raw.senderName || 'ReachInbox Sender',
    errorMessage: raw.errorMessage || (statusUpper === 'FAILED' ? 'Delivery attempt failed' : undefined),
    hourlyLimit: raw.hourlyLimit || 50,
  };
}

export const apiService = {
  // Authentication
  getGoogleOAuthUrl(): string {
    return `${API_BASE_URL}/auth/google`;
  },

  async devLogin(): Promise<User> {
    const response = await apiClient.post('/dev/login');
    return response.data.user;
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (err: any) {
      throw new Error(`Failed to fetch authenticated user profile: ${err.message}`);
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (err: any) {
      console.warn('[API Client] Logout call warning:', err.message);
    }
    
    // Clear all local storage data
    localStorage.clear();
    sessionStorage.clear();
  },

  // Emails
  async getScheduledEmails(): Promise<ScheduledEmailItem[]> {
    try {
      const response = await apiClient.get('/emails/scheduled');
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map(mapBackendEmailToFrontend);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Could not connect to backend server';
      throw new Error(`Failed to load scheduled emails: ${message}`);
    }
  },

  async getSentEmails(): Promise<ScheduledEmailItem[]> {
    try {
      const response = await apiClient.get('/emails/sent');
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map(mapBackendEmailToFrontend);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Could not connect to backend server';
      throw new Error(`Failed to load sent emails: ${message}`);
    }
  },

  async searchEmails(query: string): Promise<ScheduledEmailItem[]> {
    try {
      const response = await apiClient.get('/emails/search', { params: { q: query } });
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map(mapBackendEmailToFrontend);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Search request failed';
      throw new Error(`Search failed: ${message}`);
    }
  },

  async getSenderAccounts(): Promise<SenderAccount[]> {
    try {
      const response = await apiClient.get('/emails/senders').catch(() => null);
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [
        { id: 'snd_01', name: 'ReachInbox Growth', email: 'outreach@reachinbox.ai', hourlyLimit: 100 },
        { id: 'snd_02', name: 'Alex Morgan (Primary)', email: 'alex.morgan@reachinbox.ai', hourlyLimit: 50 },
        { id: 'snd_03', name: 'Product Announcements', email: 'updates@reachinbox.ai', hourlyLimit: 250 },
      ];
    } catch (err) {
      return [
        { id: 'snd_01', name: 'ReachInbox Growth', email: 'outreach@reachinbox.ai', hourlyLimit: 100 },
      ];
    }
  },

  async createSchedule(formData: EmailScheduleFormData): Promise<ScheduleResponseData> {
    try {
      const payload = {
        subject: formData.subject,
        body: formData.body,
        recipients: formData.recipients,
        senderId: formData.senderId || 'snd_01',
        startTime: formData.startTime,
        delayMs: (formData.delayBetweenSecs || 2) * 1000,
        hourlyLimit: formData.hourlyLimit || 50,
      };

      const response = await apiClient.post('/emails/schedule', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Server error while scheduling batch';
      throw new Error(`Scheduling failed: ${message}`);
    }
  },

  // Slack
  getSlackConnectUrl(): string {
    return `${API_BASE_URL}/api/slack/connect`;
  },

  async getSlackStatus(): Promise<SlackIntegrationState> {
    try {
      const response = await apiClient.get('/slack/status');
      return {
        ...response.data,
        workspaceName: response.data.workspaceName || response.data.teamName || null,
        connectedAt: response.data.connectedAt || response.data.createdAt,
      };
    } catch (err: any) {
      return { isConnected: false, workspaceName: null };
    }
  },

  async disconnectSlack(): Promise<SlackIntegrationState> {
    try {
      const response = await apiClient.post('/slack/disconnect');
      return {
        ...response.data,
        workspaceName: response.data.workspaceName || response.data.teamName || null,
      };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to disconnect Slack integration';
      throw new Error(message);
    }
  },

  async toggleSlackConnection(connect: boolean): Promise<SlackIntegrationState> {
    if (connect) {
      window.location.href = this.getSlackConnectUrl();
      return { isConnected: false, workspaceName: null };
    } else {
      return this.disconnectSlack();
    }
  },

  // Email detail, edit, delete, retry
  async getEmailById(id: string): Promise<ScheduledEmailItem> {
    try {
      const response = await apiClient.get(`/emails/${id}`);
      return mapBackendEmailToFrontend(response.data);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch email';
      throw new Error(message);
    }
  },

  async updateEmail(id: string, updates: {
    recipient: string;
    subject: string;
    body: string;
    scheduledAt?: string;
    delayMs?: number;
  }): Promise<ScheduledEmailItem> {
    try {
      const response = await apiClient.patch(`/emails/${id}`, updates);
      return mapBackendEmailToFrontend(response.data.email || response.data);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update email';
      throw new Error(message);
    }
  },

  async deleteEmail(id: string): Promise<void> {
    try {
      await apiClient.delete(`/emails/${id}`);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete email';
      throw new Error(message);
    }
  },

  async retryEmail(id: string): Promise<ScheduledEmailItem> {
    try {
      const response = await apiClient.post(`/emails/${id}/retry`);
      return mapBackendEmailToFrontend(response.data.email || response.data);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to retry email';
      throw new Error(message);
    }
  },
};
