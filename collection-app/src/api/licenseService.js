import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

// Your exact API URL from the Dart code
const API_URL = 'https://chandaservices.in/license-manager/api.php';

export const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem('device_id');
  if (!deviceId) {
    // Attempt to grab actual hardware ID
    if (Platform.OS === 'android') {
      deviceId = Application.androidId;
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }
    
    // Fallback if running in a web emulator or unsupported environment
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    }
    await AsyncStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export const checkLicenseStatus = async () => {
  const deviceId = await getDeviceId();
  
  try {
    // A. Try Online Check
    const response = await axios.post(API_URL, {
      action: 'check_status',
      user_id: deviceId
    }, { timeout: 5000 });

    if (response.status === 200 && response.data) {
      // If active, save expiry to local storage for offline use
      if (response.data.status === 'active') {
        await AsyncStorage.setItem('license_expiry', response.data.expiry);
        await AsyncStorage.setItem('license_status', 'active');
      } else {
        await AsyncStorage.setItem('license_status', 'expired');
      }
      return response.data;
    }
  } catch (error) {
    console.log("Online check failed:", error.message);
  }

  // B. Offline Fallback
  // If internet fails, check local storage
  const localExpiry = await AsyncStorage.getItem('license_expiry');
  if (localExpiry) {
    const expiryDate = new Date(localExpiry);
    if (new Date() < expiryDate) {
      return { status: 'active', expiry: localExpiry, offline: true };
    }
  }

  return { status: 'error', message: 'Connection failed & no offline license found' };
};

export const activateLicenseKey = async (key) => {
  try {
    const deviceId = await getDeviceId();
    const response = await axios.post(API_URL, {
      action: 'activate',
      user_id: deviceId,
      license_key: key
    });

    if (response.status === 200 && response.data) {
      if (response.data.success) {
        // Save locally immediately upon success
        await AsyncStorage.setItem('license_expiry', response.data.new_expiry);
        await AsyncStorage.setItem('license_status', 'active');
      }
      return response.data;
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'Server Error' };
};