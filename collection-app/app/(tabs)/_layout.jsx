import { Tabs } from 'expo-router';
import { LayoutDashboard, Map, Search, User ,Building2} from 'lucide-react-native';
import { View ,Platform} from 'react-native';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🟢 Import this

export default function TabLayout() {
  const insets = useSafeAreaInsets(); // 🟢 Get safe area dimensions

    useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000'); // Black background for back/home buttons
      NavigationBar.setButtonStyleAsync('light'); // White icons
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We usually hide default headers for custom look
        tabBarStyle: {
          backgroundColor: '#060606',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10), 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          elevation: 0
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
      <Tabs.Screen
        name="company-setup"
        options={{
          title: 'Company',
          tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}