import React, { useState, useEffect,useMemo} from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, CheckCircle2, Wallet, CreditCard, Plus, Trash2,Banknote
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedModeId, setSelectedModeId] = useState(''); //For single mode

  // --- FORM STATE ---
  const [loanType, setLoanType] = useState('Daily');
  const [principal, setPrincipal] = useState('');
  
  // Financials
  const [duration, setDuration] = useState('100'); // Days
  const [interestType, setInterestType] = useState('Percentage'); // 'Percentage' or 'Fixed'
  const [rate, setRate] = useState('5'); // Interest %
  const [fixedInterest, setFixedInterest] = useState(''); // For Fixed Amount
  const [installment, setInstallment] = useState(''); // Auto-calc
  
  // Deduction Toggles 
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
        try {
          if (customerId) {              
            const custData = await getCustomerByIdService(customerId);
            if (isMounted) setCustomer(custData);
          }
        // const data = await getCustomerByIdService(customerId);
        // if (isMounted) setCustomer(data);

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


   // --- CALCULATIONS MEMO ---
  const calcs = useMemo(() => {
      const princ = Number(principal) || 0;
      let interestDed = 0;
      
      // 🟢 Interest Logic (Fixed vs Percentage)
      let calculatedInterest = 0;
      if (interestType === 'Fixed') {
          calculatedInterest = Number(fixedInterest) || 0;
      } else {
          const r = Number(rate) || 0;
        //   const d = Number(duration) || 0;
          if (loanType === 'Monthly') {
              calculatedInterest  = (princ * r) / 100;
            } else if (loanType === 'Daily') {
                // Simplified Daily Logic or 0
                calculatedInterest  = (princ * r) / 100;
            //   calculatedInterest  = (princ * (Number(rate)||0) * ((Number(duration)||0)/30)) / 100;
          }
      }

   // Apply Deduction if Upfront
      if (interestUpfront) {
          interestDed = calculatedInterest;
      }
      // Additional Charges
          const extraCharges = additionalCharges.reduce((sum, item) => {
          const amt = Number(item.amount);
          return item.type === 'Discount' ? sum - amt : sum + amt;
      }, 0);

      const totalDeductions = interestDed  + extraCharges;
      const netDisbursement = princ - totalDeductions;

      return { calculatedInterest , totalDeductions, netDisbursement };
  }, [principal, rate,fixedInterest, duration,loanType, interestUpfront,interestType, additionalCharges]);


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
    // let finalDisbursementMode = 'Cash'; // Default fallback
     const p = Number(principal);
    let finalDisbursementMode = 'Cash';
    let finalPaymentSplit = null;
    if (isSplit) {
         // Calculate Total Split
        let totalSplit = 0;
        const splitObj  = {}; // Format: { modeId: amount }
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
                     splitObj[modeId] = amt;
                }
            });
             // 🟢 VALIDATION: Split Total must equal Net Disbursement
        if (Math.abs(totalSplit - calcs.netDisbursement) > 1) { // Allow 1 rupee variance
             Alert.alert("Mismatch", `Split Total (${totalSplit.toLocaleString()}) must match Net Disburse (${calcs.netDisbursement.toLocaleString()})`);
             return;
        }
        //    finalDisbursementMode = 'Split';
        // Construct the object structure backend expects for split
        // Backend 'paymentSplit' is usually { cash: 0, online: 0 } or array depending on schema.
        // Looking at your previous Loan model: 
        // paymentSplit: { cash: { type: Number }, online: { type: Number } }
        // BUT wait, if we use dynamic modes, we need to send an array or map based on new schema.
        // Since we are changing to dynamic payment modes, we should check if backend accepts array.
        // Assuming backend supports dynamic split if mode is 'Split'.
        // If your backend strictly expects { cash: ..., online: ... }, we need to map dynamic modes to these categories.
        
        // Mapping dynamic modes to 'cash' and 'online' buckets for the existing backend schema:     
               
         finalDisbursementMode = 'Split';
        finalPaymentSplit = splitObj;

    } else {
        // Single Mode Logic
        const mode = paymentModes.find(m => m._id === selectedModeId);
        if (!mode) return Alert.alert("Error", "Select a payment mode");
        
        finalDisbursementMode = selectedModeId; // 'Cash' or 'Online'
        // Send ID directly or Type depending on controller
        // Controller expects ID in disbursementMode for single
    }
    setLoading(true);

    try {
        // 2. Get the active company ID
        const storedCompanyId = await AsyncStorage.getItem('activeCompanyId');
        console.log("storedCompanyId",storedCompanyId);
        // Safety check
        if (!storedCompanyId) {
             Alert.alert("Error", "No Company Selected. Please restart the app.");
             setLoading(false);
             return;
        }
        // Prepare additional charges for backend
        // Backend expects 'deductions' array for extra charges
        const deductions = additionalCharges.map(c => ({
            name: c.name,
            amount: Number(c.amount),
            type: 'Fixed', // Map to backend logic
            isDiscount: c.type === 'Discount'
        }));

        // PAYLOAD MATCHING WEB APP STRUCTURE EXACTLY
        const payload = {
            companyId: storedCompanyId,
            customerId,
            loanType,
            disbursementMode: finalDisbursementMode, 
             paymentSplit: finalPaymentSplit ,
            
            financials: {
                principalAmount: Number(principal),
                interestRate: Number(rate),
                duration: Number(duration),
                // 🟢 Send Interest Config
                interestType, // 'Percentage' or 'Fixed'
                interestRate: interestType === 'Percentage' ? Number(rate) : 0,
                fixedInterestAmount: interestType === 'Fixed' ? Number(fixedInterest) : 0,
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
               {/* 🟢 Interest Type Toggle */}
            <View style={{flex: 1}}>
                <View style={styles.miniToggle}>
                    <TouchableOpacity onPress={() => setInterestType('Percentage')} style={[styles.miniBtn, interestType === 'Percentage' && styles.miniActive]}>
                        <Text style={[styles.miniText, interestType === 'Percentage' && {color:'#fff'}]}>%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setInterestType('Fixed')} style={[styles.miniBtn, interestType === 'Fixed' && styles.miniActive]}>
                        <Text style={[styles.miniText, interestType === 'Fixed' && {color:'#fff'}]}>₹</Text>
                    </TouchableOpacity>
                </View>
                {interestType === 'Percentage' ? (
                    <TextInput 
                        style={styles.input} keyboardType="numeric"
                        placeholder="Interest %"
                        value={rate} onChangeText={setRate}
                    />
                ) : (
                    <TextInput 
                        style={styles.input} keyboardType="numeric"
                        placeholder="Fixed Amt"
                        value={fixedInterest} onChangeText={setFixedInterest}
                    />
                )}
            </View>
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

  {/* 🟢 SUMMARY SECTION */}
        <View style={styles.summaryBox}>
            <View style={styles.sumLine}>
                <Text style={styles.sumText}>Principal</Text>
                <Text style={styles.sumAmt}>₹ {Number(principal || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.sumLine}>
                <Text style={styles.sumText}>Total Deductions</Text>
                <Text style={[styles.sumAmt, {color: '#ef4444'}]}>
                    - ₹ {calcs.totalDeductions.toLocaleString()}
                </Text>
            </View>
             <View style={[styles.netLine, {marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155'}]}>
                <Text style={styles.netLabel}>Net Disburse</Text>
                <Text style={styles.netAmt}>₹ {calcs.netDisbursement.toLocaleString()}</Text>
            </View>
        </View>



        {/* Disbursement Mode */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Disbursement Mode</Text>
            {paymentModes.length > 1?
            <View style={styles.switchRow}>
                <Text style={styles.label}>Split Payment? </Text>
                <Switch value={isSplit} onValueChange={setIsSplit} trackColor={{true: '#2563eb', false: '#cbd5e1'}} />
            </View>:null}

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
  
  // Mini Toggles for Interest Type
  miniToggle: { flexDirection: 'row', marginBottom: 4, alignSelf: 'flex-end', backgroundColor: '#e2e8f0', borderRadius: 6 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  miniActive: { backgroundColor: '#2563eb' },
  miniText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },

  // Summary Box
  summaryBox: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, marginBottom: 20 },
  sumLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumText: { color: '#94a3b8', fontSize: 13 },
  sumAmt: { color: '#fff', fontWeight: 'bold' },
  netLine: { flexDirection: 'row', justifyContent: 'space-between'},
  netLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  netAmt: { color: '#10b981', fontSize: 24, fontWeight: 'bold' },


  
  // Split & Charges

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeBtn: { padding: 12, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
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