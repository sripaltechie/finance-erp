import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, Save, User, Phone, Lock} from 'lucide-react-native';

import { createStaffService, updateStaffService,getStaffByIdService  } from '../../src/api/staffService';
// You might want to get specific details. For now we assume passing data via route params or fetching list again is overkill for simple edit.
// A better approach is fetching ID. I'll add a simple mock fetch or just use params if passed, but typically we fetch by ID.
// Since we didn't export getStaffById, we can update staffService to have it OR just update blindly.
// Ideally, add getStaffByIdService to staffService.js if needed. For this code, I'll rely on the user filling fields or a fetch.

export default function StaffManageScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false); // State for initial load

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    role: 'Collection_Boy',
    isActive: true
  });

  const roles = [
    { label: 'Collection Boy', value: 'Collection_Boy', desc: 'Can view route & collect money' },
    { label: 'Recovery Agent', value: 'Recovery_Agent', desc: 'Handles Level-3 Defaulters' },
    { label: 'Manager', value: 'Manager', desc: 'Can view dashboard & reports' },
    { label: 'Admin', value: 'Admin', desc: 'Full Access' }
  ];

    // 🟢 1. FETCH DATA ON MOUNT (If Edit Mode)
  useEffect(() => {
    const loadStaffDetails = async () => {
      if (!isEdit) return;

      setFetching(true);
      try {
        const data = await getStaffByIdService(id);
        setFormData({
          name: data.name,
          mobile: data.mobile,
          role: data.role,
          isActive: data.isActive,
          password: '' // Keep empty, don't show hash
        });
      } catch (error) {
        // console.log(error);
        // Alert.alert("Error", "Could not load staff details");
        console.log("Detailed Fetch Error:", error); // Check exactly what 'error' is
        Alert.alert("Error", typeof error === 'string' ? error : "Could not load staff details");
        router.back();
      } finally {
        setFetching(false);
      }
    };

    loadStaffDetails();
  }, [id]);
  
  // For simplicity, if it's edit, we assume the user might need to re-enter or we fetch.
  // Let's assume for now we are creating new or updating basic info.

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile) {
      Alert.alert("Missing Fields", "Name and Mobile are required.");
      return;
    }
    if (!isEdit && !formData.password) {
      Alert.alert("Missing Fields", "Password is required for new accounts.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        // Prepare payload (remove password if empty to avoid resetting it)
        const payload = { 
          name: formData.name, 
          role: formData.role, 
          isActive: formData.isActive 
        };
        if (formData.password) payload.password = formData.password;

        await updateStaffService(id, payload);
        Alert.alert("Success", "Staff updated successfully");
      } else {
        await createStaffService(formData);
        Alert.alert("Success", "Staff created successfully");
      }
      router.back();
    } catch (err) {
      Alert.alert("Error", typeof err === 'string' ? err : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

    if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Loading details...</Text>
      </View>
        );
    }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? "Edit Staff" : "Add New Staff"}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.card}>
            
            <View style={styles.inputBox}>
              <User size={18} color="#64748b" style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.name} 
                  onChangeText={t => setFormData({ ...formData, name: t })} 
                  placeholder="e.g. Ramesh Kumar"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputBox}>
              <Phone size={18} color="#64748b" style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput 
                   style={[styles.input, isEdit && { color: '#94a3b8' }]} 
                  value={formData.mobile} 
                  onChangeText={t => setFormData({ ...formData, mobile: t })} 
                  placeholder="10 digit number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isEdit} // Mobile usually unique/fixed ID
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputBox}>
              <Lock size={18} color="#64748b" style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{isEdit ? "Reset Password (Optional)" : "Password"}</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.password} 
                  onChangeText={t => setFormData({ ...formData, password: t })} 
                  placeholder={isEdit ? "Leave empty to keep current" : "Set login password"}
                  secureTextEntry
                />
              </View>
            </View>

          </View>

          <Text style={styles.sectionTitle}>ROLE & PERMISSIONS</Text>
          <View style={styles.card}>
            {roles.map((r, i) => (
              <TouchableOpacity 
                key={r.value} 
                style={[styles.roleRow, i !== roles.length - 1 && styles.borderBottom]}
                onPress={() => setFormData({ ...formData, role: r.value })}
              >
                <View style={[styles.radio, formData.role === r.value && styles.radioActive]}>
                  {formData.role === r.value && <View style={styles.radioDot} />}
                </View>
                <View>
                  <Text style={styles.roleLabel}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {isEdit && (
            <View style={[styles.card, styles.switchRow]}>
              <View>
                <Text style={styles.roleLabel}>Account Active</Text>
                <Text style={styles.roleDesc}>Toggle to ban/unban access</Text>
              </View>
              <Switch 
                value={formData.isActive} 
                onValueChange={v => setFormData({ ...formData, isActive: v })}
                trackColor={{ true: '#2563eb', false: '#cbd5e1' }}
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Save size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>{isEdit ? "Update Staff" : "Create Account"}</Text>
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginLeft: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  scroll: { padding: 16 },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginTop: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 1 },
  
  inputBox: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  icon: { marginRight: 16 },
  label: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
  input: { fontSize: 16, color: '#0f172a', fontWeight: '500', padding: 0 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 50 },

  roleRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roleLabel: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  roleDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#2563eb' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563eb' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },

  submitBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10, marginTop: 10, marginBottom: 40 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});