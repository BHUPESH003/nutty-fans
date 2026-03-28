# NuttyFans — Production Messaging System Migration

## Complete Cursor Implementation Roadmap

> **Scope:** Upgrade the existing messaging system from SSE-based 1:1 chat to a
> full production-grade platform (WebSockets, broadcasting, presence, PPV, CRM).
>
> **Safety rule (applies to every phase):** Only touch files listed in that phase.
> Never modify API route auth logic, payment processing, existing Prisma relations
> that are not extended in this guide, or any file under `src/repositories/` unless
> explicitly stated.

---

## MASTER EXECUTION ORDER

```
Phase 0  → Infrastructure (Redis, BullMQ, Socket.IO deps)
Phase 1  → WebSocket server (replace SSE)
Phase 2  → Presence, typing indicators, delivery receipts
Phase 3  → Message reliability (optimistic UI, deduplication)
Phase 4  → Broadcasting system (data model + queue + UI)
Phase 5  → PPV broadcasts + analytics
Phase 6  → Fan CRM (tags, welcome messages, fan sidebar)
Phase 7  → In-chat tipping
Phase 8  → Voice messages
Phase 9  → Message reactions
Phase 10 → Infrastructure hardening (Redis read counts, pagination)
```

Each phase is independently deployable. Phases 0–3 are blocking (do these first
in order). Phases 4–10 can be parallelised after Phase 3 is complete.

---

## PHASE 0 — Infrastructure Setup

### 0.1 Install dependencies

```bash
npm install socket.io socket.io-client
npm install bullmq ioredis
npm install @types/ioredis --save-dev

# For voice messages (Phase 8, install now to avoid later disruption)
npm install wavesurfer.js
```

### 0.2 Environment variables — add to `.env` and `.env.example`

```env
# Redis (required for WebSocket adapter, BullMQ, presence, read counts)
REDIS_URL=redis://localhost:6379

# WebSocket server (same host in dev, separate URL in prod)
NEXT_PUBLIC_WS_URL=http://localhost:3001

# BullMQ concurrency
BROADCAST_WORKER_CONCURRENCY=5
BROADCAST_BATCH_SIZE=500
```

### 0.3 Create Redis client singleton

**Create file:** `src/lib/redis/redisClient.ts`

```typescript
import { Redis } from 'ioredis';

declare global {
  var __redis: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
  });

  return client;
}

// Singleton — reuse across hot reloads in dev
if (!global.__redis) {
  global.__redis = createRedisClient();
}

export const redis = global.__redis;

// Separate pub/sub clients (ioredis cannot share connection for subscribe)
export const redisPub = new Redis(process.env.REDIS_URL!);
export const redisSub = new Redis(process.env.REDIS_URL!);
```

### 0.4 Create BullMQ queue registry

**Create file:** `src/lib/queues/index.ts`

```typescript
import { Queue } from 'bullmq';
import { redis } from '@/lib/redis/redisClient';

const connection = { host: redis.options.host, port: redis.options.port };

export const broadcastQueue = new Queue('broadcasts', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const welcomeMessageQueue = new Queue('welcome-messages', {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'fixed', delay: 2000 } },
});
```

### 0.5 Prisma schema additions

**Modify:** `prisma/schema.prisma`

Add the following models and fields. Do NOT remove any existing models.

```prisma
// ─── Extend existing Message model ───────────────────────────────────────────
// Add these fields to the existing Message model:
//   clientId     String?   @unique  // for deduplication
//   type         MessageType @default(TEXT)
//   status       MessageStatus @default(SENT)
//   deliveredAt  DateTime?
//   readAt       DateTime?
//   reactions    MessageReaction[]
//   metadata     Json?      // stores tip amount, voice duration, etc.

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO        // voice messages
  PPV          // pay-per-view locked content
  TIP          // tip event message
  SYSTEM       // join, subscribe notifications
}

enum MessageStatus {
  SENDING      // optimistic, client only
  SENT         // persisted to DB
  DELIVERED    // recipient client connected and received
  READ         // recipient scrolled past
  FAILED       // send failed
}

// ─── Broadcasting ─────────────────────────────────────────────────────────────
model Broadcast {
  id              String            @id @default(cuid())
  creatorId       String
  creator         User              @relation("CreatorBroadcasts", fields: [creatorId], references: [id])
  status          BroadcastStatus   @default(DRAFT)
  audienceFilter  BroadcastAudience @default(ALL_SUBSCRIBERS)
  customTagId     String?           // if audienceFilter = TAGGED_FANS
  fanTag          FanTag?           @relation(fields: [customTagId], references: [id])
  content         String            // message text
  mediaUrls       String[]          // attached media S3 keys
  ppvPrice        Decimal?          // if set, this is a PPV broadcast
  ppvDescription  String?
  scheduledAt     DateTime?
  sentAt          DateTime?
  recipientCount  Int               @default(0)
  deliveredCount  Int               @default(0)
  openedCount     Int               @default(0)
  purchasedCount  Int               @default(0)
  revenueTotal    Decimal           @default(0)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([creatorId, status])
  @@index([scheduledAt])
}

enum BroadcastStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  FAILED
}

enum BroadcastAudience {
  ALL_SUBSCRIBERS
  ACTIVE_SUBSCRIBERS
  TIER_BASED
  TOP_SPENDERS       // top 10% by lifetime spend
  INACTIVE_FANS      // no message opened in 30 days
  EXPIRING_SOON      // subscription expires within 7 days
  TAGGED_FANS        // custom tag
  NEW_SUBSCRIBERS    // subscribed within last 7 days
}

// ─── Fan CRM ─────────────────────────────────────────────────────────────────
model FanTag {
  id          String      @id @default(cuid())
  creatorId   String
  creator     User        @relation("CreatorFanTags", fields: [creatorId], references: [id])
  label       String      // "VIP", "High Spender", "At Risk", etc.
  color       String?     // hex color for UI badge
  isAutomatic Boolean     @default(false)
  rule        Json?       // { type: "spend_threshold", value: 100 }
  fans        FanTagAssignment[]
  broadcasts  Broadcast[]
  createdAt   DateTime    @default(now())

  @@unique([creatorId, label])
  @@index([creatorId])
}

model FanTagAssignment {
  id        String   @id @default(cuid())
  tagId     String
  tag       FanTag   @relation(fields: [tagId], references: [id], onDelete: Cascade)
  fanId     String
  fan       User     @relation("FanTagAssignments", fields: [fanId], references: [id])
  assignedAt DateTime @default(now())

  @@unique([tagId, fanId])
  @@index([fanId])
}

// ─── Welcome Message Templates ────────────────────────────────────────────────
model WelcomeMessageTemplate {
  id          String   @id @default(cuid())
  creatorId   String   @unique
  creator     User     @relation(fields: [creatorId], references: [id])
  content     String
  mediaUrls   String[]
  ppvPrice    Decimal?
  isEnabled   Boolean  @default(true)
  sentCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── Message Reactions ────────────────────────────────────────────────────────
model MessageReaction {
  id        String   @id @default(cuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation("UserReactions", fields: [userId], references: [id])
  emoji     String   // "❤️", "🔥", "💰", "😍"
  createdAt DateTime @default(now())

  @@unique([messageId, userId, emoji])
  @@index([messageId])
}

// ─── Broadcast PPV Purchases ──────────────────────────────────────────────────
model BroadcastPurchase {
  id          String    @id @default(cuid())
  broadcastId String
  broadcast   Broadcast @relation(fields: [broadcastId], references: [id])
  fanId       String
  fan         User      @relation("FanBroadcastPurchases", fields: [fanId], references: [id])
  amount      Decimal
  messageId   String?   // the specific conversation message that was unlocked
  purchasedAt DateTime  @default(now())

  @@unique([broadcastId, fanId])
  @@index([broadcastId])
}
```

