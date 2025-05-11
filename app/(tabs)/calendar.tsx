import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTasks } from '../../lib/tasks';
import { getEvents, subscribeToEvents, Event, deleteEvent } from '../../lib/events';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import AddEventModal from '@/components/AddEventModal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Trash2 } from 'lucide-react-native';

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<{ id: string; title: string; due_date?: string }[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { colors } = useTheme();

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
      
      // Update state with the results
      setTasks(tasksData);
      setEvents(eventsData);
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
      ]
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
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>Calendar</Text>
        <TouchableOpacity 
          onPress={() => setIsAddEventModalVisible(true)} 
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Add Event</Text>
        </TouchableOpacity>
      </View>
      

      <AddEventModal
        visible={isAddEventModalVisible}
        onClose={() => setIsAddEventModalVisible(false)}
        onEventAdded={handleEventAdded}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading calendar...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }>
          {/* Monthly Calendar View */}
          <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
            {renderCalendarHeader()}
            {renderDayNames()}
            
            <View style={styles.daysContainer}>
              {calendarDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
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
                    <Text> </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selected Date Events */}
          <View style={styles.selectedDateContainer}>
            <Text style={[styles.selectedDateHeader, { color: colors.text }]}>
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </Text>
            
            {selectedDateEvents.length === 0 ? (
              <View style={[styles.noEventsContainer, { backgroundColor: colors.card }]}>
                <CalendarIcon size={24} color={colors.text} style={styles.noEventsIcon} />
                <Text style={[styles.noEventsText, { color: colors.text }]}>No events scheduled for this day</Text>
              </View>
            ) : (
              selectedDateEvents.map((event) => (
                <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.card }]}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEvent(event.id, event.title)}
                    >
                      <Trash2 size={18} color="#dc3545" />
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
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },

  addButton: {
    backgroundColor: '#3E64FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 4,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
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
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDay: {
    borderRadius: 20,
  },
  selectedDayText: {
    fontWeight: 'bold',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  selectedDateContainer: {
    marginTop: 8,
  },
  selectedDateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noEventsContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsIcon: {
    marginBottom: 8,
    opacity: 0.7,
  },
  noEventsText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    marginRight: 6,
  },
  eventTime: {
    fontSize: 14,
  },
  eventLocation: {
    fontSize: 14,
  },
});