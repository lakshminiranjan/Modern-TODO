import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ChevronRight, Bell, Palette, Lock, CircleHelp as HelpCircle, Globe, Moon, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

// Define theme colors
const COLORS = {
  primary: '#3E64FF',
  secondary: '#38B2AC',
  accent: '#9F7AEA',
  background: '#F7F9FC',
  card: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  border: '#E2E8F0',
};

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Failed to log out:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <TouchableOpacity style={styles.profileContainer}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatar}>
              <User size={32} color={COLORS.card} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.user_metadata?.full_name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Preferences Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingContainer}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Manage notifications and alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
              thumbColor={notificationsEnabled ? COLORS.primary : '#F7FAFC'}
            />
          </View>

          <View style={styles.settingContainer}>
            <View style={[styles.settingIconContainer, { backgroundColor: COLORS.secondary }]}>
              <Palette size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Appearance</Text>
              <Text style={styles.settingDescription}>Customize the app appearance</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </View>

          <View style={styles.settingContainer}>
            <View style={[styles.settingIconContainer, { backgroundColor: COLORS.accent }]}>
              <Globe size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>Change language preferences</Text>
            </View>
            <View style={styles.languageValue}>
              <Text style={styles.languageText}>English</Text>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </View>
          </View>

          <View style={styles.settingContainer}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#805AD5' }]}>
              <Moon size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Toggle dark/light theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
              thumbColor={darkModeEnabled ? COLORS.primary : '#F7FAFC'}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingContainer}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#DD6B20' }]}>
              <Lock size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Account Security</Text>
              <Text style={styles.settingDescription}>Manage password and security settings</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.settingContainer}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#319795' }]}>
              <HelpCircle size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Help & Feedback</Text>
              <Text style={styles.settingDescription}>Get help or send feedback</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut size={20} color="#E53E3E" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatarContainer: {
    marginRight: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIcon: {},
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.text,
    marginRight: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#E53E3E',
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});