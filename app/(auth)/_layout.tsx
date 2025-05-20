import { Stack, Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  // Check if rootLayoutMounted flag is set
  const isRootLayoutMounted = global.rootLayoutMounted === true;
  
  const { session, loading } = useAuth();
  // Always declare all hooks at the top level, regardless of conditions
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Use useEffect to handle the redirect logic
  useEffect(() => {
    // Only proceed with redirect if session exists and root layout is mounted
    if (session && isRootLayoutMounted) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [session, isRootLayoutMounted]);
  
  // Show loading screen while checking auth state
  if (loading) {
    return null;
  }

  // Handle redirect if user is authenticated and shouldRedirect is true
  if (session) {
    if (shouldRedirect) {
      return <Redirect href="/(tabs)" />;
    }
    // Return null while waiting to redirect
    return null;
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
      <Stack.Screen 
        name="otp-verification" 
        options={{ 
          headerShown: false,
          // Prevent going back to login after OTP is sent
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="set-new-password" 
        options={{ 
          headerShown: false,
          // Prevent going back to OTP verification
          gestureEnabled: false 
        }} 
      />
    </Stack>
  );
}