import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse, errorResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { FeedService } from '@/services/content/feedService';

const feedService = new FeedService();

/**
 * GET /api/reels
 *
 * Returns posts optimized for reels-style browsing:
 * - Videos and reel-type posts
 * - Ordered by engagement (views + likes)
 * - Uses same Post model, just filtered presentation
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    // Get feed with video/reel filter
    const result = await feedService.getReelsFeed(userId, cursor, limit);

    return successResponse({
      posts: result.posts,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Reels API error:', error);
    return errorResponse('Failed to fetch reels', 500);
  }
}
