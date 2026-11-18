import { Router } from 'express';
import { 
  scheduleEmails, 
  getScheduledEmails, 
  getSentEmails, 
  searchEmailLogs, 
  getSenderAccounts,
  getEmailById,
  updateEmail,
  deleteEmail,
  retryEmail,
} from './email.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { ScheduleEmailsSchema } from './email.validator';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// All email routes require authentication
router.use(requireAuth);

// Specific routes (must come before generic /:id routes)
router.post('/schedule', validateBody(ScheduleEmailsSchema), scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/search', searchEmailLogs);
router.get('/senders', getSenderAccounts);

// Email detail, edit, delete, retry (generic :id routes)
router.get('/:id', getEmailById);
router.patch('/:id', updateEmail);
router.delete('/:id', deleteEmail);
router.post('/:id/retry', retryEmail);

export default router;
