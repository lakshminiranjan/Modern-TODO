# Events Table Implementation

This document explains how the events table is implemented in the ToDo application.

## Overview

The application now includes a proper events table in Supabase that stores calendar events. The implementation includes:

1. Automatic table creation if it doesn't exist
2. Migration of local events to the Supabase database
3. Real-time subscription to events changes
4. Fallback to localStorage if the database is unavailable

## How It Works

### Table Structure

The events table has the following structure:

```sql
CREATE TABLE public.events (
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
```

### Row Level Security (RLS)

The table includes RLS policies to ensure users can only access their own events:

- Users can view their own events or events with null user_id
- Users can insert their own events or events with null user_id
- Users can update their own events or events with null user_id
- Users can delete their own events or events with null user_id

### Automatic Table Creation

When the application starts, it checks if the events table exists:

1. First, it tries a simple query to the events table
2. If that fails, it checks the database schema
3. If the table doesn't exist, it attempts to create it using the `createEventsTable` function
4. If table creation succeeds, it migrates any local events to the database

### Migration from localStorage

If you had events stored in localStorage, they will be automatically migrated to the Supabase database when the table is created. The migration process:

1. Retrieves all events from localStorage
2. Maps them to the database schema
3. Inserts them in batches to the database
4. Clears localStorage after successful migration

## Manual Setup

If you prefer to set up the table manually:

1. Run the SQL migration file in the Supabase dashboard:
   - Navigate to `/supabase/migrations/20240101000000_create_events_table.sql`
   - Copy the contents and run them in the SQL editor in your Supabase dashboard

2. Set the localStorage flag to indicate the table exists:
   ```javascript
   localStorage.setItem('eventsTableExists', 'true');
   ```

## Troubleshooting

If you encounter issues with the events table:

1. Check the browser console for error messages
2. Verify your Supabase credentials are correct
3. Ensure the RLS policies are properly set up
4. Try clearing the localStorage cache:
   ```javascript
   localStorage.removeItem('eventsTableExists');
   localStorage.removeItem('mockEvents');
   ```
5. Refresh the application to trigger table creation again

## Fallback Mechanism

If the database is unavailable or the table cannot be created, the application will fall back to using localStorage for event storage. This ensures the application remains functional even without database access.