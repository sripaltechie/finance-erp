import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getDashboardStatsService = async () => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("No Company Selected");
        
        const response = await api.get(`/capital/dashboard-stats?companyId=${companyId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to fetch dashboard stats";
    }
};