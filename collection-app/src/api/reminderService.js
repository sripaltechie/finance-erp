import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getRemindersService = async (date = '') => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("No Company Selected");
        
        let url = `/reminders?companyId=${companyId}`;
        if (date) url += `&date=${date}`;
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to fetch reminders";
    }
};

export const updateReminderStatusService = async (id, status) => {
    try {
        const response = await api.put(`/reminders/${id}`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to update reminder";
    }
};