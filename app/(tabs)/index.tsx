import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, PlusCircle, ArrowRight, Bell } from 'lucide-react-native';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Define theme colors
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

const TASKS = [
  {
    id: '1',
    title: 'Review quarterly marketing plan',
    time: '10:00 AM',
    category: 'Work',
    priority: 'High',
    color: COLORS.primary,
  },
  {
    id: '2',
    title: 'Team standup meeting',
    time: '11:30 AM',
    category: 'Meeting',
    priority: 'Medium',
    color: COLORS.secondary,
  },
  {
    id: '3',
    title: 'Lunch with client',
    time: '1:00 PM',
    category: 'Personal',
    priority: 'Medium',
    color: COLORS.accent,
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.user_metadata?.full_name || 'User'}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell color={COLORS.textSecondary} size={24} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
              <Calendar color={COLORS.primary} size={20} />
            </View>
            <Text style={styles.quickActionText}>Add Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.secondary}20` }]}>
              <PlusCircle color={COLORS.secondary} size={20} />
            </View>
            <Text style={styles.quickActionText}>New Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.accent}20` }]}>
              <Clock color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.quickActionText}>Reminders</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Tasks */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ArrowRight color={COLORS.primary} size={16} />
            </TouchableOpacity>
          </View>

          {TASKS.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <View style={[styles.taskPriorityIndicator, { backgroundColor: task.color }]} />
              <View style={styles.taskDetails}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskMetaContainer}>
                  <Text style={styles.taskTime}>{task.time}</Text>
                  <View style={styles.taskCategoryContainer}>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                  </View>
                  <View style={[styles.taskPriorityContainer, 
                    { backgroundColor: task.priority === 'High' ? `${COLORS.error}20` : `${COLORS.secondary}20` }]}>
                    <Text style={[styles.taskPriority, 
                      { color: task.priority === 'High' ? COLORS.error : COLORS.secondary }]}>
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
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ArrowRight color={COLORS.primary} size={16} />
            </TouchableOpacity>
          </View>

          {UPCOMING_EVENTS.map((event) => (
            <TouchableOpacity key={event.id} style={styles.eventCard}>
              <View style={styles.eventDateContainer}>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
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
    backgroundColor: COLORS.error,
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
    backgroundColor: COLORS.card,
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
    color: COLORS.textSecondary,
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
    color: COLORS.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
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
    color: COLORS.text,
    marginBottom: 8,
  },
  taskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 12,
  },
  taskCategoryContainer: {
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  taskCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.card,
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
    borderRightColor: COLORS.border,
    minWidth: 80,
  },
  eventDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 4,
  },
  eventTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  eventLocation: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});