import { redisPub } from '@/lib/redis/redisClient';
import { jsonSafeReplacer } from '@/lib/serialization/jsonSafe';

type WsPublishPayload = {
  event: string;
  room: string;
  data: unknown;
};

const CHANNEL = 'ws:events';

export async function emitNewMessageToUser(
  userId: string,
  conversationId: string,
  message: unknown
) {
  const payload: WsPublishPayload = {
    event: 'message:new',
    room: `user:${userId}`,
    data: message,
  };
  await redisPub.publish(CHANNEL, JSON.stringify(payload, jsonSafeReplacer));
}

export async function emitMessageUnlockedToUser(
  userId: string,
  conversationId: string,
  message: unknown
) {
  const payload: WsPublishPayload = {
    event: 'message:unlocked',
    room: `user:${userId}`,
    data: message,
  };
  await redisPub.publish(CHANNEL, JSON.stringify(payload, jsonSafeReplacer));
}

export async function emitMessageReaction(conversationId: string, reaction: unknown) {
  const payload: WsPublishPayload = {
    event: 'message:reaction',
    room: `conv:${conversationId}`,
    data: reaction,
  };
  await redisPub.publish(CHANNEL, JSON.stringify(payload, jsonSafeReplacer));
}

export async function emitConversationUpdated(
  userId: string,
  conversationId: string,
  preview: { content: string | null; createdAt: Date | string },
  unreadCount: number
) {
  const payload: WsPublishPayload = {
    event: 'conversation:updated',
    room: `user:${userId}`,
    data: { conversationId, lastMessage: preview, unreadCount },
  };
  await redisPub.publish(CHANNEL, JSON.stringify(payload, jsonSafeReplacer));
}

export async function emitNotificationCountUpdate(userId: string) {
  const payload: WsPublishPayload = {
    event: 'notification:count',
    room: `user:${userId}`,
    data: {},
  };
  await redisPub.publish(CHANNEL, JSON.stringify(payload, jsonSafeReplacer));
}
