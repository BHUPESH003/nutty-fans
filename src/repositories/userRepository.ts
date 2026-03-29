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

  async updateEmailVerifiedAndAccountStateActive(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const metadata = (user.metadata ?? {}) as Record<string, unknown>;
    const existingAuthState = (metadata['authState'] as Record<string, unknown>) ?? {};
    const nextMetadata = {
      ...metadata,
      authState: {
        ...existingAuthState,
        accountState: 'active',
      },
    } as unknown;

    return prisma.user.update({
      where: { id },
      data: {
        emailVerified: new Date(),
        metadata: nextMetadata as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });
  }

  async updateLastLoginAt(id: string, lastLoginAt: Date) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async update(
    id: string,
    data: {
      displayName?: string;
      username?: string;
      avatarUrl?: string | null;
      bio?: string;
      role?: 'user' | 'creator' | 'admin';
    }
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateFlags(
    id: string,
    data: {
      isDiscoverable?: boolean;
      showLocation?: boolean;
    }
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    const deletedEmail = `deleted+${id}@nuttyfans.invalid`;
    const deletedUsername = `deleted_${id.slice(0, 8)}`;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { metadata: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const metadata = (user.metadata ?? {}) as Record<string, unknown>;
      const authState = (metadata['authState'] as Record<string, unknown>) ?? {};

      await tx.session.deleteMany({ where: { userId: id } });
      await tx.account.deleteMany({ where: { userId: id } });

      return tx.user.update({
        where: { id },
        data: {
          email: deletedEmail,
          username: deletedUsername,
          displayName: 'Deleted User',
          avatarUrl: null,
          bio: null,
          location: null,
          passwordHash: null,
          status: 'deleted',
          isDiscoverable: false,
          showLocation: false,
          metadata: {
            ...metadata,
            authState: {
              ...authState,
              accountState: 'deleted',
            },
          } as Prisma.InputJsonValue,
        },
      });
    });
  }
}
