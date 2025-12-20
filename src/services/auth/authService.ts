import { User } from '@prisma/client';

import { hashPassword, verifyPassword } from '@/lib/security/hash';
import { isPasswordPwned } from '@/lib/security/haveIBeenPwnedClient';
import { validatePassword } from '@/lib/security/passwordPolicy';
import { UserRepository } from '@/repositories/userRepository';

type RegisterInput = {
  email: string;
  password: string | null;
  displayName: string;
  username: string;
  dateOfBirth: Date;
  country: string;
};

export class AuthService {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly userRepository: UserRepository
  ) {}

  async register(input: RegisterInput): Promise<User> {
    if (input.password) {
      const validation = validatePassword(input.password);
      if (!validation.valid) {
        const error = new Error('Password does not meet policy requirements');
        // @ts-expect-error attach details for controller
        error.details = validation.errors;
        throw error;
      }

      const pwned = await isPasswordPwned(input.password);
      if (pwned) {
        throw new Error('Password is too common or has appeared in a data breach');
      }
    }

    const existing = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = input.password ? await hashPassword(input.password) : null;

    return this.userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash,
      displayName: input.displayName,
      username: input.username,
      dateOfBirth: input.dateOfBirth,
      country: input.country,
      metadata: {
        authState: {
          accountState: 'email_unverified',
        },
      },
    });
  }

  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user || !user.passwordHash) {
      return null;
    }

    const metadata = (user.metadata ?? {}) as Record<string, unknown>;
    const authState = (metadata['authState'] as Record<string, unknown>) ?? {};
    const lockUntil = authState['lockUntil'] as string | undefined;
    if (lockUntil && new Date(lockUntil) > new Date()) {
      return null;
    }

    const accountState = authState['accountState'] as string | undefined;
    if (accountState === 'email_unverified') {
      throw new Error('Please verify your email address before logging in.');
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const failedAttempts = (authState['failedLoginAttempts'] as number | undefined) ?? 0;
      const nextAttempts = failedAttempts + 1;
      const shouldLock = nextAttempts >= 10;

      const nextAuthState: Record<string, unknown> = {
        ...authState,
        failedLoginAttempts: nextAttempts,
      };

      if (shouldLock) {
        const lockMinutes = 30;
        nextAuthState['lockUntil'] = new Date(Date.now() + lockMinutes * 60 * 1000).toISOString();
        nextAuthState['accountState'] = 'locked';
      }

      await this.userRepository.updateMetadata(user.id, {
        ...metadata,
        authState: nextAuthState,
      });

      return null;
    }

    const nextAuthState: Record<string, unknown> = {
      ...(authState ?? {}),
      failedLoginAttempts: 0,
      lockUntil: null,
    };

    await this.userRepository.updateMetadata(user.id, {
      ...metadata,
      authState: nextAuthState,
    });

    await this.userRepository.updateLastLoginAt(user.id, new Date());
    return user;
  }
}
