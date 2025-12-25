/**
 * Message Event Emitter
 *
 * Simple in-memory event emitter for real-time message broadcasting
 * In production, this could be replaced with Redis pub/sub or Pusher
 */

type MessageEventListener = (_data: unknown) => void;

class MessageEventEmitter {
  private listeners: Map<string, Set<MessageEventListener>> = new Map();

  /**
   * Subscribe to events for a conversation
   */
  subscribe(conversationId: string, listener: MessageEventListener): () => void {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, new Set());
    }
    this.listeners.get(conversationId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const conversationListeners = this.listeners.get(conversationId);
      if (conversationListeners) {
        conversationListeners.delete(listener);
        if (conversationListeners.size === 0) {
          this.listeners.delete(conversationId);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers of a conversation
   */
  emit(conversationId: string, data: unknown): void {
    const conversationListeners = this.listeners.get(conversationId);
    if (conversationListeners) {
      conversationListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in message event listener:', error);
        }
      });
    }
  }

  /**
   * Emit to multiple conversations (e.g., conversation list update)
   */
  emitToConversations(conversationIds: string[], data: unknown): void {
    conversationIds.forEach((id) => this.emit(id, data));
  }

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(conversationId: string): number {
    return this.listeners.get(conversationId)?.size ?? 0;
  }
}

// Singleton instance
export const messageEmitter = new MessageEventEmitter();
