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
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { validatePasswordStrength } from '../../lib/security';
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
              { text: 'OK', onPress: () => router.replace('/login') }
            ]
          );
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        Alert.alert(
          'Error',
          'Something went wrong. Please try again.',
          [
            { text: 'OK', onPress: () => router.replace('/login') }
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
        return;
      }
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message || 'Password is not strong enough');
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      // Verify session
      const storedEmail = await AsyncStorage.getItem(OTP_EMAIL_KEY);
      if (!storedEmail || storedEmail !== email) {
        setError('Your session is invalid or has expired. Please request a new password reset.');
        return;
      }
      
      // Try to get the stored session from the OTP verification step
      const sessionJson = await AsyncStorage.getItem('supabase_session');
      let session = null;
      
      if (sessionJson) {
        try {
          session = JSON.parse(sessionJson);
          console.log('Retrieved stored session for password update');
        } catch (parseError) {
          console.error('Error parsing stored session:', parseError);
        }
      }
      
      // Check if we're using local verification
      const usingLocalVerification = await AsyncStorage.getItem('using_local_verification');
      
      // If we don't have a stored session, we need to re-verify the OTP
      if (!session && usingLocalVerification !== 'true') {
        console.log('No stored session found, re-verifying OTP');
        
        // Get the stored OTP
        const storedOtp = await AsyncStorage.getItem(OTP_STORAGE_KEY);
        if (!storedOtp) {
          setError('Your verification code has expired. Please request a new password reset.');
          return;
        }
        
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
              setError(`Please wait ${waitTime} seconds before trying again (rate limit protection)`);
              
              // Wait for the required time
              await new Promise(resolve => setTimeout(resolve, 15000 - timeSinceLastRequest));
            }
          }
          
          // Update the last auth request time
          await AsyncStorage.setItem('last_auth_request_time', currentTime.toString());
          
          // Now try to verify the OTP directly without requesting a new password reset
          // This avoids triggering rate limits
          console.log('Verifying OTP directly without requesting a new password reset');
        } catch (error) {
          console.error('Error checking rate limit:', error);
          // Continue with the process even if rate limit check fails
        }
        
        // Short delay to ensure the token is registered in Supabase
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Re-verify OTP to establish a session
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: storedOtp,
          type: 'recovery',
          // Don't use redirectTo for mobile apps
          options: Platform.OS === 'web' 
            ? { redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/set-new-password?email=${encodeURIComponent(email)}` }
            : undefined
        });
        
        if (verifyError) {
          console.error('OTP re-verification error:', verifyError);
          
          // Check if it's a rate limiting error
          if (verifyError.message && verifyError.message.includes('security purposes') && verifyError.message.includes('seconds')) {
            const secondsMatch = verifyError.message.match(/(\d+) seconds/);
            const seconds = secondsMatch ? secondsMatch[1] : '60';
            setError(`For security purposes, please wait ${seconds} seconds before trying again.`);
          } else if (verifyError.message && (verifyError.message.includes('expired') || verifyError.message.includes('invalid') || verifyError.message.includes('Token'))) {
            // If verification fails, mark that we're using local verification
            console.log('Supabase verification failed, using local verification');
            await AsyncStorage.setItem('using_local_verification', 'true');
            
            // Continue with the password update process
            // We'll handle this case below
          } else {
            setError('Failed to authenticate. Please try again or request a new password reset.');
            return;
          }
        } else if (verifyData && verifyData.session) {
          // Store the session for future use
          session = verifyData.session;
          await AsyncStorage.setItem('supabase_session', JSON.stringify(session));
        }
      }
      
      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we're using local verification (update the value in case it changed)
      const isUsingLocalVerification = await AsyncStorage.getItem('using_local_verification');
      
      if (isUsingLocalVerification === 'true') {
        // If we're using local verification, we need to sign in with the email
        // and then update the password
        
        // First, try to sign in with magic link
        try {
          console.log('Using local verification flow for password update');
          
          // Request a magic link to sign in
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false,
            }
          });
          
          if (signInError) {
            console.error('Error sending magic link:', signInError);
            
            // Check if the error is due to rate limiting
            if (signInError.message && signInError.message.includes('security purposes') && signInError.message.includes('seconds')) {
              // Extract the number of seconds from the error message
              const secondsMatch = signInError.message.match(/(\d+) seconds/);
              const seconds = secondsMatch ? secondsMatch[1] : '60';
              
              setError(`For security purposes, please wait ${seconds} seconds before trying again.`);
              return;
            }
            
            // If it's not a rate limiting error, we'll show a generic message
            setError('Unable to update your password at this time. Please try again later or contact support.');
            return;
            
            // If the password reset request succeeds, we'll show a success message
            setSuccess(true);
            
            // Show a message to the user
            Alert.alert(
              'Password Reset Code Sent',
              'We\'ve sent you an email with a verification code to reset your password. Please check your email and enter the code.',
              [{ text: 'OK' }]
            );
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              router.replace('/login');
            }, 3000);
            
            return;
          }
          
          // If the magic link was sent successfully, show a success message
          setSuccess(true);
          
          // Show a message to the user
          Alert.alert(
            'Sign-in Link Sent',
            'We\'ve sent you an email with a link to sign in. After signing in, you can change your password from your profile settings.',
            [{ text: 'OK' }]
          );
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.replace('/login');
          }, 3000);
          
          return;
        } catch (error) {
          console.error('Error in local verification flow:', error);
          setError('Something went wrong. Please try again later.');
          return;
        }
      } else {
        // Now update the password with the established session
        // Add retry mechanism in case the session isn't fully established on first try
        let updateError = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          const { error: attemptError } = await supabase.auth.updateUser({
            password
          });
          
          if (!attemptError) {
            // Success, no error
            updateError = null;
            break;
          }
          
          updateError = attemptError;
          console.error(`Password update attempt ${retryCount + 1} failed:`, updateError.message);
          
          // If it's a session error, wait and retry
          if (updateError.message && (updateError.message.includes('session') || updateError.message.includes('JWT'))) {
            console.log(`Retry ${retryCount + 1}/${maxRetries}: Waiting for session to be established...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            retryCount++;
          } else if (updateError.message && updateError.message.includes('security purposes') && updateError.message.includes('seconds')) {
            // If it's a rate limiting error, don't retry
            const secondsMatch = updateError.message.match(/(\d+) seconds/);
            const seconds = secondsMatch ? secondsMatch[1] : '60';
            setError(`For security purposes, please wait ${seconds} seconds before trying again.`);
            setLoading(false);
            return;
          } else {
            // If it's not a session error or rate limiting, don't retry
            break;
          }
        }
        
        if (updateError) {
          console.error('Password update error after retries:', updateError);
          
          // Check if it's a session error
          if (updateError.message && updateError.message.includes('session')) {
            // Try the local verification flow as a fallback
            await AsyncStorage.setItem('using_local_verification', 'true');
            
            // Recursively call this function to use the local verification flow
            await handleResetPassword();
            return;
          } else if (updateError.message && updateError.message.includes('security purposes') && updateError.message.includes('seconds')) {
            const secondsMatch = updateError.message.match(/(\d+) seconds/);
            const seconds = secondsMatch ? secondsMatch[1] : '60';
            setError(`For security purposes, please wait ${seconds} seconds before trying again.`);
          } else {
            setError('Failed to update password. Please try again.');
          }
          return;
        }
      }
      
      // Success
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
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
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
              You will be redirected to the login page shortly.
            </Text>
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
});