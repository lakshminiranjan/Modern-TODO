import { Tabs, Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Calendar, ChartBar as BarChart3, Chrome as Home, ListTodo, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { colors, isDarkMode } = useTheme();

  // Show loading screen while checking auth state
  if (loading) {
    return null;
  }

  // If no session, redirect to auth
  if (!session) {
    // Use a state variable to delay the redirect until after layout is mounted
    const [shouldRedirect, setShouldRedirect] = useState(false);
    
    // Use useEffect to set the redirect flag after checking if Root Layout is mounted
    useEffect(() => {
      const checkAndSetRedirect = async () => {
        try {
          // Check if Root Layout is mounted
          const isLayoutMounted = await AsyncStorage.getItem('root_layout_mounted');
          
          if (isLayoutMounted === 'true' || global.rootLayoutMounted) {
            // Root Layout is mounted, safe to redirect
            setShouldRedirect(true);
          } else {
            // Root Layout not mounted yet, wait and check again
            console.log('Waiting for Root Layout to mount before redirecting...');
            setTimeout(checkAndSetRedirect, 100);
          }
        } catch (error) {
          console.error('Error checking layout mounted status:', error);
          // Wait a bit longer and try again
          setTimeout(checkAndSetRedirect, 500);
        }
      };
      
      // Start the check process
      checkAndSetRedirect();
      
      // No cleanup needed for this effect
    }, []);
    
    // Only redirect after the delay and when Root Layout is mounted
    if (shouldRedirect) {
      return <Redirect href="/(auth)/signup" />;
    }
    
    // Return null while waiting to redirect
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [
          styles.tabBar, 
          { 
            backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderTopColor: colors.border
          }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: false,
        tabBarBackground: () => 
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={80} 
              tint={isDarkMode ? "dark" : "light"} 
              style={styles.tabBarBlurView}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ size, color }) => (
            <ListTodo size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarBlurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
});