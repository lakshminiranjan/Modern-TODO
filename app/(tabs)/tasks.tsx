import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CirclePlus as PlusCircle, CircleCheck as CheckCircle, Circle, Search, ChevronDown, Trash2, Filter } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { getTasks, updateTask, deleteTask, subscribeToTasks, Task } from '../../lib/tasks';
import AddTaskModal from '../../components/AddTaskModal';
import { useTheme } from '../../contexts/ThemeContext';
import COLORS from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
      
      setTasks(data as Task[]);
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
    <View style={{ flex: 1 }}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(700)}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { color: COLORS.text }]}>Tasks</Text>
          <TouchableOpacity 
            style={styles.addTaskButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={60} tint="light" style={styles.addTaskBlur}>
                <PlusCircle color={COLORS.primary} size={24} />
                <Text style={[styles.addTaskText, { color: COLORS.primary }]}>New Task</Text>
              </BlurView>
            ) : (
              <View style={[styles.androidAddTask, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]}>
                <PlusCircle color={COLORS.primary} size={24} />
                <Text style={[styles.addTaskText, { color: COLORS.primary }]}>New Task</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(700)}
          style={styles.searchContainer}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.searchBlur}>
              <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: COLORS.text }]}
                placeholder="Search tasks..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          ) : (
            <View style={[styles.androidSearch, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
              <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: COLORS.text }]}
                placeholder="Search tasks..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}
        </Animated.View>

        {/* Category Filter */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(700)}
          style={styles.filterContainer}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {CATEGORIES.map((category, index) => (
              <Animated.View 
                key={category.id}
                entering={FadeInDown.delay(400 + (index * 50)).duration(700)}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id ? 
                      { backgroundColor: category.color } : 
                      Platform.OS === 'ios' ? 
                        { borderColor: category.color } : 
                        { 
                          backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                          borderColor: category.color 
                        }
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  {Platform.OS === 'ios' && selectedCategory !== category.id && (
                    <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.categoryBlur}>
                      <Text style={[styles.categoryButtonText, { color: category.color }]}>
                        {category.name}
                      </Text>
                    </BlurView>
                  )}
                  
                  {(Platform.OS !== 'ios' || selectedCategory === category.id) && (
                    <Text 
                      style={[
                        styles.categoryButtonText,
                        { color: selectedCategory === category.id ? '#FFFFFF' : category.color }
                      ]}
                    >
                      {category.name}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Completed Filter */}
        <Animated.View 
          entering={FadeInDown.delay(500).duration(700)}
          style={styles.completedFilterContainer}
        >
          <TouchableOpacity 
            style={styles.completedFilterButton}
            onPress={() => setShowCompletedTasks(!showCompletedTasks)}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.filterBlur}>
                <Filter size={16} color={COLORS.textSecondary} style={styles.filterIcon} />
                <Text style={[styles.completedFilterText, { color: COLORS.text }]}>
                  {showCompletedTasks ? 'Hide Completed Tasks' : 'Show Completed Tasks'}
                </Text>
                <ChevronDown size={16} color={COLORS.textSecondary} />
              </BlurView>
            ) : (
              <View style={[styles.androidFilter, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                <Filter size={16} color={COLORS.textSecondary} style={styles.filterIcon} />
                <Text style={[styles.completedFilterText, { color: COLORS.text }]}>
                  {showCompletedTasks ? 'Hide Completed Tasks' : 'Show Completed Tasks'}
                </Text>
                <ChevronDown size={16} color={COLORS.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Task List */}
        <ScrollView
          style={styles.taskList}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Animated.View 
              entering={FadeIn.delay(600).duration(700)}
              style={styles.noTasksContainer}
            >
              <Text style={[styles.noTasksText, { color: COLORS.textSecondary }]}>Loading tasks...</Text>
            </Animated.View>
          ) : error ? (
            <Animated.View 
              entering={FadeIn.delay(600).duration(700)}
              style={styles.noTasksContainer}
            >
              <Text style={[styles.noTasksText, { color: COLORS.error }]}>Error: {error}</Text>
            </Animated.View>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <Animated.View 
                key={task.id} 
                entering={FadeInDown.delay(600 + (index * 100)).duration(700)}
                style={styles.taskItemContainer}
              >
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.taskItemBlur}>
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
                        { color: COLORS.text },
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
                        
                        <Text style={[styles.taskDueDate, { color: COLORS.textSecondary }]}>
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
                  </BlurView>
                ) : (
                  <View style={[styles.androidTaskItem, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
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
                        { color: COLORS.text },
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
                        
                        <Text style={[styles.taskDueDate, { color: COLORS.textSecondary }]}>
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
                )}
              </Animated.View>
            ))
          ) : (
            <Animated.View 
              entering={FadeIn.delay(600).duration(700)}
              style={styles.noTasksContainer}
            >
              <Text style={[styles.noTasksText, { color: COLORS.text }]}>No tasks found</Text>
              <Text style={[styles.noTasksSubtext, { color: COLORS.textSecondary }]}>Try changing your filters or create a new task</Text>
            </Animated.View>
          )}
        </ScrollView>

        <AddTaskModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          onTaskAdded={loadTasks}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    paddingBottom: 80, // Add extra padding at the bottom to account for the tab bar
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
    fontSize: 28,
  },
  addTaskButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addTaskBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: '100%',
  },
  androidAddTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addTaskText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    height: 50,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  androidSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    paddingVertical: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryList: {
    paddingVertical: 4,
  },
  categoryButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  categoryBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  categoryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  completedFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  completedFilterButton: {
    borderRadius: 12,
    height: 44,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  filterBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: '100%',
  },
  androidFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: '100%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  filterIcon: {
    marginRight: 8,
  },
  completedFilterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskItemContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  taskItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  androidTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
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
    marginBottom: 8,
  },
  noTasksSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});