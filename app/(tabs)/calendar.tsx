import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTasks } from '../../lib/tasks';
import { getEvents, subscribeToEvents, Event, deleteEvent } from '../../lib/events';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import AddEventModal from '@/components/AddEventModal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Trash2, PlusCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<{ id: string; title: string; due_date?: string }[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    // Load calendar data immediately when component mounts
    loadCalendarData();
    
    // Set up real-time subscription
    const subscription = subscribeToEvents((updatedEvents) => {
      setEvents(updatedEvents);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCalendarData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator on initial load or forced refresh
      if ((events.length === 0 && tasks.length === 0) || forceRefresh) {
        if (forceRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }
      
      // Load tasks and events in parallel for better performance
      const [tasksPromise, eventsPromise] = [
        getTasks(forceRefresh).catch(err => {
          console.error('Error loading tasks:', err);
          return [];
        }),
        getEvents(forceRefresh).catch(err => {
          console.error('Error loading events:', err);
          return [];
        })
      ];
      
      // Wait for both promises to resolve
      const [tasksData, eventsData] = await Promise.all([tasksPromise, eventsPromise]);
      
      // Update state with the results - map tasks to match the expected state type
      // Check if tasksData is an array before mapping
      if (Array.isArray(tasksData)) {
        setTasks(tasksData.map(task => {
          if ('id' in task && 'title' in task) {
            return {
              id: task.id,
              title: task.title,
              due_date: task.due_date || undefined // Convert null to undefined
            };
          }
          return null;
        }).filter((task): task is NonNullable<typeof task> => task !== null));
      } else {
        // Handle the case where tasksData is an error object
        console.error('Invalid tasks data format:', tasksData);
        setTasks([]);
      }
      
      // Also check if eventsData is an array before setting it
      if (Array.isArray(eventsData)) {
        setEvents(eventsData);
      } else {
        console.error('Invalid events data format:', eventsData);
        setEvents([]);
      }
    } catch (err) {
      console.error('General error in loadCalendarData:', err);
      // Handle general errors silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    loadCalendarData(true);
  };

  const handleEventAdded = (newEvent?: Event) => {
    // Optimistic UI update - add the new event to the state immediately
    if (newEvent) {
      setEvents(prevEvents => [...prevEvents, newEvent]);
    } else {
      // If no event is provided, refresh the data
      loadCalendarData(true);
    }
  };
  
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    // Show confirmation dialog
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${eventTitle}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Optimistic UI update - remove the event from state immediately
              setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
              
              // Then perform the actual deletion
              await deleteEvent(eventId);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert("Error", "Failed to delete event. Please try again.");
              
              // Revert the optimistic update if there was an error
              loadCalendarData();
            }
          }
        }
      ],
      { 
        // This doesn't affect the actual styling of the Alert on most platforms
        // but it's good practice to include it for consistency
        cancelable: true
      }
    );
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const startDay = getDay(monthStart);
    
    // Create array with empty slots for days before the first day of month
    const calendarArray = Array(startDay).fill(null);
    
    // Add the actual days of the month
    return [...calendarArray, ...daysInMonth];
  }, [currentMonth]);

  const eventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const hasEventsOnDate = (date: Date) => {
    return eventsForDate(date).length > 0;
  };

  const selectedDateEvents = useMemo(() => {
    return eventsForDate(selectedDate);
  }, [selectedDate, events]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={prevMonth} style={styles.calendarNavButton}>
        <ChevronLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.calendarMonthTitle, { color: colors.text }]}>
        {format(currentMonth, 'MMMM yyyy')}
      </Text>
      <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton}>
        <ChevronRight size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderDayNames = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day, index) => (
          <Text key={index} style={[styles.dayName, { color: colors.text }]}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(700)}
          style={styles.headerContainer}
        >
          <Text style={[styles.header, { color: colors.text }]}>Calendar</Text>
          <TouchableOpacity 
            onPress={() => setIsAddEventModalVisible(true)} 
            style={styles.addButton}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? "dark" : "light"} style={styles.addButtonBlur}>
                <PlusCircle color={colors.primary} size={20} style={styles.addButtonIcon} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Event</Text>
              </BlurView>
            ) : (
              <View style={[styles.androidAddButton, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                <PlusCircle color={colors.primary} size={20} style={styles.addButtonIcon} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Event</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <AddEventModal
          visible={isAddEventModalVisible}
          onClose={() => setIsAddEventModalVisible(false)}
          onEventAdded={handleEventAdded}
        />
        
        {loading ? (
          <Animated.View 
            entering={FadeIn.delay(200).duration(700)}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading calendar...</Text>
          </Animated.View>
        ) : (
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressBackgroundColor={colors.card}
              />
            }>
            {/* Monthly Calendar View */}
            <Animated.View 
              entering={FadeInDown.delay(200).duration(700)}
              style={styles.calendarContainer}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? "dark" : "light"} style={styles.calendarBlur}>
                  {renderCalendarHeader()}
                  {renderDayNames()}
                  
                  <View style={styles.daysContainer}>
                    {calendarDays.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          { backgroundColor: day ? 'transparent' : 'transparent' },
                          day && isSameDay(day, selectedDate) && styles.selectedDay,
                          day && isSameDay(day, selectedDate) && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => day && setSelectedDate(day)}
                        disabled={!day}
                      >
                        {day ? (
                          <View style={styles.dayCellContent}>
                            <Text
                              style={[
                                styles.dayText,
                                isSameDay(day, selectedDate) && styles.selectedDayText,
                                { color: isSameDay(day, selectedDate) ? '#fff' : colors.text },
                              ]}
                            >
                              {format(day, 'd')}
                            </Text>
                            {hasEventsOnDate(day) && (
                              <View 
                                style={[
                                  styles.eventDot,
                                  { backgroundColor: isSameDay(day, selectedDate) ? '#fff' : colors.primary }
                                ]} 
                              />
                            )}
                          </View>
                        ) : (
                          <Text style={{ color: 'transparent' }}> </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </BlurView>
              ) : (
                <View style={[styles.androidCalendar, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                  {renderCalendarHeader()}
                  {renderDayNames()}
                  
                  <View style={styles.daysContainer}>
                    {calendarDays.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          { backgroundColor: day ? 'transparent' : 'transparent' },
                          day && isSameDay(day, selectedDate) && styles.selectedDay,
                          day && isSameDay(day, selectedDate) && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => day && setSelectedDate(day)}
                        disabled={!day}
                      >
                        {day ? (
                          <View style={styles.dayCellContent}>
                            <Text
                              style={[
                                styles.dayText,
                                isSameDay(day, selectedDate) && styles.selectedDayText,
                                { color: isSameDay(day, selectedDate) ? '#fff' : colors.text },
                              ]}
                            >
                              {format(day, 'd')}
                            </Text>
                            {hasEventsOnDate(day) && (
                              <View 
                                style={[
                                  styles.eventDot,
                                  { backgroundColor: isSameDay(day, selectedDate) ? '#fff' : colors.primary }
                                ]} 
                              />
                            )}
                          </View>
                        ) : (
                          <Text style={{ color: 'transparent' }}> </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Selected Date Events */}
            <Animated.View 
              entering={FadeInDown.delay(300).duration(700)}
              style={styles.selectedDateContainer}
            >
              <Text style={[styles.selectedDateHeader, { color: colors.text }]}>
                Events for {format(selectedDate, 'MMMM d, yyyy')}
              </Text>
              
              {selectedDateEvents.length === 0 ? (
                <Animated.View 
                  entering={FadeInDown.delay(400).duration(700)}
                  style={styles.noEventsContainer}
                >
                  {Platform.OS === 'ios' ? (
                    <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.noEventsBlur}>
                      <CalendarIcon size={24} color={colors.text} style={styles.noEventsIcon} />
                      <Text style={[styles.noEventsText, { color: colors.text }]}>No events scheduled for this day</Text>
                    </BlurView>
                  ) : (
                    <View style={[styles.androidNoEvents, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                      <CalendarIcon size={24} color={colors.text} style={styles.noEventsIcon} />
                      <Text style={[styles.noEventsText, { color: colors.text }]}>No events scheduled for this day</Text>
                    </View>
                  )}
                </Animated.View>
              ) : (
                selectedDateEvents.map((event, index) => (
                  <Animated.View 
                    key={event.id} 
                    entering={FadeInDown.delay(400 + (index * 100)).duration(700)}
                    style={styles.eventCardContainer}
                  >
                    {Platform.OS === 'ios' ? (
                      <BlurView intensity={isDarkMode ? 40 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.eventCardBlur}>
                        <View style={styles.eventHeader}>
                          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => handleDeleteEvent(event.id, event.title)}
                          >
                            <Trash2 size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                        
                        {event.description && (
                          <Text style={[styles.eventDescription, { color: colors.text }]}>
                            {event.description}
                          </Text>
                        )}
                        
                        <View style={styles.eventTimeContainer}>
                          <Clock size={16} color={colors.primary} style={styles.eventIcon} />
                          <Text style={[styles.eventTime, { color: colors.text }]}>
                            {format(new Date(event.start_time), 'h:mm a')}
                            {event.end_time && ` - ${format(new Date(event.end_time), 'h:mm a')}`}
                          </Text>
                        </View>
                        
                        {event.location && (
                          <View style={styles.eventLocationContainer}>
                            <MapPin size={16} color={colors.primary} style={styles.eventIcon} />
                            <Text style={[styles.eventLocation, { color: colors.text }]}>{event.location}</Text>
                          </View>
                        )}
                      </BlurView>
                    ) : (
                      <View style={[styles.androidEventCard, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                        <View style={styles.eventHeader}>
                          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => handleDeleteEvent(event.id, event.title)}
                          >
                            <Trash2 size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                        
                        {event.description && (
                          <Text style={[styles.eventDescription, { color: colors.text }]}>
                            {event.description}
                          </Text>
                        )}
                        
                        <View style={styles.eventTimeContainer}>
                          <Clock size={16} color={colors.primary} style={styles.eventIcon} />
                          <Text style={[styles.eventTime, { color: colors.text }]}>
                            {format(new Date(event.start_time), 'h:mm a')}
                            {event.end_time && ` - ${format(new Date(event.end_time), 'h:mm a')}`}
                          </Text>
                        </View>
                        
                        {event.location && (
                          <View style={styles.eventLocationContainer}>
                            <MapPin size={16} color={colors.primary} style={styles.eventIcon} />
                            <Text style={[styles.eventLocation, { color: colors.text }]}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Animated.View>
                ))
              )}
            </Animated.View>
          </ScrollView>
        )}
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
    padding: 16,
    paddingBottom: 80, // Add extra padding at the bottom to account for the tab bar
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },

  addButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: '100%',
  },
  androidAddButton: {
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
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  calendarContainer: {
    borderRadius: 16,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    marginBottom: 16,
  },
  calendarBlur: {
    padding: 16,
    borderRadius: 16,
  },
  androidCalendar: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 20,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7 days per row
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayCellContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: '80%',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  selectedDay: {
    borderRadius: 20,
  },
  selectedDayText: {
    fontFamily: 'Inter-Bold',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },
  selectedDateContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  selectedDateHeader: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  noEventsContainer: {
    borderRadius: 16,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    marginBottom: 12,
  },
  noEventsBlur: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidNoEvents: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  noEventsIcon: {
    marginBottom: 12,
    opacity: 0.7,
  },
  noEventsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    opacity: 0.8,
  },
  eventCardContainer: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  eventCardBlur: {
    padding: 16,
    borderRadius: 16,
  },
  androidEventCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(125, 211, 252, 0.15)',
    padding: 8,
    borderRadius: 8,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    padding: 8,
    borderRadius: 8,
  },
  eventIcon: {
    marginRight: 8,
  },
  eventTime: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  eventLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});