/**
 * Real-time Messages Hook (SSE-based)
 *
 * Uses Server-Sent Events for real-time message updates instead of polling
 */

import { useEffect, useRef, useState, useCallback } from 'react';

import { apiClient } from '@/services/apiClient';
import type { Message } from '@/types/messaging';

interface SSEEvent {
  type: string;
  data?: unknown;
  error?: string;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!conversationId) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const eventSource = new EventSource(`/api/conversations/${conversationId}/messages/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        reconnectAttempts.current = 0;
        setIsLoading(false);
        setIsError(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);

          switch (sseEvent.type) {
            case 'connected':
              // Connection established
              break;

            case 'initial':
              if (sseEvent.data && typeof sseEvent.data === 'object' && 'items' in sseEvent.data) {
                const data = sseEvent.data as { items: Message[]; nextCursor?: string };
                setMessages(data.items || []);
              }
              setIsLoading(false);
              break;

            case 'message':
            case 'newMessage': {
              // New message received
              if (sseEvent.data && typeof sseEvent.data === 'object') {
                const newMessage = sseEvent.data as Message;
                // Ensure required fields exist
                if (newMessage.id && newMessage.senderId && newMessage.createdAt) {
                  setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some((m) => m.id === newMessage.id)) {
                      return prev;
                    }
                    // Sort messages by createdAt
                    const updated = [...prev, newMessage].sort(
                      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                    return updated;
                  });
                }
              }
              break;
            }

            case 'message_unlocked':
            case 'messageUnlocked': {
              // Message unlocked - update existing message
              if (sseEvent.data && typeof sseEvent.data === 'object' && 'id' in sseEvent.data) {
                const unlockedData = sseEvent.data as {
                  id: string;
                  content?: string | null;
                  media?: unknown[];
                  isLocked?: boolean;
                };
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === unlockedData.id
                      ? {
                          ...msg,
                          content: unlockedData.content ?? msg.content,
                          media: unlockedData.media as Message['media'],
                          isLocked: false,
                        }
                      : msg
                  )
                );
              }
              break;
            }

            case 'heartbeat':
              // Keep-alive, no action needed
              break;

            case 'error':
              console.error('SSE error:', sseEvent.error);
              setIsError(true);
              break;

            default:
              // Unknown event type, ignore
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        setIsError(true);
        setIsLoading(false);
        eventSource.close();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts.current);
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setIsError(true);
      setIsLoading(false);
    }
  }, [conversationId]);

  // Initialize connection
  useEffect(() => {
    if (conversationId) {
      connect();
    }

    // Cleanup on unmount or conversation change
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [conversationId, connect]);

  const sendMessage = async (content: string | null, mediaId?: string, price?: number) => {
    if (!conversationId) throw new Error('No conversation ID');

    try {
      await apiClient.messaging.sendMessage(conversationId, content, mediaId, price);
      // Message will be received via SSE, no need to manually refresh
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const unlockMessage = async (messageId: string) => {
    try {
      await apiClient.messaging.unlockMessage(messageId);
      // Message update will be received via SSE
      // No need to manually refresh, SSE will handle it
    } catch (err) {
      console.error('Error unlocking message:', err);
      throw err;
    }
  };

  const mutate = useCallback(async () => {
    // Manual refresh: fetch latest messages and update state
    if (!conversationId) return;
    try {
      const data = await apiClient.messaging.listMessages(conversationId);
      setMessages(data.items || []);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    isError,
    mutate,
    sendMessage,
    unlockMessage,
  };
}
