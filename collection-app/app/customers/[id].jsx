import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  User, Phone, MapPin, CreditCard, Plus, ChevronRight, FileText, Calendar, ArrowLeft, BadgeCheck, AlertCircle 
} from 'lucide-react-native';

// Services
import { getCustomerByIdService } from '../../src/api/customerService';
import { getCustomerLoansService } from '../../src/api/loanService';

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [custData, loansData] = await Promise.all([
        getCustomerByIdService(id),
        getCustomerLoansService(id)
      ]);
      setCustomer(custData);
      setLoans(loansData);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load customer details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#16a34a';
      case 'Closed': return '#64748b';
      case 'Bad_Debt': return '#dc2626';
      default: return '#2563eb';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Customer not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Navbar Setup */}
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "Customer Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
              <ArrowLeft size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/customers/manage', params: { id: customer._id } })}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        
        {/* 2. Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <User size={32} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{customer.fullName}</Text>
              <Text style={styles.mobile}>{customer.mobile}</Text>
              <View style={styles.tagsRow}>
                {customer.shortId && (
                  <View style={styles.idTag}>
                    <Text style={styles.idText}>ID: {customer.shortId}</Text>
                  </View>
                )}
                <View style={[styles.levelTag, 
                   customer.level === 'Level 3' ? styles.lvl3 : styles.lvl2
                ]}>
                  <Text style={[styles.levelText,
                    customer.level === 'Level 3' ? styles.lvl3T : styles.lvl2T
                  ]}>{customer.level || 'Level 2'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.infoText} numberOfLines={2}>
              {customer.locations?.residence?.addressText || "No Address Provided"}
            </Text>
          </View>
          
          <View style={styles.kycContainer}>
             <View style={styles.kycItem}>
                <Text style={styles.kycLabel}>Aadhar</Text>
                <Text style={styles.kycValue}>{customer.kyc?.aadhaarNumber || '-'}</Text>
             </View>
             <View style={styles.kycItem}>
                <Text style={styles.kycLabel}>Ration</Text>
                <Text style={styles.kycValue}>{customer.kyc?.rationCardNumber || '-'}</Text>
             </View>
             <View style={styles.kycItem}>
                <Text style={styles.kycLabel}>Credit Score</Text>
                <Text style={[styles.kycValue, { color: '#2563eb' }]}>{customer.creditScore || 500}</Text>
             </View>
          </View>
        </View>

        {/* 3. Loan History Section */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan History</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{loans.length}</Text>
            </View>
        </View>

        {loans.length === 0 ? (
            <View style={styles.emptyState}>
                <FileText size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No loans found for this customer.</Text>
            </View>
        ) : (
            loans.map((loan) => (
                <TouchableOpacity 
                    key={loan._id} 
                    style={styles.loanCard}
                    onPress={() => Alert.alert("Coming Soon", "Loan Details screen is under construction.")}
                >
                    <View style={styles.loanHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <View style={[styles.statusDot, { backgroundColor: getStatusColor(loan.status) }]} />
                             <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>{loan.status}</Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(loan.start_date).toLocaleDateString()}
                        </Text>
                    </View>
                    
                    <View style={styles.loanBody}>
                        <View>
                            <Text style={styles.amount}>₹{loan.financials?.principalAmount?.toLocaleString()}</Text>
                            <Text style={styles.loanMeta}>
                                {loan.loan_type} • {loan.financials?.interestRate}% Int.
                            </Text>
                        </View>
                        <ChevronRight size={20} color="#cbd5e1" />
                    </View>
                </TouchableOpacity>
            ))
        )}

      </ScrollView>

      {/* 4. Floating Action Button (Create Loan) */}
      <View style={styles.fabContainer}>
         <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push({ pathname: '/loans/create', params: { customerId: customer._id } })}
         >
            <Plus size={24} color="#fff" />
            <Text style={styles.fabText}>New Loan</Text>
         </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#64748b', fontSize: 16 },
  editLink: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },

  // Header Card
  headerCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  mobile: { fontSize: 14, color: '#64748b', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', gap: 8 },
  
  idTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  idText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  
  levelTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  levelText: { fontSize: 12, fontWeight: 'bold' },
  lvl2: { backgroundColor: '#f1f5f9' }, lvl2T: { color: '#475569' },
  lvl3: { backgroundColor: '#fee2e2' }, lvl3T: { color: '#991b1b' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 },
  infoText: { fontSize: 14, color: '#475569', flex: 1 },

  kycContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  kycItem: { alignItems: 'center', flex: 1 },
  kycLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  kycValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },

  // Loans Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  badge: { backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },

  loanCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, elevation: 1 },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: '#94a3b8' },
  
  loanBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  loanMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },

  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { marginTop: 10, fontSize: 14 },

  // FAB
  fabContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  fab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, elevation: 6, gap: 8 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});