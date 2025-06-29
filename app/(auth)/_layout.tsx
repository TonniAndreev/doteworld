import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dog-profile" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="callback" />
      <Stack.Screen name="invite/[token]" />
    </Stack>
  );
}