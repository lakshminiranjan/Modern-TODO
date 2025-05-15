import { supabase } from './supabase';
import type { Database } from '../types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Task = Database['public']['Tables']['tasks']['Row'];
export type InsertTask = Database['public']['Tables']['tasks']['Insert'];
export type UpdateTask = Database['public']['Tables']['tasks']['Update'];

// Cache keys
const TASKS_CACHE_KEY = 'tasks_cache';
const TASKS_CACHE_TIMESTAMP_KEY = 'tasks_cache_timestamp';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getTasks(forceRefresh = false) {
  try {
    // Try to get data from cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await getCachedTasks();
      if (cachedData) {
        console.log('Using cached tasks data');
        return cachedData;
      }
    }
    
    console.log('Fetching tasks from database...');
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      
      // If there's an error, try to return cached data as fallback
      const cachedData = await getCachedTasks(true); // ignore expiry
      if (cachedData) {
        console.log('Using cached tasks data as fallback after error');
        return cachedData;
      }
      
      throw error;
    }
    
    // Cache the fresh data
    if (data) {
      await cacheTasks(data);
    }
    
    console.log(`Successfully fetched ${data?.length || 0} tasks`);
    return data || [];
  } catch (err) {
    console.error('Exception in getTasks:', err);
    throw err;
  }
}

// Helper function to cache tasks
async function cacheTasks(tasks: Task[]) {
  try {
    await AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
    await AsyncStorage.setItem(TASKS_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Error caching tasks:', e);
  }
}

// Helper function to get cached tasks
async function getCachedTasks(ignoreExpiry = false): Promise<Task[] | null> {
  try {
    const cachedTasksJson = await AsyncStorage.getItem(TASKS_CACHE_KEY);
    const timestampStr = await AsyncStorage.getItem(TASKS_CACHE_TIMESTAMP_KEY);
    
    if (!cachedTasksJson || !timestampStr) {
      return null;
    }
    
    // Check if cache is expired
    if (!ignoreExpiry) {
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      if (now - timestamp > CACHE_EXPIRY_TIME) {
        console.log('Tasks cache expired');
        return null;
      }
    }
    
    return JSON.parse(cachedTasksJson);
  } catch (e) {
    console.error('Error retrieving cached tasks:', e);
    return null;
  }
}

export async function createTask(task: InsertTask) {
  try {
    console.log('Creating new task:', task);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }
    
    console.log('Task created successfully:', data);
    return data;
  } catch (err) {
    console.error('Exception in createTask:', err);
    throw err;
  }
}

export async function updateTask(id: string, updates: UpdateTask) {
  try {
    // Make sure we're only sending fields that exist in the database
    const safeUpdates: UpdateTask = {
      status: updates.status,
      title: updates.title,
      description: updates.description,
      priority: updates.priority,
      due_date: updates.due_date,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields to avoid sending them to the database
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key as keyof UpdateTask] === undefined) {
        delete safeUpdates[key as keyof UpdateTask];
      }
    });

    console.log('Updating task with ID:', id, 'Updates:', safeUpdates);
    
    const { data, error } = await supabase
      .from('tasks')
      .update(safeUpdates as UpdateTask)
      .eq('id', id as any)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Exception in updateTask:', err);
    throw err;
  }
}

export async function deleteTask(id: string) {
  try {
    console.log('Deleting task with ID:', id);
    
    // Use type assertion to match the expected type for the id parameter
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id as any);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
    
    console.log('Successfully deleted task with ID:', id);
  } catch (err) {
    console.error('Exception in deleteTask:', err);
    throw err;
  }
}

export function subscribeToTasks(callback: (tasks: Task[]) => void) {
  console.log('Setting up real-time subscription to tasks table');
  
  return supabase
    .channel('tasks')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      async (payload) => {
        console.log('Real-time update received:', payload.eventType, payload);
        
        try {
          // Fetch all tasks after any change
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching tasks in subscription:', error);
            return;
          }
          
          console.log(`Subscription update: fetched ${data?.length || 0} tasks`);
          if (data) callback(data as unknown as Task[]);
        } catch (err) {
          console.error('Exception in subscription callback:', err);
        }
      }
    )
    .subscribe();
}

export async function getTaskStats() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status, priority, created_at');

  if (error) throw error;

  // Type guard to ensure we only process valid task objects
  const isTask = (t: any): t is { status: any; priority: any; created_at: any } =>
    t && typeof t === 'object' && 'status' in t && 'priority' in t && 'created_at' in t;

  const validTasks = (tasks as any[]).filter(isTask);

  const total = validTasks.length;
  const completed = validTasks.filter(t => t.status === 'completed').length;
  const pending = validTasks.filter(t => t.status === 'pending').length;
  const highPriority = validTasks.filter(t => t.priority === 'high').length;

  return {
    total,
    completed,
    pending,
    completionRate: total ? (completed / total) * 100 : 0,
    highPriorityTasks: highPriority,
    tasksByStatus: {
      completed,
      pending,
    },
    tasksByPriority: {
      high: highPriority,
      medium: validTasks.filter(t => t.priority === 'medium').length,
      low: validTasks.filter(t => t.priority === 'low').length,
    }
  };
}