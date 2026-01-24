import api from './api';

// 1. Client Registration
export const registerClientService = async (userData) => {
  // userData includes plan, price, ownerName, etc.
  const response = await api.post('/auth/client/register', userData);
  return response.data;
};

// 2. Client Login
export const loginClientService = async (credentials) => {
  // credentials: { email, password }
  console.log("response1");
  const response = await api.post('/auth/client/login', credentials);
  console.log("response",response);
  return response.data;
};