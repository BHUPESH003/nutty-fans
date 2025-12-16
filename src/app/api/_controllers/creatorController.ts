import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { UserRepository } from '@/repositories/userRepository';
import { CreatorService } from '@/services/creator/creatorService';
import { DashboardService } from '@/services/creator/dashboardService';
import { KycService } from '@/services/creator/kycService';
import { PaymentService } from '@/services/creator/paymentService';

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

    try {
      const body = await req.json();
      const result = await creatorService.apply(userId, {
        displayName: body.displayName,
        bio: body.bio,
        categoryId: body.categoryId,
        subscriptionPrice: body.subscriptionPrice,
      });
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit application';
      return NextResponse.json({ error: { code: 'APPLICATION_ERROR', message } }, { status: 400 });
    }
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

    return NextResponse.json(status);
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

    return NextResponse.json(profile);
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

    try {
      const body = await req.json();
      const updated = await creatorService.updateProfile(userId, body);
      return NextResponse.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update profile';
      return NextResponse.json({ error: { code: 'UPDATE_ERROR', message } }, { status: 400 });
    }
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

    try {
      const body = await req.json();
      const updated = await creatorService.updatePricing(userId, body);
      return NextResponse.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update pricing';
      return NextResponse.json({ error: { code: 'UPDATE_ERROR', message } }, { status: 400 });
    }
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

    try {
      const result = await kycService.startVerification(userId, displayName);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start KYC';
      return NextResponse.json({ error: { code: 'KYC_ERROR', message } }, { status: 400 });
    }
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

    return NextResponse.json({
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

    try {
      const { url, state } = await paymentService.getConnectUrl(userId);
      // In production, store state in session
      return NextResponse.json({ url, state });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to get connect URL';
      return NextResponse.json({ error: { code: 'CONNECT_ERROR', message } }, { status: 400 });
    }
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

    const period = (req.nextUrl.searchParams.get('period') ?? '30d') as
      | '7d'
      | '30d'
      | '90d'
      | 'all';
    const metrics = await dashboardService.getMetrics(userId, period);

    if (!metrics) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Creator profile not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(metrics);
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

    try {
      const result = await paymentService.getPayouts(userId);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to get payouts';
      return NextResponse.json({ error: { code: 'PAYOUT_ERROR', message } }, { status: 400 });
    }
  }
}

export const creatorController = new CreatorController();
