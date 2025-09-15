import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HuWukzpkiHype611dKpaOeaG8bR7obOPKdaOYpvLS0wdK2K5OiKrq4mVEY';

interface NotificationSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const useSupabasePushNotifications = () => {
  const { profile } = useRole();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(isSupported);
      setPermission(Notification.permission);
    };

    checkSupport();
  }, []);

  // Check existing subscription on mount
  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!isSupported || !profile?.operator_id) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          // Check if subscription exists in database
          const { data, error } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('operator_id', profile.operator_id)
            .eq('endpoint', existingSubscription.endpoint)
            .single();

          setSubscription(!error && !!data);
        } else {
          setSubscription(false);
        }
      } catch (error) {
        console.error('Error checking existing subscription:', error);
        setSubscription(false);
      }
    };

    checkExistingSubscription();
  }, [isSupported, profile?.operator_id]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !profile?.operator_id) {
      console.log('Push notifications not supported or no operator ID');
      return false;
    }

    setIsLoading(true);
    
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await registration.update();
      
      // Wait for service worker to be ready
      const readyRegistration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const pushSubscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      // Extract keys from subscription
      const p256dh = btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!)));

      // Save subscription to Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          operator_id: profile.operator_id,
          endpoint: pushSubscription.endpoint,
          p256dh_key: p256dh,
          auth_key: auth
        }, {
          onConflict: 'operator_id'
        });

      if (error) {
        console.error('Error saving subscription to Supabase:', error);
        return false;
      }

      console.log('Successfully subscribed to push notifications');
      setSubscription(true);
      return true;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, profile?.operator_id]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!profile?.operator_id) return false;

    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Remove from Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('operator_id', profile.operator_id);

      if (error) {
        console.error('Error removing subscription from Supabase:', error);
        return false;
      }

      console.log('Successfully unsubscribed from push notifications');
      setSubscription(false);
      return true;

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [profile?.operator_id]);

  const sendPushNotification = useCallback(async (
    operatorId: string,
    title: string,
    body: string,
    options?: {
      eventId?: string;
      shiftId?: string;
      type?: string;
    }
  ): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          operatorId,
          title,
          body,
          type: options?.type || 'general',
          eventId: options?.eventId,
          shiftId: options?.shiftId
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
        throw error;
      }

      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    subscription,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendPushNotification
  };
};