Run after editing:

```bash
npx prisma migrate dev --name messaging_v2_upgrade
npx prisma generate
```

---

## PHASE 1 — WebSocket Server (Replaces SSE)

> **What changes:** Remove `src/app/api/conversations/[id]/messages/stream/route.ts`
> usage from the frontend. The SSE route can stay as a deprecated fallback but
> will no longer be the primary transport.

### 1.1 Create the WebSocket server

**Create file:** `src/server/websocket.ts`

This is a standalone Node.js server that runs alongside Next.js.

```typescript
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPub, redisSub } from '@/lib/redis/redisClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ServerToClientEvents {
  'message:new': (msg: WsMessage) => void;
  'message:delivered': (data: { messageId: string; deliveredAt: string }) => void;
  'message:read': (data: { conversationId: string; readBy: string; readAt: string }) => void;
  'message:reaction': (data: WsReaction) => void;
  'typing:start': (data: { conversationId: string; userId: string; userName: string }) => void;
  'typing:stop': (data: { conversationId: string; userId: string }) => void;
  'presence:online': (data: { userId: string }) => void;
  'presence:offline': (data: { userId: string; lastSeen: string }) => void;
  'broadcast:progress': (data: { broadcastId: string; sent: number; total: number }) => void;
}

interface ClientToServerEvents {
  'conversation:join': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
  'message:delivered': (messageId: string) => void;
  'message:read': (conversationId: string) => void;
}

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
const httpServer = createServer();
export const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL,
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling (multiple Node processes/pods)
io.adapter(createAdapter(redisPub, redisSub));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    // Extract session token from cookie header
    const cookieHeader = socket.handshake.headers.cookie || '';
    // Validate session — use your existing session validation
    const userId = await validateSocketSession(cookieHeader);
    if (!userId) return next(new Error('Unauthorized'));
    socket.data.userId = userId;
    next();
  } catch {
    next(new Error('Auth failed'));
  }
});

// ─── Connection Handler ───────────────────────────────────────────────────────
io.on('connection', async (socket: Socket) => {
  const userId = socket.data.userId as string;

  // Join personal room (for targeted events like new message notifications)
  socket.join(`user:${userId}`);

  // Set presence in Redis with 35s TTL (refreshed by heartbeat)
  await setPresence(userId, socket.id);

  // Broadcast presence to relevant users
  io.emit('presence:online', { userId });

  // ── Conversation room management ──
  socket.on('conversation:join', (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conv:${conversationId}`);
  });

  // ── Typing indicators (ephemeral, never persisted) ──
  const typingTimers = new Map<string, NodeJS.Timeout>();

  socket.on('typing:start', (conversationId) => {
    socket.to(`conv:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      userName: socket.data.userName,
    });
    // Auto-stop after 4s of no updates
    const existing = typingTimers.get(conversationId);
    if (existing) clearTimeout(existing);
    typingTimers.set(
      conversationId,
      setTimeout(() => {
        socket.to(`conv:${conversationId}`).emit('typing:stop', { conversationId, userId });
      }, 4000)
    );
  });

  socket.on('typing:stop', (conversationId) => {
    const t = typingTimers.get(conversationId);
    if (t) {
      clearTimeout(t);
      typingTimers.delete(conversationId);
    }
    socket.to(`conv:${conversationId}`).emit('typing:stop', { conversationId, userId });
  });

  // ── Delivery receipts ──
  socket.on('message:delivered', async (messageId) => {
    await markMessageDelivered(messageId, userId);
    const msg = await getMessageById(messageId);
    if (msg) {
      io.to(`user:${msg.senderId}`).emit('message:delivered', {
        messageId,
        deliveredAt: new Date().toISOString(),
      });
    }
  });

  // ── Read receipts ──
  socket.on('message:read', async (conversationId) => {
    await markConversationRead(conversationId, userId);
    // Notify the other participant
    const otherUserId = await getOtherParticipant(conversationId, userId);
    if (otherUserId) {
      io.to(`user:${otherUserId}`).emit('message:read', {
        conversationId,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', async () => {
    typingTimers.forEach(clearTimeout);
    const lastSeen = new Date().toISOString();
    await clearPresence(userId);
    io.emit('presence:offline', { userId, lastSeen });
  });
});

// ─── Presence Helpers ─────────────────────────────────────────────────────────
async function setPresence(userId: string, socketId: string) {
  await redisPub.setex(
    `presence:${userId}`,
    35,
    JSON.stringify({
      online: true,
      socketId,
      lastSeen: new Date().toISOString(),
    })
  );
}

async function clearPresence(userId: string) {
  await redisPub.del(`presence:${userId}`);
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const data = await redisPub.get(`presence:${userId}`);
  return data !== null;
}

// ─── Start server ─────────────────────────────────────────────────────────────
const WS_PORT = parseInt(process.env.WS_PORT || '3001');
httpServer.listen(WS_PORT, () => {
  console.log(`[WebSocket] Server listening on port ${WS_PORT}`);
});
```

### 1.2 Create server startup script

**Create file:** `src/server/index.ts`

```typescript
// This file is the entry point for the WebSocket server process.
// Run alongside Next.js: `node src/server/index.ts`
import './websocket';
import { startBroadcastWorker } from './workers/broadcastWorker';
import { startWelcomeMessageWorker } from './workers/welcomeMessageWorker';

startBroadcastWorker();
startWelcomeMessageWorker();

console.log('[Server] All workers started');
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"tsx watch src/server/index.ts\"",
    "ws:server": "tsx src/server/index.ts"
  }
}
```

```bash
npm install concurrently tsx --save-dev
```

### 1.3 Create WebSocket emitter utility (used by API routes to push events)

**Create file:** `src/lib/realtime/wsEmitter.ts`

```typescript
// API routes call this to push real-time events without being in the WS process.
// Uses Redis pub/sub to communicate cross-process.
import { redisPub } from '@/lib/redis/redisClient';

export async function emitNewMessage(conversationId: string, message: any) {
  await redisPub.publish(
    'ws:events',
    JSON.stringify({
      event: 'message:new',
      room: `conv:${conversationId}`,
      data: message,
    })
  );
}

export async function emitToUser(userId: string, event: string, data: any) {
  await redisPub.publish(
    'ws:events',
    JSON.stringify({
      event,
      room: `user:${userId}`,
      data,
    })
  );
}
```

**In `src/server/websocket.ts`**, add subscriber for cross-process events:

```typescript
// Add this after io setup:
redisSub.subscribe('ws:events');
redisSub.on('message', (_, message) => {
  const { event, room, data } = JSON.parse(message);
  io.to(room).emit(event, data);
});
```

### 1.4 Update the message send API route

**Modify:** `src/app/api/conversations/[id]/messages/route.ts`

After successfully saving a message, replace the SSE push logic with:

```typescript
import { emitNewMessage } from '@/lib/realtime/wsEmitter';

// After message is saved to DB:
await emitNewMessage(conversationId, {
  id: message.id,
  clientId: body.clientId, // echo back for deduplication
  conversationId,
  senderId: session.user.id,
  content: message.content,
  type: message.type,
  status: 'SENT',
  createdAt: message.createdAt,
  media: message.media,
});
```

### 1.5 Update `useMessages` hook

**Modify:** `src/hooks/useMessages.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return sharedSocket;
}

export function useMessages(conversationId: string) {
  const socket = useRef<Socket>(getSocket());

  useEffect(() => {
    const s = socket.current;
    s.emit('conversation:join', conversationId);

    s.on('message:new', (msg) => {
      // Add to local state; skip if clientId already present (dedup)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id || m.clientId === msg.clientId)) return prev;
        return [...prev, { ...msg, status: 'SENT' }];
      });
      // Emit delivered receipt
      s.emit('message:delivered', msg.id);
    });

    s.on('message:delivered', ({ messageId, deliveredAt }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'DELIVERED', deliveredAt } : m))
      );
    });

    s.on('message:read', ({ conversationId: cid, readAt }) => {
      if (cid === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== 'READ' ? { ...m, status: 'READ', readAt } : m))
        );
      }
    });

    s.on('typing:start', ({ userId: typingUserId }) => {
      setTypingUsers((prev) => new Set([...prev, typingUserId]));
    });

    s.on('typing:stop', ({ userId: typingUserId }) => {
      setTypingUsers((prev) => {
        const s = new Set(prev);
        s.delete(typingUserId);
        return s;
      });
    });

    return () => {
      s.emit('conversation:leave', conversationId);
      s.off('message:new');
      s.off('message:delivered');
      s.off('message:read');
      s.off('typing:start');
      s.off('typing:stop');
    };
  }, [conversationId]);

  // Emit read when conversation is opened
  useEffect(() => {
    socket.current.emit('message:read', conversationId);
  }, [conversationId]);

  // ... rest of hook (sendMessage, unlockMessage, pagination)
}
```

---

## PHASE 2 — Presence, Typing Indicators, Delivery Receipts UI

### 2.1 Presence display in `ChatWindow.tsx`

**Modify:** `src/components/messaging/ChatWindow.tsx`

```tsx
// Add presence hook
const [isOnline, setIsOnline] = useState(false);
const [lastSeen, setLastSeen] = useState<string | null>(null);

useEffect(() => {
  // Fetch initial presence via API
  fetch(`/api/users/${otherUserId}/presence`)
    .then((r) => r.json())
    .then(({ online, lastSeen }) => {
      setIsOnline(online);
      setLastSeen(lastSeen);
    });

  const socket = getSocket();
  socket.on('presence:online', ({ userId }) => {
    if (userId === otherUserId) setIsOnline(true);
  });
  socket.on('presence:offline', ({ userId, lastSeen }) => {
    if (userId === otherUserId) {
      setIsOnline(false);
      setLastSeen(lastSeen);
    }
  });

  return () => {
    socket.off('presence:online');
    socket.off('presence:offline');
  };
}, [otherUserId]);

// In JSX, replace static "Online Now" with:
// {isOnline
//   ? <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online Now</span>
//   : <span className="text-[10px] text-on-surface-variant">Last seen {formatRelative(lastSeen)}</span>
// }
```

**Create API route:** `src/app/api/users/[id]/presence/route.ts`

```typescript
import { isUserOnline } from '@/server/websocket';
import { redis } from '@/lib/redis/redisClient';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const data = await redis.get(`presence:${params.id}`);
  if (data) {
    const presence = JSON.parse(data);
    return Response.json({ online: true, lastSeen: presence.lastSeen });
  }
  // Fall back to DB lastSeen if you track it
  return Response.json({ online: false, lastSeen: null });
}
```

### 2.2 Typing indicator UI in `ChatWindow.tsx`

```tsx
// Add to state:
const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

// In JSX, show below message list, above input:
{
  typingUsers.size > 0 && (
    <div className="flex items-center gap-2 px-6 py-2">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant" />
      </div>
      <span className="text-xs italic text-on-surface-variant">typing…</span>
    </div>
  );
}
```

### 2.3 Typing emit in `MessageInput.tsx`

**Modify:** `src/components/messaging/MessageInput.tsx`

```tsx
const typingTimeout = useRef<NodeJS.Timeout>();
const isTyping = useRef(false);
const socket = getSocket();

const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setValue(e.target.value);

  if (!isTyping.current) {
    socket.emit('typing:start', conversationId);
    isTyping.current = true;
  }

  clearTimeout(typingTimeout.current);
  typingTimeout.current = setTimeout(() => {
    socket.emit('typing:stop', conversationId);
    isTyping.current = false;
  }, 3000);
};
```

### 2.4 Message status ticks in `MessageBubble.tsx`

**Modify:** `src/components/messaging/MessageBubble.tsx`

```tsx
// Add status indicator for sent messages:
{
  isMine && (
    <span
      className="material-symbols-outlined text-[12px] opacity-70"
      style={{ fontVariationSettings: message.status === 'READ' ? "'FILL' 1" : "'FILL' 0" }}
    >
      {message.status === 'SENDING' ? 'schedule' : ''}
      {message.status === 'SENT' ? 'check' : ''}
      {message.status === 'DELIVERED' ? 'done_all' : ''}
      {message.status === 'READ' ? 'done_all' : ''}
      {message.status === 'FAILED' ? 'error' : ''}
    </span>
  );
}
// Read = done_all in secondary (blue) color:
// className={message.status === 'READ' ? 'text-secondary' : 'text-on-primary/60'}
```

---

## PHASE 3 — Message Reliability (Optimistic Sends + Deduplication)

### 3.1 Update message send endpoint for deduplication

**Modify:** `src/app/api/conversations/[id]/messages/route.ts`

```typescript
// In POST handler, before inserting:
const { clientId, content, type, ppvPrice, mediaUrls } = body;

if (clientId) {
  // Check for existing message with this clientId (idempotency)
  const existing = await prisma.message.findUnique({ where: { clientId } });
  if (existing) return Response.json(existing); // Return existing, don't duplicate
}

const message = await prisma.message.create({
  data: {
    clientId, // store for deduplication
    conversationId,
    senderId: session.user.id,
    content,
    type: type || 'TEXT',
    status: 'SENT',
    // ... rest of fields
  },
});
```

### 3.2 Optimistic send in `useMessages.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';

const sendMessage = useCallback(
  async ({ content, type = 'TEXT', mediaUrls = [], ppvPrice }: SendMessageParams) => {
    const clientId = uuidv4();

    // 1. Optimistic update — show immediately
    const optimisticMsg: Message = {
      id: `optimistic-${clientId}`,
      clientId,
      conversationId,
      senderId: currentUserId,
      content,
      type,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
      mediaUrls,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // 2. Persist to server
      const res = await apiClient.messaging.sendMessage(conversationId, {
        clientId,
        content,
        type,
        mediaUrls,
        ppvPrice,
      });

      // 3. Replace optimistic message with server response
      setMessages((prev) =>
        prev.map((m) => (m.clientId === clientId ? { ...res, status: 'SENT' } : m))
      );
    } catch (err) {
      // 4. Mark as failed, show retry
      setMessages((prev) =>
        prev.map((m) => (m.clientId === clientId ? { ...m, status: 'FAILED' } : m))
      );
    }
  },
  [conversationId, currentUserId]
);
```

### 3.3 Retry UI in `MessageBubble.tsx`

```tsx
{
  message.status === 'FAILED' && isMine && (
    <button
      onClick={() => retryMessage(message.clientId!)}
      className="mt-1 flex items-center gap-1 text-[10px] font-bold text-error"
    >
      <span className="material-symbols-outlined text-[12px]">refresh</span>
      Tap to retry
    </button>
  );
}
```

### 3.4 Persist cursor to localStorage for conversation resumption

**Modify:** `src/hooks/useMessages.ts`

```typescript
// Save last-seen message cursor per conversation
const CURSOR_KEY = (convId: string) => `msg_cursor_${convId}`;

// On load, check localStorage for stored cursor:
const storedCursor = localStorage.getItem(CURSOR_KEY(conversationId));

// After fetching new messages, update cursor:
const lastId = messages[messages.length - 1]?.id;
if (lastId) localStorage.setItem(CURSOR_KEY(conversationId), lastId);
```

---

## PHASE 4 — Broadcasting System

### 4.1 Create Broadcast data service

**Create file:** `src/services/messaging/broadcastService.ts`

```typescript
import { prisma } from '@/lib/db/prisma';
import { broadcastQueue } from '@/lib/queues';
import { BroadcastAudience, BroadcastStatus } from '@prisma/client';

export async function createBroadcast(
  creatorId: string,
  data: {
    content: string;
    audienceFilter: BroadcastAudience;
    customTagId?: string;
    mediaUrls?: string[];
    ppvPrice?: number;
    ppvDescription?: string;
    scheduledAt?: Date;
  }
) {
  const broadcast = await prisma.broadcast.create({
    data: { creatorId, ...data, status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT' },
  });
  return broadcast;
}

export async function sendBroadcast(broadcastId: string) {
  const broadcast = await prisma.broadcast.findUniqueOrThrow({
    where: { id: broadcastId },
  });

  // Count audience before queuing
  const recipientIds = await resolveAudience(
    broadcast.creatorId,
    broadcast.audienceFilter,
    broadcast.customTagId
  );

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: 'SENDING', recipientCount: recipientIds.length },
  });

  // Enqueue the job — actual sending happens in worker
  await broadcastQueue.add(
    'send',
    {
      broadcastId,
      recipientIds,
      content: broadcast.content,
      ppvPrice: broadcast.ppvPrice,
      mediaUrls: broadcast.mediaUrls,
      creatorId: broadcast.creatorId,
    },
    {
      jobId: `broadcast:${broadcastId}`, // prevent duplicate jobs
    }
  );

  return { recipientCount: recipientIds.length };
}

export async function resolveAudience(
  creatorId: string,
  filter: BroadcastAudience,
  customTagId?: string | null
): Promise<string[]> {
  const now = new Date();

  switch (filter) {
    case 'ALL_SUBSCRIBERS':
      return getSubscriberIds(creatorId, { activeOnly: false });

    case 'ACTIVE_SUBSCRIBERS':
      return getSubscriberIds(creatorId, { activeOnly: true });

    case 'TOP_SPENDERS':
      const spenders = await prisma.$queryRaw<{ fanId: string }[]>`
        SELECT t."userId" as "fanId", SUM(t.amount) as total
        FROM "Transaction" t
        JOIN "Subscription" s ON s."userId" = t."userId" AND s."creatorId" = ${creatorId}
        WHERE t."creatorId" = ${creatorId}
        GROUP BY t."userId"
        ORDER BY total DESC
        LIMIT (SELECT COUNT(*) * 0.1 FROM "Subscription" WHERE "creatorId" = ${creatorId} AND status = 'ACTIVE')
      `;
      return spenders.map((s) => s.fanId);

    case 'INACTIVE_FANS':
      // Fans who haven't opened a DM in 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const inactive = await prisma.conversation.findMany({
        where: {
          participants: { some: { id: creatorId } },
          messages: { none: { createdAt: { gte: thirtyDaysAgo } } },
        },
        include: { participants: { where: { id: { not: creatorId } } } },
      });
      return inactive.flatMap((c) => c.participants.map((p) => p.id));

    case 'EXPIRING_SOON':
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiring = await prisma.subscription.findMany({
        where: {
          creatorId,
          status: 'ACTIVE',
          currentPeriodEnd: { lte: sevenDaysFromNow, gte: now },
        },
      });
      return expiring.map((s) => s.userId);

    case 'TAGGED_FANS':
      if (!customTagId) return [];
      const tagged = await prisma.fanTagAssignment.findMany({
        where: { tagId: customTagId },
      });
      return tagged.map((t) => t.fanId);

    case 'NEW_SUBSCRIBERS':
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const newSubs = await prisma.subscription.findMany({
        where: { creatorId, createdAt: { gte: sevenDaysAgo } },
      });
      return newSubs.map((s) => s.userId);

    default:
      return [];
  }
}

