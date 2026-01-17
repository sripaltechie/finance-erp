import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  ChevronLeft, Plus, User, Shield, Briefcase, Trash2, Edit, Phone, Users 
} from 'lucide-react-native';

import { getStaffListService, deleteStaffService } from '../../src/api/staffService';

export default function StaffListScreen() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load Data
  const loadStaff = async () => {
    try {
      const data = await getStaffListService();
      setStaff(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload when screen comes into focus (e.g., coming back from Edit)
  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [])
  );

  const handleDelete = (id, name) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteStaffService(id);
              setStaff(prev => prev.filter(item => item._id !== id));
            } catch (err) {
              Alert.alert("Error", typeof err === 'string' ? err : "Delete failed");
            }
          }
        }
      ]
    );
  };

  const getRoleBadge = (role) => {
    const stylesMap = {
      'Admin': { bg: '#dbeafe', color: '#1e40af', icon: Shield },
      'Manager': { bg: '#f3e8ff', color: '#7e22ce', icon: Briefcase },
      'Collection_Boy': { bg: '#dcfce7', color: '#166534', icon: User },
      'Recovery_Agent': { bg: '#fee2e2', color: '#991b1b', icon: Shield }
    };
    const conf = stylesMap[role] || stylesMap['Collection_Boy'];
    const Icon = conf.icon;

    return (
      <View style={[styles.badge, { backgroundColor: conf.bg }]}>
        <Icon size={12} color={conf.color} style={{ marginRight: 4 }} />
        <Text style={[styles.badgeText, { color: conf.color }]}>{role.replace('_', ' ')}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.isActive && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.name}>{item.name}</Text>
            {getRoleBadge(item.role)}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Phone size={12} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={styles.mobile}>{item.mobile}</Text>
            {!item.isActive && <Text style={styles.inactiveTag}>(Inactive)</Text>}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push({ pathname: '/staff/manage', params: { id: item._id } })}
        >
          <Edit size={16} color="#64748b" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <View style={styles.vDiv} />

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => handleDelete(item._id, item.name)}
        >
          <Trash2 size={16} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => router.push('/staff/manage')}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStaff(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No staff found.</Text>
              <Text style={styles.emptySub}>Add collection agents to start operations.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  backBtn: { padding: 8, marginLeft: -8 },
  addBtn: { backgroundColor: '#2563eb', padding: 8, borderRadius: 12 },

  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  inactiveCard: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  mobile: { fontSize: 13, color: '#64748b' },
  inactiveTag: { fontSize: 12, color: '#ef4444', fontWeight: 'bold', marginLeft: 6 },

  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#f1f5f9' },
  actions: { flexDirection: 'row', padding: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  vDiv: { width: 1, backgroundColor: '#f1f5f9' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#94a3b8', marginTop: 16 },
  emptySub: { color: '#cbd5e1', fontSize: 14 }
});