import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook that debounces a value
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // This runs 300ms after user stops typing
 *   searchProducts(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook that returns a debounced callback function
 * 
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced callback function
 * 
 * @example
 * const debouncedSave = useDebouncedCallback((value) => {
 *   saveToServer(value);
 * }, 1000);
 * 
 * // Call whenever needed, but actual execution is debounced
 * debouncedSave(newValue);
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number = 500
): (...args: Parameters<T>) => void {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Update callback ref on each render
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay]
    );

    return debouncedCallback;
}

export default useDebounce;