async function getSubscriberIds(creatorId: string, { activeOnly }: { activeOnly: boolean }) {
  const subs = await prisma.subscription.findMany({
    where: { creatorId, ...(activeOnly ? { status: 'ACTIVE' } : {}) },
    select: { userId: true },
  });
  return subs.map((s) => s.userId);
}

export async function getBroadcastAnalytics(broadcastId: string) {
  const broadcast = await prisma.broadcast.findUniqueOrThrow({
    where: { id: broadcastId },
    include: { _count: { select: { purchases: true } } },
  });

  const totalRevenue = await prisma.broadcastPurchase.aggregate({
    where: { broadcastId },
    _sum: { amount: true },
  });

  return {
    ...broadcast,
    purchasedCount: broadcast._count.purchases,
    revenueTotal: totalRevenue._sum.amount || 0,
    conversionRate:
      broadcast.recipientCount > 0
        ? (broadcast._count.purchases / broadcast.recipientCount) * 100
        : 0,
  };
}
```

### 4.2 Create BullMQ broadcast worker

**Create file:** `src/server/workers/broadcastWorker.ts`

```typescript
import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/db/prisma';
import { emitNewMessage, emitToUser } from '@/lib/realtime/wsEmitter';
import { io } from '../websocket';

const BATCH_SIZE = parseInt(process.env.BROADCAST_BATCH_SIZE || '500');

