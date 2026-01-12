import api from './api'; // Importing existing centralized api instance

// Create a new loan (LoanOrigination)
export const createLoanService = async (loanData) => {
  const response = await api.post('/loans/create-advanced', loanData);
  return response.data;
};

// Get Loan Details (LoanDetails)
export const getLoanDetailsService = async (id) => {
  const response = await api.get(`/loans/${id}`);
  return response.data;
};

// Apply Penalty (LoanDetails)
export const applyPenaltyService = async (id, penaltyData) => {
  // penaltyData should be { amount: 500, reason: "Overdue" }
  const response = await api.post(`/loans/${id}/penalty`, penaltyData);
  return response.data;
};


// 3. 🟢 NEW: Add Repayment (Collection)
export const addRepaymentService = async (id, paymentData) => {
  // paymentData: { amount: 200, type: 'Cash' }
  const response = await api.post(`/loans/${id}/repayment`, paymentData);
  return response.data;
};