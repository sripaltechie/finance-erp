import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Key } from 'lucide-react-native';
import { getDeviceId, activateLicenseKey } from '../src/api/licenseService';

export default function ActivationScreen() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [deviceId, setDeviceId] = useState('Loading...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadId = async () => {
      const id = await getDeviceId();
      setDeviceId(id);
    };
    loadId();
  }, []);

  const handleActivate = async () => {
    if (!key.trim()) return;
    
    setLoading(true);
    const result = await activateLicenseKey(key.trim());
    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Activation Successful!", [
        { text: "Continue", onPress: () => router.replace('/') } // Go back to login
      ]);
    } else {
      Alert.alert("Failed", result.error || "Invalid License Key");
    }
  };

  return (
    <View style={styles.container}>
      <Shield size={80} color="#fbbf24" style={styles.icon} />
      
      <Text style={styles.title}>License Required</Text>
      
      <Text style={styles.subtext}>Your Device ID:</Text>
      <Text style={styles.deviceId}>{deviceId}</Text>

      <View style={styles.inputContainer}>
        <Key size={20} color="#fbbf24" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter License Key"
          placeholderTextColor="#94a3b8"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.7 }]} 
        onPress={handleActivate}
        disabled={loading}
      >
        {loading ? (
           <ActivityIndicator color="#000" />
        ) : (
           <Text style={styles.btnText}>ACTIVATE APP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312e81', // Indigo 900
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  deviceId: {
    color: '#fbbf24', // Amber 400
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3730a3', // Indigo 800
    borderWidth: 1,
    borderColor: '#4f46e5', // Indigo 600
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
    width: '100%',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#fbbf24', // Amber 400
    height: 56,
    width: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  }
});