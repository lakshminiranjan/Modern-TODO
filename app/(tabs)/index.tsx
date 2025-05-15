import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, PlusCircle, ArrowRight, Bell } from 'lucide-react-native';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, COLORS as ThemeColors } from '@/contexts/ThemeContext';

// Default colors for static data
const DefaultColors = {
  primary: '#3182CE',
  secondary: '#805AD5',
  accent: '#38B2AC',
};

const TASKS = [
  {
    id: '1',
    title: 'Review quarterly marketing plan',
    time: '10:00 AM',
    category: 'Work',
    priority: 'High',
    color: DefaultColors.primary,
  },
  {
    id: '2',
    title: 'Team standup meeting',
    time: '11:30 AM',
    category: 'Meeting',
    priority: 'Medium',
    color: DefaultColors.secondary,
  },
  {
    id: '3',
    title: 'Lunch with client',
    time: '1:00 PM',
    category: 'Personal',
    priority: 'Medium',
    color: DefaultColors.accent,
  },
];

const UPCOMING_EVENTS = [
  {
    id: '1',
    title: 'Weekly review with management',
    date: 'Tomorrow',
    time: '9:30 AM',
    location: 'Conference Room A',
  },
  {
    id: '2',
    title: 'Product roadmap planning',
    date: 'May 15, 2025',
    time: '2:00 PM',
    location: 'Main Office',
  },
];

export default function DashboardScreen() {
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good morning,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.user_metadata?.full_name || 'User'}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formattedDate}</Text>
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
            <Bell color={colors.textSecondary} size={24} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Calendar color={colors.primary} size={20} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Add Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.secondary}20` }]}>
              <PlusCircle color={colors.secondary} size={20} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>New Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
              <Clock color={colors.accent} size={20} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Reminders</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Tasks */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Tasks</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              <ArrowRight color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>

          {TASKS.map((task) => (
            <TouchableOpacity key={task.id} style={[styles.taskCard, { backgroundColor: colors.card }]}>
              <View style={[styles.taskPriorityIndicator, { backgroundColor: task.color }]} />
              <View style={styles.taskDetails}>
                <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                <View style={styles.taskMetaContainer}>
                  <Text style={[styles.taskTime, { color: colors.textSecondary }]}>{task.time}</Text>
                  <View style={[styles.taskCategoryContainer, { backgroundColor: isDarkMode ? colors.card : '#EDF2F7' }]}>
                    <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>{task.category}</Text>
                  </View>
                  <View style={[styles.taskPriorityContainer, 
                    { backgroundColor: task.priority === 'High' ? `${colors.error}20` : `${colors.secondary}20` }]}>
                    <Text style={[styles.taskPriority, 
                      { color: task.priority === 'High' ? colors.error : colors.secondary }]}>
                      {task.priority}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Events */}
        <View style={[styles.sectionContainer, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              <ArrowRight color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>

          {UPCOMING_EVENTS.map((event) => (
            <TouchableOpacity key={event.id} style={[styles.eventCard, { backgroundColor: colors.card }]}>
              <View style={[styles.eventDateContainer, { borderRightColor: colors.border }]}>
                <Text style={[styles.eventDate, { color: colors.primary }]}>{event.date}</Text>
                <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{event.time}</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>{event.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80, // Add extra padding at the bottom to account for the tab bar
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'gray', // Will be overridden by dynamic style
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    marginBottom: 4,
    color: 'black', // Will be overridden by dynamic style
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'gray', // Will be overridden by dynamic style
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  taskCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskPriorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  taskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 12,
  },
  taskCategoryContainer: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  taskCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  taskPriorityContainer: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  taskPriority: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventDateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    minWidth: 80,
  },
  eventDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  eventTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  eventLocation: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});