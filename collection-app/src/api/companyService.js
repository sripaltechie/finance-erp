import client from './client'; 

export const createCompanyService = async (payload) => {
  // Middleware automatically adds Token here
  const response = await client.post('/companies/create', payload); 
  console.log("data1",response.data);
  // Middleware automatically checks for 401 errors here
  return response.data;
};

export const getDashboardStatsService = async () => {
  const response = await client.get('/capital/dashboard-stats');
  return response.data;
};
