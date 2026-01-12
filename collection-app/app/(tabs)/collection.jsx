import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Search, Calendar, Wallet, CreditCard } from 'lucide-react-native';

export default function CollectionScreen() {
  const [step, setStep] = useState(1);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [customer, setCustomer] = useState(null);
  
  // Form State
  const [totalAmount, setTotalAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date());
  
  // Payment Mode State
  const [isSplit, setIsSplit] = useState(false); // Toggle Single/Split
  const [paymentMode, setPaymentMode] = useState('Cash'); // For Single
  const [splitCash, setSplitCash] = useState('');
  const [splitOnline, setSplitOnline] = useState('');

  // Derived State (Visuals)
  const [indexDisplay, setIndexDisplay] = useState('');

  // --- 1. SEARCH LOGIC ---
  const handleSearch = () => {
    // MOCK API DATA
    if(searchId === '100') {
        const mockCust = {
            name: 'Mastan Vali',
            loanType: 'Daily',
            installment: 500, // Daily Chit Value
            due: 500,
            lastIndex: 55,
            loanId: 'dummy_loan_123'
        };
        
        setCustomer(mockCust);
        
        // AUTO-FILL DEFAULT (1 Day)
        setTotalAmount(mockCust.installment.toString());
        setSplitCash(mockCust.installment.toString()); // Default full cash
        setSplitOnline('0');
        
        setStep(2);
    } else {
        Alert.alert("Not Found", "Try ID 100");
    }
  };

  // --- 2. LIVE INDEX CALCULATOR ---
  useEffect(() => {
    if (!customer || !totalAmount) return;

    const amt = parseInt(totalAmount) || 0;
    const inst = customer.installment;
    const lastIdx = customer.lastIndex;

    const daysCleared = Math.floor(amt / inst);
    const remainder = amt % inst;

    let text = "";
    
    if (daysCleared === 0) {
        text = "Partial Payment Only";
    } else if (daysCleared === 1) {
        text = `Index: ${lastIdx + 1}`;
    } else if (daysCleared === 2) {
        text = `Indexes: ${lastIdx + 1}, ${lastIdx + 2}`;
    } else {
        text = `Indexes: ${lastIdx + 1} - ${lastIdx + daysCleared}`;
    }

    if (remainder > 0) text += ` (+ ₹${remainder} Bal)`;
    
    setIndexDisplay(text);

  }, [totalAmount, customer]);

  // --- 3. HANDLE AMOUNT CHANGES ---
  const handleTotalChange = (val) => {
    setTotalAmount(val);
    // If split is active, reset split fields to force user to re-enter
    if (isSplit) {
        setSplitCash(val); 
        setSplitOnline('0');
    }
  };

  const handleShortcut = (multiplier) => {
    if (!customer) return;
    const val = (customer.installment * multiplier).toString();
    handleTotalChange(val);
  };

  // --- 4. SUBMIT ---
  const handleSubmit = () => {
    // Validation
    if (isSplit) {
        const c = parseInt(splitCash) || 0;
        const o = parseInt(splitOnline) || 0;
        const t = parseInt(totalAmount) || 0;
        if (c + o !== t) {
            Alert.alert("Mismatch", `Cash (${c}) + Online (${o}) must equal Total (${t})`);
            return;
        }
    }

    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        Alert.alert("Success", `Collected ₹${totalAmount} for Indices: ${indexDisplay}`);
        setStep(1);
        setSearchId('');
    }, 1000);
  };

  // ------------------------------------------
  // UI RENDER
  // ------------------------------------------
  
  if (step === 1) {
    // ... (Same Search UI as before) ...
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Daily Collection</Text>
        <View style={styles.searchBox}>
            <Text style={styles.label}>Enter Customer ID</Text>
            <View style={styles.inputRow}>
                <TextInput 
                    style={styles.inputLarge} placeholder="100" keyboardType="number-pad" 
                    autoFocus value={searchId} onChangeText={setSearchId} onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.goBtn} onPress={handleSearch}><Search color="#fff" size={24} /></TouchableOpacity>
            </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
        <Text style={styles.backText}>← Change Customer</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.headerRow}>
            <View>
                <Text style={styles.custName}>{customer.name}</Text>
                <Text style={styles.subText}>Installment: ₹{customer.installment}/day</Text>
            </View>
            <View style={styles.dateBadge}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.dateText}>{collectionDate.toDateString().slice(4, 10)}</Text>
            </View>
        </View>

        {/* 1. TOTAL AMOUNT INPUT */}
        <View style={styles.amountSection}>
            <Text style={styles.labelCenter}>Total Amount Received</Text>
            <TextInput 
                style={styles.amountInput} 
                keyboardType="number-pad"
                value={totalAmount}
                onChangeText={handleTotalChange}
            />
            {/* Live Index Display */}
            <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{indexDisplay || "Enter Amount"}</Text>
            </View>
        </View>

        {/* Shortcuts */}
        <View style={styles.shortcutRow}>
            {[1, 2, 3, 4].map(m => (
                <TouchableOpacity key={m} style={styles.shortcutBtn} onPress={() => handleShortcut(m)}>
                    <Text style={styles.shortcutLabel}>x{m}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View style={styles.divider} />

        {/* 2. PAYMENT MODE & SPLIT LOGIC */}
        <View style={styles.modeSection}>
            <View style={styles.switchRow}>
                <Text style={styles.label}>Split Payment? (Cash + Online)</Text>
                <Switch 
                    value={isSplit} 
                    onValueChange={setIsSplit} 
                    trackColor={{true: '#2563eb', false: '#cbd5e1'}}
                />
            </View>

            {!isSplit ? (
                // SINGLE MODE
                <View style={styles.toggleRow}>
                    <TouchableOpacity 
                        style={[styles.modeBtn, paymentMode === 'Cash' && styles.modeActive]}
                        onPress={() => setPaymentMode('Cash')}
                    >
                        <Wallet size={18} color={paymentMode === 'Cash' ? '#fff' : '#64748b'} />
                        <Text style={[styles.modeText, paymentMode === 'Cash' && styles.textActive]}>Cash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modeBtn, paymentMode === 'Online' && styles.modeActive]}
                        onPress={() => setPaymentMode('Online')}
                    >
                        <CreditCard size={18} color={paymentMode === 'Online' ? '#fff' : '#64748b'} />
                        <Text style={[styles.modeText, paymentMode === 'Online' && styles.textActive]}>Online</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // SPLIT MODE
                <View style={styles.splitBox}>
                    <View style={styles.splitInputGrp}>
                        <Text style={styles.splitLabel}>Cash Portion</Text>
                        <TextInput 
                            style={styles.splitInput} 
                            value={splitCash}
                            keyboardType="number-pad"
                            onChangeText={t => setSplitCash(t)}
                        />
                    </View>
                    <View style={styles.splitInputGrp}>
                        <Text style={styles.splitLabel}>Online Portion</Text>
                        <TextInput 
                            style={styles.splitInput} 
                            value={splitOnline}
                            keyboardType="number-pad"
                            onChangeText={t => setSplitOnline(t)}
                        />
                    </View>
                </View>
            )}
        </View>

        {/* 3. CONFIRM BUTTON */}
        <TouchableOpacity 
            style={[styles.payBtn, loading && styles.disabled]} 
            onPress={handleSubmit}
            disabled={loading}
        >
            <Text style={styles.payText}>{loading ? "Saving..." : "CONFIRM PAYMENT"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 20, marginTop: 20 },
  
  // Search Styles
  searchBox: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputLarge: { flex: 1, fontSize: 32, fontWeight: 'bold', borderBottomWidth: 2, borderColor: '#e2e8f0', color: '#0f172a' },
  goBtn: { backgroundColor: '#2563eb', width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Card Styles
  backBtn: { marginBottom: 15, marginTop: 20 },
  backText: { color: '#64748b', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 3 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  custName: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subText: { color: '#64748b', fontSize: 13 },
  dateBadge: { flexDirection: 'row', gap: 6, backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, alignItems: 'center' },
  dateText: { fontWeight: 'bold', color: '#475569', fontSize: 12 },

  // Amount Section
  amountSection: { alignItems: 'center', marginBottom: 15 },
  labelCenter: { color: '#64748b', fontWeight: '600', marginBottom: 5 },
  amountInput: { fontSize: 42, fontWeight: '800', color: '#0f172a', borderBottomWidth: 2, borderColor: '#e2e8f0', width: '60%', textAlign: 'center', marginBottom: 10 },
  
  indexBadge: { backgroundColor: '#dcfce7', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  indexText: { color: '#166534', fontWeight: 'bold', fontSize: 14 },

  shortcutRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  shortcutBtn: { backgroundColor: '#eff6ff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  shortcutLabel: { color: '#2563eb', fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },

  // Mode Section
  modeSection: { marginBottom: 25 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  modeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  modeActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  modeText: { fontWeight: 'bold', color: '#64748b' },
  textActive: { color: '#fff' },

  splitBox: { flexDirection: 'row', gap: 10 },
  splitInputGrp: { flex: 1 },
  splitLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  splitInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 16, fontWeight: 'bold' },

  payBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 14, alignItems: 'center', shadowColor: '#16a34a', shadowOpacity: 0.3, shadowOffset: {height: 4, width: 0} },
  payText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabled: { opacity: 0.7 }
});