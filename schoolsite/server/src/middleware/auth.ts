import type { RequestHandler } from 'express';
import type { AdminUser } from '../domain/models.js';
import type { AuthProvider } from '../domain/ports.js';
import { AppError } from './errors.js';
export const authenticate =
  (provider: AuthProvider): RequestHandler =>
  async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer '))
        throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
      const user = await provider.resolveToken(header.slice(7));
      if (!user)
        throw new AppError(
          401,
          'UNAUTHENTICATED',
          'Your session has expired, or you do not have administrator access.',
        );
      res.locals.user = user;
      res.locals.token = header.slice(7);
      next();
    } catch (error) {
      next(error);
    }
  };
export const requireOwner: RequestHandler = (_req, res, next) => {
  if ((res.locals.user as AdminUser).role !== 'owner') {
    next(new AppError(403, 'FORBIDDEN', 'Only the school owner can change these settings.'));
    return;
  }
  next();
};
export const currentUser = (res: Parameters<RequestHandler>[1]) => res.locals.user as AdminUser;
