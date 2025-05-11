// Simple script to create the events table using the Supabase client
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
    
    console.log('Creating events table...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First, check if the table exists
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .limit(1);
      
      if (!error) {
        console.log('Events table already exists');
        return { success: true, message: 'Table already exists' };
      }
    } catch (checkErr) {
      // Table doesn't exist, continue with creation
      console.log('Table check failed, will attempt to create it');
    }
    
    // Create a test event to force table creation
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            user_id: '00000000-0000-0000-0000-000000000000', // Placeholder user ID
            title: 'Test Event',
            description: 'This is a test event to create the table',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            location: 'Test Location'
          }
        ]);
      
      if (error) {
        console.error('Error creating test event:', error);
        return { success: false, error };
      }
      
      console.log('Events table created successfully!');
      return { success: true };
    } catch (insertErr) {
      console.error('Error creating test event:', insertErr);
      return { success: false, error: insertErr };
    }
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