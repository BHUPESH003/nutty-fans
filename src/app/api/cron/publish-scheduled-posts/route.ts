/**
 * Scheduled Post Publishing Cron Job
 *
 * Runs every minute to publish scheduled posts whose scheduledAt time has passed
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

// Authorization header for cron jobs
const CRON_SECRET = process.env['CRON_SECRET'] || '';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all scheduled posts where scheduledAt has passed
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: now,
          not: null,
        },
      },
      take: 50, // Process in batches
      select: {
        id: true,
        creatorId: true,
        scheduledAt: true,
      },
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Publish each scheduled post
    for (const post of scheduledPosts) {
      try {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: post.scheduledAt || now,
            scheduledAt: null, // Clear scheduledAt after publishing
          },
        });

        results.succeeded++;
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Scheduled post publishing cron job error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
