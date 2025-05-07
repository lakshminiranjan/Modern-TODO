import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type Task = Database['public']['Tables']['tasks']['Row'];
export type InsertTask = Database['public']['Tables']['tasks']['Insert'];
export type UpdateTask = Database['public']['Tables']['tasks']['Update'];

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(task: InsertTask) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: UpdateTask) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function subscribeToTasks(callback: (tasks: Task[]) => void) {
  return supabase
    .channel('tasks')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      async () => {
        // Fetch all tasks after any change
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) callback(data);
      }
    )
    .subscribe();
}

export async function getTaskStats() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status, priority, created_at');

  if (error) throw error;

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const highPriority = tasks.filter(t => t.priority === 'high').length;

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
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    }
  };
}