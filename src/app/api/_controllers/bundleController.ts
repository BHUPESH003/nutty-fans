import { NextResponse } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { AppError, handleAsyncRoute, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { CreatorAccessService } from '@/services/creator/creatorAccessService';
import { BundleService } from '@/services/payments/bundleService';

const bundleService = new BundleService();
const creatorAccessService = new CreatorAccessService();

export const bundleController = {
  async listMyBundles(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      const creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      const result = await bundleService.listCreatorBundles(creatorId, cursor);
      return successResponse(result);
    });
  },

  async createMyBundle(userId: string, body: unknown) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      const creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      const payload = (body ?? {}) as Record<string, unknown>;
      const title = payload['title'];
      const description = payload['description'];
      const price = payload['price'];
      const originalPrice = payload['originalPrice'];
      const coverImageUrl = payload['coverImageUrl'];
      const postIds = payload['postIds'];

      if (typeof title !== 'string' || !title.trim()) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Title is required', 400);
      }
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Price is required', 400);
      }

      const bundle = await bundleService.createBundle(creatorId, {
        title: title.trim(),
        description: typeof description === 'string' ? description : undefined,
        price: priceNum,
        originalPrice: originalPrice !== undefined ? Number(originalPrice) : null,
        coverImageUrl: typeof coverImageUrl === 'string' ? coverImageUrl : null,
        postIds: Array.isArray(postIds) ? (postIds as string[]) : undefined,
      });
      return successResponse(bundle, 'Bundle created', 201);
    });
  },

  async updateMyBundle(userId: string, bundleId: string, body: unknown) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!bundleId) throw new AppError(VALIDATION_MISSING_FIELD, 'Bundle ID is required', 400);
      const creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      const payload = (body ?? {}) as Record<string, unknown>;
      const updated = await bundleService.updateBundle(bundleId, creatorId, {
        title: typeof payload['title'] === 'string' ? (payload['title'] as string) : undefined,
        description:
          payload['description'] === null || typeof payload['description'] === 'string'
            ? (payload['description'] as string | null | undefined)
            : undefined,
        price: payload['price'] !== undefined ? Number(payload['price']) : undefined,
        originalPrice:
          payload['originalPrice'] !== undefined ? Number(payload['originalPrice']) : undefined,
        coverImageUrl:
          payload['coverImageUrl'] === null || typeof payload['coverImageUrl'] === 'string'
            ? (payload['coverImageUrl'] as string | null | undefined)
            : undefined,
        status:
          payload['status'] === 'draft' ||
          payload['status'] === 'active' ||
          payload['status'] === 'archived'
            ? (payload['status'] as 'draft' | 'active' | 'archived')
            : undefined,
      });
      return successResponse(updated, 'Bundle updated');
    });
  },

  async getMyBundle(userId: string, bundleId: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!bundleId) throw new AppError(VALIDATION_MISSING_FIELD, 'Bundle ID is required', 400);
      const creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      const bundle = await bundleService.getBundleForCreator(bundleId, creatorId);
      return successResponse(bundle);
    });
  },

  async setMyBundleItems(userId: string, bundleId: string, body: unknown) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!bundleId) throw new AppError(VALIDATION_MISSING_FIELD, 'Bundle ID is required', 400);
      const creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      const payload = (body ?? {}) as Record<string, unknown>;
      const postIds: string[] = Array.isArray(payload['postIds'])
        ? (payload['postIds'] as string[])
        : [];
      const result = await bundleService.updateBundleItems(bundleId, creatorId, postIds);
      return successResponse(result, 'Bundle items updated');
    });
  },

  async activateMyBundle(userId: string, bundleId: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!bundleId) throw new AppError(VALIDATION_MISSING_FIELD, 'Bundle ID is required', 400);
      const creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      const result = await bundleService.activateBundle(bundleId, creatorId);
      return successResponse(result, 'Bundle activated');
    });
  },

  async purchase(userId: string, bundleId: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!bundleId) throw new AppError(VALIDATION_MISSING_FIELD, 'Bundle ID is required', 400);
      const result = await bundleService.purchaseBundle(userId, bundleId);
      return successResponse(result, 'Bundle purchased', 201);
    });
  },

  async listMyPurchases(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      const result = await bundleService.listUserBundlePurchases(userId, cursor);
      return successResponse(result);
    });
  },

  async listPublicByHandle(handle: string, viewerId?: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!handle) throw new AppError(VALIDATION_MISSING_FIELD, 'Handle is required', 400);
      const result = await bundleService.listPublicBundlesByHandle(handle, viewerId, cursor);
      if (!result) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Creator not found' } },
          { status: 404 }
        );
      }
      return successResponse(result);
    });
  },
};
