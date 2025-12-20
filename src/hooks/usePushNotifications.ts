'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { apiClient } from '@/services/apiClient';

export function usePushNotifications() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if service workers and push are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      void checkSubscription();
      void fetchVapidKey();
    }
  }, [session]);

  const fetchVapidKey = async () => {
    try {
      const response = await apiClient.push.getVapidKey();
      if (response.publicKey) {
        setVapidPublicKey(response.publicKey);
      }
    } catch (error) {
      console.error('Failed to fetch VAPID key:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || !vapidPublicKey || !session?.user?.id) {
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!) as unknown as BufferSource,
      });

      // Send subscription to server
      await apiClient.push.subscribe({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported || !session?.user?.id) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Notify server
        await apiClient.push.unsubscribe(subscription.endpoint);

        setIsSubscribed(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window.btoa(binary);
}
