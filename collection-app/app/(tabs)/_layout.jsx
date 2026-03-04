import { Tabs } from 'expo-router';
import { LayoutDashboard, Map, Search, User, AlertCircle, Bell  } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

export default function TabLayout() {
  const insets = useSafeAreaInsets(); 

  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
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
      {/* <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      /> */}
{/* 1. HOME (Reports Dashboard) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      {/* 2. DUE TODAY (Defaulters) */}
      <Tabs.Screen
        name="due-list"
        options={{
          title: 'Defaulters',
          tabBarIcon: ({ color, size }) => <AlertCircle size={size} color={color} />,
        }}
      />

      {/* 3. COLLECTION ROUTE (The Main Work Page) */}
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collect',
          tabBarIcon: ({ color, size }) => (
            <View className="bg-blue-50 p-1 rounded-full">
              <Map size={size} color={color} />
            </View>
          ),
        }}
      />

      {/* 4. REMINDERS */}
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />

      {/* 5. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      
      {/* Hidden Screens inside tabs context */}
      <Tabs.Screen
        name="company-setup"
        options={{ href: null }} 
      />
      {/* 4. CUSTOMER SEARCH */}
      <Tabs.Screen
        name="search"
        options={{ href: null }} 
        // options={{
        //   title: 'Search',
        //   tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        // }}
      />
      <Tabs.Screen
        name="index1"
        options={{ href: null }} 
      />
    </Tabs>
  );
}