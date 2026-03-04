import api from './api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Existing Collection Service
export const collectPaymentService = async (loanId, payload) => {
    const response = await api.post(`/loans/${loanId}/repayment`, payload);
    return response.data;
};

// 🟢 NEW: Create Advanced Loan (Matches your Backend Controller)
export const createLoanService = async (payload) => {
    // Endpoint: /api/loans/create-advanced
    const response = await api.post('/loans/create-advanced', payload);
    return response.data;
};

export const getLoanDetailsService = async (id) => {
    const response = await api.get(`/loans/${id}`);
    return response.data;
};

// 🟢 NEW: Get Loans by Customer ID (For Android Customer Details)
export const getCustomerLoansService = async (customerId) => {
    const response = await api.get(`/customers/${customerId}/loans`);
    return response.data;
};


// 🟢 NEW: Service to get all defaulters / loans due today
export const getDueTodayService = async () => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("No Company Selected");
        
        const response = await api.get(`/loans/reports/due-today?companyId=${companyId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to fetch due list";
    }
};