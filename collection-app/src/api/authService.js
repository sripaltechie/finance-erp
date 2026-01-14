import client from './client';
import { Config } from '../constants/Config';

// 1. Create the instance
// const api = axios.create({
//   baseURL: Config.API_URL,
//   headers: { 'Content-Type': 'application/json' },
//   timeout: 10000, // Best practice: stop waiting after 10 seconds
// });

export const registerClientService = async (payload) => {
  try {
    // FIX: Define fullUrl before logging it
    const fullUrl = `${Config.API_URL}/auth/client/register`;
    // console.log("🚀 SENDING REQUEST TO:", fullUrl);
    // console.log("📦 PAYLOAD:", payload);

    const response = await client.post('/auth/client/register', payload);
    
    // Axios successful responses are under 'data'
    return response.data; 

  } catch (error) {
    // Professional Error Logging
    if (error.response) {
      // The server responded with a status code (400, 401, 500, etc.)
      console.error("❌ Backend Error:", error.response.data);
      throw error.response.data; // Pass the real error message to your UI
    } else if (request) {
      // The request was made but no response was received (Network/IP issues)
      console.error("❌ Network Error: No response from server at", API_URL);
      throw new Error("Cannot connect to server. Check your IP/Wi-Fi.");
    } else {
      console.error("❌ Request Setup Error:", error.message);
      throw error;
    }
  }
};

export const loginClientService = async (credentials) => {
  // credentials: { mobile: '...', password: '...' }
  const response = await api.post('/auth/client/login', credentials);
  return response.data;
};