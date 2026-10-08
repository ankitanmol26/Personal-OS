import { useState, useCallback } from 'react';

export function useApi(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);

  const withApi = useCallback(async (apiCall, errorMessage = "Operation failed.") => {
    try {
      setError(null);
      return await apiCall();
    } catch (err) {
      console.error(err);
      setError(err.message || errorMessage);
      throw err;
    }
  }, []);

  const withApiLoading = useCallback(async (apiCall, errorMessage = "Operation failed.") => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      console.error(err);
      setError(err.message || errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, setLoading, withApi, withApiLoading };
}
