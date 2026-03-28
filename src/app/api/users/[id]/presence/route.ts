import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { redisPub } from '@/lib/redis/redisClient';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  // Online state
  const onlineRaw = await redisPub.get(`presence:${id}`);
  if (onlineRaw) {
    const online = JSON.parse(onlineRaw) as { lastSeen?: string };
    return Response.json({
      online: true,
      lastSeen: online.lastSeen ?? null,
    });
  }

  // Offline state (stored separately on disconnect)
  const lastSeenRaw = await redisPub.get(`presence:lastSeen:${id}`);
  if (lastSeenRaw) {
    const offline = JSON.parse(lastSeenRaw) as { lastSeen?: string };
    return Response.json({
      online: false,
      lastSeen: offline.lastSeen ?? null,
    });
  }

  return Response.json({ online: false, lastSeen: null });
}
