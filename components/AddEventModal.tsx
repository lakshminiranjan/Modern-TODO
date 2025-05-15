import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, Platform } from 'react-native';
import { Calendar as CalendarIcon, Clock, MapPin, X } from 'lucide-react-native';
import { createEvent } from '@/lib/events';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';

import { Event } from '@/lib/events';

export default function AddEventModal({ visible, onClose, onEventAdded }: { visible: boolean; onClose: () => void; onEventAdded?: (event?: Event) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 60 * 60 * 1000)); // Default to 1 hour later
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const { session } = useAuth();
  const { colors } = useTheme();

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      const now = new Date();
      setTitle('');
      setDescription('');
      setStartDate(now);
      setEndDate(new Date(now.getTime() + 60 * 60 * 1000)); // 1 hour later
      setLocation('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End time must be after start time.');
      return;
    }

    try {
      setLoading(true);
      
      // Make sure we have a valid session
      if (!session || !session.user || !session.user.id) {
        Alert.alert('Error', 'No valid user session found. Please log in again.');
        return;
      }
      
      const eventData = {
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim() || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: location.trim() || null,
      };

      try {
        const createdEvent = await createEvent(eventData);
        
        // Check if it's a mock event (has an ID starting with 'mock-')
        if ('id' in createdEvent && createdEvent.id.toString().startsWith('mock-')) {
          Alert.alert(
            'Warning', 
            'The events table does not exist in your database. The event appears to be created but is not actually saved.'
          );
        } else {
          Alert.alert('Success', 'Event created successfully!');
        }
        
        // Pass the created event to the callback for optimistic UI updates
        if (onEventAdded && 'id' in createdEvent) onEventAdded(createdEvent);
        onClose();
      } catch (createErr: any) {
        // Provide a more specific error message if available
        const errorMessage = createErr.message || 'Failed to create event. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    // If user cancels the picker (on Android), selectedDate will be undefined
    if (!selectedDate) {
      if (Platform.OS === 'android') {
        setShowStartDatePicker(false);
      }
      return;
    }
    
    const currentDate = selectedDate;
    
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      // On Android, we might want to show the time picker right after
      // setShowStartTimePicker(true);
    }
    
    // Keep the time from the current startDate
    const newDate = new Date(currentDate);
    newDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
    
    setStartDate(newDate);
    
    // If end date is before the new start date, update it
    if (endDate < newDate) {
      const newEndDate = new Date(newDate.getTime() + 60 * 60 * 1000); // 1 hour later
      setEndDate(newEndDate);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    // If user cancels the picker (on Android), selectedTime will be undefined
    if (!selectedTime) {
      if (Platform.OS === 'android') {
        setShowStartTimePicker(false);
      }
      return;
    }
    
    const currentTime = selectedTime;
    
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    // Keep the date from the current startDate but update the time
    const newDate = new Date(startDate);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());
    
    setStartDate(newDate);
    
    // If end date is before the new start date, update it
    if (endDate < newDate) {
      const newEndDate = new Date(newDate.getTime() + 60 * 60 * 1000); // 1 hour later
      setEndDate(newEndDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    // If user cancels the picker (on Android), selectedDate will be undefined
    if (!selectedDate) {
      if (Platform.OS === 'android') {
        setShowEndDatePicker(false);
      }
      return;
    }
    
    const currentDate = selectedDate;
    
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      // On Android, we might want to show the time picker right after
      // setShowEndTimePicker(true);
    }
    
    // Keep the time from the current endDate
    const newDate = new Date(currentDate);
    newDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds());
    
    // Ensure end date is not before start date
    if (newDate < startDate) {
      newDate.setTime(startDate.getTime() + 60 * 60 * 1000); // 1 hour after start
    }
    
    setEndDate(newDate);
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    // If user cancels the picker (on Android), selectedTime will be undefined
    if (!selectedTime) {
      if (Platform.OS === 'android') {
        setShowEndTimePicker(false);
      }
      return;
    }
    
    const currentTime = selectedTime;
    
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    // Keep the date from the current endDate but update the time
    const newDate = new Date(endDate);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());
    
    // Ensure end time is not before start time
    if (newDate < startDate) {
      newDate.setTime(startDate.getTime() + 60 * 60 * 1000); // 1 hour after start
    }
    
    setEndDate(newDate);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Event</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TextInput 
            style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
            placeholder="Event Title" 
            placeholderTextColor={colors.text + '80'}
            value={title} 
            onChangeText={setTitle} 
          />
          
          <TextInput 
            style={[styles.textArea, { borderColor: colors.border, color: colors.text }]} 
            placeholder="Description (optional)" 
            placeholderTextColor={colors.text + '80'}
            value={description} 
            onChangeText={setDescription} 
            multiline={true}
            numberOfLines={3}
          />
          
          {/* Start Date & Time */}
          <View style={styles.dateTimeSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Start</Text>
            
            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { borderColor: colors.border }]} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <CalendarIcon size={18} color={colors.primary} style={styles.dateTimeIcon} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {format(startDate, 'MMM d, yyyy')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dateTimeButton, { borderColor: colors.border }]} 
                onPress={() => setShowStartTimePicker(true)}
              >
                <Clock size={18} color={colors.primary} style={styles.dateTimeIcon} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {format(startDate, 'h:mm a')}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showStartDatePicker && (
              <DateTimePicker
                testID="startDatePicker"
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
                minimumDate={new Date()} // Optional: prevent selecting dates in the past
              />
            )}
            
            {showStartTimePicker && (
              <DateTimePicker
                testID="startTimePicker"
                value={startDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartTimeChange}
                is24Hour={false}
              />
            )}
          </View>
          
          {/* End Date & Time */}
          <View style={styles.dateTimeSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>End</Text>
            
            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { borderColor: colors.border }]} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <CalendarIcon size={18} color={colors.primary} style={styles.dateTimeIcon} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {format(endDate, 'MMM d, yyyy')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dateTimeButton, { borderColor: colors.border }]} 
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={18} color={colors.primary} style={styles.dateTimeIcon} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {format(endDate, 'h:mm a')}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showEndDatePicker && (
              <DateTimePicker
                testID="endDatePicker"
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndDateChange}
                minimumDate={startDate}
              />
            )}
            
            {showEndTimePicker && (
              <DateTimePicker
                testID="endTimePicker"
                value={endDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndTimeChange}
                is24Hour={false}
              />
            )}
          </View>
          
          {/* Location */}
          <View style={styles.locationSection}>
            <View style={styles.locationInputContainer}>
              <MapPin size={18} color={colors.primary} style={styles.locationIcon} />
              <TextInput 
                style={[styles.locationInput, { color: colors.text }]} 
                placeholder="Location (optional)" 
                placeholderTextColor={colors.text + '80'}
                value={location} 
                onChangeText={setLocation} 
              />
            </View>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: colors.border }]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.primary }]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Event'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: { 
    padding: 20, 
    borderRadius: 16, 
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  dateTimeSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flex: 0.48,
  },
  dateTimeIcon: {
    marginRight: 8,
  },
  dateTimeText: {
    fontSize: 16,
  },
  locationSection: {
    marginBottom: 24,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: { 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    flex: 0.48,
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: { 
    padding: 14, 
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    flex: 0.48,
  },
  cancelButtonText: { 
    fontWeight: '500',
    fontSize: 16,
  },
});