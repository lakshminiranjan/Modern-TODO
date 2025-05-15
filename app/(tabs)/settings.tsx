import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ChevronRight, Bell, Palette, Lock, CircleHelp as HelpCircle, Globe, Moon, LogOut, X, Check } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, LANGUAGES } from '../../contexts/ThemeContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import COLORS from '@/constants/colors';

export default function SettingsScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut, user, updateUserProfile } = useAuth();
  const { 
    isDarkMode, 
    toggleDarkMode, 
    colors: COLORS, 
    notificationsEnabled, 
    toggleNotifications,
    language,
    setLanguage,
    getLanguageName
  } = useTheme();
  const {
    securitySettings,
    toggleBiometricAuth,
    toggleTwoFactorAuth
  } = useUserPreferences();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState(user?.profile?.full_name || user?.user_metadata?.full_name || '');
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Failed to log out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    try {
      setIsUpdatingProfile(true);
      const success = await updateUserProfile({ full_name: fullName.trim() });
      
      if (success) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowProfileModal(false);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 60 }} // Add padding to the content container
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <TouchableOpacity 
          style={[styles.profileContainer, { backgroundColor: COLORS.card }]}
          onPress={() => setShowProfileModal(true)}
        >
          <View style={styles.profileAvatarContainer}>
            <View style={[styles.profileAvatar, { backgroundColor: COLORS.primary }]}>
              <User size={32} color={COLORS.card} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: COLORS.text }]}>
              {user?.profile?.full_name || user?.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: COLORS.textSecondary }]}>{user?.email}</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Preferences Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>Preferences</Text>
          
          <View style={[styles.settingContainer, { backgroundColor: COLORS.card }]}>
            <View style={[styles.settingIconContainer, { backgroundColor: COLORS.primary }]}>
              <Bell size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>Notifications</Text>
              <Text style={[styles.settingDescription, { color: COLORS.textSecondary }]}>
                Manage notifications and alerts
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
              thumbColor={notificationsEnabled ? COLORS.primary : '#F7FAFC'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingContainer, { backgroundColor: COLORS.card }]}
            onPress={() => setShowAppearanceModal(true)}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: COLORS.secondary }]}>
              <Palette size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>Appearance</Text>
              <Text style={[styles.settingDescription, { color: COLORS.textSecondary }]}>
                Customize the app appearance
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingContainer, { backgroundColor: COLORS.card }]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: COLORS.accent }]}>
              <Globe size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>Language</Text>
              <Text style={[styles.settingDescription, { color: COLORS.textSecondary }]}>
                Change language preferences
              </Text>
            </View>
            <View style={styles.languageValue}>
              <Text style={[styles.languageText, { color: COLORS.text }]}>
                {getLanguageName(language)}
              </Text>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.settingContainer, { backgroundColor: COLORS.card }]}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#805AD5' }]}>
              <Moon size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: COLORS.textSecondary }]}>
                Toggle dark/light theme
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
              thumbColor={isDarkMode ? COLORS.primary : '#F7FAFC'}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>Security</Text>
          
          <TouchableOpacity 
            style={[styles.settingContainer, { backgroundColor: COLORS.card }]}
            onPress={() => setShowSecurityModal(true)}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: '#DD6B20' }]}>
              <Lock size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>Account Security</Text>
              <Text style={[styles.settingDescription, { color: COLORS.textSecondary }]}>
                Manage password and security settings
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>Support</Text>
          
          <TouchableOpacity style={[styles.settingContainer, { backgroundColor: COLORS.card }]}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#319795' }]}>
              <HelpCircle size={20} color={COLORS.card} style={styles.settingIcon} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>Help & Feedback</Text>
              <Text style={[styles.settingDescription, { color: COLORS.textSecondary }]}>
                Get help or send feedback
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
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
          <Text style={[styles.versionText, { color: COLORS.textSecondary }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]}>Edit Profile</Text>
              <TouchableOpacity 
                onPress={() => setShowProfileModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: COLORS.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? COLORS.background : '#F7FAFC',
                  color: COLORS.text,
                  borderColor: COLORS.border
                }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textSecondary}
              />
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <Text style={styles.saveButtonText}>Updating...</Text>
                ) : (
                  <>
                    <Check size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]}>Select Language</Text>
              <TouchableOpacity 
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <TouchableOpacity 
                  key={code}
                  style={[
                    styles.languageOption,
                    { 
                      backgroundColor: language === code ? `${COLORS.primary}20` : 'transparent',
                      borderColor: COLORS.border
                    }
                  ]}
                  onPress={() => {
                    setLanguage(code as keyof typeof LANGUAGES);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={[
                    styles.languageOptionText, 
                    { 
                      color: language === code ? COLORS.primary : COLORS.text,
                      fontFamily: language === code ? 'Inter-SemiBold' : 'Inter-Regular'
                    }
                  ]}>
                    {name}
                  </Text>
                  {language === code && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Appearance Modal */}
      <Modal
        visible={showAppearanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppearanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]}>Appearance</Text>
              <TouchableOpacity 
                onPress={() => setShowAppearanceModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.appearanceOption}>
                <Text style={[styles.appearanceOptionLabel, { color: COLORS.text }]}>Dark Mode</Text>
                <Switch
                  value={isDarkMode}
                  onValueChange={(value) => {
                    toggleDarkMode();
                  }}
                  trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
                  thumbColor={isDarkMode ? COLORS.primary : '#F7FAFC'}
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.closeModalButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setShowAppearanceModal(false)}
              >
                <Text style={styles.closeModalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal
        visible={showSecurityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSecurityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]}>Security Settings</Text>
              <TouchableOpacity 
                onPress={() => setShowSecurityModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.securityOption}>
                <View>
                  <Text style={[styles.securityOptionLabel, { color: COLORS.text }]}>
                    Biometric Authentication
                  </Text>
                  <Text style={[styles.securityOptionDescription, { color: COLORS.textSecondary }]}>
                    Use fingerprint or face ID to log in
                  </Text>
                </View>
                <Switch
                  value={securitySettings.biometricAuthEnabled}
                  onValueChange={toggleBiometricAuth}
                  trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
                  thumbColor={securitySettings.biometricAuthEnabled ? COLORS.primary : '#F7FAFC'}
                />
              </View>
              
              <View style={styles.securityOption}>
                <View>
                  <Text style={[styles.securityOptionLabel, { color: COLORS.text }]}>
                    Two-Factor Authentication
                  </Text>
                  <Text style={[styles.securityOptionDescription, { color: COLORS.textSecondary }]}>
                    Add an extra layer of security
                  </Text>
                </View>
                <Switch
                  value={securitySettings.twoFactorAuthEnabled}
                  onValueChange={toggleTwoFactorAuth}
                  trackColor={{ false: '#CBD5E0', true: `${COLORS.primary}80` }}
                  thumbColor={securitySettings.twoFactorAuthEnabled ? COLORS.primary : '#F7FAFC'}
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.closeModalButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setShowSecurityModal(false)}
              >
                <Text style={styles.closeModalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 80, // Add extra padding at the bottom to account for the tab bar
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  
  // Form styles
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  
  // Language selection styles
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  languageOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
  },
  
  // Appearance styles
  appearanceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appearanceOptionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
  },
  closeModalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  closeModalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Security styles
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  securityOptionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  securityOptionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});