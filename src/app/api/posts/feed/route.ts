import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { errorResponse, successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { FeedService } from '@/services/content/feedService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const searchParams = req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const type = searchParams.get('type');

    const feedService = new FeedService();

    let result;

    if (userId && type === 'following') {
      result = await feedService.getSubscribedFeed(userId, cursor, limit);
    } else {
      // Default to explore/for-you feed
      // Pass userId if available to get engagement status (liked/bookmarked)
      result = await feedService.getExploreFeed(cursor, limit, userId);
    }

    return successResponse(result);
  } catch (error) {
    console.error('Feed fetch error:', error);
    return errorResponse('Failed to fetch feed', 500);
  }
}
