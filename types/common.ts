export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  category: string;
  attendees?: string[];
  recurringRule?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  settings: UserSettings;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  language: string;
  defaultCalendarView: 'day' | 'week' | 'month';
  defaultReminderTime: number; // minutes before event
}

export interface Reminder {
  id: string;
  entityId: string; // ID of the task or event
  entityType: 'task' | 'event';
  time: string;
  message: string;
  isRead: boolean;
}