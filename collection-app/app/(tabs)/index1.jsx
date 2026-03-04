import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert,StatusBar} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Wallet, TrendingUp, Users, AlertTriangle, PlusCircle, FileText, ArrowRight, Menu ,Lock,Search
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../../src/components/Sidebar'

// 🟢 1. Import from UNIFIED API
import { getDashboardStatsService } from '../../src/api/api'; // Changed path

export default function Dashboard() {
  const router = useRouter();  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [userData, setUserData] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
  // Initial State
  const [stats, setStats] = useState({
    cashBalance: 0,
    bankBalance: 0,
    todayCollection: 0,
    activeLoans: 0,
    overdueAmount: 0
  });

  // 🟢 2. Use Service
  const fetchStats = async () => {
    try {
      const companyId = await AsyncStorage.getItem('activeCompanyId');
      const ownerInfoString = await AsyncStorage.getItem('userInfo');
      if (ownerInfoString) {
      const ownerInfo = JSON.parse(ownerInfoString);
      setUserData(ownerInfo);
      // Now you can access .user
      // console.log("Owner Name:", ownerInfo.user?.companies); 
    }
    // 🛑 CRITICAL: Check if companyId is actually there
    if (!companyId || companyId === 'undefined') { 
      console.log("No Company ID found yet...");
      return; // Stop the execution here
    }
    
    // console.log("Fetching stats for Company ID:", companyId);
      const data = await getDashboardStatsService(companyId);
      setStats(data);
      setIsPending(false); 
    } catch (error) {
      // console.log("Dashboard Fetch Error:", error);
      // Logic for redirect if no company selected is handled inside API service or here
      if (typeof error === 'string' && (error === "No Company Selected" || error.includes("Company ID"))) {
        Alert.alert(
            "Setup Required",
            "You haven't selected a branch. Redirecting to setup...",
            [{ text: "OK", onPress: () => router.replace('/company-setup') }]
          );
          return;
      }
      // Simple error handling
      // Alert.alert("Connection Error", "Retrying...");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const QuickAction = ({ icon: Icon, label, route, color }) => (
    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(route)}>
      <View style={[styles.actionIconBox, { backgroundColor: color }]}>
        <Icon size={24} color="#fff" />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.center}>
        <Lock size={64} color="#fbbf24" />
        <Text style={styles.pendingTitle}>Account Pending</Text>
        <Text style={styles.pendingSub}>
          Your account is waiting for admin approval. Please contact support.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🟢 SIDEBAR COMPONENT */}
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      {/* HEADER WITH MENU BUTTON */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* 🟢 Menu Button Triggers Sidebar */}
           <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuBtn}>
            <Menu size={28} color="#0f172a" />
          </TouchableOpacity>
          <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
           <Text style={styles.ownerName}>{userData?.user?.ownerName || " "}</Text> 
          </View>
        </View>
         {/* Profile Avatar (Optional Shortcut) */}
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
           <View style={styles.avatar}><Text style={styles.avatarText}>CO</Text></View>
        </TouchableOpacity>
      </View>
      {loading ? (
              <View style={styles.center}><ActivityIndicator size="large" color="#0f172a" /></View>
            ) : (
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        {/* TODAY'S COLLECTION CARD */}
        <View style={styles.mainCard}>
           <View style={styles.mainCardHeader}>
              <Text style={styles.mainCardLabel}>Today's Collection</Text>
              <TrendingUp size={20} color="#fff" />
           </View>
           <Text style={styles.mainCardValue}>₹ {(stats?.todayCollection ?? 0).toLocaleString()}</Text>
           <Text style={styles.mainCardSub}>Target: ₹ 50,000 (Mock)</Text>
        </View>

        {/* FINANCIAL OVERVIEW GRID */}
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.grid}>
           {/* Cash Balance */}
           <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                 <Wallet size={20} color="#0284c7" />
              </View>
              <Text style={styles.statLabel}>Cash In Hand</Text>
              <Text style={styles.statValue}>₹{(stats?.cashBalance ?? 0).toLocaleString()}</Text>
           </View>

           {/* Bank Balance */}
           <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                 <Wallet size={20} color="#16a34a" />
              </View>
              <Text style={styles.statLabel}>Bank Balance</Text>
              <Text style={styles.statValue}>₹{(stats?.bankBalance ?? 0).toLocaleString()}</Text>
           </View>

           {/* Active Loans */}
           <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                 <Users size={20} color="#9333ea" />
              </View>
              <Text style={styles.statLabel}>Active Loans</Text>
              <Text style={styles.statValue}>{stats.activeLoans}</Text>
           </View>

           {/* Overdue */}
           <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                 <AlertTriangle size={20} color="#dc2626" />
              </View>
              <Text style={styles.statLabel}>Overdue Amt</Text>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>₹{(stats?.overdueAmount ?? 0).toLocaleString()}</Text>
           </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
           <QuickAction icon={PlusCircle} label="New Loan" route="/loans/create" color="#2563eb" />
           <QuickAction icon={Users} label="Add Customer" route="/customers/manage" color="#059669" />
           <QuickAction icon={FileText} label="Reports" route="/staff/" color="#7c3aed" />
           <QuickAction icon={Menu} label="More" route="/(tabs)/profile" color="#475569" />
        </View>

        <View style={{ height: 100 }} /> 
      </ScrollView>
      )}      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748b' },
  ownerName: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  profileBtn: { padding: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#475569' },

  mainCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mainCardLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  mainCardValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  mainCardSub: { color: '#cbd5e1', fontSize: 12, marginTop: 5 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  actionBtn: { alignItems: 'center', width: '22%' },
  actionIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  pendingTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 20 },
  pendingSub: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10, marginBottom: 30 },
});