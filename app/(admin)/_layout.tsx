import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="email-templates"
        options={{
          title: 'Email Templates',
          headerShown: true,
        }}
      />
    </Stack>
  );
}