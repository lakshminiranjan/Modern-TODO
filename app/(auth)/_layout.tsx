import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return null;
  }

  // If user is authenticated, redirect to tabs
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false,
          // Prevent going back to signup after successful signup
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          // Allow going back to signup from login
          gestureEnabled: true 
        }} 
      />
    </Stack>
  );
}