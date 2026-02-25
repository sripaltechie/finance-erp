import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, 
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { Search, User, X, CheckCircle2, Banknote, CreditCard, History, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Services
import { searchCustomerService } from '../../src/api/customerService';
import { collectPaymentService, getCustomerLoansService } from '../../src/api/loanService';
import { getPaymentModesService } from '../../src/api/companyService';
import api from '../../src/api/api'; 

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  
  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customer, setCustomer] = useState(null);
  
  // Loan & Payment
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  // Split Payment State
  const [isSplit, setIsSplit] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({});
  
  // History
  const [history, setHistory] = useState([]);

  // Payment Modes
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedModeId, setSelectedModeId] = useState('');

  useEffect(() => {
    loadModes();
  }, []);

  const loadModes = async () => {
    try {
      const modes = await getPaymentModesService();
      setPaymentModes(modes);
      if (modes.length > 0) setSelectedModeId(modes[0]._id);
    } catch (error) { console.log("Failed to load modes", error); }
  };

  // Recalculate amount if Split Payment is ON
  useEffect(() => {
    if (isSplit) {
        const total = Object.values(splitAmounts).reduce((sum, val) => sum + (Number(val) || 0), 0);
        setAmount(String(total));
    }
  }, [splitAmounts, isSplit]);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length >= 1) {
      try {
        const results = await searchCustomerService(text);
        setSearchResults(results);
      } catch (error) { console.log(error); }
    } else {
      setSearchResults([]);
    }
  };

  const selectCustomer = async (cust) => {
    setCustomer(cust);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    
    try {
      const loans = await getCustomerLoansService(cust._id);
      const active = loans.filter(l => l.status === 'Active');
      setActiveLoans(active);
      
      if (active.length === 1) {
        selectLoan(active[0]);
      } else {
        setSelectedLoan(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  const selectLoan = async (loan) => {
      setSelectedLoan(loan);
      setIsSplit(false);
      setSplitAmounts({});
      if (loan.financials?.installmentAmount) {
          setAmount(String(loan.financials.installmentAmount));
      }
      try {
          const res = await api.get(`/loans/${loan._id}/transactions?limit=5`);
          setHistory(res.data);
      } catch(e) { console.log("Hist err", e); }
  };

  const clearSelection = () => {
    setCustomer(null);
    setSelectedLoan(null);
    setActiveLoans([]);
    setAmount('');
    setIsSplit(false);
    setSplitAmounts({});
    setHistory([]);
  };

  const handleShortcut = (multiplier) => {
      if(isSplit) return; // Disable shortcuts while split payment is on
      if(!selectedLoan?.financials?.installmentAmount) return;
      const base = Number(selectedLoan.financials.installmentAmount);
      const newAmt = base * multiplier;
      setAmount(String(newAmt));
  };

  const getIndexDisplay = () => {
      if(!selectedLoan || !amount) return null;
      
      const installmentAmt = Number(selectedLoan.financials?.installmentAmount || 0);
      if(installmentAmt === 0) return null;

      const totalPaid = Number(selectedLoan.amountPaid || 0); 
      const currentPaidCount = Math.floor(totalPaid / installmentAmt);
      const payingCount = Number(amount) / installmentAmt;
      
      if(payingCount < 1) return null; 

      const startIndex = currentPaidCount + 1;
      const endIndex = currentPaidCount + Math.floor(payingCount);

      if(startIndex === endIndex) return `Day ${startIndex}`;
      return `Days ${startIndex} - ${endIndex}`;
  };

  const indexText = getIndexDisplay();

  const handleCollect = async () => {
    if (!selectedLoan) return Alert.alert("Error", "Please select a loan");

    let paymentSplitPayload = [];

    if (isSplit) {
        paymentSplitPayload = Object.keys(splitAmounts)
            .filter(id => Number(splitAmounts[id]) > 0)
            .map(id => ({ modeId: Number(id), amount: Number(splitAmounts[id]) }));
        
        if (paymentSplitPayload.length === 0) return Alert.alert("Error", "Enter split amounts");
        const totalSplit = paymentSplitPayload.reduce((sum, item) => sum + item.amount, 0);
        if (totalSplit <= 0) return Alert.alert("Error", "Enter valid amounts");
    } else {
        if (!amount || isNaN(amount) || Number(amount) <= 0) return Alert.alert("Error", "Enter valid amount");
        if (!selectedModeId) return Alert.alert("Error", "Select payment mode");
        paymentSplitPayload = [{ modeId: selectedModeId, amount: Number(amount) }];
    }

    setSubmitting(true);
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("Company ID not found. Restart app.");
        
        const payload = {
            loanId: selectedLoan._id,
            companyId: companyId,
            amount: Number(amount),
            notes: notes || 'Daily Collection',
            paymentSplit: paymentSplitPayload
        };

        await collectPaymentService(selectedLoan._id, payload);
        
        Alert.alert("Success", "Payment Recorded!", [
            { text: "OK", onPress: () => {
                setAmount('');
                setNotes('');
                setIsSplit(false);
                setSplitAmounts({});
                selectCustomer(customer); 
            }}
        ]);

    } catch (error) {
        console.log("Collection Error:", error);
        const msg = error.response?.data?.message || error.message || "Collection Failed";
        Alert.alert("Error", msg);
    } finally {
        setSubmitting(false);
    }
  };

  const getDateDiff = (currDate, prevDate) => {
      if(!prevDate) return '-';
      const d1 = new Date(currDate);
      const d2 = new Date(prevDate);
      const diffTime = Math.abs(d1 - d2);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return `${diffDays}d`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Collection</Text>
        <TouchableOpacity onPress={clearSelection}>
            <Search size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        
        {/* CUSTOMER SEARCH */}
        {!customer ? (
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search by Name, Mobile, or ID"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus={false}
                    />
                </View>
                
                {searchResults.length > 0 && (
                    <View style={styles.resultsList}>
                        {searchResults.map(item => (
                            <TouchableOpacity key={item._id} style={styles.resultItem} onPress={() => selectCustomer(item)}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.resName}>{item.full_name}</Text>
                                    <Text style={styles.resSub}>{item.mobile} • {item.shortId ? `ID: ${item.shortId}` : ''}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        ) : (
            <View style={styles.customerCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.row}>
                        <View style={[styles.avatar, {backgroundColor: '#dbeafe'}]}>
                            <User size={20} color="#2563eb" />
                        </View>
                        <View style={{marginLeft: 12}}>
                            <Text style={styles.custName}>{customer.full_name}</Text>
                            <Text style={styles.custSub}>{customer.mobile}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={clearSelection} style={styles.closeBtn}>
                        <X size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
                
                {loading ? <ActivityIndicator color="#2563eb" style={{marginTop:20}} /> : (
                    <View style={{marginTop: 16}}>
                        {activeLoans.length === 0 ? (
                            <Text style={{color: '#94a3b8', fontStyle: 'italic'}}>No active loans found.</Text>
                        ) : (
                            activeLoans.map(loan => (
                                <TouchableOpacity 
                                    key={loan._id} 
                                    style={[styles.loanItem, selectedLoan?._id === loan._id && styles.loanActive]}
                                    onPress={() => selectLoan(loan)}
                                >
                                    <View style={{flex:1}}>
                                        <Text style={[styles.loanType, selectedLoan?._id === loan._id && {color: '#1e40af'}]}>
                                            {loan.loan_type} Loan
                                        </Text>
                                        <Text style={styles.loanDate}>
                                            Started: {new Date(loan.start_date || loan.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={[styles.loanAmt, selectedLoan?._id === loan._id && {color: '#1e40af'}]}>
                                            ₹{Number(loan.financials?.principalAmount).toLocaleString()}
                                        </Text>
                                        <Text style={styles.loanInst}>
                                            EMI: ₹{loan.financials?.installmentAmount || '-'}
                                        </Text>
                                    </View>
                                    {selectedLoan?._id === loan._id && (
                                        <View style={{position: 'absolute', top: -8, right: -8, backgroundColor: '#2563eb', borderRadius: 10, padding: 2}}>
                                            <CheckCircle2 size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}
            </View>
        )}

        {/* PAYMENT FORM */}
        {selectedLoan && (
            <>
                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Payment Details</Text>
                    
                    <View style={[styles.amountBox, isSplit && { borderBottomColor: '#f1f5f9' }]}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput 
                            style={[styles.amountInput, isSplit && { color: '#94a3b8' }]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            editable={!isSplit}
                        />
                    </View>

                    {/* INDEX DISPLAY */}
                    {indexText && (
                        <View style={styles.indexBadge}>
                            <Text style={styles.indexText}>{indexText}</Text>
                        </View>
                    )}

                    {/* SHORTCUT BUTTONS (Disabled if Split is ON) */}
                    {!isSplit && (
                        <View style={styles.shortcutRow}>
                            {[2, 3, 5, 10].map(m => (
                                <TouchableOpacity 
                                    key={m} 
                                    style={styles.shortcutBtn}
                                    onPress={() => handleShortcut(m)}
                                >
                                    <Text style={styles.shortcutText}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Split Payment Toggle */}
                    <View style={styles.splitToggleRow}>
                        <Text style={[styles.label, { marginBottom: 0 }]}>Split Payment Across Wallets</Text>
                        <Switch 
                            value={isSplit} 
                            onValueChange={setIsSplit} 
                            trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                            thumbColor={isSplit ? "#2563eb" : "#f4f4f5"}
                        />
                    </View>

                    {/* Payment Mode Selection */}
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
                            <Text style={[styles.label, {marginTop: 10, marginBottom: 10}]}>Received Via</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                                {paymentModes.map(mode => (
                                    <TouchableOpacity 
                                        key={mode._id}
                                        style={[styles.modeBtn, selectedModeId === mode._id && styles.modeActive]}
                                        onPress={() => setSelectedModeId(mode._id)}
                                    >
                                        {mode.type === 'Cash' ? <Banknote size={18} color={selectedModeId === mode._id ? '#fff' : '#64748b'} /> : <CreditCard size={18} color={selectedModeId === mode._id ? '#fff' : '#64748b'} />}
                                        <Text style={[styles.modeText, selectedModeId === mode._id && {color: '#fff'}]}>{mode.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}
                    
                    <Text style={[styles.label, {marginTop: 10}]}>Notes</Text>
                     <TextInput 
                        style={styles.notesInput}
                        placeholder="Optional notes..."
                        value={notes}
                        onChangeText={setNotes}
                    />

                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitBtn, submitting && styles.btnDisabled]} 
                    onPress={handleCollect}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#fff" /> : (
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <CheckCircle2 size={20} color="#fff" />
                            <Text style={styles.submitText}>CONFIRM COLLECTION</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* HISTORY TABLE */}
                {history.length > 0 && (
                    <View style={styles.historySection}>
                        <Text style={styles.historyTitle}>Last 5 Payments</Text>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, {flex: 2}]}>Date</Text>
                            <Text style={[styles.th, {flex: 1}]}>Gap</Text>
                            <Text style={[styles.th, {flex: 1, textAlign: 'right'}]}>Amount</Text>
                        </View>
                        {history.map((txn, i) => {
                            const prevTxn = history[i+1]; 
                            const diff = prevTxn ? getDateDiff(txn.date, prevTxn.date) : '-';
                            return (
                                <View key={txn.id || i} style={styles.tableRow}>
                                    <Text style={[styles.td, {flex: 2}]}>{new Date(txn.date).toLocaleDateString()}</Text>
                                    <View style={[styles.td, {flex: 1}]}>
                                        <Text style={styles.gapTag}>{diff}</Text>
                                    </View>
                                    <Text style={[styles.td, {flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#16a34a'}]}>
                                        + ₹{Number(txn.amount).toLocaleString()}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </>
        )}

      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },

  // Search
  searchSection: { marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, height: 50, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a' },
  
  resultsList: { marginTop: 8, backgroundColor: '#fff', borderRadius: 12, elevation: 3, padding: 8 },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  resName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  resSub: { fontSize: 13, color: '#64748b' },

  // Customer Card
  customerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
  custName: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  custSub: { fontSize: 14, color: '#64748b' },
  closeBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },

  label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  loanItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  loanActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  loanType: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  loanDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  loanAmt: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  loanInst: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Form
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 1, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  
  amountBox: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#e2e8f0', paddingBottom: 8, marginBottom: 10 },
  currency: { fontSize: 32, fontWeight: 'bold', color: '#94a3b8', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: 'bold', color: '#0f172a', padding: 0 },
  notesInput: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },

  // Splits & Shortcuts
  splitToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  splitBox: { gap: 10, marginBottom: 15 },
  splitInputGrp: { marginBottom: 8 },
  splitLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  splitInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, fontWeight: 'bold', backgroundColor: '#f8fafc' },

  indexBadge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  indexText: { color: '#166534', fontWeight: 'bold', fontSize: 12 },

  shortcutRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  shortcutBtn: { backgroundColor: '#f1f5f9', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  shortcutText: { fontWeight: 'bold', color: '#64748b' },

  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 10, gap: 6 },
  modeActive: { backgroundColor: '#0f172a' },
  modeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  submitBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 20 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  btnDisabled: { opacity: 0.7, backgroundColor: '#9ca3af' },

  // History
  historySection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 10, textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8, marginBottom: 8 },
  th: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  td: { fontSize: 14, color: '#334155' },
  gapTag: { fontSize: 11, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#64748b' }
});