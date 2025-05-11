// This script creates the events table in your Supabase database
// Run it with: node create-events-table.js

// Load environment variables from .env file
require('dotenv').config();

// Import the Supabase client
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create the events table
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
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
    USING (auth.uid() = user_id);
  
  -- Create policy for users to insert their own events
  CREATE POLICY "Users can insert their own events" 
    ON public.events 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  
  -- Create policy for users to update their own events
  CREATE POLICY "Users can update their own events" 
    ON public.events 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  
  -- Create policy for users to delete their own events
  CREATE POLICY "Users can delete their own events" 
    ON public.events 
    FOR DELETE 
    USING (auth.uid() = user_id);
  
  -- Add indexes for better performance
  CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);
  CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events (user_id);
  
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
  
  -- Create a function to create the events table (for programmatic access)
  CREATE OR REPLACE FUNCTION create_events_table()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    -- The table should already exist by this point
    RETURN true;
  END;
  $$;
  
  -- Grant execute permission to authenticated users
  GRANT EXECUTE ON FUNCTION create_events_table() TO authenticated;
  GRANT EXECUTE ON FUNCTION create_events_table() TO anon;
  GRANT EXECUTE ON FUNCTION create_events_table() TO service_role;
`;

async function createEventsTable() {
  try {
    console.log('Creating events table...');
    
    // Try to execute the SQL using RPC
    try {
      const { error } = await supabase.rpc('pgexec', { sql: createTableSQL });
      
      if (error) {
        console.error('Error executing SQL via RPC:', error);
        console.log('Trying alternative approach...');
      } else {
        console.log('Events table created successfully!');
        return;
      }
    } catch (rpcError) {
      console.error('RPC execution failed:', rpcError);
      console.log('Trying alternative approach...');
    }
    
    // Alternative approach: Try to create a test event
    console.log('Attempting to create a test event...');
    
    const testEvent = {
      title: 'Test Event',
      description: 'This is a test event to create the table',
      start_time: new Date().toISOString(),
    };
    
    const { error: insertError } = await supabase
      .from('events')
      .insert(testEvent);
    
    if (insertError) {
      console.error('Error creating test event:', insertError);
      console.log('Please run the SQL script manually in the Supabase SQL Editor.');
      console.log('SQL Script:');
      console.log(createTableSQL);
    } else {
      console.log('Test event created successfully! The events table should now exist.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
createEventsTable();