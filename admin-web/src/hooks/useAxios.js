import { useState, useCallback } from 'react';

const useAxios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // genericFunction: The service function (e.g., getLoanDetailsService)
  // params: Arguments for that function (e.g., loanId)
  const fetchData = useCallback(async (genericFunction, ...params) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await genericFunction(...params);
      setData(result);
      return result; // Return data for immediate use if needed
    } catch (err) {
      // Extract specific error message from Backend
      const errorMessage = err.response?.data?.message || err.message || "Something went wrong";
      setError(errorMessage);
      throw err; // Re-throw so the component knows it failed
    } finally {
      setLoading(false);
    }
  }, []);

  // resetError allows UI to clear error messages manually
  const resetError = () => setError(null);

  return { loading, error, data, fetchData, resetError };
};

export default useAxios;