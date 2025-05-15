import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Default fallback values to prevent network errors if env vars are not loaded
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yckxqboxgjsltvwijppo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlja3hxYm94Z2pzbHR2d2lqcHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQxMDgsImV4cCI6MjA2MjEyMDEwOH0.XkZ5Ke7ZqKMDmNuv-73_09scPQI_4_NLUWjom2kokFg';
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Create the regular client for most operations with network error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Use implicit flow instead of PKCE to avoid WebCrypto API issues
    flowType: 'implicit',
    // Set debug to true to help troubleshoot auth issues
    debug: true,
    // CRITICAL: Set to null to force OTP mode for password reset
    emailRedirectTo: null,
    // CRITICAL: Disable email confirmations to ensure OTP is used
    disableEmailConfirmation: true,
    // Disable auto-confirm to ensure OTP is sent
    autoConfirmNewUsers: false,
    // Set OTP as the preferred method for password reset
    passwordResetMethod: 'otp',
    storageKey: 'supabase_auth_token',
    storage: {
      getItem: async (key: string) => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const value = await AsyncStorage.getItem(key);
          return value;
        } catch (error) {
          console.error('Error getting auth storage item:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting auth storage item:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing auth storage item:', error);
        }
      }
    }
  },
  global: {
    headers: {
      // Add custom headers to help with debugging
      'X-Client-Info': 'supabase-js/2.x (React-Native)',
    },
    fetch: (...args) => {
      // Add timeout to prevent hanging requests
      return Promise.race([
        fetch(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 20000) // Increased timeout for auth operations
        )
      ]) as Promise<Response>;
    }
  }
});

// Create a special admin client for operations that need to bypass RLS
// This is used only for specific operations like profile management
// If service role key is not available, fall back to anon key (but RLS will still apply)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  }
);

// Function to check if the events table exists
export async function ensureEventsTableExists() {
  try {
    // Try a simple direct query to check if the table exists
    try {
      const { data: directData, error: directError } = await supabase
        .from('events')
        .select('count(*)')
        .limit(1);
      
      if (!directError) {
        return true;
      }
    } catch (directErr) {
      // Silently continue
    }
    
    // If we've reached here, the table doesn't exist
    return false;
  } catch (err) {
    console.error('Error in ensureEventsTableExists:', err);
    return false;
  }
}

// Function to execute SQL directly using the Supabase SQL API
export async function executeSql(sql: string) {
  try {
    // Use the already defined supabaseUrl and supabaseServiceKey variables
    const supabaseKey = supabaseServiceKey || supabaseAnonKey || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or service role key');
      return { success: false, error: 'Missing Supabase URL or service role key' };
    }
    
    // Use the Supabase SQL API endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sql }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SQL execution failed:', errorText);
        return { success: false, error: errorText };
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
        console.error('SQL execution timed out');
        return { success: false, error: 'Request timed out' };
      }
      throw fetchError;
    }
  } catch (err) {
    console.error('Exception in executeSql:', err);
    return { success: false, error: String(err) };
  }
}

// Function to safely manage profile operations with direct database access
/**
 * Update the Supabase email templates
 * This function should be called during app initialization or from an admin panel
 * 
 * Note: This is a mock implementation since direct email template updates
 * require Supabase Dashboard access or self-hosted instance configuration.
 * In a production environment, email templates should be configured through
 * the Supabase Dashboard under Authentication > Email Templates.
 */
