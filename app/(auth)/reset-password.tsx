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
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowRight, LogIn, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { validatePasswordStrength } from '../../lib/security';

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

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Input focus states for animation
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new RNAnimated.Value(0))[0];
  const slideAnim = useState(new RNAnimated.Value(50))[0];
  const scaleAnim = useState(new RNAnimated.Value(0.9))[0];
  
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
  
  // Use the imported validatePasswordStrength function
  
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
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) {
        console.log('Password reset error:', updateError);
        
        // Handle specific error types
        if (updateError.message.includes('expired') || 
            updateError.message.includes('invalid') || 
            updateError.message.includes('JWT')) {
          // Token expired or invalid
          setError('Your password reset link has expired or is invalid. Please request a new one.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.replace('/login');
          }, 3000);
        } else if (updateError.message.includes('security purposes') && updateError.message.includes('seconds')) {
          // Rate limiting error
          const secondsMatch = updateError.message.match(/(\d+) seconds/);
          const seconds = secondsMatch ? secondsMatch[1] : '60';
          
          setError(`Please wait ${seconds} seconds before trying again.`);
        } else if (updateError.message.includes('Password should be')) {
          // Password requirements error from Supabase
          setError('Your password does not meet the security requirements. Please make it stronger.');
        } else {
          // Generic error
          setError('Failed to reset your password. Please try again or request a new reset link.');
        }
        return;
      }
      
      // Success
      setSuccess(true);
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
      
    } catch (error: any) {
      console.log('Password reset exception:', error);
      
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
              router.replace('/login');
            }, 3000);
          }
        } else if ('error_description' in error && typeof error.error_description === 'string') {
          // If it's an OAuth-style error
          errorMessage = error.error_description;
        }
      }
      
      setError(errorMessage);
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
                <Text style={styles.title}>Reset Password</Text>
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
                          <AlertCircle size={16} color={COLORS.error} style={styles.errorIcon} />
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      </Animated.View>
                    )}
                    
                    {/* Reset button */}
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleResetPassword}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.buttonText}>Reset Password</Text>
                            <ArrowRight color="#FFF" size={20} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    {/* Back to login */}
                    <TouchableOpacity
                      style={styles.backToLoginButton}
                      onPress={() => router.replace('/login')}
                      disabled={loading}
                    >
                      <Text style={styles.backToLoginText}>Back to Login</Text>
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
  eyeIcon: {
    padding: 8,
  },
  
  // Password requirements
  passwordRequirements: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  passwordRequirementsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
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
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  passwordRequirementText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  
  // Error message
  errorContainer: {
    marginVertical: 8,
    width: '100%',
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
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
    flex: 1,
  },
  
  // Success message
  successContainer: {
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 12,
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Button
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
  
  // Back to login
  backToLoginButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  backToLoginText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.textLight,
    opacity: 0.9,
  },
});