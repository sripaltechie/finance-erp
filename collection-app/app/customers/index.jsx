import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  ChevronLeft, Plus, Search, MapPin, Phone, Edit, FileText, User 
} from 'lucide-react-native';

import { searchCustomerService } from '../../src/api/customerService'; // reusing search service which calls GET /customers?search=...

export default function CustomerListScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load Data
  const loadCustomers = async (query = '') => {
    try {
      if (!refreshing) setLoading(true); // Only show main loader if not pull-to-refresh
      // searchCustomerService calls GET /customers?search={query}
      // If query is empty, it returns the list (backend logic supports this)
      const data = await searchCustomerService(query);
      console.log(data);
      setCustomers(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial Load & Focus Refresh
  useFocusEffect(
    useCallback(() => {
      loadCustomers(searchText);
    }, [searchText])
  );

  const handleSearch = (text) => {
    setSearchText(text);
    // Debouncing could be added here for optimization
    loadCustomers(text);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}      
      onPress={() => router.push({ pathname: '/customers/[id]', params: { id: item._id } })}
      // onPress={() => router.push({ pathname: '/customers/manage', params: { id: item._id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {/* <Text style={styles.avatarText}>{item.fullName.charAt(0).toUpperCase()}</Text> */}
            <Text style={styles.avatarText}>
            {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={styles.row}>
            <Phone size={12} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={styles.subText}>{item.mobile}</Text>
             {item.short_id ? (
              <Text style={[styles.subText, { marginLeft: 8, color: '#2563eb', fontWeight: 'bold' }]}>
                ID: {item.short_id}
              </Text>
            ) : null}
          </View>
          {/* {item.locations?.residence?.addressText && (
            <View style={[styles.row, { marginTop: 2 }]}>
              <MapPin size={12} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.subText} numberOfLines={1}>{item.locations.residence.addressText}</Text>
            </View>
          )} */}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>

        {/* <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push({ pathname: '/customers/manage', params: { id: item._id } })}
        >
          <Edit size={16} color="#64748b" />
          <Text style={styles.actionText}>Edit Profile</Text>
        </TouchableOpacity> */}
        
         {/* Level Tag */}
        <View style={[
            styles.levelTag, 
            item.level === 'Level 1' ? styles.lvl1 : 
            item.level === 'Level 3' ? styles.lvl3 : styles.lvl2
        ]}>
            <Text style={[
                styles.levelText,
                item.level === 'Level 1' ? styles.lvl1T : 
                item.level === 'Level 3' ? styles.lvl3T : styles.lvl2T
            ]}>{item.level || 'Level 2'}</Text>
        </View>

          <View style={styles.vDiv} />
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push({ pathname: '/loans/create', params: { customerId: item._id } })}
        >
          <FileText size={16} color="#2563eb" />
          <Text style={[styles.actionText, { color: '#2563eb' }]}>New Loan</Text>
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer List</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => router.push('/customers/manage')}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#94a3b8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Name, Mobile or ID"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* List Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={customers}
         keyExtractor={(item, index) => {
            // If id exists, use it; otherwise, fallback to the index
            return item?._id ? item._id.toString() : index.toString();
          }}
          renderItem={renderItem}
          // keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCustomers(searchText); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <User size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No customers found.</Text>
              <Text style={styles.emptySub}>Add new customers to manage them.</Text>
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
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  backBtn: { padding: 8, marginLeft: -8 },
  addBtn: { backgroundColor: '#2563eb', padding: 8, borderRadius: 12 },

  searchContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },

  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  subText: { fontSize: 13, color: '#64748b' },

  divider: { height: 1, backgroundColor: '#f1f5f9' },
  actions: { flexDirection: 'row', padding: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  vDiv: { width: 1, backgroundColor: '#f1f5f9' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#94a3b8', marginTop: 16 },
  emptySub: { color: '#cbd5e1', fontSize: 14 }
});