import { createServer } from 'http';

import { createAdapter } from '@socket.io/redis-adapter';
import { decode } from 'next-auth/jwt';
import { Server as SocketIOServer, type Socket } from 'socket.io';

import { prisma } from '@/lib/db/prisma';
import { redisPub, redisSub } from '@/lib/redis/redisClient';

// ----------------------------------------------------------------------------
// Types (minimal set for Phase 1)
// ----------------------------------------------------------------------------

export interface ServerToClientEvents {
  'message:new': (msg: unknown) => void;
  'message:unlocked': (msg: unknown) => void;

  'presence:online': (data: { userId: string }) => void;
  'presence:offline': (data: { userId: string; lastSeen: string }) => void;

  'typing:start': (data: { conversationId: string; userId: string; userName: string }) => void;
  'typing:stop': (data: { conversationId: string; userId: string }) => void;

  'message:delivered': (data: { messageId: string; deliveredAt: string }) => void;
  'message:read': (data: { conversationId: string; readBy: string; readAt: string }) => void;
}

export interface ClientToServerEvents {
  'conversation:join': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;

  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;

  'message:delivered': (data: { messageId: string }) => void;
  'message:read': (data: { conversationId: string }) => void;
}

function emitToRoom(
  socketIo: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  event: string,
  room: string,
  data: unknown
) {
  // `event` comes from Redis pub/sub payload, so runtime validity is our responsibility.
  socketIo.to(room).emit(event as keyof ServerToClientEvents, data);
}

const httpServer = createServer();

export const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Socket.IO server runs on a different port than Next dev.
      // In development, allow localhost origins to ensure cookies are sent.
      if (!origin) return callback(null, true);

      const allowed = new Set(
        [process.env['NEXT_PUBLIC_APP_URL'], process.env['NEXTAUTH_URL']].filter((v): v is string =>
          Boolean(v)
        )
      );

      if (allowed.has(origin)) return callback(null, true);

      if (process.env['NODE_ENV'] !== 'production') {
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        if (origin.startsWith('http://127.0.0.1:')) return callback(null, true);
        if (origin.startsWith('http://192.168.')) return callback(null, true);
        if (origin.startsWith('http://10.')) return callback(null, true);
        if (origin.startsWith('http://172.16.')) return callback(null, true);
        if (origin.startsWith('http://172.17.')) return callback(null, true);
        if (origin.startsWith('http://172.18.')) return callback(null, true);
        if (origin.startsWith('http://172.19.')) return callback(null, true);
        if (origin.startsWith('http://172.2')) return callback(null, true); // 172.20-172.29
        if (origin.startsWith('http://172.3')) return callback(null, true); // 172.30-172.31
      }

      return callback(new Error(`Origin not allowed: ${origin}`), false);
    },
    credentials: true,
  },
  transports: ['websocket'],
  pingTimeout: 20000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling
io.adapter(createAdapter(redisPub, redisSub));

// io.use(async (socket, next) => {
//   try {
//     const cookieHeader = socket.handshake.headers.cookie || '';
//     const cookieNames =
//       cookieHeader
//         .split(';')
//         .map((p) => p.trim().split('=')[0])
//         .filter(Boolean)
//         .slice(0, 12)
//         .join(', ') || '(none)';

//     if (!cookieHeader) {
//       console.warn('[WS] Unauthorized handshake (no cookies)', {
//         origin: socket.handshake.headers.origin,
//       });
//       return next(new Error('Unauthorized'));
//     }

//     // next-auth `getToken` reads cookies from request.headers.cookie
//     const secretFromEnv = process.env['NEXTAUTH_SECRET'];
//     const secret = secretFromEnv ?? authOptions.secret;
//     const hasSecret = Boolean(secret);
//     const req = new Request('http://localhost', {
//       headers: new Headers({ cookie: cookieHeader }),
//     });

//     const token = await getToken({
//       req: req as unknown as Parameters<typeof getToken>[0]['req'],
//       secret,
//     });

//     if (!token) {
//       const sessionTokenPart =
//         cookieHeader
//           .split(';')
//           .map((p) => p.trim())
//           .find((p) => p.startsWith('next-auth.session-token=')) ?? '';
//       const sessionTokenValue = sessionTokenPart.split('=').slice(1).join('=') ?? '';

