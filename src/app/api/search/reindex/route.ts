import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { errorResponse, successResponse } from '@/lib/api/response';
import { meilisearchService } from '@/services/search/meilisearchService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 401);
    }

    // Check if user is admin (in production, add proper admin check)
    const user = await import('@/lib/db/prisma').then((m) =>
      m.prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );

    if (user?.role !== 'admin') {
      return errorResponse('Admin access required', 403);
    }

    const body = await req.json();
    const { type } = body; // 'creators', 'posts', or 'all'

    if (type === 'creators' || type === 'all') {
      await meilisearchService.reindexAllCreators();
    }

    if (type === 'posts' || type === 'all') {
      await meilisearchService.reindexAllPosts();
    }

    return successResponse({ success: true }, 'Reindexing started');
  } catch (error) {
    console.error('Failed to reindex:', error);
    return errorResponse('Failed to reindex', 500);
  }
}
