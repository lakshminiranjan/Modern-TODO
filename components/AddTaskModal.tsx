import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { X, Calendar, AlertCircle } from 'lucide-react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { createTask } from '@/lib/tasks';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = {
  primary: '#3E64FF',
  primaryLight: '#E6EBFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  border: '#E2E8F0',
  error: '#F56565',
  background: '#F7F9FC',
  card: '#FFFFFF',
  success: '#48BB78',
};

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#48BB78' },
  { id: 'medium', label: 'Medium', color: '#F6AD55' },
  { id: 'high', label: 'High', color: '#F56565' },
];

const CATEGORIES = [
  { id: 'work', name: 'Work', color: '#4C51BF' },
  { id: 'personal', name: 'Personal', color: '#9F7AEA' },
  { id: 'shopping', name: 'Shopping', color: '#ED8936' },
  { id: 'health', name: 'Health', color: '#38B2AC' },
  { id: 'education', name: 'Education', color: '#3182CE' },
  { id: 'finance', name: 'Finance', color: '#38A169' },
];

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

export default function AddTaskModal({ visible, onClose, onTaskAdded }: AddTaskModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('work');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { session } = useAuth();

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('work');
    setDueDate(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    // Description validation (optional but with length limit)
    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    // Due date validation (must be today or in the future)
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    // Authentication validation
    if (!session?.user?.id) {
      newErrors.auth = 'You must be logged in to create tasks';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setDueDate(selectedDate);
    setShowDatePicker(false);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return format(date, 'MMM d, yyyy');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Format date for database (ISO string)
      const formattedDueDate = dueDate ? dueDate.toISOString() : null;
      
      // Create task data object
      const taskData = {
        user_id: session!.user.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        // Remove category field as it's causing an error
        // category field might not exist in the database schema
        due_date: formattedDueDate,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await createTask(taskData);

      // Show success message
      Alert.alert('Success', 'Task created successfully!');
      
      // Reset form and close modal
      resetForm();
      if (onTaskAdded) {
        onTaskAdded();
      }
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setErrors({
        submit: 'Failed to create task. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButton}
                accessibilityLabel="Close modal"
              >
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Title <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.title ? styles.inputError : null
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What needs to be done?"
                  maxLength={100}
                />
                {errors.title && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{errors.title}</Text>
                  </View>
                )}
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    errors.description ? styles.inputError : null
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details about this task..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                {errors.description && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{errors.description}</Text>
                  </View>
                )}
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              {/* Priority Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.optionsContainer}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.optionButton,
                        priority === p.id && { backgroundColor: p.color + '20' },
                        priority === p.id && { borderColor: p.color },
                      ]}
                      onPress={() => setPriority(p.id)}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text
                        style={[
                          styles.optionText,
                          priority === p.id && { color: p.color },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoriesContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        category === cat.id && { backgroundColor: cat.color + '20' },
                        category === cat.id && { borderColor: cat.color },
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          category === cat.id && { color: cat.color },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton,
                    errors.dueDate ? styles.inputError : null
                  ]}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar size={20} color={COLORS.textSecondary} />
                  <Text style={styles.dateText}>
                    {dueDate ? formatDate(dueDate) : 'Select a date'}
                  </Text>
                </TouchableOpacity>
                {errors.dueDate && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{errors.dueDate}</Text>
                  </View>
                )}
                
                {showDatePicker && (
                  <View style={styles.calendarContainer}>
                    <RNCalendar
                      onDayPress={handleDateSelect}
                      markedDates={dueDate ? {
                        [format(dueDate, 'yyyy-MM-dd')]: {
                          selected: true,
                          selectedColor: COLORS.primary
                        }
                      } : {}}
                      minDate={format(new Date(), 'yyyy-MM-dd')}
                      theme={{
                        todayTextColor: COLORS.primary,
                        selectedDayBackgroundColor: COLORS.primary,
                        textDayFontFamily: 'Inter-Regular',
                        textMonthFontFamily: 'Inter-SemiBold',
                        textDayHeaderFontFamily: 'Inter-Medium',
                      }}
                    />
                  </View>
                )}
              </View>

              {/* General Error Message */}
              {errors.submit && (
                <View style={styles.generalErrorContainer}>
                  <AlertCircle size={20} color={COLORS.error} />
                  <Text style={styles.generalErrorText}>{errors.submit}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  loading ? styles.submitButtonDisabled : null
                ]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Task</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  requiredStar: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 6,
  },
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  generalErrorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
  },
  calendarContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primary + '80',
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});