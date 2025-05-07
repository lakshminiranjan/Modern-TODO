import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarComponent } from 'react-native-calendars';
import { ChevronLeft, ChevronRight, CirclePlus as PlusCircle, Clock, MapPin, Users } from 'lucide-react-native';
import { format } from 'date-fns';

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
};

// Sample event data
const EVENTS = {
  '2025-05-14': [
    { id: '1', title: 'Team Meeting', time: '10:00 AM - 11:00 AM', location: 'Conference Room A', attendees: 5, color: COLORS.primary },
    { id: '2', title: 'Lunch with Client', time: '12:30 PM - 1:30 PM', location: 'Downtown Cafe', attendees: 2, color: COLORS.accent },
    { id: '3', title: 'Project Review', time: '3:00 PM - 4:00 PM', location: 'Meeting Room B', attendees: 8, color: COLORS.secondary },
  ],
  '2025-05-15': [
    { id: '4', title: 'Product Demo', time: '9:00 AM - 10:30 AM', location: 'Main Office', attendees: 12, color: COLORS.primary },
    { id: '5', title: 'Design Workshop', time: '1:00 PM - 3:00 PM', location: 'Creative Studio', attendees: 6, color: COLORS.secondary },
  ],
  '2025-05-16': [
    { id: '6', title: 'Marketing Strategy', time: '11:00 AM - 12:00 PM', location: 'Planning Room', attendees: 4, color: COLORS.accent },
  ],
};

const MARKED_DATES = {
  '2025-05-14': { marked: true, dotColor: COLORS.primary },
  '2025-05-15': { marked: true, dotColor: COLORS.primary },
  '2025-05-16': { marked: true, dotColor: COLORS.primary },
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('2025-05-14');
  const [calendarView, setCalendarView] = useState('month');
  
  const selectedEvents = EVENTS[selectedDate] || [];
  const formattedDate = selectedDate ? format(new Date(selectedDate), 'EEEE, MMMM d, yyyy') : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.addEventButton}>
          <PlusCircle color={COLORS.primary} size={24} />
          <Text style={styles.addEventText}>New Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewToggleContainer}>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            calendarView === 'month' && styles.viewToggleButtonActive
          ]}
          onPress={() => setCalendarView('month')}
        >
          <Text 
            style={[
              styles.viewToggleText, 
              calendarView === 'month' && styles.viewToggleTextActive
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            calendarView === 'week' && styles.viewToggleButtonActive
          ]}
          onPress={() => setCalendarView('week')}
        >
          <Text 
            style={[
              styles.viewToggleText, 
              calendarView === 'week' && styles.viewToggleTextActive
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            calendarView === 'day' && styles.viewToggleButtonActive
          ]}
          onPress={() => setCalendarView('day')}
        >
          <Text 
            style={[
              styles.viewToggleText, 
              calendarView === 'day' && styles.viewToggleTextActive
            ]}
          >
            Day
          </Text>
        </TouchableOpacity>
      </View>

      <CalendarComponent
        style={styles.calendar}
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.background,
          textSectionTitleColor: COLORS.textSecondary,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: '#d9e1e8',
          dotColor: COLORS.primary,
          selectedDotColor: '#ffffff',
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.text,
          indicatorColor: COLORS.primary,
          textDayFontFamily: 'Inter-Regular',
          textMonthFontFamily: 'Inter-SemiBold',
          textDayHeaderFontFamily: 'Inter-Medium',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
        markedDates={{
          ...MARKED_DATES,
          [selectedDate]: {
            selected: true,
            marked: MARKED_DATES[selectedDate]?.marked || false,
            dotColor: MARKED_DATES[selectedDate]?.dotColor || COLORS.primary,
          }
        }}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        renderArrow={(direction) => (
          direction === 'left' ? 
            <ChevronLeft color={COLORS.primary} size={20} /> : 
            <ChevronRight color={COLORS.primary} size={20} />
        )}
      />

      <View style={styles.eventListHeader}>
        <Text style={styles.eventListDate}>{formattedDate}</Text>
        <Text style={styles.eventCount}>{selectedEvents.length} Events</Text>
      </View>

      <ScrollView
        style={styles.eventList}
        showsVerticalScrollIndicator={false}
      >
        {selectedEvents.length > 0 ? (
          selectedEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.eventCard}>
              <View style={[styles.eventColorIndicator, { backgroundColor: event.color }]} />
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                
                <View style={styles.eventMetaContainer}>
                  <View style={styles.eventMetaItem}>
                    <Clock size={14} color={COLORS.textSecondary} style={styles.eventMetaIcon} />
                    <Text style={styles.eventMetaText}>{event.time}</Text>
                  </View>
                  
                  <View style={styles.eventMetaItem}>
                    <MapPin size={14} color={COLORS.textSecondary} style={styles.eventMetaIcon} />
                    <Text style={styles.eventMetaText}>{event.location}</Text>
                  </View>
                  
                  <View style={styles.eventMetaItem}>
                    <Users size={14} color={COLORS.textSecondary} style={styles.eventMetaIcon} />
                    <Text style={styles.eventMetaText}>{event.attendees} people</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No events scheduled for this day</Text>
            <TouchableOpacity style={styles.createEventButton}>
              <Text style={styles.createEventText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEventText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  viewToggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },
  calendar: {
    marginBottom: 16,
  },
  eventListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  eventListDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  eventCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  eventList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  eventColorIndicator: {
    width: 6,
  },
  eventDetails: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  eventMetaContainer: {
    gap: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaIcon: {
    marginRight: 6,
  },
  eventMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noEventsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  createEventButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createEventText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});