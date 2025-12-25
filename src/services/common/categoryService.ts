import { CategoryRepository } from '@/repositories/categoryRepository';

export class CategoryService {
  constructor(private readonly categoryRepo = new CategoryRepository()) {}

  async getCategories() {
    return this.categoryRepo.listActive();
  }
}
