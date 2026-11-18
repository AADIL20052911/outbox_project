import { Router } from 'express';
import { config } from '../../config';
import { redisClient } from '../../config/redis';
import { prisma } from '../../services/prisma.service';
import { getHourKey } from '../../services/rateLimiter.service';
import { emailQueue } from '../../queue/email.queue';
import { indexEmailDocument } from '../../services/elasticsearch.service';

const router = Router();

router.use((req, res, next) => {
  if (config.nodeEnv !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

router.post('/login', async (req, res, next) => {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'usr_reachinbox_01',
          email: 'alex.morgan@reachinbox.ai',
          name: 'Alex Morgan',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        },
      });
    }

    const sender = await prisma.sender.findFirst({ where: { userId: user.id } });
    if (!sender) {
      await prisma.sender.create({
        data: {
          id: 'snd_01',
          userId: user.id,
          email: 'outreach@reachinbox.ai',
          smtpUser: process.env.ETHEREAL_USER || 'ethereal_user',
          smtpPassword: process.env.ETHEREAL_PASSWORD || 'ethereal_pass',
          smtpHost: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
          smtpPort: parseInt(process.env.ETHEREAL_PORT || '587', 10),
        },
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ success: true, user });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/simulate-rate-limit', async (req, res, next) => {
  try {
    let user = (req.user as any) || (await prisma.user.findFirst());
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'usr_reachinbox_01',
          email: 'alex.morgan@reachinbox.ai',
          name: 'Alex Morgan',
        },
      });
    }

    const senderId = req.body?.senderId || 'snd_01';
    let sender = await prisma.sender.findUnique({ where: { id: senderId } });
    if (!sender) {
      sender = await prisma.sender.create({
        data: {
          id: senderId,
          userId: user.id,
          email: 'outreach@reachinbox.ai',
          smtpUser: process.env.ETHEREAL_USER || 'ethereal_user',
          smtpPassword: process.env.ETHEREAL_PASSWORD || 'ethereal_pass',
          smtpHost: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
          smtpPort: parseInt(process.env.ETHEREAL_PORT || '587', 10),
        },
      });
    }

    const hourKey = getHourKey(sender.id);
    await redisClient.set(hourKey, config.maxEmailsPerHour.toString(), 'EX', 7200);

    const email = await prisma.email.create({
      data: {
        userId: sender.userId,
        senderId: sender.id,
        recipient: req.body?.recipient || 'rate-limit-demo@example.com',
        subject: req.body?.subject || 'ReachInbox rate limit simulation',
        body: req.body?.body || 'This message is used to exercise the real BullMQ rate-limit deferral path.',
        scheduledAt: new Date(),
        status: 'scheduled',
      },
    });

    const job = await emailQueue.add('send', { emailId: email.id }, { delay: 0 });
    const updatedEmail = await prisma.email.update({
      where: { id: email.id },
      data: { jobId: job.id },
    });

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

    return res.status(201).json({
      success: true,
      message: 'Simulation job queued. The worker will use the real rate-limit deferral path.',
      emailId: updatedEmail.id,
      jobId: updatedEmail.jobId,
      senderId: sender.id,
      hourlyLimit: config.maxEmailsPerHour,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
