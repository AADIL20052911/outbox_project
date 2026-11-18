import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { config } from '../config';
import { QUEUE_NAME, SendEmailJobPayload, emailQueue } from './email.queue';
import { prisma } from '../services/prisma.service';
import { EmailStatus } from '@prisma/client';
import { sendEmailViaSmtp } from '../services/mailer.service';
import { checkAndRecordRateLimit, claimRateLimitNotification, recordEmailSentTimestamp } from '../services/rateLimiter.service';
import { updateEmailDocumentStatus } from '../services/elasticsearch.service';
import { sendSlackRateLimitNotification } from '../services/slack.service';

export function setupEmailWorker() {
  const worker = new Worker<SendEmailJobPayload>(
    QUEUE_NAME,
    async (job: Job<SendEmailJobPayload>) => {
      const { emailId } = job.data;
      console.log(`[BullMQ Worker] Processing email job ${job.id} for emailId: ${emailId}`);
      await job.updateProgress(10);

      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { sender: true },
      });

      if (!email) {
        console.error(`[BullMQ Worker] Email record ${emailId} not found in database.`);
        return { status: 'FAILED_NOT_FOUND' };
      }

      if (email.status === EmailStatus.sent) {
        console.warn(`[BullMQ Worker] Email ${emailId} already sent. Skipping.`);
        await job.updateProgress(100);
        return { status: 'SKIPPED_ALREADY_SENT' };
      }

      if (email.status !== EmailStatus.scheduled && email.status !== EmailStatus.failed) {
        console.warn(`[BullMQ Worker] Email ${emailId} status is ${email.status}, not eligible for processing. Skipping.`);
        await job.updateProgress(100);
        return { status: 'SKIPPED_WRONG_STATUS' };
      }

      const claimResult = await prisma.email.updateMany({
        where: {
          id: emailId,
          OR: [
            { status: EmailStatus.scheduled },
            { status: EmailStatus.failed },
          ],
        },
        data: { status: EmailStatus.processing },
      });

      if (claimResult.count === 0) {
        console.warn(`[BullMQ Worker] Could not claim email ${emailId} (likely already processed or locked). Skipping.`);
        await job.updateProgress(100);
        return { status: 'SKIPPED_ALREADY_PROCESSED' };
      }

      
      const rateCheck = await checkAndRecordRateLimit(
        email.senderId,
        config.maxEmailsPerHour,
        config.minEmailDelayMs
      );

      if (!rateCheck.allowed) {
        const delayMs = rateCheck.rescheduleDelayMs || 5000;
        const newScheduledAt = rateCheck.nextAvailableDate || new Date(Date.now() + delayMs);

        console.warn(
          `[BullMQ Worker] Rate limit/delay threshold hit for sender ${email.senderId} (${rateCheck.reason}). Rescheduling job in ${delayMs}ms`
        );

        if (rateCheck.reason === 'RATE_LIMIT_EXCEEDED' && rateCheck.windowKey) {
          const currentHourStr = new Date().toISOString().slice(0, 13) + ':00 UTC';
          const nextWindowEtaStr = newScheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const shouldNotify = await claimRateLimitNotification(email.senderId, rateCheck.windowKey);

          if (shouldNotify) {
            await sendSlackRateLimitNotification(email.userId, {
              senderEmail: email.sender.email,
              hourlyLimit: config.maxEmailsPerHour,
              currentHour: currentHourStr,
              nextWindowEta: nextWindowEtaStr,
            });
          }
        }

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.scheduled,
            scheduledAt: newScheduledAt,
          },
        });

        const newJob = await emailQueue.add(
          'send',
          { emailId: email.id },
          { delay: delayMs }
        );

        await prisma.email.update({
          where: { id: email.id },
          data: { jobId: newJob.id },
        });

        await updateEmailDocumentStatus(email.id, 'scheduled', null, newScheduledAt);

        return { status: 'RESCHEDULED', reason: rateCheck.reason, delayMs };
      }

      await job.updateProgress(30);

      try {
        const sendResult = await sendEmailViaSmtp({
          from: email.sender.email,
          to: email.recipient,
          subject: email.subject,
          body: email.body,
          smtpHost: email.sender.smtpHost,
          smtpPort: email.sender.smtpPort,
          smtpUser: email.sender.smtpUser,
          smtpPassword: email.sender.smtpPassword,
        });

        await job.updateProgress(80);

        const sentAtDate = new Date();

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.sent,
            sentAt: sentAtDate,
          },
        });

        await recordEmailSentTimestamp(email.senderId);

        await updateEmailDocumentStatus(emailId, 'sent', sentAtDate);
        await job.updateProgress(100);

        console.log(`[BullMQ Worker] Email ${emailId} sent successfully via SMTP! MessageId: ${sendResult.messageId}`);
        return { status: 'SENT', messageId: sendResult.messageId };
      } catch (err) {
        console.error(`[BullMQ Worker] Email ${emailId} dispatch failed:`, (err as Error).message);

        
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.failed,
          },
        });

        
        await updateEmailDocumentStatus(emailId, 'failed');

        throw err;
      }
    },
    {
      
      connection: redisClient,
      concurrency: config.workerConcurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return worker;
}
