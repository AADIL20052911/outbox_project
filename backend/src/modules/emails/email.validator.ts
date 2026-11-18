import { z } from 'zod';

export const ScheduleEmailsSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body content is required'),
  recipients: z.array(z.string()).min(1, 'At least one recipient email is required'),
  senderId: z.string().min(1, 'Sender ID is required'),
  startTime: z.string().optional(),
  delayMs: z.number().min(0).optional().default(2000),
  hourlyLimit: z.number().min(1).optional().default(50),
});

export type ScheduleEmailsInput = z.infer<typeof ScheduleEmailsSchema>;
