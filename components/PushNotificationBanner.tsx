'use client';

import { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationBanner({ memberId }: { memberId: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });
      setSubscription(sub);

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, memberId })
      });
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported || subscription) return null;

  return (
    <div className="bg-[#3584E4]/10 border-b border-[#3584E4]/20 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-start gap-2">
        <BellRing className="w-4 h-4 text-[#3584E4] shrink-0 mt-0.5" />
        <p className="text-xs text-[#1E1E1E] dark:text-white/90">
          Recibe notificaciones de tareas en este dispositivo.
        </p>
      </div>
      <button
        onClick={subscribeToPush}
        disabled={loading}
        className="shrink-0 bg-[#3584E4] text-white text-[10px] font-bold px-2.5 py-1.5 rounded hover:bg-[#1C71D8] transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Activar'}
      </button>
    </div>
  );
}
