// Script to create the events table using the Supabase JavaScript client
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createEventsTable() {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or service role key');
      return { success: false, error: 'Missing Supabase URL or service role key' };
    }
    
    console.log('Creating events table using Supabase client...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // SQL to create the events table
    const sql = `
      -- Drop the existing events table if it exists
      DROP TABLE IF EXISTS public.events CASCADE;
      
      -- Create the events table
      CREATE TABLE public.events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
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
      
      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);
      CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events (user_id);
    `;
    
    // Execute the SQL using the rpc method
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error('SQL execution failed:', error);
      
      // Try an alternative approach if the first one fails
      console.log('Trying alternative approach...');
      
      // Try to create the table directly
      const { error: tableError } = await supabase
        .from('events')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist, try to create it
        console.log('Table does not exist, creating it...');
        
        // Create the table with minimal SQL
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS public.events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            location TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
          );
        `;
        
        // Try to execute the SQL using a different method
        const { data: tableData, error: createError } = await supabase
          .rpc('execute_sql', { sql: createTableSql });
        
        if (createError) {
          console.error('Failed to create table:', createError);
          return { success: false, error: createError };
        }
        
        console.log('Table created successfully!');
        return { success: true, data: tableData };
      }
      
      return { success: false, error };
    }
    
    console.log('Events table created successfully!');
    return { success: true, data };
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