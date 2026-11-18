export type ScheduleStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface SenderAccount {
  id: string;
  name: string;
  email: string;
  hourlyLimit: number;
}

export interface ScheduledEmailItem {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  scheduledTime: string; 
  sentTime?: string;
  status: ScheduleStatus;
  senderEmail: string;
  senderName: string;
  errorMessage?: string;
  hourlyLimit: number;
}

export interface SlackIntegrationState {
  isConnected: boolean;
  workspaceName: string | null;
  teamName?: string | null;
  teamId?: string;
  slackUserId?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  webhookUrl?: string;
  connectedAt?: string;
  createdAt?: string;
}

export interface RateLimitToastPayload {
  id: string;
  sender: string;
  limit: number;
  nextWindow: string;
  slackStatus: 'Sent' | 'Failed' | 'Not configured';
}

export interface EmailScheduleFormData {
  subject: string;
  body: string;
  senderId: string;
  startTime: string;
  delayBetweenSecs: number;
  hourlyLimit: number;
  recipients: string[];
  invalidEmails: string[];
  fileName?: string;
}

export type ComposeModalState = 'empty' | 'uploading' | 'uploaded' | 'validation_error' | 'scheduling_loading' | 'success';