//       console.warn('[WS] Unauthorized handshake (token null)', {
//         origin: socket.handshake.headers.origin,
//         cookieNames,
//         hasSecret,
//         secretLen: typeof secret === 'string' ? secret.length : 0,
//         sessionTokenLen: sessionTokenValue ? sessionTokenValue.length : 0,
//         sessionTokenHasDot: sessionTokenValue.includes('.'),
//       });
//       return next(new Error('Unauthorized'));
//     }

//     const userId = (token.id as string | undefined) ?? token.sub;
//     if (!userId) {
//       console.warn('[WS] Unauthorized handshake (missing user id)', {
//         origin: socket.handshake.headers.origin,
//         cookieNames,
//         tokenKeys: Object.keys(token).slice(0, 20),
//       });
//       return next(new Error('Unauthorized'));
//     }

//     socket.data.userId = userId;
//     next();
//   } catch {
//     console.warn('[WS] Unauthorized handshake', {
//       origin: socket.handshake.headers.origin,
//       hasCookieHeader: Boolean(socket.handshake.headers.cookie),
//     });
//     next(new Error('Unauthorized'));
//   }
// });
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || '';

    if (!cookieHeader) {
      console.warn('[WS] No cookies in handshake', {
        origin: socket.handshake.headers.origin,
      });
      return next(new Error('Unauthorized'));
    }

    // Parse cookie string into a map
    const cookies: Record<string, string> = {};
    for (const part of cookieHeader.split(';')) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }

    // Try all three Next-Auth cookie name variants
    const sessionToken =
      cookies['next-auth.session-token'] ??
      cookies['__Secure-next-auth.session-token'] ??
      cookies['__Host-next-auth.session-token'];

    if (!sessionToken) {
      console.warn('[WS] No session-token cookie found', {
        origin: socket.handshake.headers.origin,
        cookieKeys: Object.keys(cookies).slice(0, 12).join(', ') || '(none)',
      });
      return next(new Error('Unauthorized'));
    }

    const secret = process.env['NEXTAUTH_SECRET'];
    if (!secret) {
      console.error('[WS] NEXTAUTH_SECRET is not set — cannot decode token');
      return next(new Error('Server misconfiguration'));
    }

    // decode() works on the raw JWT string directly — no fake Request needed
    const decoded = await decode({ token: sessionToken, secret });

    if (!decoded) {
      console.warn('[WS] Token decode returned null', {
        origin: socket.handshake.headers.origin,
        tokenLength: sessionToken.length,
        tokenDots: (sessionToken.match(/\./g) ?? []).length, // JWT = 3 parts = 2 dots
      });
      return next(new Error('Unauthorized'));
    }

    const userId = (decoded.id as string | undefined) ?? decoded.sub;

    if (!userId) {
      console.warn('[WS] Decoded token has no id/sub', {
        tokenKeys: Object.keys(decoded).join(', '),
      });
      return next(new Error('Unauthorized'));
    }

    socket.data.userId = userId;
    next();
  } catch (err) {
    console.error('[WS] Auth middleware exception:', err);
    next(new Error('Unauthorized'));
  }
});
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  const userId = socket.data.userId as string;

  // Join personal room
  void socket.join(`user:${userId}`);

  // Cache username for typing events
  void prisma.user
    .findUnique({
      where: { id: userId },
      select: { displayName: true, username: true },
    })
    .then((u) => {
      if (!u) return;
      socket.data.userName = u.displayName ?? u.username ?? userId;
    })
    .catch(() => {
      socket.data.userName = userId;
    });

  void setPresence(userId, socket.id)
    .then(() => {
      io.emit('presence:online', { userId });
    })
    .catch(() => {
      // Presence cache is best-effort.
    });

  socket.on('conversation:join', (conversationId) => {
    void socket.join(`conv:${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId) => {
    void socket.leave(`conv:${conversationId}`);
  });

  // Typing indicators (ephemeral)
  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      userName: (socket.data.userName as string) ?? userId,
    });

    const existing = typingTimers.get(conversationId);
    if (existing) clearTimeout(existing);

    typingTimers.set(
      conversationId,
      setTimeout(() => {
        socket.to(`conv:${conversationId}`).emit('typing:stop', { conversationId, userId });
        typingTimers.delete(conversationId);
      }, 4000)
    );
  });

  socket.on('typing:stop', ({ conversationId }) => {
    const t = typingTimers.get(conversationId);
    if (t) clearTimeout(t);
    typingTimers.delete(conversationId);

    socket.to(`conv:${conversationId}`).emit('typing:stop', { conversationId, userId });
  });

  socket.on('message:delivered', async ({ messageId }) => {
    // Client should only emit for messages they received, not their own sends.
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, deliveredAt: true },
    });
    if (!msg) return;
    if (msg.senderId === userId) return;

    const deliveredAt = new Date();
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'DELIVERED',
        deliveredAt,
      },
    });

    // Notify sender
    io.to(`user:${msg.senderId}`).emit('message:delivered', {
      messageId: msg.id,
      deliveredAt: deliveredAt.toISOString(),
    });
  });

  socket.on('message:read', async ({ conversationId }) => {
    // Mark as read messages that were sent by the other participant.
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
      },
      data: {
        isRead: true,
        status: 'READ',
        readAt: new Date(),
      },
    });

    // Reset conversation-level unread counter for the reader (used by `ConversationList`).
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conv) {
      const isUser1 = conv.participant1 === userId;
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          unreadCount1: isUser1 ? 0 : conv.unreadCount1,
          unreadCount2: isUser1 ? conv.unreadCount2 : 0,
        },
      });

      // Phase 10: Redis unread cache reset (best-effort).
      void redisPub.set(`chat_unread:${userId}:${conversationId}`, '0').catch(() => {
        // ignore
      });
    }

    const otherUserId = await getOtherParticipant(conversationId, userId);
    if (!otherUserId) return;

    io.to(`user:${otherUserId}`).emit('message:read', {
      conversationId,
      readBy: userId,
      readAt: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    const lastSeen = new Date().toISOString();
    void clearPresence(userId, lastSeen)
      .then(() => {
        io.emit('presence:offline', { userId, lastSeen });
      })
      .catch(() => {
        io.emit('presence:offline', { userId, lastSeen });
      });
  });
});

// Cross-process: subscribe to Redis channel and re-emit through socket.io
redisSub.subscribe('ws:events').catch((err) => {
  console.error('[WS] Failed subscribing to ws:events:', err);
});

redisSub.on('message', (channel, rawMessage) => {
  if (channel !== 'ws:events') return;
  try {
    const parsed = JSON.parse(rawMessage) as { event: string; room: string; data: unknown };
    const { event, room, data } = parsed;
    emitToRoom(io, event as keyof ServerToClientEvents, room, data);
  } catch (err) {
    console.error('[WS] Failed parsing ws:events payload:', err);
  }
});

// ----------------------------------------------------------------------------
// Start (if this module is executed directly)
// ----------------------------------------------------------------------------
const WS_PORT = parseInt(process.env['WS_PORT'] || '3001', 10);

httpServer.listen(WS_PORT, () => {
  console.warn(`[WebSocket] listening on port ${WS_PORT}`);
});

// ----------------------------------------------------------------------------
// Placeholder handlers for later phases (Phase 2+)
// ----------------------------------------------------------------------------
export async function getOtherParticipant(
  conversationId: string,
  userId: string
): Promise<string | null> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { participant1: true, participant2: true },
  });
  if (!conv) return null;
  if (conv.participant1 === userId) return conv.participant2;
  if (conv.participant2 === userId) return conv.participant1;
  return null;
}

// ----------------------------------------------------------------------------
// Presence helpers (Redis-backed)
// ----------------------------------------------------------------------------

async function setPresence(userId: string, socketId: string) {
  const lastSeen = new Date().toISOString();
  await redisPub.setex(
    `presence:${userId}`,
    35,
    JSON.stringify({
      online: true,
      socketId,
      lastSeen,
    })
  );
}

async function clearPresence(userId: string, lastSeen: string) {
  // Keep the lastSeen available long enough for the offline event/UI.
  // We store it under a separate key with a short TTL.
  await Promise.all([
    redisPub.del(`presence:${userId}`),
    redisPub.setex(
      `presence:lastSeen:${userId}`,
      3600,
      JSON.stringify({
        online: false,
        lastSeen,
      })
    ),
  ]);
}
