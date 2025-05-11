// Simple script to create the events table using the executeSql function
require('dotenv').config();
const fetch = require('node-fetch');

async function createEventsTable() {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or service role key');
      return { success: false, error: 'Missing Supabase URL or service role key' };
    }
    
    console.log('Creating events table...');
    
    // SQL to create the events table
    const sql = `
      CREATE TABLE IF NOT EXISTS public.events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
      
      -- Create policy for users to insert their own events
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
      
      -- Create policy for users to update their own events
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
      
      -- Create policy for users to delete their own events
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
    
    // Use the Supabase SQL API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SQL execution failed:', errorText);
      return { success: false, error: errorText };
    }
    
    const result = await response.json();
    console.log('Events table created successfully!');
    return { success: true, data: result };
  } catch (err) {
    console.error('Exception in createEventsTable:', err);
    return { success: false, error: String(err) };
  }
}

// Run the function
createEventsTable()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });