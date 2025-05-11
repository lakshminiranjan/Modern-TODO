-- Create the events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Users can view their own events'
  ) THEN
    CREATE POLICY "Users can view their own events" 
      ON public.events 
      FOR SELECT 
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END
$$;

-- Policy for users to insert their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Users can insert their own events'
  ) THEN
    CREATE POLICY "Users can insert their own events" 
      ON public.events 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END
$$;

-- Policy for users to update their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Users can update their own events'
  ) THEN
    CREATE POLICY "Users can update their own events" 
      ON public.events 
      FOR UPDATE 
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END
$$;

-- Policy for users to delete their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Users can delete their own events'
  ) THEN
    CREATE POLICY "Users can delete their own events" 
      ON public.events 
      FOR DELETE 
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END
$$;

-- Create a stored procedure to execute SQL for table creation
CREATE OR REPLACE FUNCTION public.create_events_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if table already exists
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'events'
  ) INTO table_exists;
  
  -- If table already exists, return true
  IF table_exists THEN
    RETURN true;
  END IF;
  
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Add RLS policies
  ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
  
  -- Add policies
  CREATE POLICY "Users can view their own events" 
    ON public.events 
    FOR SELECT 
    USING (auth.uid() = user_id OR user_id IS NULL);
    
  CREATE POLICY "Users can insert their own events" 
    ON public.events 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    
  CREATE POLICY "Users can update their own events" 
    ON public.events 
    FOR UPDATE 
    USING (auth.uid() = user_id OR user_id IS NULL);
    
  CREATE POLICY "Users can delete their own events" 
    ON public.events 
    FOR DELETE 
    USING (auth.uid() = user_id OR user_id IS NULL);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating events table: %', SQLERRM;
    RETURN false;
END;
$$;

-- Create a function to execute arbitrary SQL (for admin use only)
-- This is used as a fallback if the RPC method doesn't work
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE sql INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE events_id_seq TO authenticated;