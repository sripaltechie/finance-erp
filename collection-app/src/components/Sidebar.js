import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  Animated, Dimensions, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  X, LogOut, LayoutDashboard, Map, Search, 
  User, Shield, Users, Wallet, Settings ,List
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; // Takes 75% of screen width

export default function Sidebar({ visible, onClose }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  // Load User Info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) setUser(JSON.parse(userData));
      } catch (e) { console.log(e); }
    };
    if (visible) loadUser();
  }, [visible]);

  // Animation Logic
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/(auth)/login');
  };

  const navigateTo = (path) => {
    onClose();
    router.push(path);
  };

  // Define Menu Items based on Role
  const role = user?.user?.role || 'Collection_Boy';
  const isAdmin = role === 'Admin' || role === 'Client';

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.overlay}>
        {/* Transparent Touch Area to Close */}
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        {/* Sliding Sidebar */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          
          {/* 1. HEADER / PROFILE */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.ownerName?.charAt(0) || user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.ownerName || user?.name || 'User'}</Text>
              <Text style={styles.userRole}>{role.replace('_', ' ')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 2. MENU ITEMS */}
          <View style={styles.menuContainer}>
            
            <Text style={styles.sectionLabel}>MAIN MENU</Text>
            
            <MenuItem icon={LayoutDashboard} label="Dashboard" onPress={() => navigateTo('/(tabs)')} />
            <MenuItem icon={Map} label="My Route" onPress={() => navigateTo('/(tabs)/collection')} />
            <MenuItem icon={List} label="Customer List" onPress={() => navigateTo('/customers/')} />
            
            {/* ADMIN ONLY LINKS */}
            {isAdmin && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>ADMIN CONTROLS</Text>
                <MenuItem icon={Users} label="Manage Staff" onPress={() => navigateTo('/staff')} />
                <MenuItem icon={Wallet} label="Company Setup" onPress={() => navigateTo('/company-setup')} />
              </>
            )}

            <View style={styles.divider} />
            
            <MenuItem icon={User} label="My Profile" onPress={() => navigateTo('/(tabs)/profile')} />
            <MenuItem icon={Settings} label="Settings" onPress={() => navigateTo('/settings')} /> 
          </View>

          {/* 3. FOOTER */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

// Helper Component for Menu Row
const MenuItem = ({ icon: Icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon size={22} color="#475569" style={{ marginRight: 12 }} />
    <Text style={styles.menuText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { 
    width: SIDEBAR_WIDTH, 
    height: '100%', 
    backgroundColor: '#fff', 
    position: 'absolute', 
    left: 0,
    elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10
  },
  header: { 
    height: 140, 
    backgroundColor: '#0f172a', 
    padding: 20, 
    paddingTop: 50,
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12
  },
  avatar: { 
    width: 50, height: 50, 
    borderRadius: 25, 
    backgroundColor: '#2563eb', 
    alignItems: 'center', justifyContent: 'center' 
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userRole: { color: '#94a3b8', fontSize: 12 },
  closeBtn: { position: 'absolute', top: 40, right: 20 },
  
  menuContainer: { flex: 1, paddingVertical: 20 },
  sectionLabel: { 
    paddingHorizontal: 20, marginBottom: 10, marginTop: 10,
    fontSize: 11, fontWeight: 'bold', color: '#94a3b8' 
  },
  menuItem: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 14, paddingHorizontal: 20,
    // borderBottomWidth: 1, borderBottomColor: '#f8fafc'
  },
  menuText: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10, marginHorizontal: 20 },

  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    backgroundColor: '#fff'
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 10 }
});