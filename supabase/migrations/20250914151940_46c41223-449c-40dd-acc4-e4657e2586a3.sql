-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.availability_status AS ENUM ('Disponibile', 'Occupato', 'In ferie');
CREATE TYPE public.activity_type AS ENUM (
  'doorman',
  'presidio notturno e diurno', 
  'presidio notturno',
  'presido diurno',
  'gestione flussi ingresso e uscite',
  'shooting',
  'endorsement',
  'GPG armata con auto',
  'GPG armata senza auto'
);
CREATE TYPE public.notification_type AS ENUM ('shift_assignment', 'shift_update', 'shift_cancellation');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create operators table
CREATE TABLE public.operators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  availability availability_status DEFAULT 'Disponibile',
  phone TEXT,
  email TEXT,
  fiscal_code TEXT,
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact persons table
CREATE TABLE public.contact_persons (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brands table
CREATE TABLE public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand addresses table
CREATE TABLE public.brand_addresses (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  activity_code TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shifts table
CREATE TABLE public.shifts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activity_type activity_type,
  team_leader_id TEXT REFERENCES public.operators(id),
  required_operators INTEGER NOT NULL,
  notes TEXT,
  pause_hours DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift assignments table (many-to-many between shifts and operators)
CREATE TABLE public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  operator_id TEXT NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  slot_index INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shift_id, operator_id),
  UNIQUE(shift_id, slot_index)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  shift_id TEXT REFERENCES public.shifts(id),
  event_id TEXT REFERENCES public.events(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id TEXT NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE UNIQUE,
  shift_assignment BOOLEAN DEFAULT TRUE,
  shift_updates BOOLEAN DEFAULT TRUE,
  shift_cancellation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id TEXT NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE UNIQUE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Operators: Users can only access their own operator data
CREATE POLICY "Users can view own operator data" ON public.operators
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.operator_id = operators.id
  )
);

CREATE POLICY "Users can update own operator data" ON public.operators
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.operator_id = operators.id
  )
);

-- Admin policies for operators (for now, allow all authenticated users to view all operators for assignment purposes)
CREATE POLICY "Authenticated users can view all operators" ON public.operators
FOR SELECT TO authenticated USING (true);

-- Events, Shifts, Tasks: All authenticated users can view (operators need to see assignments)
CREATE POLICY "Authenticated users can view events" ON public.events
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view shifts" ON public.shifts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view shift assignments" ON public.shift_assignments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view tasks" ON public.tasks
FOR SELECT TO authenticated USING (true);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.operator_id = notifications.operator_id
  )
);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.operator_id = notifications.operator_id
  )
);

-- Notification preferences: Users can only manage their own preferences
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.operator_id = notification_preferences.operator_id
  )
);

-- Push subscriptions: Users can only manage their own subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.operator_id = push_subscriptions.operator_id
  )
);

-- Clients and brands: All authenticated users can view (needed for event management)
CREATE POLICY "Authenticated users can view clients" ON public.clients
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view contact persons" ON public.contact_persons
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view brands" ON public.brands
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view brand addresses" ON public.brand_addresses
FOR SELECT TO authenticated USING (true);

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, operator_id)
  VALUES (NEW.id, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();