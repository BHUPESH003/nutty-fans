import { successResponse, errorResponse } from '@/lib/api/response';
import { TagService } from '@/services/content/tagService';

const tagService = new TagService();

export const tagController = {
  async list(params: { q?: string; limit?: number }) {
    try {
      const q = params.q?.trim() ?? '';
      if (q) {
        const tags = await tagService.search(q, params.limit);
        return successResponse({ tags });
      }

      const tags = await tagService.trending(params.limit);
      return successResponse({ tags });
    } catch (error) {
      console.error('Error fetching tags:', error);
      return errorResponse('Unable to fetch tags', 500);
    }
  },
};
