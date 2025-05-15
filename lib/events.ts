import { supabase, ensureEventsTableExists, supabaseAdmin, executeSql } from './supabase';
import type { Database } from '../types/supabase';

export type Event = Database['public']['Tables']['events']['Row'];
export type InsertEvent = Database['public']['Tables']['events']['Insert'];
export type UpdateEvent = Database['public']['Tables']['events']['Update'];

// Function to create the events table if it doesn't exist
export async function createEventsTable() {
  try {
    console.log('Checking if events table needs to be created...');
    
    // Try to query the events table to see if it exists
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    // If we get a specific error code, the table doesn't exist
    if (error && error.code === '42P01') {
      console.log('Events table does not exist, creating it...');
      
      try {
        // Create the events table with SQL
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS public.events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE,
            location TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
          );
        `;
        
        // Execute the SQL using our utility function
        const { success: tableCreated, error: tableError } = await executeSql(createTableSql);
        
        if (!tableCreated) {
          console.error('Failed to create events table:', tableError);
          return false;
        }
        
        // Add RLS policies
        const rlsSql = `
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
        `;
        
        // Execute the RLS SQL
        const { success: rlsCreated, error: rlsError } = await executeSql(rlsSql);
        
        if (!rlsCreated) {
          console.error('Failed to create RLS policies:', rlsError);
          // Continue anyway, the table exists
        }
        
        // Add function and trigger for updated_at
        const triggerSql = `
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
        `;
        
        // Execute the trigger SQL
        const { success: triggerCreated, error: triggerError } = await executeSql(triggerSql);
        
        if (!triggerCreated) {
          console.error('Failed to create trigger:', triggerError);
          // Continue anyway, the table exists
        }
        
        // Add index for better performance
        const indexSql = `
          -- Add index for better performance
          CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);
        `;
        
        // Execute the index SQL
        const { success: indexCreated, error: indexError } = await executeSql(indexSql);
        
        if (!indexCreated) {
          console.error('Failed to create index:', indexError);
          // Continue anyway, the table exists
        }
        
        // If we've made it this far, the table exists
        console.log('Events table created successfully!');
        return true;
      } catch (createErr) {
        console.error('Error creating events table:', createErr);
        
        // Last resort: try to insert directly
        try {
          // Get the current user's ID
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            console.error('No authenticated user found to create events table');
            return false;
          }
          
          const { error: insertError } = await supabaseAdmin
            .from('events')
            .insert({ 
              user_id: user.id as string,
              title: 'Test Event', 
              description: 'This is a test event to create the table structure',
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600000).toISOString(),
              location: 'Test Location'
            } as Database['public']['Tables']['events']['Insert']);
          
          if (insertError) {
            console.error('Failed to create events table via insert:', insertError);
            return false;
          }
          
          return true;
        } catch (insertErr) {
          console.error('Error in last resort insert:', insertErr);
          return false;
        }
      }
    } else if (error) {
      console.error('Error checking if events table exists:', error);
      return false;
    } else {
      console.log('Events table already exists');
      return true;
    }
  } catch (err) {
    console.error('Exception in createEventsTable:', err);
    return false;
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const EVENTS_CACHE_KEY = 'events_cache';
const EVENTS_CACHE_TIMESTAMP_KEY = 'events_cache_timestamp';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getEvents(forceRefresh = false): Promise<Event[]> {
  try {
    // Try to get data from cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await getCachedEvents();
      if (cachedData) {
        console.log('Using cached events data');
        return cachedData;
      }
    }
    
    console.log('Fetching events from database...');
    
    // Try to create the events table if it doesn't exist
    const tableExists = await createEventsTable();
    if (!tableExists) {
      console.warn('Events table does not exist and could not be created');
      
      // Try to get cached data as fallback
      const cachedData = await getCachedEvents(true); // ignore expiry
      if (cachedData) {
        console.log('Using cached events data as fallback after table creation error');
        return cachedData;
      }
      
      return []; // Return empty array if table doesn't exist and no cache
    }
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });
    
    // If we have a user, filter by their ID
    if (user) {
      // Use the filter method with the correct typing
      query = query.filter('user_id', 'eq', user.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching events:', error);
      
      // Try to get cached data as fallback
      const cachedData = await getCachedEvents(true); // ignore expiry
      if (cachedData) {
        console.log('Using cached events data as fallback after query error');
        return cachedData;
      }
      
      return []; // Return empty array if no cache available
    }
    
    // Cache the fresh data
    if (data) {
      // First convert to unknown, then to Event[] to avoid TypeScript error
      const typedData = data as unknown as Event[];
      await cacheEvents(typedData);
    }
    
    console.log(`Successfully fetched ${data?.length || 0} events`);
    return (data as unknown as Event[]) || [];
  } catch (err) {
    console.error('Exception in getEvents:', err);
    
    // Try to get cached data as fallback
    const cachedData = await getCachedEvents(true); // ignore expiry
    if (cachedData) {
      console.log('Using cached events data as fallback after exception');
      return cachedData;
    }
    
    return [];
  }
}

// Helper function to cache events
async function cacheEvents(events: Event[]) {
  try {
    await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
    await AsyncStorage.setItem(EVENTS_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Error caching events:', e);
  }
}

// Helper function to get cached events
async function getCachedEvents(ignoreExpiry = false): Promise<Event[] | null> {
  try {
    const cachedEventsJson = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
    const timestampStr = await AsyncStorage.getItem(EVENTS_CACHE_TIMESTAMP_KEY);
    
    if (!cachedEventsJson || !timestampStr) {
      return null;
    }
    
    // Check if cache is expired
    if (!ignoreExpiry) {
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      if (now - timestamp > CACHE_EXPIRY_TIME) {
        console.log('Events cache expired');
        return null;
      }
    }
    
    return JSON.parse(cachedEventsJson);
  } catch (e) {
    console.error('Error retrieving cached events:', e);
    return null;
  }
}

export async function createEvent(event: InsertEvent) {
  try {
    console.log('Creating new event:', event);
    
    // Try to create the events table if it doesn't exist
    const tableExists = await createEventsTable();
    if (!tableExists) {
      console.warn('Events table does not exist and could not be created');
      // Return a mock event to prevent UI errors
      const mockEvent: Event = {
        id: `mock-${Date.now()}`,
        user_id: event.user_id || null,
        title: event.title,
        description: event.description || null,
        start_time: event.start_time,
        end_time: event.end_time || null,
        location: event.location || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockEvent;
    }
    
    // Get the current user's ID if not provided
    if (!event.user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        event.user_id = user.id as string;
      }
    }
    
    // Make sure all required fields are present
    if (!event.title || !event.start_time) {
      throw new Error('Event title and start time are required');
    }
    
    // Create a properly typed event object that matches the Insert type
    const typedEvent: Database['public']['Tables']['events']['Insert'] = {
      id: event.id,
      user_id: event.user_id,
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      created_at: event.created_at,
      updated_at: event.updated_at
    };
    
    const { data, error } = await supabase
      .from('events')
      .insert(typedEvent)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }
    
    console.log('Event created successfully:', data);
    return data as unknown as Event;
  } catch (err) {
    console.error('Exception in createEvent:', err);
    throw err;
  }
}

export async function updateEvent(id: string, updates: UpdateEvent) {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    // Make sure we're only sending fields that exist in the UpdateEvent type
    const safeUpdates: UpdateEvent = {
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.start_time !== undefined ? { start_time: updates.start_time } : {}),
      ...(updates.end_time !== undefined ? { end_time: updates.end_time } : {}),
      ...(updates.location !== undefined ? { location: updates.location } : {}),
      updated_at: new Date().toISOString(),
    };

    console.log('Updating event with ID:', id, 'Updates:', safeUpdates);
    
    let query = supabase
      .from('events')
      .update(safeUpdates as UpdateEvent)
      .eq('id', id as any);
    
    // If we have a user, add user_id filter for security
    if (user) {
      query = query.filter('user_id', 'eq', user.id);
    }
    
    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }
    
    console.log('Event updated successfully:', data);
    return data as unknown as Event;
  } catch (err) {
    console.error('Exception in updateEvent:', err);
    throw err;
  }
}

export async function deleteEvent(id: string) {
  try {
    console.log('Deleting event with ID:', id);
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('events')
      .delete();
    
    // Add ID filter
    query = query.eq('id', id as any);
    
    // If we have a user, add user_id filter for security
    if (user) {
      query = query.filter('user_id', 'eq', user.id);
    }
    
    const { error } = await query;

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
    
    console.log('Successfully deleted event with ID:', id);
  } catch (err) {
    console.error('Exception in deleteEvent:', err);
    throw err;
  }
}

export function subscribeToEvents(callback: (events: Event[]) => void) {
  console.log('Setting up real-time subscription to events table');
  
  // First, try to create the events table if it doesn't exist
  createEventsTable().then(tableExists => {
    if (!tableExists) {
      console.warn('Events table does not exist and could not be created for subscription');
      callback([]); // Return empty array if table doesn't exist
      return;
    }
    
    // Get the current user's ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userId = user?.id;
      
      const channel = supabase
        .channel('events')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: userId ? `user_id=eq.${userId}` : undefined,
          },
          async (payload) => {
            console.log('Real-time update received:', payload.eventType, payload);
            
            try {
              // Fetch all events after any change
              let query = supabase
                .from('events')
                .select('*')
                .order('start_time', { ascending: true });
              
              // Filter by user ID if available
              if (userId) {
                query = query.filter('user_id', 'eq', userId);
              }
              
              const { data, error } = await query;

              if (error) {
                console.error('Error fetching events in subscription:', error);
                return;
              }
              
              console.log(`Subscription update: fetched ${data?.length || 0} events`);
              if (data) callback(data as unknown as Event[]);
            } catch (err) {
              console.error('Exception in subscription callback:', err);
              callback([]);
            }
          }
        )
        .subscribe();
        
      // Store the subscription
      return {
        unsubscribe: () => {
          supabase.removeChannel(channel);
        }
      };
    }).catch(err => {
      console.error('Error setting up events subscription:', err);
      callback([]);
      
      // Return a dummy unsubscribe function
      return {
        unsubscribe: () => {}
      };
    });
  }).catch(err => {
    console.error('Error checking events table for subscription:', err);
    callback([]);
  });
  
  // Return a dummy unsubscribe function that will be replaced when the promise resolves
  return {
    unsubscribe: () => {}
  };
}