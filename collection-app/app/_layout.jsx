import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
   <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {/* Self-closing Stack auto-detects (auth) and (tabs) folders */}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}