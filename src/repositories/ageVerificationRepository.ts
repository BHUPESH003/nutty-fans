import { prisma } from '@/lib/db/prisma';

type AgeVerificationStatus = 'pending' | 'passed' | 'failed' | 'needs_review';

export class AgeVerificationRepository {
  create(data: {
    userId: string;
    provider: string;
    providerSessionId: string;
    status: AgeVerificationStatus;
    method?: string | null;
    country?: string | null;
  }) {
    return prisma.ageVerification.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerSessionId: data.providerSessionId,
        status: data.status,
        method: data.method ?? null,
        country: data.country ?? null,
      },
    });
  }

  findByProviderSessionId(providerSessionId: string) {
    return prisma.ageVerification.findFirst({
      where: { providerSessionId },
    });
  }

  updateStatus(
    id: string,
    status: AgeVerificationStatus,
    fields?: Partial<{ verifiedAt: Date; failureReason: string }>
  ) {
    return prisma.ageVerification.update({
      where: { id },
      data: {
        status,
        verifiedAt: fields?.verifiedAt,
        failureReason: fields?.failureReason,
      },
    });
  }
}
