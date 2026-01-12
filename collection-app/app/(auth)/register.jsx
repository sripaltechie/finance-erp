import React, { useState, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Alert 
} from 'react-native';
import { Check, X, Smartphone, Globe, Monitor } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PLATFORMS, DURATIONS, BASE_PRICES, PLANS } from '../../../shared/PricingData';
import {API_URL} from '../../src/constants/Config';
import { registerClientService } from '../../src/api/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Form, 2: Pricing
  const [formData, setFormData] = useState({ ownerName: '', mobile: '', email: '', password: '', businessName: '' });
  
  // Pricing State
  const [selectedPlatform, setSelectedPlatform] = useState('mobile');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // --- LOGIC: Calculate Price ---
  const getPrice = (tierId) => {
    const baseMonthly = BASE_PRICES[selectedPlatform][tierId];
    const durationObj = DURATIONS.find(d => d.id === selectedDuration);
    const totalBase = baseMonthly * selectedDuration;
    const discounted = totalBase - (totalBase * (durationObj.discount / 100));
    return Math.round(discounted);
  };

const handleRegister = async (planId, isDemo = false) => {
    // 1. Prepare Data
    const finalPayload = {
      ...formData,
      plan: isDemo ? 'Demo' : planId,
      platform: selectedPlatform,
      duration: selectedDuration,
      price: isDemo ? 0 : getPrice(planId),
      isDemo
    };

    console.log("Sending Payload:", finalPayload);

    try {
      // 2. API Call
      // Replace with your actual backend IP/URL
      // e.g., 'http://192.168.1.5:5000/api/auth/client/register'
      const response = await registerClientService(finalPayload);

      // 3. Success Handling
      if(isDemo) {
        Alert.alert("Welcome!", "Your 7-Day Demo is active. Please login.");
        router.replace('/(auth)/login'); // Redirect to login
      } else {
        Alert.alert("Registration Successful", "Please contact Admin to activate your account.");
        router.replace('/(auth)/login');
      }

    } catch (error) {
      console.error("Registration Error:", error);
      const msg = error.response?.data?.message || "Registration Failed";
      Alert.alert("Error", msg);
    }
  };

  // --- STEP 1: BASIC FORM ---
  if (step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Create Account</Text>
        <TextInput placeholder="Owner Name" style={styles.input} value={formData.ownerName} onChangeText={t => setFormData({...formData, ownerName: t})} />
        <TextInput placeholder="Business Name" style={styles.input} value={formData.businessName} onChangeText={t => setFormData({...formData, businessName: t})} />
        <TextInput placeholder="Mobile Number" style={styles.input} keyboardType="phone-pad" value={formData.mobile} onChangeText={t => setFormData({...formData, mobile: t})} />
        <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} />
        <TextInput placeholder="Password" style={styles.input} secureTextEntry value={formData.password} onChangeText={t => setFormData({...formData, password: t})} />
        
        <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
          <Text style={styles.btnText}>Next: Select Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.btn, styles.demoBtn]} onPress={() => handleRegister(null, true)}>
          <Text style={[styles.btnText, styles.demoText]}>Start 7-Day Free Demo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- STEP 2: PRICING UI ---
  return (
    <View style={styles.container}>
      <Text style={styles.subHeader}>Choose Your Plan</Text>

      {/* FILTERS */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PLATFORMS.map(p => (
            <TouchableOpacity key={p.id} onPress={() => setSelectedPlatform(p.id)} 
              style={[styles.chip, selectedPlatform === p.id && styles.chipActive]}>
              <Text style={[styles.chipText, selectedPlatform === p.id && styles.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DURATIONS.map(d => (
            <TouchableOpacity key={d.id} onPress={() => setSelectedDuration(d.id)} 
              style={[styles.chip, selectedDuration === d.id && styles.chipActive]}>
              <Text style={[styles.chipText, selectedDuration === d.id && styles.chipTextActive]}>
                {d.label} {d.discount > 0 && `(-${d.discount}%)`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PLAN CARDS (Horizontal Scroll) */}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
        {PLANS.map(plan => (
          <View key={plan.id} style={[styles.card, { borderColor: plan.color }]}>
            {plan.recommended && <View style={styles.badge}><Text style={styles.badgeText}>Best Value</Text></View>}
            
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <Text style={styles.price}>₹{getPrice(plan.id).toLocaleString()}</Text>
            <Text style={styles.duration}>for {DURATIONS.find(d => d.id === selectedDuration).label}</Text>
            
            <View style={styles.divider} />
            
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Check size={16} color="green" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.selectBtn, { backgroundColor: plan.color }]} onPress={() => handleRegister(plan.id)}>
              <Text style={styles.selectBtnText}>Select {plan.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.compareLink} onPress={() => setCompareModalVisible(true)}>
        <Text style={styles.compareText}>Compare All Features</Text>
      </TouchableOpacity>

      {/* COMPARISON MODAL */}
      <Modal visible={compareModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feature Comparison</Text>
            <TouchableOpacity onPress={() => setCompareModalVisible(false)}><X size={24} color="#000" /></TouchableOpacity>
          </View>
          <ScrollView>
             {/* Detailed Comparison Table Logic Here */}
             <Text style={{padding: 20}}>Detailed feature list goes here...</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f8fafc' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#0f172a' },
  subHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#0f172a' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  btn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  demoBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0f172a', marginTop: 15 },
  demoText: { color: '#0f172a' },
  
  filterRow: { flexDirection: 'row', marginBottom: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  cardsContainer: { paddingRight: 20, paddingBottom: 20 },
  card: { backgroundColor: '#fff', width: 280, padding: 20, borderRadius: 20, marginRight: 15, borderWidth: 2, justifyContent: 'space-between' },
  planName: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  price: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  duration: { fontSize: 12, color: '#64748b', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 15 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  featureText: { fontSize: 13, color: '#334155' },
  selectBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  selectBtnText: { color: '#fff', fontWeight: 'bold' },
  badge: { position: 'absolute', top: -12, right: 20, backgroundColor: '#eab308', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  compareLink: { alignItems: 'center', padding: 15 },
  compareText: { color: '#2563eb', fontWeight: '600' },
  modalContent: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' }
});