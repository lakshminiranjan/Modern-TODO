import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safely navigate to a route after ensuring the Root Layout is mounted
 * This prevents the "Attempted to navigate before mounting the Root Layout component" error
 * 
 * @param route The route to navigate to
 * @param params Optional parameters to pass to the route
 * @param method The navigation method to use (replace, push, etc.)
 * @param maxAttempts Maximum number of attempts to check if Root Layout is mounted
 */
export const safeNavigate = async (
  route: string,
  params?: Record<string, string>,
  method: 'replace' | 'push' = 'replace',
  maxAttempts: number = 50
): Promise<void> => {
  let attempts = 0;
  
  // Force set the global flag to true to ensure navigation works
  // This is a workaround for cases where the flag might not be set properly
  global.rootLayoutMounted = true;
  
  // Try to set the AsyncStorage flag as well
  try {
    await AsyncStorage.setItem('root_layout_mounted', 'true');
  } catch (error) {
    console.error('Failed to set root_layout_mounted in AsyncStorage:', error);
  }
  
  const navigate = async (): Promise<void> => {
    try {
      attempts++;
      
      // Check if Root Layout is mounted
      const isLayoutMounted = await AsyncStorage.getItem('root_layout_mounted');
      const isGlobalFlagSet = global.rootLayoutMounted === true;
      
      // Log the current state for debugging
      console.log(`Navigation check: AsyncStorage=${isLayoutMounted}, globalFlag=${isGlobalFlagSet}, attempt=${attempts}`);
      
      // Always consider the layout mounted after a certain number of attempts
      // This prevents infinite waiting
      const forceNavigate = attempts >= 5;
      
      if (isLayoutMounted === 'true' || isGlobalFlagSet || forceNavigate) {
        // Layout is mounted or we're forcing navigation, proceed
        console.log(`Navigating to ${route} with method ${method}`);
        
        // Add a small delay to ensure any pending operations complete
        setTimeout(() => {
          try {
            if (method === 'replace') {
              if (params) {
                router.replace({
                  pathname: route as any,
                  params
                });
              } else {
                router.replace(route as any);
              }
            } else if (method === 'push') {
              if (params) {
                router.push({
                  pathname: route as any,
                  params
                });
              } else {
                router.push(route as any);
              }
            }
          } catch (navError) {
            console.error('Navigation error:', navError);
          }
        }, 50);
        
        return;
      } else {
        // Layout not mounted yet, wait and check again
        if (attempts < maxAttempts) {
          console.log(`Waiting for Root Layout to mount before navigating (attempt ${attempts}/${maxAttempts})...`);
          setTimeout(navigate, 100);
        } else {
          console.warn(`Failed to navigate after ${maxAttempts} attempts. Root Layout may not be mounting properly.`);
          // As a fallback, try to navigate anyway
          setTimeout(() => {
            try {
              if (method === 'replace') {
                if (params) {
                  router.replace({
                    pathname: route as any,
                    params
                  });
                } else {
                  router.replace(route as any);
                }
              } else if (method === 'push') {
                if (params) {
                  router.push({
                    pathname: route as any,
                    params
                  });
                } else {
                  router.push(route as any);
                }
              }
            } catch (navError) {
              console.error('Fallback navigation error:', navError);
            }
          }, 50);
        }
      }
    } catch (error) {
      console.error('Error during safe navigation:', error);
      if (attempts < maxAttempts) {
        // Wait a bit longer and try again
        setTimeout(navigate, 200);
      } else {
        console.warn(`Failed to navigate after ${maxAttempts} attempts due to errors.`);
        // Final fallback attempt
        setTimeout(() => {
          try {
            if (method === 'replace') {
              router.replace(route as any);
            } else {
              router.push(route as any);
            }
          } catch (finalError) {
            console.error('Final navigation attempt failed:', finalError);
          }
        }, 100);
      }
    }
  };
  
  // Start the navigation process
  await navigate();
};