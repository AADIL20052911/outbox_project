import { Router } from 'express';
import {
  connectSlackOAuth,
  handleSlackCallback,
  getSlackStatus,
  disconnectSlack,
} from './slack.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public routes (OAuth flow handles its own auth via session)
router.get('/connect', connectSlackOAuth);
router.get('/callback', handleSlackCallback);

// Protected routes - require authentication
router.get('/status', requireAuth, getSlackStatus);
router.post('/disconnect', requireAuth, disconnectSlack);

router.post('/toggle', requireAuth, async (req, res, next) => {
  const { connect } = req.body;
  if (connect) {
    return connectSlackOAuth(req, res);
  } else {
    return disconnectSlack(req, res, next);
  }
});

export default router;
