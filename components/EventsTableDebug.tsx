import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase, ensureEventsTableExists } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function EventsTableDebug() {
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    // Check if the table actually exists in the database
    checkTableExists();
  }, []);

  const handleSetExists = (exists: boolean) => {
    // Update local state only since ensureEventsTableExists is a check function, not a setter
    setTableExists(exists);
    // Show alert to indicate this is just for UI testing
    Alert.alert(
      'Debug Mode',
      `Events table status set to: ${exists ? 'Exists' : 'Does not exist'} (UI only)`
    );
  };
  
  const checkTableExists = async () => {
    try {
      setError(null);
      
      // Use the ensureEventsTableExists function from supabase library
      const exists = await ensureEventsTableExists();
      setTableExists(exists);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
  };

  const createEventsTable = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      // SQL to create the events table
      const sql = `
        CREATE TABLE IF NOT EXISTS events (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users NOT NULL,
          title text NOT NULL,
          description text,
          start_time timestamptz NOT NULL,
          end_time timestamptz NOT NULL,
          location text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        
        -- Add policies for authenticated users
        CREATE POLICY "Users can read own events"
          ON events
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create own events"
          ON events
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own events"
          ON events
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own events"
          ON events
          FOR DELETE
          TO authenticated
          USING (auth.uid() = user_id);
        
        -- Trigger to update the \`updated_at\` column
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_events_updated_at
          BEFORE UPDATE
          ON events
          FOR EACH ROW
          EXECUTE PROCEDURE update_updated_at_column();
      `;
      
      // Execute the SQL
      const { error } = await supabase.rpc('pgexec', { sql });
      
      if (error) {
        setError(error.message);
        Alert.alert('Error', `Failed to create events table: ${error.message}`);
      } else {
        setTableExists(true);
        Alert.alert('Success', 'Events table created successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      Alert.alert('Error', `Exception: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Events Table Debug</Text>
      
      <Text style={[styles.status, { color: colors.text }]}>
        Current status: {tableExists === null ? 'Unknown' : tableExists ? 'Exists' : 'Does not exist'}
      </Text>
      
      {error && (
        <Text style={[styles.error, { color: 'red' }]}>
          Error: {error}
        </Text>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleSetExists(true)}
        >
          <Text style={styles.buttonText}>Set Table Exists</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F44336' }]}
          onPress={() => handleSetExists(false)}
        >
          <Text style={styles.buttonText}>Set Table Does Not Exist</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={checkTableExists}
        >
          <Text style={styles.buttonText}>Check Table</Text>
        </TouchableOpacity>
        
        {!tableExists && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'green' }]}
            onPress={createEventsTable}
            disabled={isCreating}
          >
            <Text style={styles.buttonText}>
              {isCreating ? 'Creating...' : 'Create Table'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.note, { color: colors.text + '80' }]}>
        Note: This is for debugging purposes. The "Set Table" buttons only affect the UI state, while "Create Table" actually creates the table in the database.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
});