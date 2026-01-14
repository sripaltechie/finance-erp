import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/Config'; // Ensure this points to your config file

// 1. Create Axios Instance
const client = axios.create({
  baseURL: Config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (The "Security Guard")
// Before any request is sent, this code runs automatically.
client.interceptors.request.use(
  async (config) => {
    try {
      // Retrieve token from phone storage
      const token = await AsyncStorage.getItem('token');
      console.log("🔑 Interceptor Token Check:", token ? "Token Found ✅" : "NO TOKEN FOUND ❌");
      // If token exists, attach it to the header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error attaching token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (Optional: Handle 401 Unauth)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      console.log(error);
      console.log("Session expired. Logging out...");
      
      // Clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userInfo');
      
      // Note: Redirecting to login from here in React Native is tricky 
      // without passing the router. Usually, the UI handles the missing token state.
    }
    return Promise.reject(error);
  }
);

export default client;