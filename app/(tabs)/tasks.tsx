import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CirclePlus as PlusCircle, CircleCheck as CheckCircle, Circle, Search, ChevronDown, Trash2 } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { getTasks, updateTask, deleteTask, subscribeToTasks, Task } from '../../lib/tasks';
import AddTaskModal from '../../components/AddTaskModal';
import { useTheme } from '../../contexts/ThemeContext';
import COLORS from '@/constants/colors';

// Define categories with dynamic colors
const getCategoriesWithColors = (colors: any) => [
  { id: 'all', name: 'All', color: colors.primary },
  { id: 'work', name: 'Work', color: '#4C51BF' },
  { id: 'personal', name: 'Personal', color: '#9F7AEA' },
  { id: 'shopping', name: 'Shopping', color: '#ED8936' },
  { id: 'health', name: 'Health', color: '#38B2AC' },
];

export default function TasksScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const { colors: COLORS, isDarkMode } = useTheme();

  useEffect(() => {
    // Load tasks immediately when component mounts
    loadTasks();
    
    // Set up real-time subscription
    const subscription = subscribeToTasks(setTasks);
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTasks = async (forceRefresh = false) => {
    try {
      // Only show loading indicator on initial load or forced refresh
      if (tasks.length === 0 || forceRefresh) {
        setLoading(true);
      }
      
      // Clear any previous errors
      setError(null);
      
      console.log('Loading tasks from server...');
      const data = await getTasks(forceRefresh);
      console.log(`Loaded ${data.length} tasks from server`);
      
      setTasks(data);
    } catch (err: unknown) {
      console.error('Error loading tasks:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      console.log(`Toggling task ${taskId} from ${currentStatus} to ${newStatus}`);
      
      // Update local state immediately for better UX
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updated_at: new Date().toISOString() } 
            : task
        )
      );
      
      // Send update to the server
      await updateTask(taskId, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      // Show success message (optional)
      console.log(`Successfully updated task ${taskId} status to ${newStatus}`);
      
      // Refresh tasks from server to ensure consistency
      loadTasks();
    } catch (err: unknown) {
      console.error('Error toggling task completion:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to update task status: ${errorMessage}`);
      
      // Revert the optimistic update if there was an error
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log(`Attempting to delete task ${taskId}`);
      
      // Update local state immediately for better UX
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Send delete request to the server
      await deleteTask(taskId);
      console.log(`Task ${taskId} deleted successfully`);
      
      // Refresh tasks from server to ensure consistency
      loadTasks();
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to delete task: ${errorMessage}`);
      
      // Revert the optimistic update if there was an error
      loadTasks();
    }
  };

  const getCategoryColor = () => {
    // Since category field doesn't exist in the database, we'll always use 'work' category color
    const categories = getCategoriesWithColors(COLORS);
    const category = categories.find(cat => cat.id === 'work');
    return category ? category.color : COLORS.primary;
  };

  const getPriorityIndicator = (priority: string | undefined | null) => {
    switch(priority) {
      case 'high':
        return { color: COLORS.error, label: 'High' };
      case 'medium':
        return { color: COLORS.warning, label: 'Medium' };
      case 'low':
        return { color: COLORS.success, label: 'Low' };
      default:
        return { color: COLORS.textSecondary, label: 'None' };
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Since category field doesn't exist in the database, we'll treat all tasks as 'work' category
    // or show all tasks when 'all' is selected
    const categoryMatch = selectedCategory === 'all' || selectedCategory === 'work';
    const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const completionMatch = showCompletedTasks || task.status !== 'completed';
    return categoryMatch && searchMatch && completionMatch;
  });

  // Get categories with current theme colors
  const CATEGORIES = getCategoriesWithColors(COLORS);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Tasks</Text>
        <TouchableOpacity 
          style={[styles.addTaskButton, { backgroundColor: `${COLORS.primary}10` }]}
          onPress={() => setIsAddModalVisible(true)}
        >
          <PlusCircle color={COLORS.primary} size={24} />
          <Text style={[styles.addTaskText, { color: COLORS.primary }]}>New Task</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { 
        backgroundColor: COLORS.card,
        borderColor: COLORS.border
      }]}>
        <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.text }]}
          placeholder="Search tasks..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { backgroundColor: isDarkMode ? COLORS.card : '#FFFFFF' },
                selectedCategory === category.id && [
                  styles.categoryButtonActive,
                  { backgroundColor: category.color }
                ],
                { borderColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive,
                  { color: selectedCategory === category.id ? '#FFFFFF' : category.color }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.completedFilterContainer}>
        <TouchableOpacity 
          style={[styles.completedFilterButton, { 
            backgroundColor: COLORS.card,
            borderColor: COLORS.border
          }]}
          onPress={() => setShowCompletedTasks(!showCompletedTasks)}
        >
          <Text style={[styles.completedFilterText, { color: COLORS.text }]}>
            {showCompletedTasks ? 'Hide Completed Tasks' : 'Show Completed Tasks'}
          </Text>
          <ChevronDown size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.noTasksContainer}>
            <Text style={[styles.noTasksText, { color: COLORS.textSecondary }]}>Loading tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.noTasksContainer}>
            <Text style={[styles.noTasksText, { color: COLORS.error }]}>Error: {error}</Text>
          </View>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task.id} style={[styles.taskItem, { backgroundColor: COLORS.card }]}>
              <TouchableOpacity 
                style={styles.taskCheckbox}
                onPress={() => toggleTaskCompletion(task.id, task.status)}
              >
                {task.status === 'completed' ? (
                  <CheckCircle size={24} color={COLORS.success} />
                ) : (
                  <Circle size={24} color={COLORS.textSecondary} />
                )}
              </TouchableOpacity>
              
              <View style={styles.taskContent}>
                <Text style={[
                  styles.taskTitle,
                  task.status === 'completed' && styles.taskTitleCompleted
                ]}>
                  {task.title}
                </Text>
                
                <View style={styles.taskMeta}>
                  <View style={[
                    styles.taskCategoryBadge, 
                    { backgroundColor: `${getCategoryColor()}20` }
                  ]}>
                    <Text style={[
                      styles.taskCategoryText,
                      { color: getCategoryColor() }
                    ]}>
                      Work
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.taskPriorityBadge,
                    { backgroundColor: `${getPriorityIndicator(task.priority).color}20` }
                  ]}>
                    <Text style={[
                      styles.taskPriorityText,
                      { color: getPriorityIndicator(task.priority).color }
                    ]}>
                      {getPriorityIndicator(task.priority).label}
                    </Text>
                  </View>
                  
                  <Text style={styles.taskDueDate}>
                    Due: {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'No date'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.taskDeleteButton}
                onPress={() => handleDeleteTask(task.id)}
              >
                <Trash2 size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noTasksContainer}>
            <Text style={styles.noTasksText}>No tasks found</Text>
            <Text style={styles.noTasksSubtext}>Try changing your filters or create a new task</Text>
          </View>
        )}
      </ScrollView>

      <AddTaskModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onTaskAdded={loadTasks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: COLORS.text,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTaskText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  filterContainer: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  completedFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  completedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedFilterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskCategoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  taskPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskPriorityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  taskDueDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  taskDeleteButton: {
    padding: 8,
  },
  noTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noTasksText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  noTasksSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});