interface BroadcastJobData {
  broadcastId: string;
  recipientIds: string[];
  content: string;
  creatorId: string;
  ppvPrice?: number;
  mediaUrls?: string[];
}

export function startBroadcastWorker() {
  const worker = new Worker(
    'broadcasts',
    async (job: Job<BroadcastJobData>) => {
      const { broadcastId, recipientIds, content, creatorId, ppvPrice, mediaUrls } = job.data;
      let sent = 0;

      // Process in batches to avoid memory exhaustion
      for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
        const batch = recipientIds.slice(i, i + BATCH_SIZE);

        // Find or create 1:1 conversations in bulk
        const conversations = await Promise.all(
          batch.map((fanId) => findOrCreateConversation(creatorId, fanId))
        );

        // Batch insert messages
        const messages = await prisma.$transaction(
          conversations.map((conv) =>
            prisma.message.create({
              data: {
                conversationId: conv.id,
                senderId: creatorId,
                content,
                type: ppvPrice ? 'PPV' : 'TEXT',
                status: 'SENT',
                mediaUrls: mediaUrls || [],
                metadata: ppvPrice ? { ppvPrice, locked: true, broadcastId } : {},
              },
            })
          )
        );

        // Push real-time events per conversation
        await Promise.all(
          messages.map((msg, idx) =>
            emitNewMessage(conversations[idx].id, {
              ...msg,
              isBroadcast: true,
            })
          )
        );

        sent += batch.length;

        // Update progress
        await prisma.broadcast.update({
          where: { id: broadcastId },
          data: { deliveredCount: sent },
        });

        // Emit progress to creator's dashboard
        await emitToUser(creatorId, 'broadcast:progress', {
          broadcastId,
          sent,
          total: recipientIds.length,
        });

        job.updateProgress(Math.round((sent / recipientIds.length) * 100));
      }

      // Mark broadcast as sent
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { status: 'SENT', sentAt: new Date(), deliveredCount: sent },
      });
    },
    {
      connection: {
        /* redis connection */
      },
      concurrency: parseInt(process.env.BROADCAST_WORKER_CONCURRENCY || '5'),
    }
  );

  worker.on('failed', async (job, err) => {
    console.error(`[BroadcastWorker] Job ${job?.id} failed:`, err);
    if (job?.data.broadcastId) {
      await prisma.broadcast.update({
        where: { id: job.data.broadcastId },
        data: { status: 'FAILED' },
      });
    }
  });

  return worker;
}

