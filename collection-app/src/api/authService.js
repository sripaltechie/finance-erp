import axios from 'axios';
import { API_URL } from '../constants/Config'; // Assuming you have this config

// Create a configured axios instance (Bridge for Mobile)
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const registerClientService = async (payload) => {
  const response = await api.post('/auth/client/register', payload);
  return response.data;
};