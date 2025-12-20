import { NextRequest } from 'next/server';

import { searchController } from '../../../_controllers/searchController';

export async function GET(request: NextRequest) {
  return searchController.getTrendingCreators(request);
}
