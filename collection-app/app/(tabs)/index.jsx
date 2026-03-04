import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, Landmark, TrendingUp, Users, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDashboardStatsService } from '../../src/api/reportService';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');

  const loadDashboard = async () => {
    try {
      setError(null);
      // Get user name for greeting
      const userStr = await AsyncStorage.getItem('userInfo');
      if (userStr) {
          const parsed = JSON.parse(userStr);
          setUserName(parsed.user?.ownerName || parsed.user?.name || 'User');
      }

      // Fetch Stats
      const data = await getDashboardStatsService();
      setStats(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const StatCard = ({ title, amount, icon, color, bgColor }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardAmount, { color: color }]}>
          {typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userName} 👋</Text>
        <Text style={styles.subGreeting}>Here is your daily cash flow</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <AlertCircle size={40} color="#ef4444" style={{marginBottom: 10}} />
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <TouchableOpacity onPress={loadDashboard} style={styles.retryBtn}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          
          {/* Main Hero Card: Today's Collection */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
               <View style={styles.heroIconBox}>
                 <TrendingUp size={24} color="#fff" />
               </View>
               <Text style={styles.heroTitle}>Today's Total Collection</Text>
            </View>
            <Text style={styles.heroAmount}>₹{Number(stats?.todayCollection || 0).toLocaleString('en-IN')}</Text>
          </View>

          <Text style={styles.sectionTitle}>WALLETS & BALANCES</Text>
          <View style={styles.grid}>
            <StatCard 
              title="Cash in Hand" 
              amount={stats?.cashBalance || 0} 
              icon={<Wallet size={24} color="#16a34a" />} 
              color="#15803d" 
              bgColor="#dcfce7" 
            />
            <StatCard 
              title="Bank / Online" 
              amount={stats?.bankBalance || 0} 
              icon={<Landmark size={24} color="#2563eb" />} 
              color="#1d4ed8" 
              bgColor="#dbeafe" 
            />
          </View>

          <Text style={styles.sectionTitle}>BUSINESS METRICS</Text>
          <View style={styles.grid}>
            <StatCard 
              title="Active Loans" 
              amount={stats?.activeLoans || 0} 
              icon={<Users size={24} color="#9333ea" />} 
              color="#7e22ce" 
              bgColor="#f3e8ff" 
            />
            {/* Future Placeholder for Market Outstanding */}
            <StatCard 
              title="Outstanding (Est)" 
              amount={stats?.marketOutstanding || "TBD"} 
              icon={<AlertCircle size={24} color="#ea580c" />} 
              color="#c2410c" 
              bgColor="#ffedd5" 
            />
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subGreeting: { fontSize: 14, color: '#64748b' },

  heroCard: { backgroundColor: '#2563eb', padding: 24, borderRadius: 20, marginBottom: 24, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, marginRight: 12 },
  heroTitle: { fontSize: 16, color: '#e0e7ff', fontWeight: '600' },
  heroAmount: { fontSize: 40, fontWeight: '900', color: '#fff' },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
  
  grid: { gap: 12, marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  cardAmount: { fontSize: 22, fontWeight: 'bold' },

  errorText: { fontSize: 16, color: '#334155', marginBottom: 15 },
  retryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
});