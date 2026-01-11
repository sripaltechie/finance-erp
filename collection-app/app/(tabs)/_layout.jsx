import { Tabs } from 'expo-router';
import { LayoutDashboard, Map, Search, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We usually hide default headers for custom look
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 70, // Taller bar for modern look
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#2563eb', // Blue-600
        tabBarInactiveTintColor: '#94a3b8', // Slate-400
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. HOME (Dashboard) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />

      {/* 2. COLLECTION ROUTE (The Main Work Page) */}
      <Tabs.Screen
        name="collection"
        options={{
          title: 'My Route',
          tabBarIcon: ({ color, size }) => (
            <View className="bg-blue-50 p-1 rounded-full">
               {/* Highlight the main action button */}
              <Map size={size} color={color} />
            </View>
          ),
        }}
      />

      {/* 3. CUSTOMER SEARCH */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />

      {/* 4. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}