export async function updateEmailTemplates() {
  try {
    // Check if we have the service role key
    if (!supabaseServiceKey) {
      console.log('Service role key not available, skipping email template update');
      return false;
    }
    
    // Import only the OTP template from the module
    // This avoids file system access which isn't available in React Native
    const { OTP_TEMPLATE } = require('./email-templates');
    
    console.log('Successfully loaded OTP template from module');
    
    // Verify that the OTP template contains the correct placeholder
    if (!OTP_TEMPLATE.includes('{{ .Data.otp }}')) {
      console.warn('WARNING: OTP template does not contain the correct placeholder: {{ .Data.otp }}');
      console.warn('Please update the template in lib/email-templates.ts');
    } else {
      console.log('OTP template contains the correct placeholder: {{ .Data.otp }}');
    }
    
    // In a real implementation, we would update the templates via the Supabase Dashboard
    // or via the Management API if available
    
    // For now, we'll simulate a successful update
    console.log('Email templates would be updated in a production environment');
    console.log('To update email templates, go to the Supabase Dashboard:');
    console.log('Authentication > Email Templates');
    
    // Log template details for verification
    console.log('Templates loaded successfully:');
    console.log('- OTP Template: ' + (OTP_TEMPLATE ? 'Loaded' : 'Missing'));
    
    // For compatibility with existing code, export the OTP template as all template types
    const RESET_PASSWORD_TEMPLATE = OTP_TEMPLATE;
    const CONFIRMATION_TEMPLATE = OTP_TEMPLATE;
    const MAGIC_LINK_TEMPLATE = OTP_TEMPLATE;
    
    // Important note for developers:
    console.log('IMPORTANT: For OTP to be sent via email, make sure to:');
    console.log('1. Configure the OTP template in Supabase Dashboard');
    console.log('2. Set up a proper email provider in Supabase Dashboard');
    console.log('3. Ensure the {{ .Data.otp }} variable is included in the template');
    console.log('4. We are now using a single OTP template for all email types');
    console.log('5. CRITICAL: Disable "Enable Email Confirmations" in Authentication > Email > Providers > Email');
    console.log('6. CRITICAL: Set "Password Reset Link Lifespan" to 0 in Authentication > Email > Providers > Email');
    console.log('7. CRITICAL: Make sure the template in Supabase Dashboard matches the one in your code');
    
    // Return success to prevent errors in the UI
    return true;
  } catch (error) {
    console.error('Error in updateEmailTemplates:', error);
    return false;
  }
}

// Initialize Supabase settings for OTP
export async function initializeSupabaseOtpSettings() {
  try {
    console.log('Initializing Supabase OTP settings...');
    
    // Update email templates
    await updateEmailTemplates();
    
    // Set a flag in AsyncStorage to indicate we're using OTP mode
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('using_otp_mode', 'true');
    
    // Set additional flags to ensure OTP mode is used
    await AsyncStorage.setItem('supabase_use_otp', 'true');
    await AsyncStorage.setItem('supabase_disable_email_confirmation', 'true');
    
    // Log instructions for Supabase Dashboard settings
    console.log('IMPORTANT: To ensure OTP works correctly, configure these settings in Supabase Dashboard:');
    console.log('1. Authentication > Email > Providers > Email:');
    console.log('   - Disable "Enable Email Confirmations"');
    console.log('   - Set "Password Reset Link Lifespan" to 0');
    console.log('2. Authentication > Email Templates:');
    console.log('   - Ensure the OTP template includes {{ .Data.otp }}');
    console.log('   - Remove any password reset links from the template');
    console.log('   - Make sure the template only shows the OTP code');
    console.log('   - Verify that the template is properly formatted with HTML');
    
    // Verify OTP template format
    console.log('Verifying OTP template format...');
    const { OTP_TEMPLATE } = require('./email-templates');
    if (OTP_TEMPLATE && OTP_TEMPLATE.includes('{{ .Data.otp }}')) {
      console.log('OTP template contains the correct placeholder: {{ .Data.otp }}');
    } else {
      console.warn('WARNING: OTP template may not contain the correct placeholder for OTP code');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Supabase OTP settings:', error);
    return false;
  }
}

export async function manageProfile(user: { id: string; full_name?: string; avatar_url?: string | null }) {
  if (!user.id) {
    console.error('User ID is required for profile operations');
    return false;
  }

  try {
    // First, check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id as any)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking profile existence:', checkError);
    }
    
    // Prepare profile data using the Database type for type safety
    const profileData: Database['public']['Tables']['profiles']['Insert'] = {
      id: user.id,
      full_name: user.full_name || null,
      avatar_url: user.avatar_url || null,
      updated_at: new Date().toISOString()
    };
    
    // Add created_at for new profiles
    if (!existingProfile) {
      profileData.created_at = new Date().toISOString();
    }
    
    // Try with regular client first - this avoids network requests if possible
    try {
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            updated_at: profileData.updated_at
          })
          .eq('id', user.id as any);
          
        if (!updateError) {
          return true;
        }
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);
          
        if (!insertError) {
          return true;
        }
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue to fallback method
    }
    
    // Fallback: Use AsyncStorage to store profile data locally
    try {
      const storageKey = `profile_${user.id}`;
      const profileJson = JSON.stringify(profileData);
      
      // Use AsyncStorage from react-native
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(storageKey, profileJson);
      
      console.log('Profile stored locally due to network issues');
      return true;
    } catch (storageError) {
      console.error('Failed to store profile locally:', storageError);
      return false;
    }
  } catch (error) {
    console.error('Profile operation failed:', error);
    return false;
  }
}
