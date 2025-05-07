import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CirclePlus as PlusCircle, CircleCheck as CheckCircle, Circle, Search, ChevronDown, Trash2 } from 'lucide-react-native';
import { getTasks, updateTask, deleteTask, subscribeToTasks, Task } from '@/lib/tasks';
import AddTaskModal from '@/components/AddTaskModal';

const COLORS = {
  primary: '#3E64FF',
  secondary: '#38B2AC',
  accent: '#9F7AEA',
  background: '#F7F9FC',
  card: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  border: '#E2E8F0',
  success: '#48BB78',
  warning: '#F6AD55',
  error: '#F56565',
};

const CATEGORIES = [
  { id: 'all', name: 'All', color: COLORS.primary },
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

  useEffect(() => {
    loadTasks();
    const subscription = subscribeToTasks(setTasks);
    return () => subscription.unsubscribe();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const getCategoryColor = (categoryId) => {
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.color : COLORS.primary;
  };

  const getPriorityIndicator = (priority) => {
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
    const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory;
    const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const completionMatch = showCompletedTasks || task.status !== 'completed';
    return categoryMatch && searchMatch && completionMatch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity 
          style={styles.addTaskButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <PlusCircle color={COLORS.primary} size={24} />
          <Text style={styles.addTaskText}>New Task</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
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
                selectedCategory === category.id && styles.categoryButtonActive,
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
          style={styles.completedFilterButton}
          onPress={() => setShowCompletedTasks(!showCompletedTasks)}
        >
          <Text style={styles.completedFilterText}>
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
            <Text style={styles.noTasksText}>Loading tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.noTasksContainer}>
            <Text style={styles.noTasksText}>Error: {error}</Text>
          </View>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
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
                    { backgroundColor: `${getCategoryColor(task.category)}20` }
                  ]}>
                    <Text style={[
                      styles.taskCategoryText,
                      { color: getCategoryColor(task.category) }
                    ]}>
                      {CATEGORIES.find(cat => cat.id === task.category)?.name || 'Other'}
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
                  
                  <Text style={styles.taskDueDate}>Due: {task.due_date || 'No date'}</Text>
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