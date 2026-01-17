import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Lock, Smartphone, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 1. Import Storage

// 2. Import Service
import { loginClientService } from '../../src/api/authService';

export default function LoginScreen() {
 const router = useRouter();
  const [loading, setLoading] = useState(false);
  

  // 🟢 Single State for Input
  const [identifier, setIdentifier] = useState('7989704897'); 
  const [password, setPassword] = useState('123456');
    
  const handleLogin = async () => {
    if (!identifier || !password) {
            Alert.alert("Error", "fill all fields");
      return;
    }
    
    setLoading(true);

    try {
      // 3. Call Backend
      const data = await loginClientService({ identifier:identifier, password:password });
      // 4. Save Session (CRITICAL STEP)
      await AsyncStorage.setItem('token', data.token); //      
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
      if (data && data.companyId) {
        await AsyncStorage.setItem('activeCompanyId', data.companyId);
      }
      // 🟢 NEW: Handle Company Selection
      // console.log("com_name",data.user);
      if (data.user.companies && data.user.companies.length > 0) {
        // Default to the first company for now
        // In a real app, you might show a "Select Branch" screen here
        await AsyncStorage.setItem('activeCompanyId', data.user.companies[0]._id);
        // 3. Show Alert and Navigate ON PRESS of "OK"
      Alert.alert(
        "Success", 
        `Welcome back, ${data.user.ownerName || 'Owner'}`,
        [
          { 
            text: "Go to Dashboard", 
            onPress: () => router.replace('/(tabs)') // 🟢 Navigate here
          }
        ]
      );
      } else {
        Alert.alert(
          "Notice", 
          "No branches found. Please set up your company.",
          [{ text: "OK", onPress: () => router.replace('/company-setup') }]
        );
      }
      
      router.replace('/(tabs)');
      

      // 5. Navigate to Dashboard (Tabs)
      // Note: We use replace to prevent going back to login
      router.replace('/(tabs)'); 

    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.message || "Login Failed";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to access your route</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Smartphone size={20} color="#64748b" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="e.g. 9876543210  or user@email.com"
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748b" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.btn, loading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <>
               <Text style={styles.btnText}>Login Securely</Text>
               <ArrowRight size={20} color="#fff" />
             </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New Business Owner? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Register Here</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 64, height: 64, backgroundColor: '#2563eb', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b' },
  form: { backgroundColor: '#fff', padding: 24, borderRadius: 24, elevation: 2 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 50 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  btn: { backgroundColor: '#2563eb', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b' },
  link: { color: '#2563eb', fontWeight: 'bold' }
});