import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Create a special admin client for table creation operations
const supabaseAdmin = createClient<Database>(
  supabaseUrl || '', 
  supabaseServiceKey || supabaseAnonKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

/**
 * Creates the events table in Supabase if it doesn't already exist
 * @returns Promise<boolean> - true if table was created or already exists, false if creation failed
 */
export async function createEventsTable(): Promise<boolean> {
  try {
    // First check if the table already exists using a direct query
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('count(*)')
        .limit(1);
      
      if (!error) {
        console.log('Events table already exists (direct query)');
        return true;
      }
    } catch (directErr) {
      // Continue to next approach if this fails
    }
    
    // Alternative approach: try to run a simple SQL query to check if table exists
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events')" 
      });
      
      if (!error && data && data === true) {
        console.log('Events table already exists (SQL query)');
        return true;
      }
    } catch (sqlErr) {
      // If this fails too, we'll assume the table doesn't exist
      console.log('Could not check if events table exists via SQL:', sqlErr);
    }

    // Try to create the events table using the RPC function
    try {
      const { data, error } = await supabaseAdmin.rpc('create_events_table');
      
      if (error) {
        console.error('Error calling create_events_table RPC:', error);
      } else if (data === true) {
        console.log('Events table created successfully via RPC');
        return true;
      }
    } catch (rpcErr) {
      console.error('Exception calling create_events_table RPC:', rpcErr);
    }
    
    // If RPC fails, try direct SQL approach
    try {
      const createTableSQL = `
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
        
        SELECT true;
      `;
      
      // Execute the SQL directly
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.error('Error executing SQL to create events table:', error);
        return false;
      }
      
      console.log('Events table created successfully via direct SQL');
      return true;
    } catch (sqlErr) {
      console.error('Failed to create events table via direct SQL:', sqlErr);
      
      // Last resort: try a simpler approach with minimal SQL
      try {
        const simpleSQL = `
          CREATE TABLE IF NOT EXISTS public.events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE,
            location TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow all" ON public.events FOR ALL USING (true);
          SELECT true;
        `;
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: simpleSQL });
        
        if (error) {
          console.error('Error executing simple SQL to create events table:', error);
          return false;
        }
        
        console.log('Events table created successfully via simple SQL');
        return true;
      } catch (simpleErr) {
        console.error('Failed to create events table via simple SQL:', simpleErr);
        return false;
      }
    }

    console.log('Events table created successfully');
    return true;
  } catch (err) {
    console.error('Unexpected error creating events table:', err);
    return false;
  }
}