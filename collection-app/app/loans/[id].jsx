import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, Calendar, FileText, DollarSign, Percent, 
  Clock, CheckCircle, AlertTriangle, X 
} from 'lucide-react-native';

// Services
import { getLoanDetailsService, addRepaymentService } from '../../src/api/loanService';

export default function LoanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Load Data
  const loadLoan = async () => {
    try {
      setLoading(true);
      const data = await getLoanDetailsService(id);
      // Backend returns either { loan: {...}, stats: {...} } or just loan object depending on implementation
      // Adapting to both:
      setLoan(data.loan || data); 
    } catch (error) {
      Alert.alert("Error", "Failed to load loan details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadLoan();
  }, [id]);

  // Handle Collection
  const handleCollect = async () => {
    if (!amount) return Alert.alert("Invalid Amount", "Please enter an amount.");
    
    setCollecting(true);
    try {
      await addRepaymentService(id, {
        amount: Number(amount),
        notes: note,
        type: 'Cash' // Defaulting to Cash for now
      });
      Alert.alert("Success", "Payment Recorded!");
      setModalVisible(false);
      setAmount('');
      setNote('');
      loadLoan(); // Refresh
    } catch (error) {
      Alert.alert("Failed", "Could not record payment");
    } finally {
      setCollecting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#16a34a';
      case 'Closed': return '#64748b';
      case 'Bad_Debt': return '#dc2626';
      default: return '#2563eb';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!loan) return null;

  const fin = loan.financials || {};

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: `Loan #${id}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
              <ArrowLeft size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* 1. Status Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Current Status</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(loan.status) }]}>{loan.status}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Principal Amount</Text>
            <Text style={styles.amountValue}>₹{fin.principalAmount?.toLocaleString()}</Text>
          </View>
        </View>

        {/* 2. Details Grid */}
        <Text style={styles.sectionTitle}>Loan Terms</Text>
        <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
                <Calendar size={20} color="#64748b" style={{ marginBottom: 8 }} />
                <Text style={styles.gridLabel}>Start Date</Text>
                <Text style={styles.gridValue}>
                    {new Date(loan.start_date || loan.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.gridItem}>
                <Percent size={20} color="#64748b" style={{ marginBottom: 8 }} />
                <Text style={styles.gridLabel}>Interest</Text>
                <Text style={styles.gridValue}>{fin.interestRate}% / {fin.durationType === 'Days' ? 'Month' : 'Month'}</Text>
            </View>
            <View style={styles.gridItem}>
                <Clock size={20} color="#64748b" style={{ marginBottom: 8 }} />
                <Text style={styles.gridLabel}>Duration</Text>
                <Text style={styles.gridValue}>{fin.duration} {fin.durationType}</Text>
            </View>
            <View style={styles.gridItem}>
                <FileText size={20} color="#64748b" style={{ marginBottom: 8 }} />
                <Text style={styles.gridLabel}>Type</Text>
                <Text style={styles.gridValue}>{loan.loan_type}</Text>
            </View>
        </View>

        {/* 3. Disbursement Info */}
        <Text style={styles.sectionTitle}>Disbursement Info</Text>
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.itemLabel}>Net Disbursed</Text>
                <Text style={styles.itemValue}>₹{fin.netDisbursementAmount?.toLocaleString()}</Text>
            </View>
            {loan.deductions?.map((ded, index) => (
                <View key={index} style={[styles.rowBetween, { marginTop: 8 }]}>
                    <Text style={[styles.itemLabel, { color: '#ef4444' }]}>{ded.name}</Text>
                    <Text style={[styles.itemValue, { color: '#ef4444' }]}>- ₹{ded.amount}</Text>
                </View>
            ))}
        </View>

        {/* 4. Notes */}
        {loan.notes ? (
            <View style={[styles.card, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}>
                <Text style={[styles.label, { color: '#854d0e', marginBottom: 4 }]}>Notes</Text>
                <Text style={{ color: '#a16207' }}>{loan.notes}</Text>
            </View>
        ) : null}

      </ScrollView>

      {/* 5. Collect Button */}
      {loan.status === 'Active' && (
        <View style={styles.footer}>
            <TouchableOpacity 
                style={styles.payBtn}
                onPress={() => setModalVisible(true)}
            >
                <DollarSign size={24} color="#fff" />
                <Text style={styles.payBtnText}>Collect Payment</Text>
            </TouchableOpacity>
        </View>
      )}

      {/* COLLECTION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Record Collection</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Amount Received (₹)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                />

                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <TextInput
                    style={[styles.input, { height: 50, fontSize: 16 }]}
                    placeholder="e.g. Paid by brother"
                    value={note}
                    onChangeText={setNote}
                />

                <TouchableOpacity 
                    style={styles.confirmBtn}
                    onPress={handleCollect}
                    disabled={collecting}
                >
                    {collecting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmText}>Confirm Payment</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 1, borderWidth: 1, borderColor: '#e2e8f0' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  
  amountContainer: { alignItems: 'center', paddingVertical: 8 },
  amountLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  amountValue: { fontSize: 32, fontWeight: '800', color: '#0f172a' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, marginLeft: 4 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  gridItem: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  gridLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

  itemLabel: { fontSize: 14, color: '#475569' },
  itemValue: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  payBtn: { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  
  confirmBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});