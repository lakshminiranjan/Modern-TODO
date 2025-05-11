import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Define supported languages
export const LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
};

// Define colors for light and dark themes
export const COLORS = {
  light: {
    primary: '#3182CE',
    secondary: '#805AD5',
    accent: '#38B2AC',
    background: '#F7FAFC',
    card: '#FFFFFF',
    text: '#1A202C',
    textSecondary: '#718096',
    border: '#E2E8F0',
    error: '#E53E3E',
    success: '#38A169',
    warning: '#DD6B20',
  },
  dark: {
    primary: '#63B3ED',
    secondary: '#B794F4',
    accent: '#4FD1C5',
    background: '#1A202C',
    card: '#2D3748',
    text: '#F7FAFC',
    textSecondary: '#A0AEC0',
    border: '#4A5568',
    error: '#FC8181',
    success: '#68D391',
    warning: '#F6AD55',
  },
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  colors: typeof COLORS.light;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  language: keyof typeof LANGUAGES;
  setLanguage: (lang: keyof typeof LANGUAGES) => void;
  getLanguageName: (code: keyof typeof LANGUAGES) => string;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = 'user_theme_preference';
const LANGUAGE_STORAGE_KEY = 'user_language_preference';
const NOTIFICATIONS_STORAGE_KEY = 'user_notifications_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [language, setLanguageState] = useState<keyof typeof LANGUAGES>('en');

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load theme preference
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
        
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
        // Fallback to defaults
        setIsDarkMode(systemColorScheme === 'dark');
      }
    };

    loadPreferences();
  }, [systemColorScheme]);

  // Save theme preference whenever it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };

    saveThemePreference();
  }, [isDarkMode]);

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

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
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

  // Get the appropriate color scheme based on dark mode setting
  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleTheme, 
      setDarkMode,
      colors,
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