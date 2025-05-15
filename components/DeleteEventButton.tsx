import React, { useState } from 'react';
import { Button, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface DeleteEventButtonProps {
  eventId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * A button component that deletes an event when pressed
 */
export default function DeleteEventButton({
  eventId,
  onSuccess,
  onError,
}: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!eventId) {
      setError('Event ID is required');
      onError?.('Event ID is required');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!user) {
        throw new Error('You must be logged in to delete events');
      }
      
      // Delete the event (RLS will ensure the user can only delete their own events)
      const { error } = await supabase
        .from('events')
        .delete()
        .match({ id: eventId, user_id: user.id }); // Using match instead of eq for type safety
      
      if (error) {
        throw error;
      }
      
      // Call onSuccess callback if provided
      onSuccess?.();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Failed to delete event');
      onError?.(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Button
        title={isDeleting ? "Deleting..." : "Delete Event"}
        onPress={handleDelete}
        disabled={isDeleting}
        color="#dc3545"
      />
      {isDeleting && <ActivityIndicator size="small" color="#dc3545" />}
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});