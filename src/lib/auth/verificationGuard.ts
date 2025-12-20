import { AppError } from '@/lib/errors/errorHandler';
import { AuthUser } from '@/types/auth';

/**
 * Enforces that the user has verified their email address.
 * Throws an AppError if the user is unverified.
 *
 * @param user The authenticated user object
 * @throws AppError 403 if email is not verified
 */
export function requireEmailVerification(user: AuthUser): void {
  if (user.accountState === 'email_unverified') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Please verify your email address to perform this action.',
      403
    );
  }
}
