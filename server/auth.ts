import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword } from './db.js';
import type { User } from './types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, salt, verificationCode, resetPasswordToken, resetPasswordExpires, ...safe } = user;
  return safe;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationCode(): string {
  // 6 digit code for easy verification
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  const session = db.findSession(token);
  if (!session) {
    return next();
  }

  const user = db.findUserById(session.userId);
  if (user && !user.isBanned) {
    req.user = user;
    // Update lastActiveAt periodically
    user.lastActiveAt = new Date().toISOString();
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in or register.' });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}
