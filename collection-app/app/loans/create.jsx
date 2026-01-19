import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, CheckCircle2, Wallet, CreditCard, Plus, Trash2,Banknote
} from 'lucide-react-native';

// Services
import { createLoanService } from '../../src/api/loanService';
import { getCustomerByIdService } from '../../src/api/customerService';
import { getPaymentModesService } from '@/src/api/companyService';

export default function CreateLoan() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [customer, setCustomer] = useState(null);

  //Payment Modes Data
  const [paymentModes,setPaymentModes] = useState([]);
  const [selectedModeId,setSelectedModeId] = useState(''); //For single mode

  // --- FORM STATE ---
  const [loanType, setLoanType] = useState('Daily');
  const [principal, setPrincipal] = useState('');
  
  // Financials
  const [duration, setDuration] = useState('100'); // Days
  const [rate, setRate] = useState('3'); // Interest %
  const [installment, setInstallment] = useState(''); // Auto-calc
  
  // Deduction Toggles (Only Interest as per your file)
  const [interestUpfront, setInterestUpfront] = useState(false);
  
  // Penalty Config
  const [penaltyType, setPenaltyType] = useState('Fixed'); 
  const [penaltyAmount, setPenaltyAmount] = useState('0');
  const [gracePeriod, setGracePeriod] = useState('0');

  // Disbursement
  const [isSplit, setIsSplit] = useState(false);
   // For split: array of { modeId, amount }
  // We initialize with available modes but 0 amount
  const [splitAmounts, setSplitAmounts] = useState({}); 

    // Additional Charges / Discounts
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');
  const [newChargeType, setNewChargeType] = useState('Charge'); // Charge or Discount

  const [notes, setNotes] = useState('');

  // --- 1. LOAD Data ---
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!customerId) { setFetching(false); return; }
      try {
        const data = await getCustomerByIdService(customerId);
        if (isMounted) setCustomer(data);

          // Fetch Payment Modes
        const modesData = await getPaymentModesService();
        if (isMounted) {
            setPaymentModes(modesData);
            if (modesData.length > 0) {
                setSelectedModeId(modesData[0]._id); // Default to first
            }
        }
      } catch (err) {
        console.log("Fetch error:", err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [customerId]);

  // --- 2. AUTO-CALCULATE INSTALLMENT ---
  useEffect(() => {
    if (loanType === 'Daily' && principal && duration) {
      const p = parseFloat(principal) || 0;
      const d = parseFloat(duration) || 1;
      setInstallment(Math.ceil(p / d).toString());
    }
  }, [principal, duration, loanType]);

  // --- HANDLERS ---
    const handleSplitChange = (modeId, text) => {
        setSplitAmounts(prev => ({ ...prev, [modeId]: text }));
    };

    //   const handlePrincipalChange = (text) => {
    //     setPrincipal(text);
    //     if (isSplit) {
    //         setSplitCash(text);
    //         setSplitOnline('0');
    //     }
    //   };

    //   const handleSplitToggle = (value) => {
    //     setIsSplit(value);
    //     if (value) {
    //         setSplitCash(principal || '0');
    //         setSplitOnline('0');
    //     }
    //   };

  const addCharge = () => {
    if (!newChargeName || !newChargeAmount) {
      Alert.alert("Error", "Please enter charge name and amount");
      return;
    }
    setAdditionalCharges([...additionalCharges, {
      id: Date.now(),
      name: newChargeName,
      amount: newChargeAmount,
      type: newChargeType
    }]);
    setNewChargeName('');
    setNewChargeAmount('');
  };

  const removeCharge = (id) => {
    setAdditionalCharges(additionalCharges.filter(c => c.id !== id));
  };

  // --- 3. SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!principal) return Alert.alert("Required", "Enter Principal Amount");
    if (!duration) return Alert.alert("Required", "Enter Duration");

    // Split Validation
     const p = Number(principal);
    let finalDisbursementMode = 'Cash'; // Default fallback
    let finalPaymentSplit = null;
    if (isSplit) {

         // Calculate Total Split
        let totalSplit = 0;
        const splitArray = [];
        // Calculate Net Disbursement to validate against split if needed, 
        // but typically split must equal Principal or Net Disbursement depending on logic.
        // Assuming split equals Principal for simplicity here as backend handles deductions.
        // Or if backend deducts upfront, split should match net. 
        // Let's stick to Principal for basic check or warn user.
        
        // Actually, normally cash/online is what you GIVE. 
        // If interest is upfront, you give Principal - Interest.
        // For now, simple validation that they summed up something reasonable.
          Object.keys(splitAmounts).forEach(modeId => {
            const amt = Number(splitAmounts[modeId]);
                if (amt > 0) {
                    totalSplit += amt;
                    splitArray.push({ modeId, amount: amt });
                }
            });
         if (totalSplit !== p) {
             Alert.alert("Mismatch", `Split Total (${totalSplit}) must match Principal (${p})`);
             return;
        }
           finalDisbursementMode = 'Split';
        // Construct the object structure backend expects for split
        // Backend 'paymentSplit' is usually { cash: 0, online: 0 } or array depending on schema.
        // Looking at your previous Loan model: 
        // paymentSplit: { cash: { type: Number }, online: { type: Number } }
        // BUT wait, if we use dynamic modes, we need to send an array or map based on new schema.
        // Since we are changing to dynamic payment modes, we should check if backend accepts array.
        // Assuming backend supports dynamic split if mode is 'Split'.
        // If your backend strictly expects { cash: ..., online: ... }, we need to map dynamic modes to these categories.
        
        // Mapping dynamic modes to 'cash' and 'online' buckets for the existing backend schema:
        let cashTotal = 0;
        let onlineTotal = 0;
        
        splitArray.forEach(item => {
            const mode = paymentModes.find(m => m._id === item.modeId);
            if (mode?.type === 'Cash') cashTotal += item.amount;
            else onlineTotal += item.amount;
        });
        
        finalPaymentSplit = { cash: cashTotal, online: onlineTotal };

    } else {
        // Single Mode Logic
        const mode = paymentModes.find(m => m._id === selectedModeId);
        if (!mode) return Alert.alert("Error", "Select a payment mode");
        
        finalDisbursementMode = mode.type; // 'Cash' or 'Online'
        // Even for single mode, backend might use paymentSplit structure for consistent accounting?
        // Or createAdvancedLoan uses disbursementMode.
    }
    setLoading(true);

    try {
        // Prepare additional charges for backend
        // Backend expects 'deductions' array for extra charges
        const deductions = additionalCharges.map(c => ({
            name: c.name,
            amount: Number(c.amount),
            type: c.type === 'Charge' ? 'Fixed' : 'Discount', // Map to backend logic
            isDiscount: c.type === 'Discount'
        }));

        // PAYLOAD MATCHING WEB APP STRUCTURE EXACTLY
        const payload = {
            customerId,
            loanType,
            disbursementMode: disbursementMode, 
            
             // Send split if applicable
            ...(isSplit && { paymentSplit: finalPaymentSplit }),
            
            financials: {
                principalAmount: Number(principal),
                interestRate: Number(rate),
                duration: Number(duration),
                durationType: loanType === 'Daily' ? 'Days' : 'Months',
                
                // Only include installment if Daily
                ...(loanType === 'Daily' && { installmentAmount: Number(installment) }),

                // Configuration Toggles (Only Interest)
                deductionConfig: {
                    interest: interestUpfront ? 'Upfront' : 'End'
                }
            },

            // Pass additional charges
            deductions,

            penaltyConfig: {
                type: penaltyType,
                amount: Number(penaltyAmount),
                gracePeriod: Number(gracePeriod)
            },

            notes
        };

        await createLoanService(payload);
        
        Alert.alert("Success", "Loan Created Successfully", [
            { text: "OK", onPress: () => router.replace('/(tabs)/collection') }
        ]);

    } catch (err) {
        const msg = err.response?.data?.message || err.message || "Creation Failed";
        Alert.alert("Error", msg);
    } finally {
        setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>New Loan</Text>
          <Text style={styles.customerSub}>{customer?.fullName || 'Loading...'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Type Toggle */}
        <View style={styles.typeContainer}>
            {['Daily', 'Monthly'].map(t => (
              <TouchableOpacity 
                key={t} 
                style={[styles.typeBtn, loanType === t && styles.typeBtnActive]}
                onPress={() => setLoanType(t)}
              >
                <Text style={[styles.typeText, loanType === t && {color: '#fff'}]}>{t}</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* Financials */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financials</Text>
          <TextInput 
              style={styles.mainInput} 
              keyboardType="numeric" 
              placeholder="Principal Amount"
              value={principal} onChangeText={setPrincipal}
          />
          <View style={styles.rowGrid}>
            <TextInput 
                style={[styles.input, {flex:1, marginRight:8}]} keyboardType="numeric"
                placeholder={loanType === 'Daily' ? 'Days' : 'Months'}
                value={duration} onChangeText={setDuration}
            />
            <TextInput 
                style={[styles.input, {flex:1}]} keyboardType="numeric"
                placeholder="Interest %"
                value={rate} onChangeText={setRate}
            />
          </View>
          {loanType === 'Daily' && (
             <TextInput 
                style={[styles.input, styles.readOnlyInput, {marginTop: 12}]} 
                editable={false} value={installment} placeholder="Daily Installment"
             />
          )}
        </View>

        {/* Deductions */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Deductions</Text>
            
            <View style={styles.deductionRow}>
                <Text style={styles.label}>Interest Upfront?</Text>
                <Switch value={interestUpfront} onValueChange={setInterestUpfront} trackColor={{true: '#2563eb', false: '#e2e8f0'}}/>
            </View>
        </View>

        {/* Additional Charges / Discounts */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Charges / Discounts</Text>
            
            <View style={styles.rowGrid}>
                <TextInput 
                    style={[styles.input, {flex:2, marginRight:8}]} 
                    placeholder="Name (e.g. Doc Fee)"
                    value={newChargeName} onChangeText={setNewChargeName}
                />
                <TextInput 
                    style={[styles.input, {flex:1}]} keyboardType="numeric"
                    placeholder="Amount"
                    value={newChargeAmount} onChangeText={setNewChargeAmount}
                />
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
                 <View style={{flexDirection:'row', gap: 10}}>
                    <TouchableOpacity onPress={() => setNewChargeType('Charge')} style={[styles.smallBtn, newChargeType === 'Charge' && styles.activeBtn]}>
                        <Text style={[styles.smallBtnText, newChargeType === 'Charge' && {color: '#fff'}]}>Charge (+)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setNewChargeType('Discount')} style={[styles.smallBtn, newChargeType === 'Discount' && styles.activeBtn]}>
                        <Text style={[styles.smallBtnText, newChargeType === 'Discount' && {color: '#fff'}]}>Discount (-)</Text>
                    </TouchableOpacity>
                 </View>
                 <TouchableOpacity onPress={addCharge} style={styles.addBtn}>
                    <Plus size={20} color="#fff" />
                 </TouchableOpacity>
            </View>

            {additionalCharges.length > 0 && (
                <View style={{marginTop: 15}}>
                    {additionalCharges.map((item) => (
                        <View key={item.id} style={styles.chargeRow}>
                            <Text style={styles.chargeText}>{item.name} ({item.type})</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[styles.chargeAmt, item.type === 'Discount' ? {color: 'green'} : {color: 'red'}]}>
                                    {item.type === 'Discount' ? '-' : '+'} ₹{item.amount}
                                </Text>
                                <TouchableOpacity onPress={() => removeCharge(item.id)} style={{marginLeft: 10}}>
                                    <Trash2 size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>

        {/* Penalty */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Penalty</Text>
            <View style={styles.rowGrid}>
                <TextInput 
                    style={[styles.input, {flex:1, marginRight:8}]} keyboardType="numeric"
                    placeholder="Grace Period (Days)"
                    value={gracePeriod} onChangeText={setGracePeriod}
                />
                <TextInput 
                    style={[styles.input, {flex:1}]} keyboardType="numeric"
                    placeholder="Amount (₹)"
                    value={penaltyAmount} onChangeText={setPenaltyAmount}
                />
            </View>
        </View>

        {/* Mode */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Disbursement Mode</Text>
            
            <View style={styles.switchRow}>
                <Text style={styles.label}>Split Payment? </Text>
                <Switch value={isSplit} onValueChange={setIsSplit} trackColor={{true: '#2563eb', false: '#cbd5e1'}} />
            </View>

            {!isSplit ? (
                 // Single Mode Selection
                 <View style={styles.modeContainer}>
                    {paymentModes.map(mode => (
                        <TouchableOpacity 
                            key={mode._id} 
                            style={[styles.modeBtn, selectedModeId === mode._id && styles.modeActive]}
                            onPress={() => setSelectedModeId(mode._id)}
                        >
                            {mode.type === 'Cash' ? <Banknote size={18} color={selectedModeId === mode._id ? '#fff' : '#64748b'} /> : <CreditCard size={18} color={selectedModeId === mode._id ? '#fff' : '#64748b'} />}
                            <Text style={[styles.modeText, selectedModeId === mode._id && styles.textActive]}>{mode.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.splitBox}>
                     {paymentModes.map(mode => (
                        <View key={mode._id} style={styles.splitInputGrp}>
                            <Text style={styles.splitLabel}>{mode.name} ({mode.type})</Text>
                            <TextInput 
                                style={styles.splitInput} 
                                keyboardType="number-pad" 
                                placeholder="0"
                                value={splitAmounts[mode._id] || ''} 
                                onChangeText={text => handleSplitChange(mode._id, text)} 
                            />
                        </View>
                    ))}
                </View>
            )}
        </View>

        <TouchableOpacity style={[styles.disburseBtn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.disburseText}>CREATE LOAN</Text>}
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  customerSub: { fontSize: 13, color: '#64748b' },
  scroll: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
  typeContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#2563eb' },
  typeText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  mainInput: { fontSize: 24, fontWeight: 'bold', color: '#2563eb', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', marginBottom: 12 },
  rowGrid: { flexDirection: 'row' },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b' },
  readOnlyInput: { backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 'bold' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6 },
  deductionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  disburseBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10, marginTop: 10 },
  disburseText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  disabled: { opacity: 0.6, backgroundColor: '#94a3b8' },
  
  // Split Styles
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
    modeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  modeActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  modeText: { fontWeight: 'bold', color: '#64748b' },
  textActive: { color: '#fff' },
  splitBox: { gap: 10 },
  splitInputGrp: { marginBottom: 8 },
  splitLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  splitInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 16, fontWeight: 'bold' },

  // Charges Styles
  smallBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  activeBtn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  smallBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  addBtn: { backgroundColor: '#0f172a', padding: 10, borderRadius: 8 },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  chargeText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  chargeAmt: { fontSize: 14, fontWeight: 'bold' }
});