async function findOrCreateConversation(userId1: string, userId2: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: userId1 } } },
        { participants: { some: { id: userId2 } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { participants: { connect: [{ id: userId1 }, { id: userId2 }] } },
  });
}
```

### 4.3 Broadcast API routes

**Create file:** `src/app/api/creator/broadcasts/route.ts`

```typescript
// GET /api/creator/broadcasts — list creator's broadcasts
// POST /api/creator/broadcasts — create draft

// Create file: src/app/api/creator/broadcasts/[id]/route.ts
// GET    — get broadcast + analytics
// PATCH  — update draft
// DELETE — delete draft

// Create file: src/app/api/creator/broadcasts/[id]/send/route.ts
// POST — trigger send (enqueues BullMQ job)
import { sendBroadcast } from '@/services/messaging/broadcastService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // auth check — must be the creator
  const result = await sendBroadcast(params.id);
  return Response.json(result);
}

// Create file: src/app/api/creator/broadcasts/[id]/analytics/route.ts
// GET — detailed analytics per broadcast
```

### 4.4 Broadcast UI — `ConversationList.tsx`

Update the existing Broadcast button to open the broadcast composer:

**Create file:** `src/components/messaging/BroadcastComposer.tsx`

This is a full-screen slide-over panel with these sections:

```tsx
// Section 1: Audience selector
// Tabs: "All Subscribers" | "Top Spenders" | "Inactive Fans" | "Expiring Soon" | "Tagged" | "New"
// Shows estimated reach count below tabs

// Section 2: Message composer
// Textarea (same style as MessageInput)
// Media attachment toolbar: image, video, PPV toggle

// Section 3: PPV toggle (visible when PPV is on)
// Price input: "$" prefix + number
// Description input

// Section 4: Schedule toggle
// DateTimePicker input (only show if scheduled)

// Footer: "Estimate Reach" button + "Send Now" | "Schedule" CTA
// Send Now: bg-primary-container rounded-full text-white font-bold py-3 px-8
// Shows progress bar after sending (broadcast:progress WS event)
```

### 4.5 Add scheduled broadcast support to cron

**Modify:** `src/app/api/cron/publish-scheduled-posts/route.ts`

Add at the end of the cron handler:

```typescript
// Process scheduled broadcasts
const dueBroadcasts = await prisma.broadcast.findMany({
  where: {
    status: 'SCHEDULED',
    scheduledAt: { lte: new Date() },
  },
});

for (const broadcast of dueBroadcasts) {
  await sendBroadcast(broadcast.id);
}
```

---

## PHASE 5 — PPV Broadcasts + Analytics

### 5.1 PPV unlock for broadcast messages

**Modify:** `src/app/api/messages/[id]/unlock/route.ts`

After existing unlock logic, check if message is from a broadcast:

```typescript
const message = await prisma.message.findUnique({
  where: { id: params.id },
  include: { conversation: true },
});

const metadata = message.metadata as any;
if (metadata?.broadcastId) {
  // Record broadcast purchase
  await prisma.broadcastPurchase.upsert({
    where: { broadcastId_fanId: { broadcastId: metadata.broadcastId, fanId: session.user.id } },
    create: {
      broadcastId: metadata.broadcastId,
      fanId: session.user.id,
      amount: metadata.ppvPrice,
      messageId: message.id,
    },
    update: {},
  });

  // Update broadcast revenue stats atomically
  await prisma.broadcast.update({
    where: { id: metadata.broadcastId },
    data: {
      purchasedCount: { increment: 1 },
      revenueTotal: { increment: metadata.ppvPrice },
    },
  });
}
```

### 5.2 Broadcast analytics dashboard widget

**Create file:** `src/components/creator/BroadcastAnalyticsCard.tsx`

```tsx
// Card displays per-broadcast:
// - Recipients bar: "Sent to 4,821 fans"
// - Opened rate: progress bar (openedCount / recipientCount)
// - Conversion rate: progress bar (purchasedCount / recipientCount)
// - Revenue: "$1,247.50" in font-headline font-black text-2xl text-primary

// Stat row component:
// Label: text-xs text-on-surface-variant uppercase tracking-widest
// Value: font-headline font-black text-xl text-on-surface
// Bar: h-1.5 bg-surface-container-high rounded-full
//   Fill: h-full bg-primary-container rounded-full transition-all
```

---

## PHASE 6 — Fan CRM

### 6.1 Fan tag service

**Create file:** `src/services/messaging/fanTagService.ts`

```typescript
export async function createFanTag(creatorId: string, label: string, color?: string) {
  return prisma.fanTag.create({ data: { creatorId, label, color } });
}

