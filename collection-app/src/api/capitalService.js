import AsyncStorage from '@react-native-async-storage/async-storage';
import client from './client';

export const getDashboardStatsService = async () => {
  // 1. Get the selected company ID from storage
  const companyId = await AsyncStorage.getItem('activeCompanyId');
  
  if (!companyId) throw new Error("No Company Selected");

  // 2. Send it as a Query Parameter
  const response = await client.get(`/capital/dashboard-stats?companyId=${companyId}`);
  return response.data;
};