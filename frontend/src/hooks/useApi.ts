import { useState, useEffect, useCallback } from 'react';
import type { AxiosError, AxiosResponse } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for making API calls with loading, error, and data states
 * 
 * @param apiFunction - The API function to call (should return a Promise)
 * @param immediate - Whether to call the API immediately on mount (default: true)
 * @param dependencies - Array of dependencies that trigger a refetch
 * @returns Object with data, loading, error, refetch, and reset
 * 
 * @example
 * const { data, loading, error, refetch } = useApi(
 *   () => inventoryAPI.getProducts(),
 *   true,
 *   []
 * );
 */
export function useApi<T>(
  apiFunction: () => Promise<AxiosResponse<T>>,
  immediate: boolean = true,
  dependencies: React.DependencyList = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiFunction();
      setState({
        data: response.data,
        loading: false,
        error: null,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string; error?: { message?: string } }>;
      const errorMessage =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.detail ||
        axiosError.message ||
        'An unexpected error occurred';

      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    ...state,
    refetch: execute,
    reset,
  };
}

/**
 * Hook for making API calls with parameters
 * 
 * @param apiFunction - The API function to call with parameters
 * @returns Object with execute, data, loading, error, and reset
 * 
 * @example
 * const { execute, data, loading } = useApiWithParams(
 *   (id: number) => inventoryAPI.getProductById(id)
 * );
 * 
 * // Later: execute(productId);
 */
export function useApiWithParams<T, P extends unknown[]>(
  apiFunction: (...params: P) => Promise<AxiosResponse<T>>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiFunction(...params);
      setState({
        data: response.data,
        loading: false,
        error: null,
      });
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string; error?: { message?: string } }>;
      const errorMessage =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.detail ||
        axiosError.message ||
        'An unexpected error occurred';

      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw err;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;
