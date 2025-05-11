import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Event } from '../lib/events';
import { deleteEvent } from '../lib/events';

interface EventItemProps {
  event: Event;
  onDelete: () => void;
}

/**
 * A component that displays an event and provides a delete button
 */
export default function EventItem({ event, onDelete }: EventItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteEvent(event.id);
      
      // Call onDelete callback to refresh the events list
      onDelete();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{event.title}</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#dc3545" />
          ) : (
            <Trash2 size={18} color="#dc3545" />
          )}
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {event.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}
      
      <View style={styles.detailsContainer}>
        <Text style={styles.detailLabel}>Start:</Text>
        <Text style={styles.detailValue}>{formatDate(event.start_time)}</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.detailLabel}>End:</Text>
        <Text style={styles.detailValue}>
          {event.end_time ? formatDate(event.end_time) : 'Not specified'}
        </Text>
      </View>
      
      {event.location && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{event.location}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
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