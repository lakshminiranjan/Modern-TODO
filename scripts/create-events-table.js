// This script creates the events table in your Supabase database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEventsTable() {
  console.log('Creating events table...');
  
  try {
    // First, check if the table exists
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Table does not exist, creating it...');
      
      // Create a simple event to create the table structure
      const { error: insertError } = await supabase
        .from('events')
        .insert([
          { 
            title: 'Test Event', 
            description: 'This is a test event to create the table structure',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            location: 'Test Location'
          }
        ]);
      
      if (insertError) {
        console.error('Error creating events table:', insertError);
        // Try alternative approach
        console.log('Trying alternative approach...');
        await createTableAlternative();
      } else {
        console.log('Events table created successfully!');
        
        // Delete the test event
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('title', 'Test Event')
          .eq('description', 'This is a test event to create the table structure');
        
        if (deleteError) {
          console.warn('Warning: Could not delete test event:', deleteError);
        } else {
          console.log('Test event deleted successfully.');
        }
      }
    } else if (error) {
      console.error('Error checking if table exists:', error);
    } else {
      console.log('Events table already exists!');
    }
  } catch (err) {
    console.error('Exception:', err);
    // Try alternative approach
    console.log('Trying alternative approach...');
    await createTableAlternative();
  }
}

async function createTableAlternative() {
  try {
    // Check if the table exists
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Table does not exist, creating it using direct SQL API...');
      
      // Create the table with minimal fields first
      const createTableResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'resolution=ignore-duplicates,return=minimal'
        },
        body: JSON.stringify({
          command: `
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
          `
        })
      });
      
      if (!createTableResponse.ok) {
        console.error('Error creating table:', await createTableResponse.text());
        
        // Try a simpler approach - create the table directly through the API
        console.log('Trying to create table through direct API...');
        
        // First, let's try to create a simple table structure
        const { error: createError } = await supabase
          .from('events')
          .insert([
            { 
              title: 'Test Event', 
              description: 'This is a test event to create the table structure',
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600000).toISOString(),
              location: 'Test Location'
            }
          ]);
        
        if (createError) {
          console.error('Error creating table through API:', createError);
          return;
        } else {
          console.log('Table created successfully through API!');
        }
      } else {
        console.log('Basic table created successfully!');
      }
      
      // Check if the table was created
      const { data: checkData, error: checkError } = await supabase
        .from('events')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking if table was created:', checkError);
        return;
      }
      
      console.log('Events table created successfully!');
    } else if (error) {
      console.error('Error checking table existence:', error);
    } else {
      console.log('Events table already exists!');
    }
  } catch (err) {
    console.error('Exception in alternative approach:', err);
  }
}

// Run the function
createEventsTable()
  .catch(console.error)
  .finally(() => process.exit());