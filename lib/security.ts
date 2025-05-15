import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for rate limiting
const MAX_ATTEMPTS = 5; // Maximum number of attempts allowed
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour window for counting attempts

// Storage keys
const RESET_ATTEMPTS_KEY = 'password_reset_attempts';
const RESET_LOCKOUT_KEY = 'password_reset_lockout';

/**
 * Interface for tracking password reset attempts
 */
interface ResetAttempts {
  count: number;
  timestamps: number[];
}

/**
 * Check if password reset is allowed or if the user is rate limited
 * @param email The email address to check
 * @returns An object indicating if the action is allowed and any error message
 */
export async function checkPasswordResetRateLimit(email: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Normalize email to prevent case-sensitive bypasses
    const normalizedEmail = email.toLowerCase().trim();
    
    // Create a unique key for this email
    const emailKey = `${RESET_ATTEMPTS_KEY}_${normalizedEmail}`;
    const lockoutKey = `${RESET_LOCKOUT_KEY}_${normalizedEmail}`;
    
    // Check if user is currently locked out
    const lockoutData = await AsyncStorage.getItem(lockoutKey);
    if (lockoutData) {
      const lockoutUntil = parseInt(lockoutData, 10);
      const now = Date.now();
      
      if (now < lockoutUntil) {
        // Calculate remaining lockout time in minutes
        const remainingMinutes = Math.ceil((lockoutUntil - now) / (60 * 1000));
        return { 
          allowed: false, 
          message: `Too many attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.` 
        };
      } else {
        // Lockout period has expired, remove the lockout
        await AsyncStorage.removeItem(lockoutKey);
      }
    }
    
    // Get current attempts data
    const attemptsData = await AsyncStorage.getItem(emailKey);
    let attempts: ResetAttempts = attemptsData 
      ? JSON.parse(attemptsData) 
      : { count: 0, timestamps: [] };
    
    // Filter out attempts older than the window
    const now = Date.now();
    attempts.timestamps = attempts.timestamps.filter(time => now - time < ATTEMPT_WINDOW);
    attempts.count = attempts.timestamps.length;
    
    // Check if max attempts reached
    if (attempts.count >= MAX_ATTEMPTS) {
      // Set lockout
      const lockoutUntil = now + LOCKOUT_DURATION;
      await AsyncStorage.setItem(lockoutKey, lockoutUntil.toString());
      
      // Reset attempts after setting lockout
      await AsyncStorage.setItem(emailKey, JSON.stringify({ count: 0, timestamps: [] }));
      
      return { 
        allowed: false, 
        message: `Too many attempts. Please try again in 15 minutes.` 
      };
    }
    
    // Record this attempt
    attempts.timestamps.push(now);
    attempts.count = attempts.timestamps.length;
    await AsyncStorage.setItem(emailKey, JSON.stringify(attempts));
    
    // Action is allowed
    return { allowed: true };
  } catch (error) {
    console.error('Error in rate limit check:', error);
    // Default to allowing the action if there's an error checking
    return { allowed: true };
  }
}

/**
 * Reset the rate limit counter for an email
 * @param email The email to reset the counter for
 */
export async function resetRateLimitCounter(email: string): Promise<void> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const emailKey = `${RESET_ATTEMPTS_KEY}_${normalizedEmail}`;
    const lockoutKey = `${RESET_LOCKOUT_KEY}_${normalizedEmail}`;
    
    await AsyncStorage.removeItem(emailKey);
    await AsyncStorage.removeItem(lockoutKey);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Validate password strength
 * @param password The password to validate
 * @returns An object with validation result and optional error message
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 * @param email The email to validate
 * @returns Whether the email format is valid
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}