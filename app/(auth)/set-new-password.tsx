// Extend the global object to include rootLayoutMounted
declare global {
  // eslint-disable-next-line no-var
  var rootLayoutMounted: boolean | undefined;
}

import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Animated as RNAnimated, 
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowRight, LogIn, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { validatePasswordStrength } from '../../lib/security';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeNavigate } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#4F46E5', // Indigo
  primaryDark: '#3730A3', // Darker indigo
  primaryLight: '#818CF8', // Lighter indigo
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6', // Lighter pink
  text: '#1E293B', // Slate 800
  textSecondary: '#64748B', // Slate 500
  textLight: '#F8FAFC', // Slate 50
  border: '#CBD5E1', // Slate 300
  error: '#EF4444', // Red 500
  errorLight: '#FEE2E2', // Red 100
  success: '#10B981', // Emerald 500
  successLight: '#D1FAE5', // Emerald 100
  background: '#F1F5F9', // Slate 100
  backgroundDark: '#0F172A', // Slate 900
  card: 'rgba(255, 255, 255, 0.8)',
  cardDark: 'rgba(15, 23, 42, 0.8)',
  shadow: '#94A3B8', // Slate 400
};

// OTP storage keys
const OTP_STORAGE_KEY = 'password_reset_otp';
const OTP_EMAIL_KEY = 'password_reset_email';
const OTP_EXPIRY_KEY = 'password_reset_otp_expiry';

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default function SetNewPasswordScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Input focus states for animation
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new RNAnimated.Value(0))[0];
  const slideAnim = useState(new RNAnimated.Value(50))[0];
  const scaleAnim = useState(new RNAnimated.Value(0.9))[0];
  
  // Verify session
  useEffect(() => {
    const verifySession = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem(OTP_EMAIL_KEY);
        
        if (!storedEmail || storedEmail !== email) {
          // Invalid session, redirect to login
          Alert.alert(
            'Invalid Session',
            'Your password reset session is invalid or has expired. Please request a new password reset.',
            [
              { text: 'OK', onPress: () => {
                // Use the safe navigation utility to navigate to login
                safeNavigate('/login');
              } }
            ]
          );
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        Alert.alert(
          'Error',
          'Something went wrong. Please try again.',
          [
            { text: 'OK', onPress: () => safeNavigate('/login') }
          ]
        );
      }
    };
    
    verifySession();
  }, [email]);
  
  // Animate elements when component mounts
  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting password reset process');
      
      // Animate button press
      RNAnimated.sequence([
        RNAnimated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Validate inputs
      if (!password || !confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message || 'Password is not strong enough');
        setLoading(false);
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      // Verify session
      const storedEmail = await AsyncStorage.getItem(OTP_EMAIL_KEY);
      if (!storedEmail || storedEmail !== email) {
        setError('Your session is invalid or has expired. Please request a new password reset.');
        setLoading(false);
        return;
      }
      
      // Get the stored OTP
      const storedOtp = await AsyncStorage.getItem(OTP_STORAGE_KEY);
      if (!storedOtp) {
        setError('Your verification code has expired. Please request a new password reset.');
        setLoading(false);
        return;
      }
      
      console.log('Creating new Supabase client for password reset');
      
      // Create a fresh client for this operation to avoid session conflicts
      const resetClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: 'implicit',
          debug: true
        }
      });
      
      // Try to get the stored session from the OTP verification step
      console.log('Retrieving stored session from OTP verification');
      const storedSessionStr = await AsyncStorage.getItem('supabase_session');
      let session = null;
      
      if (storedSessionStr) {
        try {
          session = JSON.parse(storedSessionStr);
          console.log('Found stored session from OTP verification');
        } catch (parseError) {
          console.error('Error parsing stored session:', parseError);
        }
      }
      
      // If we don't have a stored session, try to verify the OTP again
      if (!session) {
        console.log('No stored session found, attempting to verify OTP again');
        const { data: verifyData, error: verifyError } = await resetClient.auth.verifyOtp({
          email,
          token: storedOtp,
          type: 'recovery',
          options: {
            redirectTo: undefined
          }
        });
        
        if (verifyError) {
          console.error('OTP verification error:', verifyError);
          
          if (verifyError.message && (verifyError.message.includes('expired') || 
              verifyError.message.includes('invalid') || 
              verifyError.message.includes('Token'))) {
            // Token expired or invalid
            setError('Your password reset link has expired or is invalid. Please request a new one.');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              safeNavigate('/login');
            }, 3000);
            setLoading(false);
            return;
          } else if (verifyError.message && verifyError.message.includes('security purposes') && verifyError.message.includes('seconds')) {
            // Rate limiting error
            const secondsMatch = verifyError.message.match(/(\d+) seconds/);
            const seconds = secondsMatch ? secondsMatch[1] : '60';
            
            setError(`Please wait ${seconds} seconds before trying again.`);
            setLoading(false);
            return;
          } else {
            // Generic error
            setError('Failed to verify your identity. Please try again or request a new reset link.');
            setLoading(false);
            return;
          }
        }
        
        if (verifyData && verifyData.session) {
          session = verifyData.session;
        }
      }
      
      if (!session) {
        console.error('No session established after OTP verification');
        setError('Failed to establish a secure session. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('Session established successfully, updating password');
      
      // Set the session in the client
      if (session.access_token && session.refresh_token) {
        console.log('Setting session in the client');
        await resetClient.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
      
      // Now update the password with the established session
      const { error: updateError } = await resetClient.auth.updateUser({
        password
      });
      
      if (updateError) {
        console.error('Password update error:', updateError);
        
        if (updateError.message && updateError.message.includes('security purposes') && updateError.message.includes('seconds')) {
          // Rate limiting error
          const secondsMatch = updateError.message.match(/(\d+) seconds/);
          const seconds = secondsMatch ? secondsMatch[1] : '60';
          
          setError(`Please wait ${seconds} seconds before trying again.`);
        } else if (updateError.message && (updateError.message.includes('expired') || 
                  updateError.message.includes('invalid') || 
                  updateError.message.includes('Token'))) {
          // Token expired or invalid
          setError('Your session has expired. Please request a new password reset.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            safeNavigate('/login');
          }, 3000);
        } else {
          // Generic error
          setError('Failed to update your password. Please try again or request a new reset link.');
        }
        
        setLoading(false);
        return;
      }
      
      // Success!
      console.log('Password updated successfully!');
      setSuccess(true);
      setShowSuccessModal(true);
      
      // Clear all stored data
      await AsyncStorage.removeItem(OTP_STORAGE_KEY);
      await AsyncStorage.removeItem(OTP_EMAIL_KEY);
      await AsyncStorage.removeItem(OTP_EXPIRY_KEY);
      await AsyncStorage.removeItem('supabase_session');
      await AsyncStorage.removeItem('using_local_verification');
      await AsyncStorage.removeItem('last_token_refresh_time');
      await AsyncStorage.removeItem('supabase_rate_limited');
      await AsyncStorage.removeItem('using_otp_mode');
      
      // Sign out to clear any existing sessions
      await resetClient.auth.signOut();
      await supabase.auth.signOut();
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after showing success modal
      setTimeout(() => {
        setShowSuccessModal(false);
        // Use the safe navigation utility to navigate to login
        safeNavigate('/login');
        console.log('Navigating to login after password reset success');
      }, 3000);
      
      setLoading(false);
    } catch (error) {
      console.error('Error in password reset process:', error);
      
      // Try to extract a meaningful error message if possible
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          // If it's a standard error object with a message
          errorMessage = error.message;
          
          // Check for rate limiting in the error message
          if (errorMessage.includes('security purposes') && errorMessage.includes('seconds')) {
            const secondsMatch = errorMessage.match(/(\d+) seconds/);
            const seconds = secondsMatch ? secondsMatch[1] : '60';
            errorMessage = `Please wait ${seconds} seconds before trying again.`;
          } else if (errorMessage.includes('expired') || 
                    errorMessage.includes('invalid') || 
                    errorMessage.includes('JWT')) {
            errorMessage = 'Your password reset link has expired or is invalid. Please request a new one.';
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              safeNavigate('/login');
            }, 3000);
          }
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="light" style={styles.successModal}>
            <CheckCircle size={70} color={COLORS.success} style={styles.successModalIcon} />
            <Text style={styles.successModalTitle}>Password has been reset successfully!</Text>
            <Text style={styles.successModalText}>
              Your password has been updated in our database.
            </Text>
            <Text style={styles.successModalText}>
              You will be redirected to the login page in a moment.
            </Text>
            <TouchableOpacity 
              style={styles.successModalButton}
              onPress={() => {
                setShowSuccessModal(false);
                safeNavigate('/login');
              }}
            >
              <Text style={styles.successModalButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
      
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <RNAnimated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Logo and branding */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <LogIn size={32} color={COLORS.textLight} />
              </View>
              <Text style={styles.logoText}>TaskMaster</Text>
            </View>
            
            {/* Top section */}
            <View style={styles.topSection}>
              <RNAnimated.View 
                style={[
                  styles.header,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                <Text style={styles.title}>Set New Password</Text>
                <Text style={styles.subtitle}>Create a new secure password for your account</Text>
              </RNAnimated.View>
            </View>
            
            {/* Glass card for form */}
            <BlurView intensity={80} tint="light" style={styles.formCard}>
              <View style={styles.form}>
                {success ? (
                  // Success message
                  <Animated.View 
                    style={styles.successContainer}
                    entering={FadeInDown.duration(300)}
                  >
                    <CheckCircle size={60} color={COLORS.success} style={styles.successIcon} />
                    <Text style={styles.successTitle}>Password Reset Successful</Text>
                    <Text style={styles.successText}>
                      Your password has been reset successfully. You will be redirected to the login page shortly.
                    </Text>
                  </Animated.View>
                ) : (
                  <>
                    {/* Password input */}
                    <View 
                      style={[
                        styles.inputContainer,
                        passwordFocused && styles.inputContainerFocused
                      ]}
                    >
                      <Lock 
                        size={20} 
                        color={passwordFocused ? COLORS.primary : COLORS.textSecondary} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="New Password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color={COLORS.textSecondary} />
                        ) : (
                          <Eye size={20} color={COLORS.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Confirm Password input */}
                    <View 
                      style={[
                        styles.inputContainer,
                        confirmPasswordFocused && styles.inputContainerFocused
                      ]}
                    >
                      <Lock 
                        size={20} 
                        color={confirmPasswordFocused ? COLORS.primary : COLORS.textSecondary} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} color={COLORS.textSecondary} />
                        ) : (
                          <Eye size={20} color={COLORS.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Password requirements */}
                    <View style={styles.passwordRequirements}>
                      <Text style={styles.passwordRequirementsTitle}>Password must:</Text>
                      <View style={styles.passwordRequirementItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.passwordRequirementText}>Be at least 8 characters long</Text>
                      </View>
                      <View style={styles.passwordRequirementItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.passwordRequirementText}>Include at least one uppercase letter</Text>
                      </View>
                      <View style={styles.passwordRequirementItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.passwordRequirementText}>Include at least one lowercase letter</Text>
                      </View>
                      <View style={styles.passwordRequirementItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.passwordRequirementText}>Include at least one number</Text>
                      </View>
                      <View style={styles.passwordRequirementItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.passwordRequirementText}>Include at least one special character</Text>
                      </View>
                    </View>
                    
                    {/* Error message */}
                    {error && (
                      <Animated.View 
                        style={styles.errorContainer}
                        entering={FadeInDown.duration(300)}
                      >
                        <View style={styles.errorContent}>
                          <AlertCircle size={20} color={COLORS.error} style={styles.errorIcon} />
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      </Animated.View>
                    )}
                    
                    {/* Reset button */}
                    <TouchableOpacity
                      style={[styles.resetButton, loading && styles.buttonDisabled]}
                      onPress={handleResetPassword}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.resetButtonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color={COLORS.textLight} size="small" />
                        ) : (
                          <Text style={styles.resetButtonText}>Reset Password</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    {/* Cancel button */}
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => router.replace('/login')}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </BlurView>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.7,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: width * 0.3,
    left: -width * 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  topSection: {
    marginBottom: 30,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    maxWidth: '80%',
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  form: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: 8,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
    marginRight: 8,
  },
  passwordRequirementText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    marginBottom: 24,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 101, 101, 0.3)',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    flex: 1,
  },
  resetButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resetButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successModalIcon: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 12,
  },
  successModalText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  successModalButton: {
    marginTop: 24,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  successModalButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});