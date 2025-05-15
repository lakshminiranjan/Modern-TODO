import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, updateEmailTemplates, initializeSupabaseOtpSettings } from '../lib/supabase';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Extended user type that includes profile information
type UserWithProfile = User & {
  profile?: {
    full_name: string;
    avatar_url: string | null;
  }
};

type AuthContextType = {
  session: Session | null;
  user: UserWithProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (profileData: { full_name: string }) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  updateUserProfile: async () => false,
});

// Storage key for profile data
const PROFILE_STORAGE_KEY = 'user_profile_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize Supabase OTP settings when the app starts
  useEffect(() => {
    // This is a fire-and-forget operation, we don't need to wait for it
    initializeSupabaseOtpSettings().catch(error => {
      console.log('Supabase OTP settings initialization failed (this is normal if not admin):', error);
    });
  }, []);

  // Store profile in memory and AsyncStorage instead of database
  // This is a temporary workaround until RLS issues are fixed
  const createOrUpdateProfile = async (user: User) => {
    try {
      console.log('Creating/updating profile for user:', user.id);
      
      // Create profile data
      const profileData = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
      };
      
      // Store profile data in AsyncStorage
      await AsyncStorage.setItem(
        `${PROFILE_STORAGE_KEY}_${user.id}`, 
        JSON.stringify(profileData)
      );
      
      // Update user object with profile data
      const userWithProfile = {
        ...user,
        profile: {
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url
        }
      };
      
      // Update state
      setUser(userWithProfile);
      
      console.log('Profile stored locally for user:', user.id);
      return true;
    } catch (error) {
      console.error('Profile storage error:', error);
      return false;
    }
  };

  // Load profile from AsyncStorage
  const loadProfileFromStorage = async (userId: string) => {
    try {
      const profileJson = await AsyncStorage.getItem(`${PROFILE_STORAGE_KEY}_${userId}`);
      if (profileJson) {
        return JSON.parse(profileJson);
      }
      return null;
    } catch (error) {
      console.error('Error loading profile from storage:', error);
      return null;
    }
  };

  // Update user with profile data
  const updateUserWithProfile = async (currentUser: User) => {
    // First try to load profile from storage
    const storedProfile = await loadProfileFromStorage(currentUser.id);
    
    if (storedProfile) {
      // If we have stored profile data, use it
      const userWithProfile = {
        ...currentUser,
        profile: {
          full_name: storedProfile.full_name,
          avatar_url: storedProfile.avatar_url
        }
      };
      setUser(userWithProfile);
    } else {
      // If no stored profile, create one
      await createOrUpdateProfile(currentUser);
    }
  };

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      // If we have a session, load profile data
      if (session?.user) {
        // We don't need to check for password reset sessions anymore
        // since we're using OTP-based password reset
        await updateUserWithProfile(session.user);
        router.replace('/(tabs)');
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // We don't need to check for password reset sessions anymore
        // since we're using OTP-based password reset
        await updateUserWithProfile(session.user);
        router.replace('/(tabs)');
      } else if (event === 'PASSWORD_RECOVERY') {
        // We're using OTP-based password reset now, so we don't need to handle this event
        // Just redirect to login
        router.replace('/login');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.replace('/login');
      } else {
        setUser(session?.user ?? null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear profile data from storage when signing out
      if (user?.id) {
        await AsyncStorage.removeItem(`${PROFILE_STORAGE_KEY}_${user.id}`);
      }
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserProfile = async (profileData: { full_name: string }): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Get existing profile data
      const storedProfile = await loadProfileFromStorage(user.id);
      
      if (!storedProfile) return false;
      
      // Update profile with new data
      const updatedProfile = {
        ...storedProfile,
        full_name: profileData.full_name
      };
      
      // Save updated profile to AsyncStorage
      await AsyncStorage.setItem(
        `${PROFILE_STORAGE_KEY}_${user.id}`, 
        JSON.stringify(updatedProfile)
      );
      
      // Update user state with new profile data
      const userWithUpdatedProfile: UserWithProfile = {
        ...user,
        profile: {
          full_name: profileData.full_name,
          avatar_url: user.profile?.avatar_url ?? null // Ensure avatar_url is string or null, not undefined
        }
      };
      
      setUser(userWithUpdatedProfile);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};