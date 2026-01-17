import api from './api'; 

export const createCompanyService = async (payload) => {
  const response = await api.post('/companies/create', payload); 
  return response.data;
};

// REMOVED: getDashboardStatsService 
// Reason: It was incorrect here and correct in capitalService.js.
// Keeping files separate and single-responsibility.