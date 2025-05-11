// Script to apply the events table migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20250509000001_add_events_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying migration to create events table...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('pgexec', { sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      
      // Try an alternative approach
      console.log('Trying alternative approach...');
      await createEventsTableDirectly();
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
    
    // Try an alternative approach
    console.log('Trying alternative approach...');
    await createEventsTableDirectly();
  }
}

async function createEventsTableDirectly() {
  try {
    // Use the SQL from create_events_table_manual.sql
    const sqlPath = path.join(__dirname, 'create_events_table_manual.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Creating events table directly...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('pgexec', { sql });
    
    if (error) {
      console.error('Error creating events table directly:', error);
      console.log('Please run the SQL manually in the Supabase SQL Editor.');
      console.log('SQL file: create_events_table_manual.sql');
    } else {
      console.log('Events table created successfully!');
    }
  } catch (err) {
    console.error('Error in alternative approach:', err);
    console.log('Please run the SQL manually in the Supabase SQL Editor.');
    console.log('SQL file: create_events_table_manual.sql');
  }
}

// Run the function
applyMigration().catch(console.error);