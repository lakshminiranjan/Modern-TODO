import { useEffect, useState } from 'react';
import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { UserPreferencesProvider } from '../contexts/UserPreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prevent the splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

// Create a global flag to track when the Root Layout is mounted
global.rootLayoutMounted = false;

function RootLayoutContent() {
  useFrameworkReady();
  const { isDarkMode } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });
  
  // State to track when layout is fully mounted
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  // Set the global flag when the layout is mounted
  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Set a flag in AsyncStorage to indicate the layout is mounted
      const setLayoutMounted = async () => {
        try {
          await AsyncStorage.setItem('root_layout_mounted', 'true');
          global.rootLayoutMounted = true;
          setIsLayoutMounted(true);
          console.log('Root Layout mounted successfully');
        } catch (error) {
          console.error('Failed to set layout mounted flag:', error);
        }
      };
      
      setLayoutMounted();
    }
    
    return () => {
      // Clean up when unmounted
      global.rootLayoutMounted = false;
    };
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Slot />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserPreferencesProvider>
          <RootLayoutContent />
        </UserPreferencesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  reminder_date: string;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}