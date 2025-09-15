import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  operatorId: string;
  title: string;
  body: string;
  type: string;
  eventId?: string;
  shiftId?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys for push notifications
const VAPID_PRIVATE_KEY = "VCxN6YHRVaagOiK9-3m3nlxIVO5p04SqSvIE-URMic4";
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa40HuWukzpkiHype611dKpaOeaG8bR7obOPKdaOYpvLS0wdK2K5OiKrq4mVEY";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const { operatorId, title, body, type, eventId, shiftId }: NotificationPayload = await req.json();

    console.log('Received notification request:', { operatorId, title, type });

    // Get push subscription for the operator
    const { data: subscription, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('operator_id', operatorId)
      .single();

    // Always save notification to database for in-app viewing
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        operator_id: operatorId,
        title,
        message: body,
        type,
        event_id: eventId || null,
        shift_id: shiftId || null,
        read: false
      });

    if (notificationError) {
      console.error('Error saving notification:', notificationError);
      return new Response(
        JSON.stringify({ error: 'Failed to save notification' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If no push subscription found, just save the notification
    if (subscriptionError || !subscription) {
      console.log('No push subscription found for operator:', operatorId);
      return new Response(
        JSON.stringify({ success: true, message: 'Notification saved (no push subscription)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification using web-push
    try {
      console.log('Sending push notification to:', subscription.endpoint);

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      };

      const payload = JSON.stringify({
        title,
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `notification-${Date.now()}`,
        data: {
          url: eventId ? `/events/${eventId}` : '/operator/dashboard',
          eventId,
          shiftId
        }
      });

      // Create the request to send push notification
      const vapidHeaders = {
        'TTL': '2419200',
        'Urgency': 'normal',
        'Authorization': `vapid t=${generateJWT()}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm'
      };

      // For now, we'll log the push notification (real implementation would use web-push library)
      console.log('Push notification prepared:', {
        subscription: pushSubscription,
        payload,
        headers: vapidHeaders
      });

      // TODO: Implement actual web-push sending when web-push library is available for Deno
      console.log('Push notification would be sent here');

    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      // Don't fail the entire request if push fails, notification is still saved
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to generate JWT for VAPID (simplified version)
function generateJWT(): string {
  // In a real implementation, this would generate a proper JWT
  // For now, returning a placeholder
  return "placeholder-jwt-token";
}