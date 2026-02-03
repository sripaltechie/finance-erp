import api from './api'; 

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