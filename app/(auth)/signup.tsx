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
  Pressable,
  KeyboardAvoidingView
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowRight, UserPlus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  
  // Animation values
  const fadeAnim = useState(new RNAnimated.Value(0))[0];
  const slideAnim = useState(new RNAnimated.Value(50))[0];
  const scaleAnim = useState(new RNAnimated.Value(0.9))[0];
  
  // Input focus states for animation
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
  if (session) {
    router.replace('/(tabs)');
    return null;
  }

  const handleSignup = async () => {
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
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      // Check for specific error types
      if (signUpError) {
        // Check if the error message contains text about user already registered
        if (signUpError.message.includes('already registered') || 
            signUpError.message.toLowerCase().includes('user already exists') ||
            signUpError.message.toLowerCase().includes('email already in use')) {
          setError('User with this email already exists. Please use a different email or try logging in.');
          return;
        }
        throw signUpError;
      }

      // Profile will be handled by AuthContext when the user logs in
      // No need to manually create profile here

      // 3. Navigate to login page after successful signup
      router.replace('/login');
    } catch (err) {
      // Don't log to console for user-already-exists errors
      if (err instanceof Error && 
          !(err.message.includes('already registered') || 
            err.message.toLowerCase().includes('user already exists') ||
            err.message.toLowerCase().includes('email already in use'))) {
        console.error('Signup error:', err);
      }
      
      setError(err instanceof Error ? err.message : String(err));
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
                <UserPlus size={32} color={COLORS.textLight} />
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
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Sign up to get started with TaskMaster</Text>
              </RNAnimated.View>
            </View>

            {/* Glass card for form */}
            <BlurView intensity={80} tint="light" style={styles.formCard}>
              <View style={styles.form}>
                {/* Name input */}
                <RNAnimated.View 
                  style={[
                    styles.inputContainer,
                    nameFocused && styles.inputContainerFocused
                  ]}
                >
                  <User 
                    size={20} 
                    color={nameFocused ? COLORS.primary : COLORS.textSecondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </RNAnimated.View>

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

                {/* Error message */}
                {error && (
                  <Animated.View 
                    style={styles.errorContainer}
                    entering={FadeInDown.duration(300)}
                  >
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                {/* Sign up button */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignup}
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
                      {loading ? 'Creating account...' : 'Create account'}
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
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity 
                style={styles.signInLink}
                onPress={() => router.push('../login')}
                activeOpacity={0.7}
              >
                <Text style={styles.signInLinkText}>Sign in</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 16,
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
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.textLight,
    opacity: 0.9,
    textAlign: 'center',
    maxWidth: '80%',
  },
  
  // Form card
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
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
  
  // Button
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.textLight,
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
    fontFamily: 'Inter-Medium',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.google,
    marginRight: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.google,
  },
  googleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  footerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  signInLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signInLinkText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.textLight,
  },
});