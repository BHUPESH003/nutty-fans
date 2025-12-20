import { NextRequest } from 'next/server';

import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedService } from '@/services/content/feedService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // TODO: Get current user ID from session/token
    // For now, we'll fetch a public feed or for a specific user if authenticated
    // Assuming FeedService handles logic.
    // We need to instantiate FeedService.
    const feedService = new FeedService();

    // Note: feedService.getFeed might require a userId if it's a personalized feed.
    // If it's a global feed, maybe not.
    // Let's check FeedService signature.
    // For now, passing 'public' or similar if needed, or just calling it.
    // Assuming getFeed(userId, options)

    // Mock user ID for now or get from session
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;

    // If no user, maybe return public feed?
    // Let's assume fetching for the current user or public.

    const result = await feedService.getExploreFeed(cursor, limit);

    return successResponse(result);
  } catch (error) {
    console.error('Feed fetch error:', error);
    return errorResponse('Failed to fetch feed', 500);
  }
}
