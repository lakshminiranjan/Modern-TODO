// This is a simple test file to verify the events table creation works
// You can run this manually in a Node.js environment

const { createEventsTable } = require('../lib/createEventsTable');
const { ensureEventsTableExists } = require('../lib/supabase');

async function testEventsTable() {
  console.log('Testing events table creation...');
  
  try {
    // First check if the table exists
    const exists = await ensureEventsTableExists();
    console.log(`Table exists check result: ${exists}`);
    
    if (!exists) {
      // Try to create the table
      const created = await createEventsTable();
      console.log(`Table creation result: ${created}`);
      
      // Check again if the table exists
      const existsAfterCreation = await ensureEventsTableExists();
      console.log(`Table exists after creation attempt: ${existsAfterCreation}`);
    }
    
    console.log('Test completed');
  } catch (err) {
    console.error('Error during test:', err);
  }
}

// Uncomment to run the test
// testEventsTable();

module.exports = { testEventsTable };