import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';

// VAPID public key (in a real app, this would be from environment variables)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HuWukzpkiHype611dKpaOeaG8bR7obOPKdaOYpvLS0wdK2K5OiKrq4mVEY';

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  const { 
    currentOperatorId, 
    addNotificationSubscription,
    getNotificationSubscription,
    updateNotificationPreferences 
  } = useAppStore();

  // Check if push notifications are supported
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
    throw new Error('Service Worker not supported');
  };

  // Convert VAPID key for subscription
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Check for existing subscription
  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          
          // Save subscription to store if current operator
          if (currentOperatorId) {
            addNotificationSubscription(currentOperatorId, {
              endpoint: existingSubscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(existingSubscription.getKey('p256dh')!))),
                auth: btoa(String.fromCharCode(...new Uint8Array(existingSubscription.getKey('auth')!))),
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Request permission and subscribe
  const subscribe = useCallback(async () => {
    if (!isSupported || !currentOperatorId) {
      toast({
        title: "Errore",
        description: "Notifiche push non supportate o operatore non selezionato",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast({
          title: "Permesso negato",
          description: "Le notifiche push sono state disabilitate",
          variant: "destructive"
        });
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(pushSubscription);

      // Save subscription to store
      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!))),
        }
      };

      addNotificationSubscription(currentOperatorId, subscriptionData);
      updateNotificationPreferences(currentOperatorId, {
        shiftAssignment: true,
        shiftUpdates: true,
        shiftCancellation: true
      });

      toast({
        title: "Notifiche attivate",
        description: "Riceverai notifiche per i tuoi turni",
      });

      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      toast({
        title: "Errore sottoscrizione",
        description: "Impossibile attivare le notifiche push",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, currentOperatorId, addNotificationSubscription, updateNotificationPreferences]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription || !currentOperatorId) return false;

    setIsLoading(true);
    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Update preferences in store
      updateNotificationPreferences(currentOperatorId, {
        shiftAssignment: false,
        shiftUpdates: false,
        shiftCancellation: false
      });

      toast({
        title: "Notifiche disattivate",
        description: "Non riceverai più notifiche push",
      });

      return true;
    } catch (error) {
      console.error('Unsubscription failed:', error);
      toast({
        title: "Errore",
        description: "Impossibile disattivare le notifiche",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, currentOperatorId, updateNotificationPreferences]);

  // Send push notification (mock for demo)
  const sendPushNotification = useCallback(async (operatorId: string, title: string, body: string, url?: string) => {
    const subscriptionData = getNotificationSubscription(operatorId);
    if (!subscriptionData) {
      console.warn('No subscription found for operator:', operatorId);
      return;
    }

    // In a real app, this would call your backend API
    // For demo purposes, we'll simulate a notification after a delay
    setTimeout(() => {
      if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: { url, operatorId }
        });
      });
      }
    }, 1000);
  }, [getNotificationSubscription]);

  return {
    isSupported,
    subscription: !!subscription,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendPushNotification
  };
};