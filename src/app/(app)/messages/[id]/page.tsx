'use client';

import { useParams } from 'next/navigation';

import { ChatWindow } from '@/components/messaging/ChatWindow';

export default function ConversationPage() {
  const params = useParams();
  const id = params?.['id'] as string;

  if (!id) return null;

  return <ChatWindow conversationId={id} />;
}
