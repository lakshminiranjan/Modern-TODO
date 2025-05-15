import * as Notifications from 'expo-notifications';
import { Reminder } from '@/types/common';
import { getEvents } from '@/lib/events';
import { getTasks, Task } from '@/lib/tasks';

export async function scheduleReminder(reminder: Reminder): Promise<void> {
  try {
    const triggerTime = new Date(reminder.time).getTime() - Date.now();

    if (triggerTime <= 0) {
      console.warn(`Skipping reminder for "${reminder.message}" as the time is in the past.`);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.entityType === 'task' ? 'Task Reminder' : 'Event Reminder',
        body: reminder.message,
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.floor(triggerTime / 1000) 
      }, // Ensure seconds are an integer
    });

    console.log(`Scheduled reminder: "${reminder.message}"`);
  } catch (error) {
    console.error(`Failed to schedule reminder for "${reminder.message}":`, error);
  }
}

export async function syncReminders(tasks: Task[], events: any[]): Promise<void> {
  const taskReminders = tasks
    .filter((task) => task.due_date) // Only include tasks with a due date
    .map((task) => ({
      id: task.id,
      entityId: task.id,
      entityType: 'task' as const,
      time: task.due_date as string, // We know due_date is not null here because of the filter
      message: `Don't forget: ${task.title}`,
      isRead: false,
    }));

  const eventReminders = events.map((event) => ({
    id: event.id,
    entityId: event.id,
    entityType: 'event' as const,
    time: event.start_time, // Using start_time from the database
    message: `Upcoming event: ${event.title}`,
    isRead: false,
  }));

  const reminders = [...taskReminders, ...eventReminders];

  for (const reminder of reminders) {
    await scheduleReminder(reminder);
  }
}

export async function loadCalendarData(
  setTasks: (tasks: Task[]) => void,
  setEvents: (events: any[]) => void,
  setLoading: (loading: boolean) => void
): Promise<void> {
  setLoading(true);

  try {
    const [tasksData, eventsData] = await Promise.all([getTasks(), getEvents()]);
    // Ensure tasksData is an array of Task objects (filter out any error results)
    const validTasks = Array.isArray(tasksData)
      ? tasksData.filter((task): task is Task => !!task && !('error' in task))
      : [];
    setTasks(validTasks);

    setEvents(eventsData);

    await syncReminders(validTasks, eventsData);
  } catch (error) {
    console.error('Error loading calendar data:', error);
  } finally {
    setLoading(false);
  }
}