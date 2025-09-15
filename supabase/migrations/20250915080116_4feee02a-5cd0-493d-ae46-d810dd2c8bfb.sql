-- Enable real-time for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- Create an Edge Function trigger for sending notifications when shift assignments are created
CREATE OR REPLACE FUNCTION notify_shift_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification via Edge Function
  PERFORM net.http_post(
    url := 'https://lvisxixfxhtjpmzaplop.supabase.co/functions/v1/send-shift-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := jsonb_build_object(
      'operator_id', NEW.operator_id,
      'shift_id', NEW.shift_id,
      'type', 'shift_assignment'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new shift assignments
CREATE TRIGGER trigger_notify_shift_assignment
  AFTER INSERT ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_shift_assignment();

-- Enable real-time for push_subscriptions (for real-time badge updates)
ALTER TABLE public.push_subscriptions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.push_subscriptions;