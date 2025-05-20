import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, PlusCircle, ArrowRight, Bell, CheckCircle, BarChart2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, COLORS as ThemeColors } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// TaskMaster colors matching login screen
const DefaultColors = {
  primary: '#5F00BA',    // Indigo tone (top gradient color)
  secondary: '#FF4CC9',  // Pink-magenta (bottom gradient color)
  accent: '#4F46E5',     // Accent color for highlights
  primaryDark: '#3730A3', // Darker indigo for shadows
  primaryLight: '#818CF8', // Lighter indigo
};

// Define text colors for better visibility on gradient background
const TextColors = {
  light: '#FFFFFF',
  lightSecondary: 'rgba(255, 255, 255, 0.8)',
  dark: '#1A202C',
  darkSecondary: '#4A5568',
  
  // Additional colors for glassmorphism
  cardBackground: 'rgba(255, 255, 255, 0.1)',
  cardBorder: 'rgba(255, 255, 255, 0.2)',
  cardShadow: 'rgba(0, 0, 0, 0.2)',
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
  const { colors } = useTheme();
  // Determine dark mode based on theme colors (adjust logic as needed)
  const isDarkMode = colors.background === '#1A202C' || colors.background === '#000';
  
  // Override colors for better visibility on gradient background
  const overrideColors = {
    text: TextColors.light,
    textSecondary: TextColors.lightSecondary,
    iconBackground: 'rgba(255, 255, 255, 0.25)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
    divider: 'rgba(255, 255, 255, 0.3)',
    cardBackground: 'rgba(255, 255, 255, 0.2)',
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      
      {/* Background gradient matching calendar page */}
      <LinearGradient
        colors={[DefaultColors.primaryDark, DefaultColors.primary, DefaultColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative circles for depth - matching login screen */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(700)}
            style={styles.header}
          >
            <View>
              <Text style={[styles.greeting, { color: TextColors.lightSecondary }]}>Good morning,</Text>
              <Text style={[styles.userName, { color: TextColors.light }]}>{user?.user_metadata?.full_name || 'User'}</Text>
              <Text style={[styles.date, { color: TextColors.lightSecondary }]}>{formattedDate}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={25} tint="light" style={[styles.blurView, { borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1.5, borderRadius: 16 }]}>
                  <Bell color={TextColors.light} size={24} />
                  <View style={[styles.notificationBadge, { backgroundColor: DefaultColors.primary }]} />
                </BlurView>
              ) : (
                <View style={[styles.androidButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1.5, borderRadius: 16 }]}>
                  <Bell color={TextColors.light} size={24} />
                  <View style={[styles.notificationBadge, { backgroundColor: DefaultColors.primary }]} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Overview */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(700)}
            style={styles.statsContainer}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={40} tint="light" style={[styles.statsBlurView, { borderColor: TextColors.cardBorder, borderWidth: 1.5, borderRadius: 24 }]}>
                <View style={styles.statsContent}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                      <CheckCircle color={TextColors.light} size={20} />
                    </View>
                    <Text style={[styles.statNumber, { color: TextColors.light }]}>12</Text>
                    <Text style={[styles.statLabel, { color: TextColors.lightSecondary }]}>Completed</Text>
                  </View>
                  
                  <View style={[styles.statDivider, { backgroundColor: 'rgba(203, 213, 224, 0.5)' }]} />
                  
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                      <Clock color={TextColors.light} size={20} />
                    </View>
                    <Text style={[styles.statNumber, { color: TextColors.light }]}>8</Text>
                    <Text style={[styles.statLabel, { color: TextColors.lightSecondary }]}>Pending</Text>
                  </View>
                  
                  <View style={[styles.statDivider, { backgroundColor: 'rgba(203, 213, 224, 0.5)' }]} />
                  
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                      <BarChart2 color={TextColors.light} size={20} />
                    </View>
                    <Text style={[styles.statNumber, { color: TextColors.light }]}>60%</Text>
                    <Text style={[styles.statLabel, { color: TextColors.lightSecondary }]}>Progress</Text>
                  </View>
                </View>
              </BlurView>
            ) : (
              <View style={[styles.androidStatsView, { backgroundColor: TextColors.cardBackground, borderColor: TextColors.cardBorder, borderWidth: 1.5, borderRadius: 24 }]}>
                <View style={styles.statsContent}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                      <CheckCircle color={TextColors.light} size={20} />
                    </View>
                    <Text style={[styles.statNumber, { color: TextColors.light }]}>12</Text>
                    <Text style={[styles.statLabel, { color: TextColors.lightSecondary }]}>Completed</Text>
                  </View>
                  
                  <View style={[styles.statDivider, { backgroundColor: 'rgba(203, 213, 224, 0.5)' }]} />
                  
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                      <Clock color={TextColors.light} size={20} />
                    </View>
                    <Text style={[styles.statNumber, { color: TextColors.light }]}>8</Text>
                    <Text style={[styles.statLabel, { color: TextColors.lightSecondary }]}>Pending</Text>
                  </View>
                  
                  <View style={[styles.statDivider, { backgroundColor: 'rgba(203, 213, 224, 0.5)' }]} />
                  
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                      <BarChart2 color={TextColors.light} size={20} />
                    </View>
                    <Text style={[styles.statNumber, { color: TextColors.light }]}>60%</Text>
                    <Text style={[styles.statLabel, { color: TextColors.lightSecondary }]}>Progress</Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(700)}
            style={styles.quickActionsContainer}
          >
            <TouchableOpacity style={styles.quickActionBtn}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={40} tint="light" style={[styles.quickActionBlur, { borderColor: TextColors.cardBorder, borderWidth: 1.5 }]}>
                  <LinearGradient
                    colors={[DefaultColors.primary, DefaultColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.iconContainer}>
                      <Calendar color={TextColors.light} size={24} />
                    </View>
                    <Text style={[styles.quickActionText, { color: TextColors.light, fontFamily: 'Inter-SemiBold' }]}>Add Event</Text>
                  </LinearGradient>
                </BlurView>
              ) : (
                <View style={[styles.androidQuickAction, { backgroundColor: TextColors.cardBackground, borderColor: TextColors.cardBorder, borderWidth: 1.5 }]}>
                  <LinearGradient
                    colors={[DefaultColors.primary, DefaultColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.iconContainer}>
                      <Calendar color={TextColors.light} size={24} />
                    </View>
                    <Text style={[styles.quickActionText, { color: TextColors.light, fontFamily: 'Inter-SemiBold' }]}>Add Event</Text>
                  </LinearGradient>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionBtn}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={40} tint="light" style={[styles.quickActionBlur, { borderColor: TextColors.cardBorder, borderWidth: 1.5 }]}>
                  <LinearGradient
                    colors={[DefaultColors.primary, DefaultColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.iconContainer}>
                      <PlusCircle color={TextColors.light} size={24} />
                    </View>
                    <Text style={[styles.quickActionText, { color: TextColors.light, fontFamily: 'Inter-SemiBold' }]}>New Task</Text>
                  </LinearGradient>
                </BlurView>
              ) : (
                <View style={[styles.androidQuickAction, { backgroundColor: TextColors.cardBackground, borderColor: TextColors.cardBorder, borderWidth: 1.5 }]}>
                  <LinearGradient
                    colors={[DefaultColors.primary, DefaultColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.iconContainer}>
                      <PlusCircle color={TextColors.light} size={24} />
                    </View>
                    <Text style={[styles.quickActionText, { color: TextColors.light, fontFamily: 'Inter-SemiBold' }]}>New Task</Text>
                  </LinearGradient>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionBtn}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={40} tint="light" style={[styles.quickActionBlur, { borderColor: TextColors.cardBorder, borderWidth: 1.5 }]}>
                  <LinearGradient
                    colors={[DefaultColors.primary, DefaultColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.iconContainer}>
                      <Clock color={TextColors.light} size={24} />
                    </View>
                    <Text style={[styles.quickActionText, { color: TextColors.light, fontFamily: 'Inter-SemiBold' }]}>Reminders</Text>
                  </LinearGradient>
                </BlurView>
              ) : (
                <View style={[styles.androidQuickAction, { backgroundColor: TextColors.cardBackground, borderColor: TextColors.cardBorder, borderWidth: 1.5 }]}>
                  <LinearGradient
                    colors={[DefaultColors.primary, DefaultColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.iconContainer}>
                      <Clock color={TextColors.light} size={24} />
                    </View>
                    <Text style={[styles.quickActionText, { color: TextColors.light, fontFamily: 'Inter-SemiBold' }]}>Reminders</Text>
                  </LinearGradient>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Today's Tasks */}
          <Animated.View 
            entering={FadeInDown.delay(400).duration(700)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: TextColors.light }]}>Today's Tasks</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: TextColors.lightSecondary }]}>See All</Text>
                <ArrowRight color={TextColors.lightSecondary} size={16} />
              </TouchableOpacity>
            </View>

            {TASKS.map((task, index) => (
              <Animated.View 
                key={task.id} 
                entering={FadeInDown.delay(500 + (index * 100)).duration(700)}
              >
                <TouchableOpacity style={styles.taskCardContainer}>
                  {Platform.OS === 'ios' ? (
                    <BlurView intensity={40} tint="light" style={[styles.taskCardBlur, { borderColor: TextColors.cardBorder, borderWidth: 1.5, borderRadius: 24 }]}>
                      <View style={[styles.taskPriorityIndicator, { backgroundColor: task.priority === 'High' ? DefaultColors.secondary : DefaultColors.primary }]} />
                      <View style={styles.taskDetails}>
                        <Text style={[styles.taskTitle, { color: TextColors.light }]}>{task.title}</Text>
                        <View style={styles.taskMetaContainer}>
                          <Text style={[styles.taskTime, { color: TextColors.lightSecondary }]}>{task.time}</Text>
                          <View style={[styles.taskCategoryContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                            <Text style={[styles.taskCategory, { color: TextColors.light }]}>{task.category}</Text>
                          </View>
                          <View style={[styles.taskPriorityContainer, 
                            { backgroundColor: task.priority === 'High' ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.25)' }]}>
                            <Text style={[styles.taskPriority, 
                              { color: task.priority === 'High' ? DefaultColors.primary : TextColors.light }]}>
                              {task.priority}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </BlurView>
                  ) : (
                    <View style={[styles.androidTaskCard, { backgroundColor: TextColors.cardBackground, borderColor: TextColors.cardBorder, borderWidth: 1.5, borderRadius: 24 }]}>
                      <View style={[styles.taskPriorityIndicator, { backgroundColor: task.priority === 'High' ? DefaultColors.secondary : DefaultColors.primary }]} />
                      <View style={styles.taskDetails}>
                        <Text style={[styles.taskTitle, { color: TextColors.light }]}>{task.title}</Text>
                        <View style={styles.taskMetaContainer}>
                          <Text style={[styles.taskTime, { color: TextColors.lightSecondary }]}>{task.time}</Text>
                          <View style={[styles.taskCategoryContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                            <Text style={[styles.taskCategory, { color: TextColors.light }]}>{task.category}</Text>
                          </View>
                          <View style={[styles.taskPriorityContainer, 
                            { backgroundColor: task.priority === 'High' ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.25)' }]}>
                            <Text style={[styles.taskPriority, 
                              { color: task.priority === 'High' ? DefaultColors.primary : TextColors.light }]}>
                              {task.priority}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Upcoming Events */}
          <Animated.View 
            entering={FadeInDown.delay(800).duration(700)}
            style={[styles.sectionContainer, { marginBottom: 100 }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: TextColors.light }]}>Upcoming Events</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: TextColors.lightSecondary }]}>See All</Text>
                <ArrowRight color={TextColors.lightSecondary} size={16} />
              </TouchableOpacity>
            </View>

            {UPCOMING_EVENTS.map((event, index) => (
              <Animated.View 
                key={event.id} 
                entering={FadeInDown.delay(900 + (index * 100)).duration(700)}
              >
                <TouchableOpacity style={styles.eventCardContainer}>
                  {Platform.OS === 'ios' ? (
                    <BlurView intensity={25} tint="light" style={[styles.eventCardBlur, { borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1.5, borderRadius: 16 }]}>
                      <View style={[styles.eventDateContainer, { borderRightColor: 'rgba(255, 255, 255, 0.3)' }]}>
                        <Text style={[styles.eventDate, { color: TextColors.light }]}>{event.date}</Text>
                        <Text style={[styles.eventTime, { color: TextColors.lightSecondary }]}>{event.time}</Text>
                      </View>
                      <View style={styles.eventDetails}>
                        <Text style={[styles.eventTitle, { color: TextColors.light }]}>{event.title}</Text>
                        <Text style={[styles.eventLocation, { color: TextColors.lightSecondary }]}>{event.location}</Text>
                      </View>
                    </BlurView>
                  ) : (
                    <View style={[styles.androidEventCard, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1.5, borderRadius: 16 }]}>
                      <View style={[styles.eventDateContainer, { borderRightColor: 'rgba(255, 255, 255, 0.3)' }]}>
                        <Text style={[styles.eventDate, { color: TextColors.light }]}>{event.date}</Text>
                        <Text style={[styles.eventTime, { color: TextColors.lightSecondary }]}>{event.time}</Text>
                      </View>
                      <View style={styles.eventDetails}>
                        <Text style={[styles.eventTitle, { color: TextColors.light }]}>{event.title}</Text>
                        <Text style={[styles.eventLocation, { color: TextColors.lightSecondary }]}>{event.location}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
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
  decorativeCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  container: {
    flex: 1,
    paddingBottom: 80, // Add extra padding at the bottom to account for the tab bar
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 30,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  notificationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 20,
  },
  blurView: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  androidButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Stats section
  statsContainer: {
    marginBottom: 28,
  },
  statsBlurView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  androidStatsView: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 50,
    marginHorizontal: 8,
  },
  // Quick actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 0,
  },
  quickActionBtn: {
    width: (width - 56) / 3, // Equal width for all 3 buttons with proper spacing
    height: 110,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  androidQuickAction: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Match the stat icon container background
    marginBottom: 12,
  },
  quickActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  quickActionGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  // Section containers
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    letterSpacing: -0.3,
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
  // Task cards
  taskCardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  taskCardBlur: {
    flexDirection: 'row',
    padding: 18,
    paddingLeft: 0,
    borderRadius: 20,
    alignItems: 'center',
  },
  androidTaskCard: {
    flexDirection: 'row',
    padding: 18,
    paddingLeft: 0,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  taskPriorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 14,
    alignSelf: 'stretch',
  },
  taskDetails: {
    flex: 1,
    paddingLeft: 12,
  },
  taskTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 17,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  taskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 12,
    marginBottom: 4,
  },
  taskCategoryContainer: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
  },
  taskCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  taskPriorityContainer: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  taskPriority: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  // Event cards
  eventCardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventCardBlur: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  androidEventCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
  actionArrow: {
    marginLeft: 4,
    position: 'relative',
  },
});