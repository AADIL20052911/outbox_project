import { Router } from 'express';
import passport from 'passport';
import { getCurrentUser, handleGoogleCallback, logoutUser } from './auth.controller';
import { config } from '../../config';

const router = Router();


router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.frontendUrl}/login?error=google_auth_failed`,
    session: true,
  }),
  handleGoogleCallback
);


router.get('/me', getCurrentUser);


router.post('/logout', logoutUser);

export default router;
