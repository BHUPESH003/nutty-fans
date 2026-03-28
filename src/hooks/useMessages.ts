/**
 * Real-time Messages Hook (Socket.IO-based)
 *
 * Uses Socket.IO events for real-time message updates instead of SSE.
 */

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

import { apiClient } from '@/services/apiClient';
import type { Message } from '@/types/messaging';

let sharedSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!sharedSocket) {
    const envWsUrl = process.env['NEXT_PUBLIC_WS_URL'];
    const wsPort = process.env['NEXT_PUBLIC_WS_PORT'] ?? '3001';
    const wsUrl =
      envWsUrl ??
      (typeof window !== 'undefined' ? `http://${window.location.hostname}:${wsPort}` : null);

    if (!wsUrl) throw new Error('Missing NEXT_PUBLIC_WS_URL (and window is unavailable)');

    sharedSocket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  return sharedSocket;
}

const OPTIMISTIC_PREFIX = 'optimistic-';

function cursorKey(conversationId: string) {
  return `msg_cursor_${conversationId}`;
}

function safeLoadCursor(conversationId: string): string | undefined {
  try {
    const val = window.localStorage.getItem(cursorKey(conversationId));
    return val || undefined;
  } catch {
    return undefined;
  }
}

function safeSaveCursor(conversationId: string, messageId: string) {
  try {
    window.localStorage.setItem(cursorKey(conversationId), messageId);
  } catch {
    // Ignore persistence failures (blocked storage, privacy mode, etc.).
  }
}

