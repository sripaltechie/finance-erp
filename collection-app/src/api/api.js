import axios from 'axios';
import { Config } from '../constants/Config'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


// 1. INITIALIZE AXIOS INSTANCE
const API = axios.create({
  baseURL: Config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. REQUEST INTERCEPTOR (Attaches Token to every request)
API.interceptors.request.use(
  async(config) => {
    // In React Native, we use AsyncStorage instead of localStorage
      const userData = await AsyncStorage.getItem('userInfo');
      const staffData = await AsyncStorage.getItem('staff');

      const user = userData ? JSON.parse(userData) : null;
      const staff = staffData ? JSON.parse(staffData) : null;
      // console.log(user);
    const token = user?.token || staff?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR (Handles Token Expiry/Errors)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // console.log(error.response);
    if (error.response && error.response.status === 401) {
      // Optional: Auto-logout logic
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.message || 'Something went wrong');
  }
);

// =====================================================================
// 4. SERVICE FUNCTIONS (Exported for use in React Components)
// =====================================================================

// --- AUTH SERVICES ---
export const registerClientService = (data) => API.post('/auth/client/register', data);
export const loginClientService = (data) => API.post('/auth/client/login', data);

// --- COMPANY / BRANCH SERVICES ---
export const createCompanyService = (data) => API.post('/companies/create', data);
export const getCompaniesService = () => API.get('/companies');
export const addPaymentModeService = (companyId, data) => API.post(`/companies/${companyId}/payment-modes`, data);

// --- STAFF SERVICES ---
export const createStaffService = (data) => API.post('/staff', data); // Check your userRoutes.js for exact path (might be /api/users)
export const getStaffByCompanyService = (companyId) => API.get(`/staff/${companyId}`);

// --- CUSTOMER SERVICES ---
export const createCustomerService = (data) => API.post('/customers', data);
export const getCustomersService = (params) => API.get('/customers', { params });
export const checkConflictService = (data) => API.post('/customers/check-conflict', data);

// --- LOAN SERVICES ---
export const createLoanService = (data) => API.post('/loans/create-advanced', data);
export const getLoanDetailsService = (id) => API.get(`/loans/${id}`);
export const applyPenaltyService = (id, data) => API.post(`/loans/${id}/penalty`, data);
export const addRepaymentService = (id, data) => API.post(`/loans/${id}/repayment`, data);

// --- CAPITAL & DASHBOARD SERVICES ---
export const addCapitalService = (data) => API.post('/capital', data);
export const getDashboardStatsService = (companyId) => {
  // console.log("📡 Requesting Dashboard for URL:", `/capital/dashboard-stats?companyId=${companyId}`);
  return API.get(`/capital/dashboard-stats?companyId=${companyId}`);
};
  // API.get(`/capital/dashboard-stats?companyId=${companyId}`);

export default API;