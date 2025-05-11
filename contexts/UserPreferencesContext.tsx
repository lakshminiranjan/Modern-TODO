import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotificationPreferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderEnabled: boolean;
};

type AppearancePreferences = {
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
};

type SecuritySettings = {
  biometricAuthEnabled: boolean;
  twoFactorAuthEnabled: boolean;
};

type UserPreferencesType = {
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
  securitySettings: SecuritySettings;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  updateAppearancePreferences: (prefs: Partial<AppearancePreferences>) => void;
  toggleBiometricAuth: () => void;
  toggleTwoFactorAuth: () => void;
};

const defaultNotificationPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  reminderEnabled: true,
};

const defaultAppearancePreferences: AppearancePreferences = {
  fontSize: 'medium',
  compactMode: false,
};

const defaultSecuritySettings: SecuritySettings = {
  biometricAuthEnabled: false,
  twoFactorAuthEnabled: false,
};

const UserPreferencesContext = createContext<UserPreferencesType | null>(null);

const PREFERENCES_STORAGE_KEY = 'user_preferences';

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [appearance, setAppearance] = useState<AppearancePreferences>(defaultAppearancePreferences);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        
        if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          setNotifications({
            ...defaultNotificationPreferences,
            ...parsedPreferences.notifications,
          });
          setAppearance({
            ...defaultAppearancePreferences,
            ...parsedPreferences.appearance,
          });
          setSecuritySettings({
            ...defaultSecuritySettings,
            ...parsedPreferences.securitySettings,
          });
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        const preferencesToSave = {
          notifications,
          appearance,
          securitySettings,
        };
        await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferencesToSave));
      } catch (error) {
        console.error('Error saving user preferences:', error);
      }
    };

    savePreferences();
  }, [notifications, appearance, securitySettings]);

  const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
    setNotifications(prev => ({ ...prev, ...prefs }));
  };

  const updateAppearancePreferences = (prefs: Partial<AppearancePreferences>) => {
    setAppearance(prev => ({ ...prev, ...prefs }));
  };

  const toggleBiometricAuth = () => {
    setSecuritySettings(prev => ({
      ...prev,
      biometricAuthEnabled: !prev.biometricAuthEnabled
    }));
  };

  const toggleTwoFactorAuth = () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorAuthEnabled: !prev.twoFactorAuthEnabled
    }));
  };

  return (
    <UserPreferencesContext.Provider 
      value={{ 
        notifications, 
        appearance, 
        securitySettings,
        updateNotificationPreferences, 
        updateAppearancePreferences,
        toggleBiometricAuth,
        toggleTwoFactorAuth
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};