export async function assignTagToFan(tagId: string, fanId: string) {
  return prisma.fanTagAssignment.upsert({
    where: { tagId_fanId: { tagId, fanId } },
    create: { tagId, fanId },
    update: {},
  });
}

export async function getFanProfile(creatorId: string, fanId: string) {
  const [subscription, totalSpend, purchases, tags] = await Promise.all([
    prisma.subscription.findFirst({
      where: { creatorId, userId: fanId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.aggregate({
      where: { creatorId, userId: fanId },
      _sum: { amount: true },
    }),
    prisma.ppvPurchase.count({ where: { userId: fanId } }),
    prisma.fanTagAssignment.findMany({
      where: { fanId, tag: { creatorId } },
      include: { tag: true },
    }),
  ]);

  return {
    subscription,
    totalSpend: totalSpend._sum.amount || 0,
    purchaseCount: purchases,
    tags: tags.map((t) => t.tag),
    subscribedSince: subscription?.createdAt,
  };
}
```

### 6.2 Fan profile sidebar in ChatWindow

**Create file:** `src/components/messaging/FanProfileSidebar.tsx`

```tsx
// This is a collapsible right panel inside ChatWindow (only visible to creators)
// Width: w-72 border-l border-surface-container-high bg-white
// Toggle: button in ChatWindow header "info" icon

// Sections:
// 1. Avatar + name + handle (large, centered)
// 2. Tags row — colored badge pills + "Add tag" button
// 3. Stats grid (2x2):
//    - "Member Since" / date
//    - "Total Spent" / "$247.50"
//    - "PPV Purchases" / count
//    - "Subscription" / tier name
// 4. "Quick Actions" section:
//    - "Send PPV" button (opens PPV composer)
//    - "Add Tag" button (opens tag picker popover)
//    - "View Subscription" link

// Tag badge: rounded-full px-2.5 py-1 text-[10px] font-bold
// Use tag.color as background at 15% opacity, full color for text
```

### 6.3 Welcome message system

**Create file:** `src/server/workers/welcomeMessageWorker.ts`

```typescript
import { Worker } from 'bullmq';

export function startWelcomeMessageWorker() {
  return new Worker(
    'welcome-messages',
    async (job) => {
      const { creatorId, newSubscriberId } = job.data;

      const template = await prisma.welcomeMessageTemplate.findUnique({
        where: { creatorId },
      });

      if (!template || !template.isEnabled) return;

      // Find or create conversation
      const conv = await findOrCreateConversation(creatorId, newSubscriberId);

      // Send the welcome message
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: creatorId,
          content: template.content,
          type: template.ppvPrice ? 'PPV' : 'TEXT',
          mediaUrls: template.mediaUrls,
          metadata: template.ppvPrice ? { ppvPrice: template.ppvPrice, locked: true } : {},
          status: 'SENT',
        },
      });

      await prisma.welcomeMessageTemplate.update({
        where: { id: template.id },
        data: { sentCount: { increment: 1 } },
      });

      await emitNewMessage(conv.id, {
        /* message data */
      });
    },
    {
      connection: {
        /* redis */
      },
    }
  );
}
```

**Modify:** `src/services/payments/subscriptionService.ts`

After successfully creating a subscription, queue welcome message:

```typescript
import { welcomeMessageQueue } from '@/lib/queues';

// After subscription is created:
await welcomeMessageQueue.add(
  'send',
  {
    creatorId: subscription.creatorId,
    newSubscriberId: subscription.userId,
  },
  { delay: 2000 }
); // Small delay to avoid race condition
```

**Create welcome message settings UI:**

**Modify:** `src/app/(creator)/creator/subscription/page.tsx`

Add a "Welcome Message" section at the bottom of subscription settings using `WelcomeMessageTemplate` form:

```tsx
// Toggle: isEnabled switch
// Content: Textarea (same styling as MessageInput)
// Media: Media upload zone
// PPV price: optional price field
// Preview: shows how the message will look in chat
// Save button: "Save Welcome Message"
```

---

## PHASE 7 — In-Chat Tipping

### 7.1 Add TipButton to MessageInput toolbar

**Modify:** `src/components/messaging/MessageInput.tsx`

The toolbar already has an `add_card` icon — wire it up:

```tsx
const [showTipModal, setShowTipModal] = useState(false)

// In toolbar JSX (already exists in design):
<button
  onClick={() => setShowTipModal(true)}
  className="w-10 h-10 flex items-center justify-center rounded-full
             text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
  title="Send Tip"
>
  <span className="material-symbols-outlined text-xl">add_card</span>
</button>

{showTipModal && (
  <InChatTipModal
    conversationId={conversationId}
    recipientId={otherUserId}
    onSent={(amount, note) => {
      sendTipMessage(amount, note) // creates tip message in thread
      setShowTipModal(false)
    }}
    onClose={() => setShowTipModal(false)}
  />
)}
```

### 7.2 Create `InChatTipModal.tsx`

**Create file:** `src/components/messaging/InChatTipModal.tsx`

```tsx
// Bottom sheet on mobile, centered modal on desktop
// Preset amounts: $5, $10, $25, $50, $100 — pill buttons
// Custom amount: input field
// Optional note: "Add a message..." textarea
// CTA: "Send Tip $XX" bg-primary-container rounded-full font-bold
// Wallet balance shown: "Your balance: $47.20"
// Low balance warning triggers LowBalanceModal (already exists)
```

### 7.3 Tip message type in `MessageBubble.tsx`

When `message.type === 'TIP'`:

```tsx
// Tip message bubble (matches Stitch design exactly):
<div className="flex w-full flex-col items-center py-4">
  <div className="flex w-64 flex-col items-center gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
      <span
        className="material-symbols-outlined text-secondary"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        volunteer_activism
      </span>
    </div>
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-secondary">
        {isMine ? 'You sent a tip' : 'Fan sent a tip'}
      </h4>
      <p className="text-2xl font-black text-on-surface">
        ${(message.metadata as any).amount.toFixed(2)}
      </p>
    </div>
    {(message.metadata as any).note && (
      <p className="text-xs italic text-on-surface-variant">"{(message.metadata as any).note}"</p>
    )}
  </div>
</div>
```

### 7.4 Send tip message API

**Modify:** `src/app/api/tips/route.ts`

After tip transaction is created, also create a conversation message:

```typescript
// After tip is saved, create message in conversation:
if (body.conversationId) {
  await prisma.message.create({
    data: {
      conversationId: body.conversationId,
      senderId: session.user.id,
      content: body.note || '',
      type: 'TIP',
      status: 'SENT',
      metadata: { amount: body.amount, note: body.note, tipId: tip.id },
    },
  });

  await emitNewMessage(body.conversationId, {
    /* tip message */
  });
}
```

---

## PHASE 8 — Voice Messages

### 8.1 Add voice recording to `MessageInput.tsx`

**Modify:** `src/components/messaging/MessageInput.tsx`

```tsx
const [isRecording, setIsRecording] = useState(false);
const [recordingDuration, setRecordingDuration] = useState(0);
const mediaRecorder = useRef<MediaRecorder | null>(null);
const audioChunks = useRef<Blob[]>([]);
const durationTimer = useRef<NodeJS.Timeout>();

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  audioChunks.current = [];

  recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
    await uploadAndSendVoiceMessage(blob, recordingDuration);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  recorder.start();
  mediaRecorder.current = recorder;
  setIsRecording(true);

  durationTimer.current = setInterval(() => {
    setRecordingDuration((d) => {
      if (d >= 120) {
        stopRecording();
        return d;
      } // 2 min max
      return d + 1;
    });
  }, 1000);
};

