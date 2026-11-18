import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    // Store in custom property to avoid Passport type conflict
    (req as any).authenticatedUser = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required', message: 'You must be logged in to access this resource' });
  }
  next();
}

export function getSessionUser(req: Request): AuthenticatedUser | null {
  // Check JWT authenticated user first
  if ((req as any).authenticatedUser) {
    return (req as any).authenticatedUser;
  }
  
  // Fallback to passport session user
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const passportUser = req.user as any;
    if (passportUser.id && passportUser.email) {
      return {
        id: passportUser.id,
        email: passportUser.email,
        name: passportUser.name || passportUser.email.split('@')[0],
      };
    }
  }
  
  return null;
}
