import crypto from 'crypto';

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

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createToken(options: CreateTokenOptions): Promise<{ token: string }> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
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
    // Use SHA-256 for deterministic lookup
    const tokenHash = this.hashToken(token);
    const record = await this.repo.findValidByHash(tokenHash, type);
    if (!record) {
      return null;
    }
    await this.repo.consume(record.id);
    return record;
  }
}
