import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AlertCircle, User, Phone, ChevronRight, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDueTodayService } from '../../src/api/loanService';

export default function DueListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dueList, setDueList] = useState([]);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await getDueTodayService();
      setDueList(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getDaysPending = (lastDateStr) => {
    if (!lastDateStr) return 'Never Paid';
    const lastDate = new Date(lastDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} Days`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/loans/${item.loan_id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={styles.rowRow}>
            <Phone size={12} color="#64748b" style={{marginRight: 4}}/>
            <Text style={styles.subText}>{item.mobile}</Text>
          </View>
        </View>
        <ChevronRight size={20} color="#cbd5e1" />
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.label}>EMI Amount</Text>
          <Text style={styles.amount}>₹{Number(item.installment_amount).toLocaleString()}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={styles.label}>Pending Since</Text>
          <View style={styles.badge}>
            <AlertCircle size={14} color="#dc2626" style={{marginRight: 4}} />
            <Text style={styles.badgeText}>{getDaysPending(item.last_payment_date)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Due Today</Text>
        <View style={styles.countBadge}>
            <Text style={styles.countText}>{dueList.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <AlertCircle size={40} color="#ef4444" style={{marginBottom: 10}} />
          <Text style={styles.errorText}>Failed to load defaulters</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : dueList.length === 0 ? (
        <View style={styles.center}>
          <CheckCircle2 size={50} color="#16a34a" style={{marginBottom: 10}} />
          <Text style={styles.successText}>All caught up!</Text>
          <Text style={styles.subText}>No pending collections for today.</Text>
        </View>
      ) : (
        <FlatList
          data={dueList}
          keyExtractor={item => item.loan_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginRight: 10 },
  countBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  rowRow: { flexDirection: 'row', alignItems: 'center' },
  subText: { fontSize: 13, color: '#64748b' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#dc2626' },

  errorText: { fontSize: 16, color: '#334155', marginBottom: 15 },
  retryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  successText: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' }
});