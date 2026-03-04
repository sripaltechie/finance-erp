import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Phone, CheckCircle, Clock } from 'lucide-react-native';

import { getRemindersService, updateReminderStatusService } from '../../src/api/reminderService';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'Completed'

  const loadData = async () => {
    try {
      const data = await getRemindersService();
      setReminders(data || []);
    } catch (err) {
      console.log("Reminders error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleResolve = (id) => {
    Alert.alert("Complete Reminder", "Mark this follow-up as resolved?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Resolve", 
        style: "default",
        onPress: async () => {
          try {
            await updateReminderStatusService(id, 'Completed');
            loadData(); // Refresh the list
          } catch (e) {
            Alert.alert("Error", "Could not resolve reminder");
          }
        }
      }
    ]);
  };

  // Filter based on active tab
  const filteredReminders = reminders.filter(r => r.status === activeTab);

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.status === 'Completed' && { opacity: 0.7 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={styles.rowRow}>
            <Phone size={12} color="#64748b" style={{marginRight: 4}}/>
            <Text style={styles.subText}>{item.mobile}</Text>
          </View>
        </View>
        <View style={[styles.badge, item.status === 'Completed' ? styles.badgeSuccess : styles.badgeWarning]}>
            {item.status === 'Completed' ? <CheckCircle size={12} color="#16a34a" /> : <Clock size={12} color="#ea580c" />}
            <Text style={[styles.badgeText, item.status === 'Completed' ? {color: '#16a34a'} : {color: '#ea580c'}]}>
                {item.status}
            </Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.detailsRow}>
        <CalendarClock size={16} color="#94a3b8" style={{marginRight: 6}} />
        <Text style={styles.dateText}>
            Promised: <Text style={{fontWeight:'bold', color:'#0f172a'}}>{new Date(item.promised_date).toLocaleDateString()}</Text>
        </Text>
      </View>

      {item.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
      ) : null}

      {item.status === 'Pending' && (
          <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item._id)}>
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.resolveText}>Mark Resolved</Text>
          </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Follow-ups</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'Pending' && styles.tabActive]}
          onPress={() => setActiveTab('Pending')}
        >
          <Text style={[styles.tabText, activeTab === 'Pending' && styles.tabTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'Completed' && styles.tabActive]}
          onPress={() => setActiveTab('Completed')}
        >
          <Text style={[styles.tabText, activeTab === 'Completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : filteredReminders.length === 0 ? (
        <View style={styles.center}>
          <CheckCircle size={50} color="#cbd5e1" style={{marginBottom: 10}} />
          <Text style={styles.emptyText}>No {activeTab} Reminders</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReminders}
          keyExtractor={item => item._id.toString()}
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
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  
  tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontWeight: 'bold', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  rowRow: { flexDirection: 'row', alignItems: 'center' },
  subText: { fontSize: 13, color: '#64748b' },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeWarning: { backgroundColor: '#ffedd5' },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 14, color: '#64748b' },
  
  noteBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4 },
  noteText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },

  resolveBtn: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 16, gap: 8 },
  resolveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600' }
});