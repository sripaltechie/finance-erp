import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl 
} from 'react-native';
import { Search, Calendar, Wallet, CreditCard, User, X, CheckCircle2, Banknote, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

// Services
import { searchCustomerService } from '../../src/api/customerService';
import { collectPaymentService, getCustomerLoansService } from '../../src/api/loanService';
import { getPaymentModesService } from '../../src/api/companyService';

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
  const [collectionDate, setCollectionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Payment Modes
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedModeId, setSelectedModeId] = useState('');

  // Initial Load
  useEffect(() => {
    loadModes();
  }, []);

  const loadModes = async () => {
    try {
      const modes = await getPaymentModesService();
      setPaymentModes(modes);
      if (modes.length > 0) setSelectedModeId(modes[0]._id);
    } catch (error) {
      console.log("Failed to load modes", error);
    }
  };

  // Search Logic
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      try {
        const results = await searchCustomerService(text);
        setSearchResults(results);
      } catch (error) {
        console.log(error);
      }
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
      // Fetch Active Loans
      const loans = await getCustomerLoansService(cust._id);
      const active = loans.filter(l => l.status === 'Active');
      setActiveLoans(active);
      
      // Auto-select if only one
      if (active.length === 1) {
        setSelectedLoan(active[0]);
        // Pre-fill amount with installment if available (Daily)
        if (active[0].financials?.installmentAmount) {
            setAmount(String(active[0].financials.installmentAmount));
        }
      } else {
        setSelectedLoan(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setCustomer(null);
    setSelectedLoan(null);
    setActiveLoans([]);
    setAmount('');
    setNotes('');
  };

  // Submit Logic
  const handleCollect = async () => {
    if (!selectedLoan) return Alert.alert("Error", "Please select a loan");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return Alert.alert("Error", "Enter valid amount");
    if (!selectedModeId) return Alert.alert("Error", "Select payment mode");

    setSubmitting(true);
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        
        const payload = {
            loanId: selectedLoan._id,
            companyId: companyId,
            amount: Number(amount),
            notes,
            // We use 'paymentSplit' array even for single mode to be consistent with backend
            paymentSplit: [
                { modeId: selectedModeId, amount: Number(amount) }
            ],
            // Optional: Pass date if backend supports backdating
            // date: collectionDate.toISOString() 
        };

        await collectPaymentService(selectedLoan._id, payload);
        
        Alert.alert("Success", "Payment Recorded!", [
            { text: "OK", onPress: () => {
                setAmount('');
                setNotes('');
                // Refresh loan data?
                selectCustomer(customer); // Reload loans to update balance
            }}
        ]);

    } catch (error) {
        const msg = error.response?.data?.message || "Collection Failed";
        Alert.alert("Error", msg);
    } finally {
        setSubmitting(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || collectionDate;
    setShowDatePicker(Platform.OS === 'ios');
    setCollectionDate(currentDate);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Collection</Text>
        <TouchableOpacity onPress={() => { setCustomer(null); setSearchQuery(''); }}>
            <Search size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        
        {/* 1. CUSTOMER SEARCH / CARD */}
        {!customer ? (
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search Customer (Name, Mobile, ID)"
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
                                    <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
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
                
                {/* Active Loan Selector */}
                {loading ? <ActivityIndicator color="#2563eb" style={{marginTop:20}} /> : (
                    <View style={{marginTop: 16}}>
                        <Text style={styles.label}>Select Active Loan</Text>
                        {activeLoans.length === 0 ? (
                            <Text style={{color: '#94a3b8', fontStyle: 'italic'}}>No active loans found.</Text>
                        ) : (
                            activeLoans.map(loan => (
                                <TouchableOpacity 
                                    key={loan._id} 
                                    style={[styles.loanItem, selectedLoan?._id === loan._id && styles.loanActive]}
                                    onPress={() => {
                                        setSelectedLoan(loan);
                                        // Auto-fill Installment amount
                                        if (loan.financials?.installmentAmount) {
                                            setAmount(String(loan.financials.installmentAmount));
                                        }
                                    }}
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
                                            ₹{loan.financials?.principalAmount?.toLocaleString()}
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

        {/* 2. COLLECTION FORM (Only if loan selected) */}
        {selectedLoan && (
            <>
                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Payment Details</Text>
                    
                    {/* Amount Input */}
                    <View style={styles.amountBox}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput 
                            style={styles.amountInput}
                            placeholder="0"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus={false}
                        />
                    </View>

                    {/* Date Picker */}
                    <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
                        <Calendar size={20} color="#64748b" />
                        <Text style={styles.dateText}>{collectionDate.toDateString()}</Text>
                        <ChevronRight size={16} color="#cbd5e1" style={{marginLeft: 'auto'}} />
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={collectionDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    {/* Payment Mode */}
                    <Text style={[styles.label, {marginTop: 20, marginBottom: 10}]}>Received Via</Text>
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

                    {/* Notes */}
                    <TextInput 
                        style={styles.notesInput}
                        placeholder="Add a note (optional)..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
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
  
  amountBox: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#e2e8f0', paddingBottom: 8, marginBottom: 20 },
  currency: { fontSize: 32, fontWeight: 'bold', color: '#94a3b8', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: 'bold', color: '#0f172a', padding: 0 },

  dateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dateText: { fontSize: 16, fontWeight: '500', color: '#334155', marginLeft: 10 },

  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 10, gap: 6 },
  modeActive: { backgroundColor: '#0f172a' },
  modeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  notesInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, height: 80, textAlignVertical: 'top', fontSize: 15, color: '#334155' },

  submitBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  btnDisabled: { opacity: 0.7, backgroundColor: '#9ca3af' }
});