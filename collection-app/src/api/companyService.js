import api from './api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createCompanyService = async (payload) => {
  const response = await api.post('/companies/create', payload); 
  return response.data;
};


// export const getDashboardStatsService = async () => {
//   const response = await api.get('/capital/dashboard-stats');
//   return response.data;
// };

// REMOVED: getDashboardStatsService 
// Reason: It was incorrect here and correct in capitalService.js.
// Keeping files separate and single-responsibility.

// 🟢 NEW: Payment Mode Services
export const getPaymentModesService = async () => {
  const companyId = await AsyncStorage.getItem('activeCompanyId');
  if (!companyId) throw new Error("No Company Selected");
  
  const response = await api.get(`/companies/${companyId}/payment-modes`);
  return response.data;
};

export const addPaymentModeService = async (payload) => {
  const companyId = await AsyncStorage.getItem('activeCompanyId');
  if (!companyId) throw new Error("No Company Selected");
  const response = await api.post(`/companies/${companyId}/payment-modes`, payload);
  return response.data;
};

export const updatePaymentModeService = async (modeId, payload) => {
  const companyId = await AsyncStorage.getItem('activeCompanyId');
  if (!companyId) throw new Error("No Company Selected");
  const response = await api.put(`/companies/${companyId}/payment-modes/${modeId}`, payload);
  return response.data;
};

export const deletePaymentModeService = async (modeId) => {
  const companyId = await AsyncStorage.getItem('activeCompanyId');
  if (!companyId) throw new Error("No Company Selected");

  const response = await api.delete(`/companies/${companyId}/payment-modes/${modeId}`);
  return response.data;
};

