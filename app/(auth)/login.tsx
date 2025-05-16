// Add type declaration for global variable
declare global {
  var lastGeneratedOTP: string;
}

import { useState, useEffect, useRef } from 'react';
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
  Pressable,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowRight, LogIn, X, AlertCircle, CheckCircle } from 'lucide-react-native';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { checkPasswordResetRateLimit, validateEmailFormat, resetRateLimitCounter } from '../../lib/security';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  background: '#F1F5F9', // Slate 100
  backgroundDark: '#0F172A', // Slate 900
  google: '#4285F4',
  card: 'rgba(255, 255, 255, 0.8)',
  cardDark: 'rgba(15, 23, 42, 0.8)',
  shadow: '#94A3B8', // Slate 400
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  
  // Forgot password states
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailFocused, setResetEmailFocused] = useState(false);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new RNAnimated.Value(0))[0];
  const slideAnim = useState(new RNAnimated.Value(50))[0];
  const scaleAnim = useState(new RNAnimated.Value(0.9))[0];
  
  // Input focus states for animation
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!forgotPasswordModalVisible) {
      setTimeout(() => {
        setResetEmail('');
        setResetEmailError(null);
        setResetEmailSent(false);
      }, 300);
    }
  }, [forgotPasswordModalVisible]);
  
  // Clear error messages when user starts typing
  useEffect(() => {
    setError(null);
  }, [email, password]);
  
  // Clear reset email error when user starts typing
  useEffect(() => {
    setResetEmailError(null);
  }, [resetEmail]);

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

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      // Use setTimeout to ensure navigation happens after layout is mounted
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
    }
  }, [session]);

  // OTP storage keys
  const OTP_STORAGE_KEY = 'password_reset_otp';
  const OTP_EMAIL_KEY = 'password_reset_email';
  const OTP_EXPIRY_KEY = 'password_reset_otp_expiry';
  const OTP_EXPIRY_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  // Generate a random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Handle password reset request with OTP
  const handleResetPassword = async () => {
    try {
      // Validate email
      if (!resetEmail || !resetEmail.trim()) {
        setResetEmailError('Please enter your email address');
        return;
      }
      
      // Email format validation
      if (!validateEmailFormat(resetEmail)) {
        setResetEmailError('Please enter a valid email address');
        return;
      }
      
      setResetLoading(true);
      setResetEmailError(null);
      
      // Check rate limiting
      const rateLimitCheck = await checkPasswordResetRateLimit(resetEmail);
      if (!rateLimitCheck.allowed) {
        setResetEmailError(rateLimitCheck.message || 'Too many attempts. Please try again later.');
        setResetLoading(false);
        return;
      }
      
      // Generate a new OTP - ensure it's exactly 6 digits
      const otp = generateOTP().padStart(6, '0');
      console.log('Generated OTP:', otp);
      
      // Store OTP, email, and expiry time in AsyncStorage for verification
      await AsyncStorage.setItem(OTP_STORAGE_KEY, otp);
      await AsyncStorage.setItem(OTP_EMAIL_KEY, resetEmail);
      
      // Also store the OTP in a global variable for debugging
      global.lastGeneratedOTP = otp;
      
      // Set OTP expiry time (2 minutes from now)
      const expiryTime = Date.now() + OTP_EXPIRY_TIME;
      await AsyncStorage.setItem(OTP_EXPIRY_KEY, expiryTime.toString());
      
      // Clear any existing session data to prevent conflicts
      await AsyncStorage.removeItem('supabase_session');
      
      // Check if we need to wait before making another auth request
      try {
        // Get the last auth request timestamp
        const lastAuthRequestTime = await AsyncStorage.getItem('last_auth_request_time');
        const currentTime = Date.now();
        
        if (lastAuthRequestTime) {
          const timeSinceLastRequest = currentTime - parseInt(lastAuthRequestTime);
          
          // If it's been less than 15 seconds since the last request, wait
          if (timeSinceLastRequest < 15000) {
            const waitTime = Math.ceil((15000 - timeSinceLastRequest) / 1000);
            console.log(`Waiting ${waitTime} seconds before making another auth request`);
            
            // Show a message to the user
            setResetEmailError(`Please wait ${waitTime} seconds before trying again (rate limit protection)`);
            setResetLoading(false);
            return;
          }
        }
        
        // Update the last auth request time
        await AsyncStorage.setItem('last_auth_request_time', currentTime.toString());
        
        // Use a more reliable approach without Promise.race which can cause issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          // For Supabase, we need to use their standard password reset flow with OTP
          // The OTP will be generated and sent to the user's email
          console.log('Sending password reset with OTP:', otp);
          
          // First, make sure we're using the correct OTP format
          // Supabase expects a 6-digit numeric code
          const cleanOtp = otp.toString().replace(/\D/g, '').substring(0, 6).padStart(6, '0');
          
          // First, clear any existing session to prevent conflicts
          await supabase.auth.signOut();
          
          // Wait a moment for the signOut to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear any stored session data
          await AsyncStorage.removeItem('supabase_auth_token');
          await AsyncStorage.removeItem('supabase_session');
          
          console.log('Sending OTP email to:', resetEmail);
          
          // Create a new Supabase client just for this operation to avoid session conflicts
          const { createClient } = require('@supabase/supabase-js');
          const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
              flowType: 'implicit',
              debug: true
            }
          });
          
          // Use signInWithOtp instead of resetPasswordForEmail for more reliable OTP delivery
          const { error } = await tempClient.auth.signInWithOtp({
            email: resetEmail,
            options: {
              // Don't create a new user if one doesn't exist
              shouldCreateUser: false,
              // Set data with OTP to ensure it's included in the email
              data: {
                otp: cleanOtp,
                type: "otp"
              },
              // Set email redirect to null to force OTP mode
              emailRedirectTo: null
            }
          });
          
        } finally {
          clearTimeout(timeoutId);
        }
        
        if (error) {
          console.log('Password reset error:', error);
          
          // Check if it's a rate limiting error
          // First check if error is an object with a message property
          // Use type assertion to tell TypeScript that error has a message property
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as { message: string }).message;
            if (errorMessage.includes('security purposes') && errorMessage.includes('seconds')) {
              // Extract the number of seconds from the error message
              const secondsMatch = errorMessage.match(/(\d+) seconds/);
              const seconds = secondsMatch ? secondsMatch[1] : '60';
            
              // Update the rate limit in our local storage to match Supabase's rate limit
              await resetRateLimitCounter(resetEmail);
              
              setResetEmailError(`Please wait ${seconds} seconds before requesting another reset code.`);
              setResetLoading(false);
              return;
            }
          }
          
          // For other errors, show a generic message
          setResetEmailError('An error occurred. Please try again later.');
          setResetLoading(false);
          return;
        }
        
        // Success - don't reveal if email exists or not for security
        setResetEmailSent(true);
        
        // Show success message with clear instructions about OTP
        Alert.alert(
          'Verification Code Sent',
          `We've sent a 6-digit verification code to ${resetEmail}. Please check your email and enter the code on the next screen.`,
          [{ 
            text: 'OK',
            onPress: () => {
              // Close the modal first
              setForgotPasswordModalVisible(false);
              
              // Longer delay before navigating to OTP verification screen
              // This ensures the layout is fully mounted before navigation
              setTimeout(() => {
                // Navigate to OTP verification screen with email parameter
                router.push({
                  pathname: '/otp-verification',
                  params: { email: resetEmail }
                });
              }, 500);
            }
          }]
        );
      } catch (fetchError) {
        // Handle abort error (timeout)
        if (fetchError && typeof fetchError === 'object' && 'name' in fetchError) {
          const errorName = (fetchError as { name: string }).name;
          if (errorName === 'AbortError') {
            setResetEmailError('Email sending timed out. Please check your internet connection and try again.');
            setResetLoading(false);
            return;
          }
        }
        
        // Handle other fetch errors
        console.error('Fetch error during password reset:', fetchError);
        setResetEmailError('Network error. Please check your connection and try again.');
        setResetLoading(false);
        return;
      }
    } catch (error: any) {
      console.log('Password reset exception:', error);
      
      // Try to extract a meaningful error message if possible
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          // If it's a standard error object with a message
          const message = (error as { message: string }).message;
          errorMessage = message;
          
          // Check for rate limiting in the error message
          if (message.includes('security purposes') && message.includes('seconds')) {
            const secondsMatch = message.match(/(\d+) seconds/);
            const seconds = secondsMatch ? secondsMatch[1] : '60';
            errorMessage = `Please wait ${seconds} seconds before requesting another reset code.`;
            
            // Update our local rate limit counter
            await resetRateLimitCounter(resetEmail);
          }
        } else if ('error_description' in error) {
          // If it's an OAuth-style error
          errorMessage = (error as { error_description: string }).error_description;
        } else if ('error' in error && typeof (error as any).error === 'object') {
          const errorObj = (error as any).error;
          
          // Handle nested error objects (common in Supabase AuthApiError)
          if ('message' in errorObj) {
            errorMessage = (errorObj as { message: string }).message;
            
            // Check for rate limiting in the nested error message
            const nestedMessage = (errorObj as { message: string }).message;
            if (nestedMessage.includes('security purposes') && nestedMessage.includes('seconds')) {
              const secondsMatch = nestedMessage.match(/(\d+) seconds/);
              const seconds = secondsMatch ? secondsMatch[1] : '60';
              errorMessage = `Please wait ${seconds} seconds before requesting another reset code.`;
              
              // Update our local rate limit counter
              await resetRateLimitCounter(resetEmail);
            }
          }
        }
      }
      
      setResetEmailError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

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
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      // Sign in the user
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check if signInError is an object with a message property
        if (signInError && typeof signInError === 'object' && 'message' in signInError) {
          const errorMessage = (signInError as { message: string }).message;
          if (errorMessage.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
            return;
          }
        }
        throw signInError;
      }
      
      if (!user) throw new Error('No user returned from sign in');

      // Get fresh user data
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!freshUser) throw new Error('Failed to get user data');

      // Profile will be handled by AuthContext
      // No need to manually create/update profile here

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      // Extract the error message from the error object
      let errorMessage = '';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.error && typeof error.error === 'object' && 'message' in error.error) {
          errorMessage = error.error.message;
        }
      }
      
      // Only log unexpected errors to console
      const isCommonError = errorMessage.includes('Invalid login credentials') || 
                           errorMessage.includes('Email not confirmed') ||
                           errorMessage.includes('security purposes');
      
      if (!isCommonError) {
        console.error('Login error:', error);
      }
      
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please confirm your email before logging in.');
      } else if (errorMessage.includes('security purposes') && errorMessage.includes('seconds')) {
        // Handle rate limiting error
        const secondsMatch = errorMessage.match(/(\d+) seconds/);
        const seconds = secondsMatch ? secondsMatch[1] : '60';
        setError(`For security purposes, please wait ${seconds} seconds before trying again.`);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to continue your productivity journey</Text>
              </RNAnimated.View>
            </View>

            {/* Glass card for form */}
            <BlurView intensity={80} tint="light" style={styles.formCard}>
              <View style={styles.form}>
                {/* Email input */}
                <RNAnimated.View 
                  style={[
                    styles.inputContainer,
                    emailFocused && styles.inputContainerFocused
                  ]}
                >
                  <Mail 
                    size={20} 
                    color={emailFocused ? COLORS.primary : COLORS.textSecondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </RNAnimated.View>

                {/* Password input */}
                <RNAnimated.View 
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
                    placeholder="Password"
                    placeholderTextColor={COLORS.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry
                  />
                </RNAnimated.View>

                {/* Forgot password link */}
                <TouchableOpacity 
                  style={styles.forgotPasswordContainer}
                  onPress={() => setForgotPasswordModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Error message */}
                {error && (
                  <Animated.View 
                    style={styles.errorContainer}
                    entering={FadeInDown.duration(300)}
                  >
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                {/* Sign in button */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Signing in...' : 'Sign in'}
                    </Text>
                    <ArrowRight color="#FFF" size={20} />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google sign in button */}
                <TouchableOpacity 
                  style={styles.googleButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleIconContainer}>
                    <View style={styles.googleIcon} />
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
            </BlurView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity 
                style={styles.signUpLink}
                onPress={() => router.push('../signup')}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpLinkText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={styles.modalContainer}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
          >
            <BlurView intensity={80} tint="light" style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setForgotPasswordModalVisible(false)}
                >
                  <X size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              {resetEmailSent ? (
                // Success message
                <View style={styles.resetSuccessContainer}>
                  <CheckCircle size={60} color={COLORS.primary} style={styles.resetSuccessIcon} />
                  <Text style={styles.resetSuccessTitle}>Email Sent</Text>
                  <Text style={styles.resetSuccessText}>
                    If an account exists with the email you provided, we've sent a password reset link to your email.
                  </Text>
                  <Text style={styles.resetSuccessSubtext}>
                    Please check your email and follow the instructions to reset your password.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetSuccessButton}
                    onPress={() => setForgotPasswordModalVisible(false)}
                  >
                    <Text style={styles.resetSuccessButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Reset password form
                <View style={styles.resetFormContainer}>
                  <Text style={styles.resetInstructions}>
                    Enter your email address and we'll send you instructions to reset your password.
                  </Text>
                  
                  {/* Email input */}
                  <View 
                    style={[
                      styles.resetInputContainer,
                      resetEmailFocused && styles.inputContainerFocused
                    ]}
                  >
                    <Mail 
                      size={20} 
                      color={resetEmailFocused ? COLORS.primary : COLORS.textSecondary} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.textSecondary}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      onFocus={() => setResetEmailFocused(true)}
                      onBlur={() => setResetEmailFocused(false)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!resetLoading}
                    />
                  </View>
                  
                  {/* Error message */}
                  {resetEmailError && (
                    <Animated.View 
                      style={styles.resetErrorContainer}
                      entering={FadeInDown.duration(300)}
                    >
                      <View style={styles.resetErrorContent}>
                        <AlertCircle size={16} color={COLORS.error} style={styles.resetErrorIcon} />
                        <Text style={styles.resetErrorText}>{resetEmailError}</Text>
                      </View>
                    </Animated.View>
                  )}
                  
                  {/* Reset button */}
                  <TouchableOpacity
                    style={[styles.resetButton, resetLoading && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={resetLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.resetButtonGradient}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.resetButtonText}>Send Reset Instructions</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {/* Cancel button */}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setForgotPasswordModalVisible(false)}
                    disabled={resetLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  
  // Logo and branding
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.textLight,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Top section
  topSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: COLORS.textLight,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    opacity: 0.9,
    maxWidth: '80%',
  },
  
  // Form card with glassmorphism
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: COLORS.backgroundDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  form: {
    gap: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Input fields
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
  },
  
  // Forgot password
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  
  // Error message
  errorContainer: {
    marginVertical: 8,
    width: '100%',
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 101, 101, 0.3)',
    overflow: 'hidden',
  },
  
  // Sign in button
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textLight,
    marginHorizontal: 16,
    opacity: 0.8,
  },
  
  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.google,
  },
  googleButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    gap: 8,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  signUpLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signUpLinkText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.textLight,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 225, 0.3)',
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Reset form styles
  resetFormContainer: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  resetInstructions: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  resetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  resetErrorContainer: {
    marginBottom: 16,
  },
  resetErrorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 101, 101, 0.3)',
  },
  resetErrorIcon: {
    marginRight: 8,
  },
  resetErrorText: {
    fontFamily: 'Inter-Medium',
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
  resetButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  resetButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Reset success styles
  resetSuccessContainer: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
  },
  resetSuccessIcon: {
    marginBottom: 16,
  },
  resetSuccessTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 12,
  },
  resetSuccessText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  resetSuccessSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  resetSuccessButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  resetSuccessButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.textLight,
  },
});