import { ScheduledEmailItem, SenderAccount, SlackIntegrationState, User } from '../../types';

export const INITIAL_MOCK_USER: User = {
  id: 'usr_reach_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@reachinbox.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
};

export const MOCK_SENDERS: SenderAccount[] = [
  { id: 'snd_01', name: 'ReachInbox Growth', email: 'outreach@reachinbox.ai', hourlyLimit: 100 },
  { id: 'snd_02', name: 'Alex Morgan (Primary)', email: 'alex.morgan@reachinbox.ai', hourlyLimit: 50 },
  { id: 'snd_03', name: 'Product Announcements', email: 'updates@reachinbox.ai', hourlyLimit: 250 },
];

export const INITIAL_MOCK_SCHEDULED_EMAILS: ScheduledEmailItem[] = [
  {
    id: 'em_sch_101',
    recipientEmail: 'sarah.connor@cyberdyne.io',
    recipientName: 'Sarah Connor',
    subject: 'Q3 Enterprise Email Automation Demo',
    body: 'Hi Sarah, wanted to follow up on your demo request for ReachInbox high-deliverability scheduling...',
    scheduledTime: '2026-08-29T09:30:00Z',
    status: 'SCHEDULED',
    senderEmail: 'alex.morgan@reachinbox.ai',
    senderName: 'Alex Morgan',
    hourlyLimit: 50,
  },
  {
    id: 'em_sch_102',
    recipientEmail: 'david.beckham@intermiami.com',
    recipientName: 'David Beckham',
    subject: 'Scaling Outreach Without Hitting Rate Limits',
    body: 'Hey David, checking if your team is currently experiencing domain throttle issues during outbound sequences...',
    scheduledTime: '2026-08-29T11:00:00Z',
    status: 'PROCESSING',
    senderEmail: 'outreach@reachinbox.ai',
    senderName: 'ReachInbox Growth',
    hourlyLimit: 100,
  },
  {
    id: 'em_sch_103',
    recipientEmail: 'elena.rodriguez@stripe-dev.net',
    recipientName: 'Elena Rodriguez',
    subject: 'Integration Specs: Webhook-driven scheduling engine',
    body: 'Hi Elena, here are the updated API specifications for configuring real-time Slack triggers and BullMQ queues...',
    scheduledTime: '2026-08-29T14:15:00Z',
    status: 'SCHEDULED',
    senderEmail: 'updates@reachinbox.ai',
    senderName: 'Product Announcements',
    hourlyLimit: 250,
  },
  {
    id: 'em_sch_104',
    recipientEmail: 'marcus.vance@scale.ai',
    recipientName: 'Marcus Vance',
    subject: 'Failed delivery notice - Domain MX error retry window',
    body: 'Notice: Delivery attempt for Marcus Vance will be automatically retried in the next 1-hour window.',
    scheduledTime: '2026-08-28T22:00:00Z',
    status: 'FAILED',
    senderEmail: 'outreach@reachinbox.ai',
    senderName: 'ReachInbox Growth',
    errorMessage: 'SMTP 550 5.1.1 Recipient address rejected: User unknown in virtual mailbox table.',
    hourlyLimit: 100,
  },
];

export const INITIAL_MOCK_SENT_EMAILS: ScheduledEmailItem[] = [
  {
    id: 'em_sent_201',
    recipientEmail: 'tech.lead@linear.app',
    recipientName: 'Guillermo Rauch',
    subject: 'Product Launch: ReachInbox Operations Console v2.0',
    body: 'Hi Guillermo, excited to announce the general availability of ReachInbox Email Scheduler with native rate limit deferral...',
    scheduledTime: '2026-08-28T16:00:00Z',
    sentTime: '2026-08-28T16:00:14Z',
    status: 'SENT',
    senderEmail: 'alex.morgan@reachinbox.ai',
    senderName: 'Alex Morgan',
    hourlyLimit: 50,
  },
  {
    id: 'em_sent_202',
    recipientEmail: 'ops@vercel.com',
    recipientName: 'Vercel Ops',
    subject: 'Infrastructure Update: Node.js + BullMQ queue throughput benchmark',
    body: 'Sharing our benchmark performance metrics for sending 50,000 emails per hour with 0 domain throttling...',
    scheduledTime: '2026-08-28T14:30:00Z',
    sentTime: '2026-08-28T14:30:05Z',
    status: 'SENT',
    senderEmail: 'updates@reachinbox.ai',
    senderName: 'Product Announcements',
    hourlyLimit: 250,
  },
  {
    id: 'em_sent_203',
    recipientEmail: 'founders@ycombinator.com',
    recipientName: 'YC Batch W26',
    subject: 'B2B Email Operations Best Practices Blueprint',
    body: 'Here is the comprehensive guide for early stage SaaS founders setting up cold outreach automation...',
    scheduledTime: '2026-08-28T10:00:00Z',
    sentTime: '2026-08-28T10:00:02Z',
    status: 'SENT',
    senderEmail: 'outreach@reachinbox.ai',
    senderName: 'ReachInbox Growth',
    hourlyLimit: 100,
  },
];

export const INITIAL_SLACK_STATE: SlackIntegrationState = {
  isConnected: true,
  workspaceName: 'ReachInbox Operations',
  webhookUrl: 'https://hooks.slack.com/services/T0123/B0456/789xyz',
  connectedAt: '2026-08-01T08:00:00Z',
};
