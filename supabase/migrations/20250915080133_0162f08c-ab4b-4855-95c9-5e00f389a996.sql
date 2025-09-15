-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;