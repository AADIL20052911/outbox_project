import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.service';
import { emailQueue } from '../../queue/email.queue';
import { indexEmailDocument, searchEmails, updateEmailDocumentStatus } from '../../services/elasticsearch.service';
import { ScheduleEmailsInput } from './email.validator';
import { getSessionUser } from '../../middleware/auth.middleware';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function scheduleEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subject, body, recipients, senderId, startTime, delayMs, hourlyLimit } = req.body as ScheduleEmailsInput;
    const authenticatedUserId = currentUser.id;

    // Verify sender belongs to the authenticated user
    let sender = await prisma.sender.findFirst({
      where: {
        id: senderId,
        userId: authenticatedUserId,
      },
    });

    if (!sender) {
      // Sender not found or doesn't belong to user - check if sender exists at all
      const existingSender = await prisma.sender.findUnique({ where: { id: senderId } });
      if (existingSender && existingSender.userId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied', message: 'Sender does not belong to your account' });
      }

      // Create a new sender for this user if it doesn't exist
      sender = await prisma.sender.create({
        data: {
          id: senderId,
          userId: authenticatedUserId,
          email: 'outreach@reachinbox.ai',
          smtpUser: process.env.ETHEREAL_USER || 'ethereal_user',
          smtpPassword: process.env.ETHEREAL_PASSWORD || 'ethereal_pass',
          smtpHost: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
          smtpPort: parseInt(process.env.ETHEREAL_PORT || '587', 10),
        },
      });
    }

    const baseStartTime = startTime ? new Date(startTime).getTime() : Date.now();
    const delayBetween = delayMs ?? 2000;

    let createdCount = 0;
    let rejectedCount = 0;
    const createdEmails: any[] = [];
    let validIndex = 0;

    for (const recipientRaw of recipients) {
      const recipient = recipientRaw.trim();

      if (!recipient || !EMAIL_REGEX.test(recipient)) {
        rejectedCount++;
        continue;
      }

      const scheduledTimeMs = baseStartTime + validIndex * delayBetween;
      const scheduledAtDate = new Date(scheduledTimeMs);
      const initialDelayMs = Math.max(scheduledTimeMs - Date.now(), 0);

      // Always use authenticated user's ID - ignore any userId from frontend
      const emailRecord = await prisma.email.create({
        data: {
          userId: authenticatedUserId, // Critical: Use authenticated user's ID
          senderId: sender.id,
          recipient,
          subject,
          body,
          scheduledAt: scheduledAtDate,
          status: 'scheduled',
        },
      });

      const bullJob = await emailQueue.add(
        'send',
        { emailId: emailRecord.id },
        { delay: initialDelayMs }
      );

      const updatedEmail = await prisma.email.update({
        where: { id: emailRecord.id },
        data: { jobId: bullJob.id },
      });

      await indexEmailDocument({
        id: updatedEmail.id,
        recipient: updatedEmail.recipient,
        subject: updatedEmail.subject,
        body: updatedEmail.body,
        status: updatedEmail.status,
        scheduledAt: updatedEmail.scheduledAt.toISOString(),
        sentAt: updatedEmail.sentAt ? updatedEmail.sentAt.toISOString() : null,
        userId: updatedEmail.userId,
        senderId: updatedEmail.senderId,
      });

      createdEmails.push(updatedEmail);
      createdCount++;
      validIndex++;
    }

    return res.status(201).json({
      success: true,
      createdCount,
      rejectedCount,
      emails: createdEmails,
    });
  } catch (err) {
    next(err);
  }
}