const stopRecording = () => {
  clearInterval(durationTimer.current);
  mediaRecorder.current?.stop();
};

const uploadAndSendVoiceMessage = async (blob: Blob, duration: number) => {
  // 1. Get upload URL from existing media upload pipeline
  const { uploadUrl, key } = await apiClient.media.getUploadUrl({
    contentType: 'audio/webm',
    purpose: 'voice_message',
  });

  // 2. Upload to S3
  await fetch(uploadUrl, { method: 'PUT', body: blob });

  // 3. Send message with type AUDIO
  await sendMessage({ content: '', type: 'AUDIO', mediaUrls: [key], metadata: { duration } });
};

// In toolbar JSX — mic button becomes recording indicator when active:
{
  isRecording ? (
    <div className="flex flex-1 items-center gap-3">
      <div className="h-2 w-2 animate-pulse rounded-full bg-error" />
      <span className="font-mono text-sm text-error">
        {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
      </span>
      <span className="text-xs text-on-surface-variant">Recording…</span>
      <button
        onClick={stopRecording}
        className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-error text-white"
      >
        <span className="material-symbols-outlined">stop</span>
      </button>
    </div>
  ) : (
    <button
      onClick={startRecording}
      title="Voice message"
      className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-all hover:bg-surface-container hover:text-primary"
    >
      <span className="material-symbols-outlined text-xl">mic</span>
    </button>
  );
}
```

### 8.2 Voice message playback in `MessageBubble.tsx`

**Create file:** `src/components/messaging/VoiceMessagePlayer.tsx`

```tsx
// Custom audio player (do NOT use <audio> element — it's unstyled)
// Uses Web Audio API for waveform + playback

export function VoiceMessagePlayer({ src, duration, isMine }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio(src));

  const toggle = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className={`flex w-64 items-center gap-3 rounded-2xl px-4 py-3 ${isMine ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface'}`}
    >
      {/* Play/Pause */}
      <button
        onClick={toggle}
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isMine ? 'bg-white/20' : 'bg-surface-container-high'}`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Waveform bars (static visual — 24 bars) */}
      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: 24 }).map((_, i) => {
          const height = [
            3, 6, 9, 12, 8, 5, 10, 14, 7, 4, 11, 9, 6, 13, 8, 5, 9, 12, 7, 4, 10, 8, 6, 3,
          ][i];
          const isActive = i / 24 < currentTime / duration;
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                isActive
                  ? isMine
                    ? 'bg-white'
                    : 'bg-primary-container'
                  : isMine
                    ? 'bg-white/30'
                    : 'bg-surface-container-high'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span
        className={`flex-shrink-0 font-mono text-[10px] ${isMine ? 'text-white/70' : 'text-on-surface-variant'}`}
      >
        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
      </span>
    </div>
  );
}
```

---

## PHASE 9 — Message Reactions

### 9.1 Reaction API route

**Create file:** `src/app/api/messages/[id]/reactions/route.ts`

```typescript
// POST — add reaction { emoji: string }
// DELETE — remove reaction { emoji: string }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { emoji } = await req.json();
  const session = await getServerSession(authOptions);

  const reaction = await prisma.messageReaction.upsert({
    where: {
      messageId_userId_emoji: { messageId: params.id, userId: session.user.id, emoji },
    },
    create: { messageId: params.id, userId: session.user.id, emoji },
    update: {},
  });

  // Get conversationId from message, then emit
  const msg = await prisma.message.findUnique({
    where: { id: params.id },
    select: { conversationId: true, senderId: true },
  });

  await emitNewMessage(msg!.conversationId, {
    type: 'reaction',
    messageId: params.id,
    userId: session.user.id,
    emoji,
    action: 'add',
  });

  return Response.json(reaction);
}
```

### 9.2 Reaction UI in `MessageBubble.tsx`

