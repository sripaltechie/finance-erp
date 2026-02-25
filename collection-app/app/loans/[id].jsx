import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Switch 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, Calendar, FileText, DollarSign, Percent, 
  Clock, CheckCircle, AlertTriangle, X, Banknote, CreditCard 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/api/api'; 

// Services
import { getLoanDetailsService, collectPaymentService } from '../../src/api/loanService';
import { getPaymentModesService } from '../../src/api/companyService';

export default function LoanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loan, setLoan] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  // Split Payment State
  const [isSplit, setIsSplit] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({});

  // Payment Config
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedModeId, setSelectedModeId] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState(null);

  // Load Data
  const loadLoan = async () => {
    try {
      setLoading(true);
      const data = await getLoanDetailsService(id);
      setLoan(data.loan || data); 
      
      // Load History
      const txns = await api.get(`/loans/${id}/transactions?limit=1000`);
      setHistory(txns.data);

      // Load Configs for Payment
      const cId = await AsyncStorage.getItem('activeCompanyId');
      setActiveCompanyId(cId);
      
      if (cId) {
        const modes = await getPaymentModesService();
        setPaymentModes(modes);
        if (modes.length > 0) setSelectedModeId(modes[0]._id);
      }
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

  // Recalculate amount if Split Payment is ON
  useEffect(() => {
    if (isSplit) {
        const total = Object.values(splitAmounts).reduce((sum, val) => sum + (Number(val) || 0), 0);
        setAmount(String(total));
    }
  }, [splitAmounts, isSplit]);


  // Handle Collection
  const handleCollect = async () => {
    let paymentSplitPayload = [];

    if (isSplit) {
        paymentSplitPayload = Object.keys(splitAmounts)
            .filter(id => Number(splitAmounts[id]) > 0)
            .map(id => ({ modeId: Number(id), amount: Number(splitAmounts[id]) }));
        
        if (paymentSplitPayload.length === 0) return Alert.alert("Error", "Enter split amounts");
        const totalSplit = paymentSplitPayload.reduce((sum, item) => sum + item.amount, 0);
        if (totalSplit <= 0) return Alert.alert("Error", "Enter valid amounts");
    } else {
        if (!amount || isNaN(amount) || Number(amount) <= 0) return Alert.alert("Invalid Amount", "Please enter an amount.");
        if (!selectedModeId) return Alert.alert("Payment Mode", "Please select a payment mode.");
        paymentSplitPayload = [{ modeId: selectedModeId, amount: Number(amount) }];
    }

    if (!activeCompanyId) return Alert.alert("Error", "Company ID missing. Restart App.");
    
    setCollecting(true);
    try {
      const payload = {
        companyId: activeCompanyId,
        amount: Number(amount),
        notes: note,
        paymentSplit: paymentSplitPayload
      };

      await collectPaymentService(id, payload);
      
      Alert.alert("Success", "Payment Recorded!");
      setModalVisible(false);
      setAmount('');
      setNote('');
      setIsSplit(false);
      setSplitAmounts({});
      loadLoan(); // Refresh
    } catch (error) {
        console.log("Collection Error:", error);
        const msg = error?.response?.data?.message || error?.message || "Could not record payment";
        Alert.alert("Failed", msg);
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
          title: `Loan #${loan.shortId || id}`, // Show nicer ID if available
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

        {/* 5. HISTORY TABLE */}
        {history.length > 0 && (
            <View style={[styles.card, { marginTop: 10, padding: 16 }]}>
                <Text style={[styles.sectionTitle, { marginLeft: 0 }]}>Transaction History</Text>
                <View style={styles.tableHeader}>
                    <Text style={[styles.th, {flex: 2}]}>Date</Text>
                    <Text style={[styles.th, {flex: 1, textAlign: 'right'}]}>Amount</Text>
                </View>
                {history.map((txn, i) => (
                    <View key={txn.id || i} style={styles.tableRow}>
                        <Text style={[styles.td, {flex: 2}]}>{new Date(txn.date).toLocaleDateString()}</Text>
                        <Text style={[styles.td, {flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#16a34a'}]}>
                            + ₹{Number(txn.amount).toLocaleString()}
                        </Text>
                    </View>
                ))}
            </View>
        )}

      </ScrollView>

      {/* Collect Button */}
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
                    style={[styles.input, isSplit && { backgroundColor: '#e2e8f0', color: '#64748b' }]}
                    placeholder="0"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={!isSplit}
                    editable={!isSplit}
                />

                {/* Split Payment Toggle */}
                <View style={styles.splitToggleRow}>
                    <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Split Payment Across Wallets</Text>
                    <Switch 
                        value={isSplit} 
                        onValueChange={setIsSplit} 
                        trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                        thumbColor={isSplit ? "#2563eb" : "#f4f4f5"}
                    />
                </View>

                {isSplit ? (
                    <View style={styles.splitBox}>
                        {paymentModes.map(mode => (
                            <View key={mode._id} style={styles.splitInputGrp}>
                                <Text style={styles.splitLabel}>{mode.name}</Text>
                                <TextInput
                                    style={styles.splitInput}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={splitAmounts[mode._id]?.toString() || ''}
                                    onChangeText={(val) => setSplitAmounts(prev => ({...prev, [mode._id]: val}))}
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    <>
                        <Text style={styles.inputLabel}>Payment Mode</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                            {paymentModes.map(mode => (
                                <TouchableOpacity 
                                    key={mode._id}
                                    style={[styles.modeBtn, selectedModeId === mode._id && styles.modeActive]}
                                    onPress={() => setSelectedModeId(mode._id)}
                                >
                                    {mode.type === 'Cash' ? <Banknote size={16} color={selectedModeId === mode._id ? '#fff' : '#64748b'} /> : <CreditCard size={16} color={selectedModeId === mode._id ? '#fff' : '#64748b'} />}
                                    <Text style={[styles.modeText, selectedModeId === mode._id && {color: '#fff'}]}>{mode.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

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
  
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 10, gap: 6 },
  modeActive: { backgroundColor: '#0f172a' },
  modeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  // Splits
  splitToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: -10 },
  splitBox: { gap: 10, marginBottom: 15 },
  splitInputGrp: { marginBottom: 8 },
  splitLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  splitInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, fontWeight: 'bold', backgroundColor: '#f8fafc' },

  confirmBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // History
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8, marginBottom: 8 },
  th: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  td: { fontSize: 14, color: '#334155' },
});