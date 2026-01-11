import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Lock, Smartphone, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert("Error", "Please enter Mobile & Password");
      return;
    }

    setLoading(true);
    
    // TODO: Connect to your API (POST /api/auth/login)
    // Simulating API delay for now...
    setTimeout(() => {
      setLoading(false);
      // On Success:
      router.replace('/(tabs)'); 
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to access your route</Text>
      </View>

      {/* Form Section */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Smartphone size={20} color="#64748b" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
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
          style={[styles.btn, loading && styles.btnLoading]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Verifying..." : "Login Securely"}</Text>
          {!loading && <ArrowRight size={20} color="#fff" />}
        </TouchableOpacity>

        {/* Link to Register (For New Clients) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New Business Owner? </Text>
          <Link href="/(auth)/register" asChild>
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
  
  form: { backgroundColor: '#fff', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#f8fafc', height: 50 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },
  
  btn: { backgroundColor: '#2563eb', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnLoading: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b' },
  link: { color: '#2563eb', fontWeight: 'bold' }
});