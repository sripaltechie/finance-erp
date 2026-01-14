import axios from 'axios';

// 1. Create the Instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Change to your prod URL later
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (The Security Guard)
// Automatically attaches the Token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Or from Context/Redux
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Optional: If you need to send companyId explicitly in headers (rare if inside token)
    // config.headers['x-company-id'] = localStorage.getItem('companyId'); 
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (The Error Handler)
// Global error handling (e.g., Token Expired -> Redirect to Login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized
      console.error("Session expired. Redirecting to login...");
      localStorage.removeItem('token');
      window.location.href = '/login'; // Force redirect
    }
    return Promise.reject(error);
  }
);

export default api;