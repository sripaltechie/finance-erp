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