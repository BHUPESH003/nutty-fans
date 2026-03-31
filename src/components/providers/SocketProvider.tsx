'use client';

import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { destroySocket, initSocket } from '@/hooks/useMessages';

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      void initSocket().catch((err) => {
        console.error('[WS] Socket initialization failed:', err);
      });
      return;
    }

    if (status === 'unauthenticated') {
      destroySocket();
    }
  }, [status]);

  return <>{children}</>;
}
