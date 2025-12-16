import { prisma } from '@/lib/db/prisma';
type VerificationTokenType = 'email_verify' | 'password_reset';

export class VerificationTokenRepository {
  create(data: {
    userId: string;
    type: VerificationTokenType;
    tokenHash: string;
    expiresAt: Date;
    createdIp?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.verificationToken.create({
      data: {
        userId: data.userId,
        type: data.type,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        createdIp: data.createdIp ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  findValidByHash(tokenHash: string, type: VerificationTokenType) {
    const now = new Date();
    return prisma.verificationToken.findFirst({
      where: {
        tokenHash,
        type,
        expiresAt: { gt: now },
        consumedAt: null,
      },
    });
  }

  consume(id: string) {
    return prisma.verificationToken.update({
      where: { id },
      data: {
        consumedAt: new Date(),
      },
    });
  }
}
