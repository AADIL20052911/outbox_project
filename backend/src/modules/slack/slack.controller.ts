import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../../config';
import { prisma } from '../../services/prisma.service';
import { getSessionUser } from '../../middleware/auth.middleware';

export function connectSlackOAuth(req: Request, res: Response) {
  const clientId = config.slack.clientId;
  const redirectUri = config.slack.redirectUri;

  if (!clientId) {
    console.warn('[Slack OAuth] SLACK_CLIENT_ID not configured. Slack connect is unavailable.');
    return res.redirect(`${config.frontendUrl}/dashboard?slack=missing_config`);
  }

  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write,incoming-webhook&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  return res.redirect(slackAuthUrl);
}

export async function handleSlackCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error || !code) {
      console.warn('[Slack OAuth Callback] Authorization error or denied by user:', error);
      return res.redirect(`${config.frontendUrl}/dashboard?slack=error`);
    }

    if (!config.slack.clientId || !config.slack.clientSecret) {
      console.warn('[Slack OAuth Callback] Slack OAuth credentials are not fully configured.');
      return res.redirect(`${config.frontendUrl}/dashboard?slack=missing_config`);
    }

    // Get authenticated user from session
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      console.warn('[Slack OAuth Callback] No authenticated user found');
      return res.redirect(`${config.frontendUrl}/login?error=session_expired`);
    }

    let accessToken = '';
    let teamId = '';
    let teamName = 'Slack Workspace';
    let slackUserId: string | null = null;
    let channelId: string | null = null;
    let channelName: string | null = null;

    const tokenResponse = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: config.slack.clientId,
        client_secret: config.slack.clientSecret,
        code,
        redirect_uri: config.slack.redirectUri,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    if (!tokenResponse.data.ok) {
      throw new Error(`Slack OAuth Token Exchange Failed: ${tokenResponse.data.error}`);
    }

    accessToken = tokenResponse.data.incoming_webhook?.url || tokenResponse.data.access_token;
    teamId = tokenResponse.data.team?.id || '';
    teamName = tokenResponse.data.team?.name || 'Slack Workspace';
    slackUserId = tokenResponse.data.authed_user?.id || null;
    channelId = tokenResponse.data.incoming_webhook?.channel_id || null;
    channelName = tokenResponse.data.incoming_webhook?.channel || null;

    if (!accessToken || !teamId) {
      throw new Error('Slack OAuth Token Exchange Failed: missing token or team information');
    }

    // Critical: Store Slack connection against the authenticated user's ID
    await prisma.slackConnection.upsert({
      where: { userId: currentUser.id },
      update: {
        accessToken,
        teamId,
        teamName,
        slackUserId,
        channelId,
        channelName,
      },
      create: {
        userId: currentUser.id,
        accessToken,
        teamId,
        teamName,
        slackUserId,
        channelId,
        channelName,
      },
    });

    console.log(`[Slack OAuth] Successfully stored SlackConnection for workspace '${teamName}' for user ${currentUser.id}`);
    return res.redirect(`${config.frontendUrl}/dashboard?slack=connected`);
  } catch (err) {
    next(err);
  }
}

export async function getSlackStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Critical: Only fetch Slack connection for the authenticated user
    const slackConn = await prisma.slackConnection.findUnique({
      where: {
        userId: currentUser.id,
      },
    });

    if (!slackConn) {
      return res.status(200).json({ isConnected: false, teamName: null });
    }

    return res.status(200).json({
      isConnected: true,
      teamId: slackConn.teamId,
      teamName: slackConn.teamName,
      workspaceName: slackConn.teamName,
      slackUserId: slackConn.slackUserId,
      channelId: slackConn.channelId,
      channelName: slackConn.channelName,
      createdAt: slackConn.createdAt,
      connectedAt: slackConn.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function disconnectSlack(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Critical: Only delete Slack connection for the authenticated user
    await prisma.slackConnection.deleteMany({
      where: {
        userId: currentUser.id,
      },
    });

    return res.status(200).json({
      success: true,
      isConnected: false,
      teamName: null,
      workspaceName: null,
      message: 'Disconnected Slack workspace integration',
    });
  } catch (err) {
    next(err);
  }
}
