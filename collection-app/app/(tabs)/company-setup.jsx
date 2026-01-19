import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Building, MapPin, DollarSign, ShieldCheck, CheckCircle, Wallet } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCompanyService } from '../../src/api/companyService';

export default function CompanySetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State matching Web App
  const [formData, setFormData] = useState({
    name: 'Hithvi Rashi',
    address: 'one town',
    initialCapital: '100000',
    allowPartial: true,
    monthlyInterest: true,
    geoFencing: true
  });

  const handleCreate = async () => {
     setErrorMsg(''); // Reset error
    // 1. Basic Validation
    if (!formData.name || !formData.address || !formData.initialCapital) {
      Alert.alert("Missing Fields", "Please fill in Name, Address and Initial Capital.");
      return;
    }
    setLoading(true);
    try {  
      // 3. Prepare Payload (Matches Web App Structure)
      const payload = {
        name: formData.name,
        address: formData.address,
        initialCapital: Number(formData.initialCapital) || 0,
        settings: {
            allowPartialPayments: formData.allowPartial,
            enableMonthlyInterest: formData.monthlyInterest,
            geoFencingEnabled: formData.geoFencing
        }
      };

      // 4. API Call
      const data  = await createCompanyService(payload);

      // 5. Success Logic
      // Save the new Company ID so the Dashboard loads correctly
      if (data.company && data.company._id) {
          await AsyncStorage.setItem('activeCompanyId', data.company._id);
      }

      Alert.alert("Success", "Branch Setup Complete!", [
        { text: "Go to Dashboard", onPress: () => router.replace('/(tabs)') }
      ]);

    } catch (error) {
      console.log("srip",error);
      const msg = error.response?.data?.message || "Failed to create branch";
      setErrorMsg(msg);
       if (msg.includes("Plan Limit")) {
        Alert.alert("Upgrade Required", msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBg}>
            <Building size={32} color="#2563eb" />
          </View>
          <Text style={styles.title}>Setup Your Branch</Text>
          <Text style={styles.subtitle}>One last step to start managing finances.</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formSection}>
          
          {/* Branch Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Firm / Branch Name</Text>
            <View style={styles.inputWrapper}>
              <Building size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="e.g. Sri Balaji Finance"
                placeholderTextColor="#94a3b8"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City / Location</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="e.g. Benz Circle, Vijayawada"
                placeholderTextColor="#94a3b8"
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
              />
            </View>
          </View>

          {/* Initial Capital */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Initial Investment (Capital)</Text>
            <View style={[styles.inputWrapper, { borderColor: '#22c55e' }]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={[styles.input, styles.capitalInput]}
                placeholder="500000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={formData.initialCapital}
                onChangeText={(text) => setFormData({...formData, initialCapital: text})}
              />
            </View>
            <Text style={styles.helperText}>Sets your starting Cash Balance.</Text>
          </View>

        </View>

        {/* Operational Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>OPERATIONAL SETTINGS</Text>

          {/* Partial Payments Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Wallet size={18} color="#9333ea" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Partial Payments</Text>
                <Text style={styles.settingSub}>Allow collecting odd amounts</Text>
              </View>
            </View>
            <Switch 
              value={formData.allowPartial}
              onValueChange={(val) => setFormData({...formData, allowPartial: val})}
              trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
              thumbColor={formData.allowPartial ? "#2563eb" : "#f4f4f5"}
            />
          </View>

          {/* Geo-Fencing Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIconBox, { backgroundColor: '#ffedd5' }]}>
                <ShieldCheck size={18} color="#ea580c" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Geo-Fencing Security</Text>
                <Text style={styles.settingSub}>Force GPS check for collection</Text>
              </View>
            </View>
            <Switch 
              value={formData.geoFencing}
              onValueChange={(val) => setFormData({...formData, geoFencing: val})}
              trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
              thumbColor={formData.geoFencing ? "#2563eb" : "#f4f4f5"}
            />
          </View>

        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Create Branch & Start</Text>
              <CheckCircle size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconBg: { width: 64, height: 64, backgroundColor: '#dbeafe', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },

  rrorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, margin: 20, marginBottom: 0, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#b91c1c', marginLeft: 10, fontSize: 13, flex: 1 },

  formSection: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', height: '100%' },
  
  capitalInput: { fontWeight: 'bold', fontSize: 18, color: '#15803d' },
  currencySymbol: { fontSize: 18, fontWeight: 'bold', color: '#64748b', marginRight: 8 },
  helperText: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 4 },

  settingsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, letterSpacing: 1 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  settingSub: { fontSize: 12, color: '#64748b' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});