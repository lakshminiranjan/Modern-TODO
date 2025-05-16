// Simple script to check if Supabase environment variables are set
console.log('Checking Supabase environment variables...');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');