import { Stack, Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return null;
  }

  // If user is authenticated, redirect to tabs
  if (session) {
    // Use a state variable to delay the redirect until after layout is mounted
    const [shouldRedirect, setShouldRedirect] = useState(false);
    
    // Use useEffect to set the redirect flag after a small delay
    useEffect(() => {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }, []);
    
    // Only redirect after the delay
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