export function useMessages(conversationId: string | null) {
  const { data: session } = useSession();
  const myUserId = session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    setIsLoading(true);
    setIsError(false);

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit('conversation:join', conversationId);
    };

    const handleMessageNew = (msg: unknown) => {
      if (!msg || typeof msg !== 'object') return;

      const m = msg as Partial<Message> & {
        id?: string;
        senderId?: string;
        clientId?: string;
        conversationId?: string;
      };
      if (!m.id || !m.senderId) return;
      if (m.conversationId && m.conversationId !== conversationId) return;

      setMessages((prev) => {
        // If this message corresponds to an optimistic placeholder, replace it in-place.
        if (m.clientId) {
          const existingByClientId = prev.find((p) => p.clientId === m.clientId);
          if (existingByClientId) {
            return [...prev.map((p) => (p.id === existingByClientId.id ? (m as Message) : p))].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
        }

        // Normal dedup by message id.
        if (prev.some((existing) => existing.id === m.id)) return prev;

        const updated = [...prev, m as Message].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return updated;
      });

      // Mark delivered for messages we didn't send.
      if (myUserId && m.senderId !== myUserId) {
        socket.emit('message:delivered', { messageId: m.id });
      }
    };

    const handleMessageUnlocked = (msg: unknown) => {
      if (!msg || typeof msg !== 'object') return;

      const m = msg as Partial<Message> & { id?: string };
      if (!m.id) return;

      setMessages((prev) =>
        prev.map((existing) =>
          existing.id === m.id
            ? {
                ...existing,
                content: (m.content ?? existing.content) as Message['content'],
                media: m.media as Message['media'],
                isLocked: false,
              }
            : existing
        )
      );
    };

    const handleMessageDelivered = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const d = data as { messageId?: string; deliveredAt?: string };
      if (!d.messageId || !d.deliveredAt) return;

      setMessages((prev) =>
        prev.map((existing) =>
          existing.id === d.messageId
            ? {
                ...existing,
                status: 'DELIVERED',
                deliveredAt: d.deliveredAt,
              }
            : existing
        )
      );
    };

    const handleMessageRead = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const d = data as { conversationId?: string; readBy?: string; readAt?: string };
      if (!d.conversationId || d.conversationId !== conversationId) return;
      if (!d.readAt) return;
      if (!myUserId) return;

      setMessages((prev) =>
        prev.map((existing) =>
          existing.senderId === myUserId
            ? {
                ...existing,
                status: 'READ',
                isRead: true,
                readAt: d.readAt,
              }
            : existing
        )
      );
    };

    const handleMessageReaction = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const d = data as { messageId?: string; emoji?: string; userId?: string; action?: string };
      if (!d.messageId || !d.emoji || !d.userId) return;

      const reactionUserId = d.userId as string;
      const reactionEmoji = d.emoji as string;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== d.messageId) return m;

          const reactions = m.reactions ?? [];
          const has = reactions.some(
            (r) => r.userId === reactionUserId && r.emoji === reactionEmoji
          );

          if (d.action === 'removed') {
            return {
              ...m,
              reactions: reactions.filter(
                (r) => !(r.userId === reactionUserId && r.emoji === reactionEmoji)
              ),
            };
          }

          if (has) return m;
          return {
            ...m,
            reactions: [...reactions, { userId: reactionUserId, emoji: reactionEmoji }],
          };
        })
      );
    };

    const handleConnectError = (err: unknown) => {
      console.error('[WS] connect_error:', err);
      setIsError(true);
      setIsLoading(false);
    };

    const storedCursor = safeLoadCursor(conversationId);

    void apiClient.messaging
      .listMessages(conversationId, storedCursor)
      .then((data) => {
        const items = data.items || [];
        // Keep consistent ascending render order.
        const sorted = [...items].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages(sorted);
        setIsLoading(false);

        if (myUserId) {
          socket.emit('message:read', { conversationId });
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        setIsError(true);
        setIsLoading(false);
      });

    socket.on('connect', handleConnect);
    socket.on('message:new', handleMessageNew);
    socket.on('message:unlocked', handleMessageUnlocked);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('message:read', handleMessageRead);
    socket.on('message:reaction', handleMessageReaction);
    socket.on('connect_error', handleConnectError);

    // Ensure we join immediately if the socket is already connected.
    if (socket.connected) socket.emit('conversation:join', conversationId);

    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('connect', handleConnect);
      socket.off('message:new', handleMessageNew);
      socket.off('message:unlocked', handleMessageUnlocked);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('message:read', handleMessageRead);
      socket.off('message:reaction', handleMessageReaction);
      socket.off('connect_error', handleConnectError);
    };
  }, [conversationId, myUserId]);

  // Phase 3: persist a message cursor for conversation resumption.
  useEffect(() => {
    if (!conversationId) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last?.id) return;
    if (last.id.startsWith(OPTIMISTIC_PREFIX)) return;
    safeSaveCursor(conversationId, String(last.id));
  }, [conversationId, messages]);

  const sendMessageWithClientId = useCallback(
    async (args: {
      content: string | null;
      mediaId?: string;
      price?: number;
      clientId: string;
      metadata?: Record<string, unknown>;
      messageTypeOverride?: Message['messageType'];
    }) => {
      if (!conversationId) throw new Error('No conversation ID');
      if (!myUserId) throw new Error('No authenticated user');

      const { content, mediaId, price, clientId, metadata, messageTypeOverride } = args;
      const tempId = `${OPTIMISTIC_PREFIX}${clientId}`;

      // Optimistic placeholder for immediate UI feedback.
      const messageType: Message['messageType'] = messageTypeOverride
        ? messageTypeOverride
        : mediaId
          ? 'media'
          : price && price > 0
            ? 'ppv'
            : 'text';

      const isPpv = messageType === 'ppv';
      const isTip = messageType === 'tip';
      const isPaid = isTip ? true : isPpv ? Boolean(price && price > 0) : false;
      const ppvPrice = isPpv ? (price ?? null) : null;

      const optimistic: Message = {
        id: tempId,
        clientId,
        conversationId,
        senderId: myUserId,
        content,
        createdAt: new Date().toISOString(),
        messageType,
        ppvPrice,
        isPaid,
        isLocked: false,
        isRead: false,
        media: [],
        status: 'SENDING',
        metadata,
      };

      setMessages((prev) => {
        // Replace any existing optimistic placeholder for the same clientId.
        const withoutOld = prev.filter((m) => m.clientId !== clientId);
        const sorted = [...withoutOld, optimistic].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return sorted;
      });

      try {
        await apiClient.messaging.sendMessage(
          conversationId,
          content,
          mediaId,
          price,
          clientId,
          metadata,
          messageTypeOverride
        );
        // Real state will be reconciled by `message:new` (server) event.
      } catch (err) {
        // Mark as failed so UI can offer retry.
        setMessages((prev) =>
          prev.map((m) => (m.clientId === clientId ? { ...m, status: 'FAILED' } : m))
        );
        throw err;
      }
    },
    [conversationId, myUserId]
  );

  const sendMessage = useCallback(
    async (
      content: string | null,
      mediaId?: string,
      price?: number,
      options?: { messageTypeOverride?: Message['messageType']; metadata?: Record<string, unknown> }
    ) => {
      if (!myUserId) throw new Error('No authenticated user');
      // Prefer browser UUID; fallback for older environments.
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      await sendMessageWithClientId({
        content,
        mediaId,
        price,
        clientId: id,
        metadata: options?.metadata,
        messageTypeOverride: options?.messageTypeOverride,
      });
    },
    [sendMessageWithClientId, myUserId]
  );

  const retryMessage = useCallback(
    async (message: Message) => {
      if (!message.clientId) throw new Error('Missing clientId for retry');

      await sendMessageWithClientId({
        content: message.content,
        mediaId: message.media?.[0]?.id,
        price: message.ppvPrice ?? undefined,
        clientId: message.clientId,
        metadata: message.metadata,
        messageTypeOverride: message.messageType,
      });
    },
    [sendMessageWithClientId]
  );

  const unlockMessage = useCallback(async (messageId: string) => {
    await apiClient.messaging.unlockMessage(messageId);
    // State update happens via `message:unlocked` events.
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    await apiClient.messaging.toggleReaction(messageId, emoji);
    // State updates via `message:reaction` WS event.
  }, []);

  const mutate = useCallback(async () => {
    if (!conversationId) return;
    const data = await apiClient.messaging.listMessages(conversationId);
    setMessages(data.items || []);
  }, [conversationId]);

  return {
    messages,
    isLoading,
    isError,
    mutate,
    sendMessage,
    unlockMessage,
    retryMessage,
    reactToMessage,
  };
}
