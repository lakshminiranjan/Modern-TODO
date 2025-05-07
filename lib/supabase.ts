import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required. Please check your environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required. Please check your environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Ensure the 'Insert' interface for 'profiles' includes the 'id' field set to 'user.id'
// This aligns with the RLS policy that allows inserts where 'auth.uid() = id'

// Example function to insert a profile with user.id
export async function insertProfile(user: { id: any; full_name: any; avatar_url: any; }) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: user.id, full_name: user.full_name, avatar_url: user.avatar_url }]);

  if (error) {
    console.error('Error inserting profile:', error);
    return null;
  }

  return data;
}
