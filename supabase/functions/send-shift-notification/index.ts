import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { operator_id, shift_id, type } = await req.json();

    console.log('Processing notification:', { operator_id, shift_id, type });

    // Get shift and event details
    const { data: shiftData, error: shiftError } = await supabase
      .from('shifts')
      .select(`
        id,
        date,
        start_time,
        end_time,
        activity_type,
        events!inner (
          id,
          title,
          address,
          clients!inner (
            name
          ),
          brands!inner (
            name
          )
        )
      `)
      .eq('id', shift_id)
      .single();

    if (shiftError || !shiftData) {
      console.error('Error fetching shift data:', shiftError);
      return new Response(JSON.stringify({ error: 'Shift not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get operator notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('shift_assignment, shift_updates, shift_cancellation')
      .eq('operator_id', operator_id)
      .single();

    // Check if notifications are enabled for this type
    const notificationsEnabled = preferences?.shift_assignment !== false; // Default to true if no preferences set

    if (!notificationsEnabled) {
      console.log('Notifications disabled for operator:', operator_id);
      return new Response(JSON.stringify({ message: 'Notifications disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format date and time
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const formatTime = (timeStr: string) => timeStr.slice(0, 5);

    // Create notification content
    const title = "Nuovo turno assegnato";
    const clientBrandName = `${shiftData.events.clients.name} - ${shiftData.events.brands.name}`;
    const message = `Nuovo turno per ${clientBrandName}
📍 ${shiftData.events.address}
📅 ${formatDate(shiftData.date)} | ${formatTime(shiftData.start_time)}-${formatTime(shiftData.end_time)}
🎯 ${shiftData.activity_type || 'Attività non specificata'}`;

    // Create notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        operator_id,
        title,
        message,
        type: 'shift_assignment',
        shift_id,
        event_id: shiftData.events.id,
        read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return new Response(JSON.stringify({ error: 'Failed to create notification' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to send push notification
    try {
      const { data: subscription } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh_key, auth_key')
        .eq('operator_id', operator_id)
        .single();

      if (subscription) {
        // Send push notification via separate function
        await supabase.functions.invoke('send-push-notification', {
          body: {
            operatorId: operator_id,
            title,
            body: `Nuovo turno: ${shiftData.events.title}`,
            type: 'shift_assignment',
            eventId: shiftData.events.id,
            shiftId: shift_id
          }
        });

        console.log('Push notification sent successfully');
      } else {
        console.log('No push subscription found for operator:', operator_id);
      }
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      // Don't fail the whole operation if push notification fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notification sent successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-shift-notification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});