-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own events
CREATE POLICY "Users can view their own events" 
  ON public.events 
  FOR SELECT 
  USING (true);  -- For now, allow all users to view all events

-- Create policy for users to insert their own events
CREATE POLICY "Users can insert their own events" 
  ON public.events 
  FOR INSERT 
  WITH CHECK (true);  -- For now, allow all authenticated users to insert events

-- Create policy for users to update their own events
CREATE POLICY "Users can update their own events" 
  ON public.events 
  FOR UPDATE 
  USING (true)  -- For now, allow all users to update all events
  WITH CHECK (true);

-- Create policy for users to delete their own events
CREATE POLICY "Users can delete their own events" 
  ON public.events 
  FOR DELETE 
  USING (true);  -- For now, allow all users to delete all events

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();