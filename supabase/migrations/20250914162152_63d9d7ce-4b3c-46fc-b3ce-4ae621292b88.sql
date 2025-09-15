-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'operator');

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'operator';

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Create check-in/out table
CREATE TABLE public.shift_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  location_lat DECIMAL,
  location_lng DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on shift_checkins
ALTER TABLE public.shift_checkins ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for events (only admins can modify)
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
CREATE POLICY "All authenticated users can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Only admins can create events" ON public.events FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update events" ON public.events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete events" ON public.events FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for shifts (only admins can modify)
DROP POLICY IF EXISTS "Authenticated users can view shifts" ON public.shifts;
CREATE POLICY "All authenticated users can view shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Only admins can create shifts" ON public.shifts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update shifts" ON public.shifts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete shifts" ON public.shifts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for shift_assignments (only admins can modify)
DROP POLICY IF EXISTS "Authenticated users can view shift assignments" ON public.shift_assignments;
CREATE POLICY "All authenticated users can view shift assignments" ON public.shift_assignments FOR SELECT USING (true);
CREATE POLICY "Only admins can create shift assignments" ON public.shift_assignments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update shift assignments" ON public.shift_assignments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete shift assignments" ON public.shift_assignments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for shift_checkins
CREATE POLICY "Operators can view own checkins" ON public.shift_checkins FOR SELECT USING (
  operator_id = (SELECT operator_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Operators can create own checkins" ON public.shift_checkins FOR INSERT WITH CHECK (
  operator_id = (SELECT operator_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Operators can update own checkins" ON public.shift_checkins FOR UPDATE USING (
  operator_id = (SELECT operator_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins can manage all checkins" ON public.shift_checkins FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for other tables to restrict admin-only modifications
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "All authenticated users can view clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Only admins can create clients" ON public.clients FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update clients" ON public.clients FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete clients" ON public.clients FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view brands" ON public.brands;
CREATE POLICY "All authenticated users can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Only admins can create brands" ON public.brands FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update brands" ON public.brands FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete brands" ON public.brands FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on shift_checkins
CREATE TRIGGER update_shift_checkins_updated_at
  BEFORE UPDATE ON public.shift_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();