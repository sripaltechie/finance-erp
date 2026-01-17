import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api'; // Using new base

export const getDashboardStatsService = async () => {
  const companyId = await AsyncStorage.getItem('activeCompanyId');
  if (!companyId) throw new Error("No Company Selected");

  const response = await api.get(`/capital/dashboard-stats?companyId=${companyId}`);
  return response.data;
};