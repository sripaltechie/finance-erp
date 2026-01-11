import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Expo Router automatically finds 'index' and 'register' inside this folder.
  // We just define the Stack wrapper here.
  return <Stack screenOptions={{ headerShown: false }} />;
}