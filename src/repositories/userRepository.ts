import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string | null;
    displayName: string;
    username: string;
    dateOfBirth: Date | null;
    country: string | null;
    metadata?: unknown;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        username: data.username,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async updateMetadata(id: string, metadata: Record<string, unknown>) {
    return prisma.user.update({
      where: { id },
      data: { metadata: metadata as Prisma.InputJsonValue },
    });
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateEmailVerified(id: string, emailVerified: Date) {
    return prisma.user.update({
      where: { id },
      data: { emailVerified },
    });
  }

  async updateLastLoginAt(id: string, lastLoginAt: Date) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt },
    });
  }
}
