-- Enable realtime for shift_assignments table
ALTER TABLE public.shift_assignments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.shift_assignments;

-- Enable realtime for shifts table  
ALTER TABLE public.shifts REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.shifts;