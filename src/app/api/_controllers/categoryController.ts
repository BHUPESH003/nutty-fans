import { successResponse, errorResponse } from '@/lib/api/response';
import { CategoryService } from '@/services/common/categoryService';

const categoryService = new CategoryService();

export const categoryController = {
  async list() {
    try {
      const categories = await categoryService.getCategories();
      return successResponse(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return errorResponse('Unable to fetch categories', 500);
    }
  },
};