export async function getScheduledEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const emails = await prisma.email.findMany({
      where: {
        userId: currentUser.id, // Critical: Filter by authenticated user
        status: {
          in: ['scheduled', 'processing'],
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return res.status(200).json(emails);
  } catch (err) {
    next(err);
  }
}

export async function getSentEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const emails = await prisma.email.findMany({
      where: {
        userId: currentUser.id, // Critical: Filter by authenticated user
        status: {
          in: ['sent', 'failed'],
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(emails);
  } catch (err) {
    next(err);
  }
}

export async function searchEmailLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = (req.query.q as string) || '';

    if (!query.trim()) {
      // Return user's emails only when no query
      const allEmails = await prisma.email.findMany({
        where: {
          userId: currentUser.id, // Critical: Filter by authenticated user
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(allEmails);
    }

    // Search in Elasticsearch with user-scoped filter
    const esResults = await searchEmails(query, currentUser.id); // Critical: Pass userId

    if (esResults.length > 0) {
      return res.status(200).json(esResults);
    }

    // Fallback to database search with user filter
    const dbResults = await prisma.email.findMany({
      where: {
        userId: currentUser.id, // Critical: Filter by authenticated user
        OR: [
          { recipient: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(dbResults);
  } catch (err) {
    next(err);
  }
}

export async function getSenderAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only return senders belonging to the authenticated user
    const senders = await prisma.sender.findMany({
      where: {
        userId: currentUser.id, // Critical: Filter by authenticated user
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
      },
    });

    return res.status(200).json(
      senders.map((sender) => ({
        id: sender.id,
        email: sender.email,
        name: sender.email.split('@')[0].replace(/[._-]+/g, ' '),
        hourlyLimit: Number(process.env.MAX_EMAILS_PER_HOUR || '50'),
      }))
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get single email by ID with user isolation
 */
export async function getEmailById(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Enforce user isolation - user can only view their own emails
    if (email.userId !== currentUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(email);
  } catch (err) {
    next(err);
  }
}

/**
 * Update email (subject, body, recipient, scheduled time for SCHEDULED emails)
 * For SENT emails: creates a new scheduled email instead
 * For SCHEDULED emails: cancels old BullMQ job and creates new one
 */
export async function updateEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { recipient, subject, body, scheduledAt, delayMs, hourlyLimit } = req.body;

    // Validate inputs
    if (!recipient || !subject || !body) {
      return res.status(400).json({ error: 'Recipient, subject, and body are required' });
    }

    if (!EMAIL_REGEX.test(recipient)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Enforce user isolation
    if (email.userId !== currentUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle SENT emails - create new scheduled email
    if (email.status === 'sent') {
      const newScheduledAt = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + (delayMs || 2000));
      const initialDelayMs = Math.max(newScheduledAt.getTime() - Date.now(), 0);

      const newEmail = await prisma.email.create({
        data: {
          userId: currentUser.id,
          senderId: email.senderId,
          recipient,
          subject,
          body,
          scheduledAt: newScheduledAt,
          status: 'scheduled',
        },
      });

      // Create BullMQ job for new email
      const bullJob = await emailQueue.add(
        'send',
        { emailId: newEmail.id },
        { delay: initialDelayMs }
      );

      const updatedEmail = await prisma.email.update({
        where: { id: newEmail.id },
        data: { jobId: bullJob.id },
      });

      // Index new email in Elasticsearch
      await indexEmailDocument({
        id: updatedEmail.id,
        recipient: updatedEmail.recipient,
        subject: updatedEmail.subject,
        body: updatedEmail.body,
        status: updatedEmail.status,
        scheduledAt: updatedEmail.scheduledAt.toISOString(),
        sentAt: null,
        userId: updatedEmail.userId,
        senderId: updatedEmail.senderId,
      });

      return res.status(200).json({
        message: 'SENT email cannot be edited. Created new scheduled email instead.',
        originalEmailId: email.id,
        newEmailId: updatedEmail.id,
        newEmail: updatedEmail,
      });
    }

    // Handle SCHEDULED emails - cancel old job, update, create new job
    if (email.status === 'scheduled' || email.status === 'processing') {
      // Cancel existing BullMQ job
      if (email.jobId) {
        try {
          const oldJob = await emailQueue.getJob(email.jobId);
          if (oldJob) {
            await oldJob.remove();
            console.log(`[Email Controller] Cancelled old BullMQ job ${email.jobId}`);
          }
        } catch (jobErr) {
          console.warn(`[Email Controller] Could not cancel job ${email.jobId}:`, (jobErr as Error).message);
        }
      }

      const newScheduledAt = scheduledAt ? new Date(scheduledAt) : email.scheduledAt;
      const initialDelayMs = Math.max(newScheduledAt.getTime() - Date.now(), 0);

      // Update email record
      const updatedEmail = await prisma.email.update({
        where: { id },
        data: {
          recipient,
          subject,
          body,
          scheduledAt: newScheduledAt,
          status: 'scheduled',
        },
      });

      // Create new BullMQ job
      const newBullJob = await emailQueue.add(
        'send',
        { emailId: updatedEmail.id },
        { delay: initialDelayMs }
      );

      // Update with new jobId
      const finalEmail = await prisma.email.update({
        where: { id },
        data: { jobId: newBullJob.id },
      });

      // Update Elasticsearch
      await indexEmailDocument({
        id: finalEmail.id,
        recipient: finalEmail.recipient,
        subject: finalEmail.subject,
        body: finalEmail.body,
        status: finalEmail.status,
        scheduledAt: finalEmail.scheduledAt.toISOString(),
        sentAt: finalEmail.sentAt ? finalEmail.sentAt.toISOString() : null,
        userId: finalEmail.userId,
        senderId: finalEmail.senderId,
      });

      return res.status(200).json({
        message: 'Email updated successfully',
        email: finalEmail,
      });
    }

    return res.status(400).json({ error: `Cannot edit email with status: ${email.status}` });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete email by ID with user isolation
 * Cancels BullMQ job if email is SCHEDULED
 */
export async function deleteEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Enforce user isolation
    if (email.userId !== currentUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot delete PROCESSING emails - they may be sending right now
    if (email.status === 'processing') {
      return res.status(400).json({
        error: 'Cannot delete email currently being processed',
        message: 'This email is currently being processed and cannot be deleted right now.',
      });
    }

    // Cancel BullMQ job if scheduled
    if (email.jobId) {
      try {
        const job = await emailQueue.getJob(email.jobId);
        if (job) {
          await job.remove();
          console.log(`[Email Controller] Cancelled BullMQ job ${email.jobId} for deletion`);
        }
      } catch (jobErr) {
        console.warn(`[Email Controller] Could not cancel job ${email.jobId}:`, (jobErr as Error).message);
      }
    }

    // Delete from Elasticsearch
    const { deleteEmailDocument } = await import('../../services/elasticsearch.service');
    try {
      await deleteEmailDocument(id);
    } catch (esErr) {
      console.warn(`[Email Controller] Could not delete from Elasticsearch:`, (esErr as Error).message);
    }

    // Delete from database
    await prisma.email.delete({
      where: { id },
    });

    return res.status(200).json({
      message: 'Email deleted successfully',
      deletedEmailId: id,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retry failed email - re-queue it for sending
 * Uses existing BullMQ scheduling workflow
 */
export async function retryEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Enforce user isolation
    if (email.userId !== currentUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow retry for FAILED or SENT emails
    if (email.status !== 'failed' && email.status !== 'sent') {
      return res.status(400).json({
        error: `Cannot retry email with status: ${email.status}`,
      });
    }

    // Reset email to scheduled status
    const now = new Date();
    const initialDelayMs = 1000; // Retry after 1 second

    const retriedEmail = await prisma.email.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + initialDelayMs),
        sentAt: null, // Clear sentAt if retrying a sent email
      },
    });

    // Create new BullMQ job
    const bullJob = await emailQueue.add(
      'send',
      { emailId: retriedEmail.id },
      { delay: initialDelayMs }
    );

    // Update with new jobId
    const finalEmail = await prisma.email.update({
      where: { id },
      data: { jobId: bullJob.id },
    });

    // Update Elasticsearch
    await indexEmailDocument({
      id: finalEmail.id,
      recipient: finalEmail.recipient,
      subject: finalEmail.subject,
      body: finalEmail.body,
      status: finalEmail.status,
      scheduledAt: finalEmail.scheduledAt.toISOString(),
      sentAt: null,
      userId: finalEmail.userId,
      senderId: finalEmail.senderId,
    });

    console.log(`[Email Controller] Email ${id} retried - new job ${bullJob.id}`);

    return res.status(200).json({
      message: 'Email re-queued successfully',
      email: finalEmail,
    });
  } catch (err) {
    next(err);
  }
}
