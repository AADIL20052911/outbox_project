import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { prisma } from '../../services/prisma.service';
import { getSessionUser } from '../../middleware/auth.middleware';

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Get user from authenticated session/JWT
    const currentUser = getSessionUser(req);
    
    if (currentUser) {
      // Return the authenticated user's data
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      });
      
      if (user) {
        return res.status(200).json(user);
      }
    }

    // No authenticated session found
    return res.status(401).json({ error: 'Unauthenticated', message: 'No active session found' });
  } catch (err) {
    next(err);
  }
}

export function handleGoogleCallback(req: Request, res: Response) {
  const redirectUrl = `${config.frontendUrl}/dashboard`;
  return res.redirect(redirectUrl);
}

export function logoutUser(req: Request, res: Response, next: NextFunction) {
  req.logout((err) => {
    if (err) return next(err);
    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
      });
    } else {
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
  });
}
