import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, LogOut, Shield, MapPin, Building, Phone, KeyRound } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed.user || parsed);
      }
    } catch (e) {
      console.log("Error loading profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to end your session?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
            await AsyncStorage.clear(); // Wipe all session data
            router.replace('/');
        }
      }
    ]);
  };

  if (loading) {
      return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const isOwner = user?.role === 'Client' || !user?.role;
  const displayName = isOwner ? user?.ownerName : user?.name;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.mobile}>{user?.mobile || 'No Mobile Available'}</Text>
            <View style={styles.roleBadge}>
              <Shield size={12} color="#2563eb" style={{marginRight: 4}} />
              <Text style={styles.roleText}>{isOwner ? 'Business Owner' : user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Options Menu */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuGroup}>
            
            {isOwner && (
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/company-setup')}>
                    <View style={[styles.iconBox, {backgroundColor: '#e0e7ff'}]}>
                        <Building size={20} color="#2563eb" />
                    </View>
                    <Text style={styles.menuText}>Manage Branches</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.iconBox, {backgroundColor: '#f3e8ff'}]}>
                    <KeyRound size={20} color="#9333ea" />
                </View>
                <Text style={styles.menuText}>Change Password</Text>
            </TouchableOpacity>

        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <View style={[styles.iconBox, {backgroundColor: '#fee2e2'}]}>
                    <LogOut size={20} color="#dc2626" />
                </View>
                <Text style={[styles.menuText, {color: '#dc2626', fontWeight: 'bold'}]}>Log Out</Text>
            </TouchableOpacity>
        </View>
        
        <Text style={styles.version}>Chanda Services • App Version 1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  
  profileCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 30, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  mobile: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 10 },
  menuGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  
  version: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 20 }
});