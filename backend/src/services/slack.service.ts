import axios from 'axios';
import { prisma } from './prisma.service';

export interface SlackRateLimitNotificationPayload {
  senderEmail: string;
  hourlyLimit: number;
  currentHour: string;
  nextWindowEta: string;
}

export async function sendSlackRateLimitNotification(
  userId: string,
  payload: SlackRateLimitNotificationPayload
): Promise<boolean> {
  try {
    // Critical: Only fetch Slack connection for the authenticated user
    const slackConn = await prisma.slackConnection.findUnique({
      where: { userId },
    });

    if (!slackConn || !slackConn.accessToken) {
      return false;
    }

    const messageText =
      `ReachInbox rate limit reached: sender ${payload.senderEmail} has reached ${payload.hourlyLimit} emails/hour. ` +
      `Remaining emails were deferred to the next available window.\n` +
      `Current window: ${payload.currentHour}\n` +
      `Next available dispatch: ${payload.nextWindowEta}`;

    // Determine if accessToken is a webhook URL or OAuth token
    if (slackConn.accessToken.startsWith('http://') || slackConn.accessToken.startsWith('https://')) {
      // Webhook URL
      await axios.post(slackConn.accessToken, { text: messageText }, { timeout: 5000 });
    } else {
      // OAuth token - use chat.postMessage API
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: slackConn.channelId || slackConn.channelName || '#general',
          text: messageText,
        },
        {
          headers: {
            Authorization: `Bearer ${slackConn.accessToken}`,
            'Content-Type': 'application/json; charset=utf-8',
          },
          timeout: 5000,
        }
      );
    }

    console.log(`[Slack Service] Sent rate limit alert to workspace '${slackConn.teamName}'`);
    return true;
  } catch (err: any) {
    console.warn('[Slack Service] Failed to send notification:', err.message);
    return false;
  }
}
