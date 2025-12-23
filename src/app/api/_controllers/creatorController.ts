import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { requireEmailVerification } from '@/lib/auth/verificationGuard';
import {
  AppError,
  handleAsyncRoute,
  VALIDATION_MISSING_FIELD,
  RESOURCE_NOT_FOUND,
} from '@/lib/errors/errorHandler';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { UserRepository } from '@/repositories/userRepository';
import { PaymentService } from '@/services/creator/creatorPayoutService';
import { CreatorService } from '@/services/creator/creatorService';
import { DashboardService } from '@/services/creator/dashboardService';
import { KycService } from '@/services/creator/kycService';

// Initialize services
const creatorRepo = new CreatorRepository();
const payoutRepo = new PayoutRepository();
const userRepo = new UserRepository();
const creatorService = new CreatorService(creatorRepo, userRepo);
const kycService = new KycService(creatorRepo);
const paymentService = new PaymentService(creatorRepo, payoutRepo);
const dashboardService = new DashboardService(creatorRepo, payoutRepo);

export class CreatorController {
  /**
   * POST /api/creator/apply — Submit creator application
   */
  async apply(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // @ts-expect-error user has accountState
    requireEmailVerification(session.user);

    return handleAsyncRoute(async () => {
      const body = await req.json();
      if (!body.displayName || !body.categoryId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Display name and category are required', 400);
      }
      const result = await creatorService.apply(userId, {
        displayName: body.displayName,
        bio: body.bio,
        categoryId: body.categoryId,
        subscriptionPrice: body.subscriptionPrice,
      });
      return successResponse(result, 'Application submitted', 201);
    });
  }

  /**
   * GET /api/creator/status — Get application status
   */
  async getStatus(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const status = await creatorService.getStatus(userId);
    if (!status) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Creator profile not found' } },
        { status: 404 }
      );
    }

    return successResponse(status);
  }

  /**
   * GET /api/creator/profile — Get own creator profile
   */
  async getProfile(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const profile = await creatorRepo.findByUserId(userId);
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Creator profile not found' } },
        { status: 404 }
      );
    }

    return successResponse(profile);
  }

  /**
   * PATCH /api/creator/profile — Update creator profile
   */
  async updateProfile(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return handleAsyncRoute(async () => {
      const body = await req.json();
      const updated = await creatorService.updateProfile(userId, body);
      return successResponse(updated);
    });
  }

  /**
   * PATCH /api/creator/subscription — Update subscription pricing
   */
  async updateSubscription(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return handleAsyncRoute(async () => {
      const body = await req.json();
      const updated = await creatorService.updatePricing(userId, body);
      return successResponse(updated);
    });
  }

  /**
   * POST /api/creator/kyc/start — Start KYC verification
   */
  async startKyc(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const displayName = session?.user?.name ?? 'User';
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return handleAsyncRoute(async () => {
      const result = await kycService.startVerification(userId, displayName);
      return successResponse(result);
    });
  }

  /**
   * GET /api/creator/kyc/status — Get KYC status
   */
  async getKycStatus(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const profile = await creatorRepo.findByUserId(userId);
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Creator profile not found' } },
        { status: 404 }
      );
    }

    return successResponse({
      status: profile.kycStatus,
      submittedAt: profile.kycSubmittedAt?.toISOString() ?? null,
      verifiedAt: profile.kycVerifiedAt?.toISOString() ?? null,
      rejectionReason: profile.kycRejectionReason,
    });
  }

  /**
   * GET /api/creator/square/connect — Get Square OAuth URL
   */
  async getSquareConnectUrl(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return handleAsyncRoute(async () => {
      const { url, state } = await paymentService.getConnectUrl(userId);
      // In production, store state in session
      return successResponse({ url, state });
    });
  }

  /**
   * GET /api/creator/dashboard — Get dashboard metrics
   */
  async getDashboard(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return handleAsyncRoute(async () => {
      const period = (req.nextUrl.searchParams.get('period') ?? '30d') as
        | '7d'
        | '30d'
        | '90d'
        | 'all';
      const metrics = await dashboardService.getMetrics(userId, period);

      if (!metrics) {
        throw new AppError(RESOURCE_NOT_FOUND, 'Creator profile not found', 404);
      }

      return successResponse(metrics);
    });
  }

  /**
   * GET /api/creator/payouts — Get payout history
   */
  async getPayouts(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return handleAsyncRoute(async () => {
      const result = await paymentService.getPayouts(userId);
      return successResponse(result);
    });
  }
}

export const creatorController = new CreatorController();
