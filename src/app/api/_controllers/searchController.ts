import { NextRequest } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { AppError, handleAsyncRoute, VALIDATION_ERROR } from '@/lib/errors/errorHandler';
import { SearchService } from '@/services/search/searchService';

const searchService = new SearchService();

export const searchController = {
  async search(request: NextRequest) {
    return handleAsyncRoute(async () => {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') ?? '';
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new AppError(VALIDATION_ERROR, 'Limit must be between 1 and 100', 400);
      }

      const results = await searchService.search(query, limit);
      return successResponse(results);
    });
  },

  async searchCreators(request: NextRequest) {
    return handleAsyncRoute(async () => {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') ?? '';
      const categoryId = searchParams.get('categoryId') ?? undefined;
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new AppError(VALIDATION_ERROR, 'Limit must be between 1 and 100', 400);
      }

      const results = await searchService.searchCreators(query, categoryId, limit);
      return successResponse({ creators: results });
    });
  },

  async getTrendingCreators(request: NextRequest) {
    return handleAsyncRoute(async () => {
      const { searchParams } = new URL(request.url);
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : 10;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new AppError(VALIDATION_ERROR, 'Limit must be between 1 and 100', 400);
      }

      const results = await searchService.getTrendingCreators(limit);
      return successResponse({ creators: results });
    });
  },

  async getTrendingPosts(request: NextRequest) {
    return handleAsyncRoute(async () => {
      const { searchParams } = new URL(request.url);
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new AppError(VALIDATION_ERROR, 'Limit must be between 1 and 100', 400);
      }

      const results = await searchService.getTrendingPosts(limit);
      return successResponse({ posts: results });
    });
  },
};
