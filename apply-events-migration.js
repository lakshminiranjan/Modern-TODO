// Script to apply the events table migration directly
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyEventsMigration() {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or service role key');
      return { success: false, error: 'Missing Supabase URL or service role key' };
    }
    
    console.log('Applying events table migration...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase', 'migrations', '20250511000000_create_events_table_new.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL file read successfully');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Statement ${i + 1} failed:`, errorText);
          // Continue with the next statement
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtErr) {
        console.error(`Error executing statement ${i + 1}:`, stmtErr);
        // Continue with the next statement
      }
    }
    
    // Verify the table was created
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error verifying events table:', error);
        return { success: false, error };
      }
      
      console.log('Events table verified successfully!');
      return { success: true };
    } catch (verifyErr) {
      console.error('Error verifying events table:', verifyErr);
      return { success: false, error: verifyErr };
    }
  } catch (err) {
    console.error('Exception in applyEventsMigration:', err);
    return { success: false, error: String(err) };
  }
}

// Run the function
applyEventsMigration()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });