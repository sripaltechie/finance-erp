import API from './api';

// Existing...
export const createCompanyService = (data) => API.post('/companies/create', data);
export const getCompaniesService = () => API.get('/companies');

// 🟢 New Payment Mode Services
export const getPaymentModesService = async (companyId) => {
 const response = await API.get(`/companies/${companyId}/payment-modes`);
 console.log(response);
 return response.data;
}

export const addPaymentModeService = async (companyId, data) => {
    const response = await API.post(`/companies/${companyId}/payment-modes`, data);
return response.data;
}
export const updatePaymentModeService = async (companyId, modeId, data) => {
    const response = await API.put(`/companies/${companyId}/payment-modes/${modeId}`, data);
    return response.data;
}

export const deletePaymentModeService = async (companyId, modeId) => {
   const response = await API.delete(`/companies/${companyId}/payment-modes/${modeId}`);
   return response.data;
}