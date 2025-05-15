import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateEmailTemplates } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function EmailTemplatesScreen() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  
  // Check if user is authorized (this is a simple check, you might want to implement proper admin checks)
  useEffect(() => {
    if (!user) {
      Alert.alert('Unauthorized', 'You must be logged in to access this page.');
      router.replace('/login');
    }
  }, [user]);
  
  const handleUpdateTemplates = async () => {
    try {
      setLoading(true);
      setSuccess(false);
      
      const result = await updateEmailTemplates();
      
      if (result) {
        setSuccess(true);
        Alert.alert(
          'Success', 
          'Email templates have been loaded successfully. To apply these templates permanently, please update them in the Supabase Dashboard under Authentication {\'>\'}  Email Templates.'
        );
      } else {
        Alert.alert(
          'Error', 
          'Failed to update email templates. Please check the console for more details.'
        );
      }
    } catch (error) {
      console.error('Error updating templates:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred while updating email templates.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Email Templates</Text>
          
          <Text style={styles.description}>
            This page allows you to preview the email templates used for authentication emails.
            To make permanent changes, use the Supabase Dashboard. The templates include:
          </Text>
          
          <View style={styles.templateList}>
            <View style={styles.templateItem}>
              <Text style={styles.templateName}>Password Reset</Text>
              <Text style={styles.templateDescription}>
                Sent when a user requests a password reset.
              </Text>
            </View>
            
            <View style={styles.templateItem}>
              <Text style={styles.templateName}>Email Verification</Text>
              <Text style={styles.templateDescription}>
                Sent when a new user signs up to verify their email address.
              </Text>
            </View>
            
            <View style={styles.templateItem}>
              <Text style={styles.templateName}>Magic Link</Text>
              <Text style={styles.templateDescription}>
                Sent when a user requests a magic link to sign in.
              </Text>
            </View>
          </View>
          
          <Text style={styles.note}>
            Note: Email templates can be previewed here, but actual updates must be done through the Supabase Dashboard.
            Go to Authentication {'>'}  Email Templates in your Supabase project dashboard to make permanent changes.
            The templates are designed to be responsive and work well on all devices.
          </Text>
          
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.buttonDisabled]}
            onPress={handleUpdateTemplates}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>
                {success ? 'Templates Loaded ✓' : 'Preview Email Templates'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 24,
  },
  templateList: {
    marginBottom: 24,
  },
  templateItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  note: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  updateButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '500',
  },
});