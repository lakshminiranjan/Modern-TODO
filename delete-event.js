// Function to delete an event from the database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

/**
 * Delete an event from the database
 * @param {string} eventId - The ID of the event to delete
 * @returns {Promise<{success: boolean, error?: any}>} - Result of the operation
 */
async function deleteEvent(eventId) {
  try {
    if (!eventId) {
      console.error('Event ID is required');
      return { success: false, error: 'Event ID is required' };
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Use anon key for authenticated users
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or anon key');
      return { success: false, error: 'Missing Supabase URL or anon key' };
    }
    
    console.log(`Deleting event with ID: ${eventId}`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return { success: false, error: userError };
    }
    
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, error: 'No authenticated user found' };
    }
    
    // Delete the event (RLS will ensure the user can only delete their own events)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id); // Extra security to ensure user can only delete their own events
    
    if (error) {
      console.error('Error deleting event:', error);
      return { success: false, error };
    }
    
    console.log(`Successfully deleted event with ID: ${eventId}`);
    return { success: true };
  } catch (err) {
    console.error('Exception in deleteEvent:', err);
    return { success: false, error: String(err) };
  }
}

// Example usage:
// deleteEvent('your-event-id-here')
//   .then(result => {
//     console.log('Result:', result);
//   })
//   .catch(err => {
//     console.error('Unhandled error:', err);
//   });

module.exports = { deleteEvent };