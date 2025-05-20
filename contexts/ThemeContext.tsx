import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define supported languages
export const LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
};

// Define colors based on login page
export const COLORS = {
  primary: '#4F46E5', // Indigo from login page
  primaryDark: '#3730A3', // Darker indigo
  primaryLight: '#818CF8', // Lighter indigo
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6', // Lighter pink
  accent: '#38B2AC',
  background: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  text: '#1E293B', // Slate 800
  textSecondary: '#64748B', // Slate 500
  textLight: '#F8FAFC', // Slate 50
  border: '#CBD5E1', // Slate 300
  error: '#EF4444', // Red 500
  errorLight: '#FEE2E2', // Red 100
  success: '#38A169',
  warning: '#DD6B20',
  google: '#4285F4',
  shadow: '#94A3B8', // Slate 400
};

type ThemeContextType = {
  isDarkMode: boolean; // Kept for backward compatibility
  toggleTheme: () => void; // Kept for backward compatibility
  setDarkMode: (isDark: boolean) => void; // Kept for backward compatibility
  colors: typeof COLORS;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  language: keyof typeof LANGUAGES;
  setLanguage: (lang: keyof typeof LANGUAGES) => void;
  getLanguageName: (code: keyof typeof LANGUAGES) => string;
  toggleDarkMode: () => void; // Kept for backward compatibility
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const LANGUAGE_STORAGE_KEY = 'user_language_preference';
const NOTIFICATIONS_STORAGE_KEY = 'user_notifications_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always set isDarkMode to false since we're removing dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [language, setLanguageState] = useState<keyof typeof LANGUAGES>('en');

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load language preference
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage !== null && savedLanguage in LANGUAGES) {
          setLanguageState(savedLanguage as keyof typeof LANGUAGES);
        }
        
        // Load notifications preference
        const savedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (savedNotifications !== null) {
          setNotificationsEnabled(savedNotifications === 'true');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save language preference whenever it changes
  useEffect(() => {
    const saveLanguagePreference = async () => {
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    };

    saveLanguagePreference();
  }, [language]);

  // Save notifications preference whenever it changes
  useEffect(() => {
    const saveNotificationsPreference = async () => {
      try {
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, notificationsEnabled.toString());
      } catch (error) {
        console.error('Error saving notifications preference:', error);
      }
    };

    saveNotificationsPreference();
  }, [notificationsEnabled]);

  // These functions are kept for backward compatibility but don't change the theme
  const toggleTheme = () => {
    // No-op function - dark mode is disabled
  };

  const toggleDarkMode = () => {
    // No-op function - dark mode is disabled
  };

  const setDarkMode = (isDark: boolean) => {
    // No-op function - dark mode is disabled
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const setLanguage = (lang: keyof typeof LANGUAGES) => {
    setLanguageState(lang);
  };

  const getLanguageName = (code: keyof typeof LANGUAGES) => {
    return LANGUAGES[code] || LANGUAGES.en;
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode: false, // Always false since dark mode is removed
      toggleTheme, 
      setDarkMode,
      colors: COLORS,
      notificationsEnabled,
      toggleNotifications,
      language,
      setLanguage,
      getLanguageName,
      toggleDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};