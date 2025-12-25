/**
 * Server-Sent Events (SSE) endpoint for real-time message streaming
 *
 * Replaces polling with real-time updates
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { messageEmitter } from '@/lib/realtime/messageEmitter';
import { MessageService } from '@/services/messaging/messageService';

const messageService = new MessageService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id: conversationId } = await params;

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      send('data: {"type":"connected"}\n\n');

      // Set up event listener for new messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unsubscribe = messageEmitter.subscribe(conversationId, (eventData: any) => {
        // Send the event data as SSE message
        // Only forward events that are objects with a type property
        if (eventData && typeof eventData === 'object' && 'type' in eventData) {
          const data = JSON.stringify(eventData);
          send(`data: ${data}\n\n`);
        }
      });

      // Send initial message list
      try {
        const initialMessages = await messageService.list(session.user.id, conversationId);
        send(`data: ${JSON.stringify({ type: 'initial', data: initialMessages })}\n\n`);
      } catch (error) {
        console.error('Error fetching initial messages:', error);
        send(`data: ${JSON.stringify({ type: 'error', error: 'Failed to load messages' })}\n\n`);
      }

      // Keep connection alive with periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        send('data: {"type":"heartbeat"}\n\n');
      }, 30000); // Every 30 seconds

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Connection already closed
        }
      });

      // Also handle client disconnect (connection close)
      // Note: This is a best-effort cleanup, actual cleanup happens via abort signal
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}