```tsx
// Add reaction picker on long-press / right-click / hover (desktop: hover button)
const REACTION_EMOJIS = ['❤️', '🔥', '💰', '😍', '👏', '😂'];

// Reaction picker (shows on hover, above the bubble):
{
  showPicker && (
    <div
      className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-10 z-10 flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 shadow-modal`}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => addReaction(message.id, emoji)}
          className="text-lg transition-transform hover:scale-125 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Reaction pills (below bubble):
{
  message.reactions && message.reactions.length > 0 && (
    <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {groupedReactions.map(({ emoji, count, includingMe }) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(message.id, emoji)}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all ${
            includingMe
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-surface-container-high bg-surface-container text-on-surface-variant'
          }`}
        >
          <span>{emoji}</span>
          <span className="font-bold">{count}</span>
        </button>
      ))}
    </div>
  );
}
```

### 9.3 Real-time reaction sync in `useMessages.ts`

```typescript
socket.on('message:reaction', ({ messageId, userId, emoji, action }) => {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions || [];
      if (action === 'add') {
        return { ...m, reactions: [...reactions, { userId, emoji }] };
      } else {
        return {
          ...m,
          reactions: reactions.filter((r) => !(r.userId === userId && r.emoji === emoji)),
        };
      }
    })
  );
});
```

---

## PHASE 10 — Infrastructure Hardening

### 10.1 Redis-backed unread counts

**Create file:** `src/lib/messaging/unreadCountService.ts`

```typescript
import { redis } from '@/lib/redis/redisClient';

const UNREAD_KEY = (userId: string, convId: string) => `unread:${userId}:${convId}`;
const TOTAL_UNREAD_KEY = (userId: string) => `unread_total:${userId}`;

export async function incrementUnread(recipientId: string, conversationId: string) {
  const key = UNREAD_KEY(recipientId, conversationId);
  await redis.incr(key);
  await redis.incr(TOTAL_UNREAD_KEY(recipientId));
}

export async function clearUnread(userId: string, conversationId: string) {
  const key = UNREAD_KEY(userId, conversationId);
  const count = parseInt((await redis.get(key)) || '0');
  if (count > 0) {
    await redis.del(key);
    await redis.decrby(TOTAL_UNREAD_KEY(userId), count);
  }
}

export async function getTotalUnread(userId: string): Promise<number> {
  const val = await redis.get(TOTAL_UNREAD_KEY(userId));
  return parseInt(val || '0');
}

export async function getConversationUnread(
  userId: string,
  conversationId: string
): Promise<number> {
  const val = await redis.get(UNREAD_KEY(userId, conversationId));
  return parseInt(val || '0');
}
```

**Modify:** `src/app/api/notifications/unread-count/route.ts`

Replace DB query with Redis lookup:

```typescript
import { getTotalUnread } from '@/lib/messaging/unreadCountService';
const count = await getTotalUnread(session.user.id);
return Response.json({ count });
```

**Modify:** `src/app/api/conversations/[id]/read/route.ts`

After marking DB read, also clear Redis counter:

```typescript
import { clearUnread } from '@/lib/messaging/unreadCountService';
await clearUnread(session.user.id, params.id);
```

**Modify message send service:** After creating a message, increment Redis unread for recipient:

```typescript
import { incrementUnread } from '@/lib/messaging/unreadCountService';
const recipientId = await getOtherParticipant(conversationId, senderId);
await incrementUnread(recipientId, conversationId);
```

### 10.2 Fan tag auto-assignment via cron

**Modify:** `src/app/api/cron/daily-tasks/route.ts`

Add automatic fan tagging:

```typescript
// Auto-apply "High Spender" tags
const creators = await prisma.user.findMany({ where: { creator: { isNot: null } } });

for (const creator of creators) {
  const topSpendThreshold = 100; // $100 lifetime

  // Find fans who spent > threshold and don't have the tag
  const highSpenders = await prisma.transaction.groupBy({
    by: ['userId'],
    where: { creatorId: creator.id },
    having: { amount: { _sum: { gte: topSpendThreshold } } },
  });

  // Get or create "High Spender" tag
  let tag = await prisma.fanTag.upsert({
    where: { creatorId_label: { creatorId: creator.id, label: 'High Spender' } },
    create: { creatorId: creator.id, label: 'High Spender', color: '#e0245e', isAutomatic: true },
    update: {},
  });

  // Assign tag to qualifying fans
  for (const { userId } of highSpenders) {
    await prisma.fanTagAssignment.upsert({
      where: { tagId_fanId: { tagId: tag.id, fanId: userId } },
      create: { tagId: tag.id, fanId: userId },
      update: {},
    });
  }
}
```

---

## UI COMPONENTS REFERENCE (from Stitch Design)

Apply these exact styles to match the "Daylight Premium" design system:

### Message Bubble — Received

```
bg-surface-container-lowest rounded-[18px] rounded-bl-[4px]
shadow-sm border border-surface-container
max-w-[70%] p-4 text-sm leading-relaxed
```

### Message Bubble — Sent

```
bg-primary text-on-primary rounded-[18px] rounded-br-[4px]
shadow-lg shadow-primary/10
max-w-[70%] p-4 text-sm leading-relaxed ml-auto
```

### PPV Locked Card

```
// Outer:
bg-surface-container-lowest rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl w-[320px]

// Blurred preview area:
relative h-48 bg-neutral-900 overflow-hidden
// Blurred image inside: absolute inset-0 opacity-40 blur-xl scale-110
// Lock overlay: absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white

// Action footer:
p-5 flex flex-col gap-3
// Unlock button: w-full py-3 bg-primary text-on-primary rounded-full font-bold text-sm
```

### Conversation List Item — Active

```
px-6 py-4 bg-primary-fixed/30 border-l-4 border-primary cursor-pointer flex gap-4
Avatar: w-14 h-14 rounded-full object-cover
Online dot: absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full
Name: font-bold text-sm
Last message: text-xs font-semibold text-on-surface (bold = unread)
Timestamp: text-[10px] font-medium text-on-surface-variant/60
```

### Conversation List Item — Inactive

```
px-6 py-4 hover:bg-surface-container-low cursor-pointer flex gap-4 border-l-4 border-transparent
Name: font-bold text-sm
Last message: text-xs text-on-surface-variant
```

### Chat Header

```
h-20 flex items-center justify-between px-8
border-b border-surface-container-high
sticky top-0 bg-white/80 backdrop-blur-xl z-10
Send Tip button: px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold
                 shadow-lg shadow-primary/20 flex items-center gap-2
```

### Message Input Footer

```
// Outer:
p-6 bg-white border-t border-surface-container-high space-y-4

// Toolbar row:
flex gap-1
// Each icon button: w-10 h-10 flex items-center justify-center rounded-full
//   text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all

// Divider between attachment and monetisation icons:
w-px h-6 bg-surface-container my-auto mx-2

// Input container:
flex items-center gap-4 bg-surface-container-low p-2 pr-3 rounded-2xl

// Textarea:
flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none no-scrollbar
placeholder:text-on-surface-variant/50

// Send button:
w-10 h-10 bg-primary text-on-primary rounded-full
flex items-center justify-center shadow-lg shadow-primary/30
hover:scale-105 active:scale-90 transition-all
```

### Date Separator

```
flex justify-center
// Pill: px-4 py-1 bg-surface-container text-[10px] font-bold text-on-surface-variant
//        rounded-full uppercase tracking-tighter
```

---

## FINAL VERIFICATION CHECKLIST

After implementing all phases, verify:

**Phase 0–1 (Core Transport):**

- [ ] WebSocket server starts on port 3001
- [ ] Next.js app connects to WS on page load
- [ ] Messages appear in real-time without polling
- [ ] SSE route is no longer the primary transport

**Phase 2 (Presence & Typing):**

- [ ] Online dot appears/disappears correctly
- [ ] Typing indicator appears within 500ms of keystroke
- [ ] Typing indicator disappears after 3s of inactivity
- [ ] Read receipt (blue double tick) updates without refresh

**Phase 3 (Reliability):**

- [ ] Messages appear instantly (optimistic) when sent
- [ ] "Tap to retry" appears on failed sends
- [ ] No duplicate messages on fast-send + reconnect

**Phase 4 (Broadcasting):**

- [ ] Broadcast composer opens from Messages header
- [ ] Audience segment shows estimated reach count
- [ ] BullMQ worker processes in batches without OOM
- [ ] Progress bar updates in real-time during send
- [ ] Scheduled broadcasts fire from cron

**Phase 5 (PPV Broadcasts):**

- [ ] PPV unlock inside DM records BroadcastPurchase
- [ ] Analytics card shows conversion rate correctly

**Phase 6 (Fan CRM):**

- [ ] Fan profile sidebar visible to creators only
- [ ] Welcome message fires on new subscription
- [ ] Tag auto-assignment runs in daily cron

**Phase 7 (Tipping):**

- [ ] Tip modal shows wallet balance
- [ ] Tip message renders as special card in thread
- [ ] Both sender and recipient see the tip card

**Phase 8 (Voice):**

- [ ] Mic button requests permission correctly
- [ ] 2-minute recording limit enforced
- [ ] Waveform player shows playback progress

**Phase 9 (Reactions):**

- [ ] Emoji picker appears on hover (desktop) / long-press (mobile)
- [ ] Reaction counts update in real-time for both users
- [ ] Mine = highlighted, others = neutral

**Phase 10 (Infrastructure):**

- [ ] Unread count badge in sidebar uses Redis (fast)
- [ ] Opening conversation clears Redis counter
- [ ] High Spender tags auto-apply after daily cron

```

```
