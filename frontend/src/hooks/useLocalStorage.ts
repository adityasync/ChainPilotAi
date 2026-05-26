import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for syncing state with localStorage
 * 
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 * 
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 * 
 * // Value persists across page refreshes
 * setTheme('dark');
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    // Get initial value from localStorage or use provided initial value
    const readValue = useCallback((): T => {
        // Prevent SSR issues
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [initialValue, key]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Update localStorage when state changes
    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                // Allow value to be a function (like useState)
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Save to state
                setStoredValue(valueToStore);

                // Save to localStorage
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    // Remove value from localStorage
    const removeValue = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Listen for changes in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(event.newValue) as T);
                } catch (error) {
                    console.warn(`Error parsing localStorage change for "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing settings object in localStorage
 * 
 * @param key - The localStorage key
 * @param defaultSettings - Default settings object
 * @returns Object with current settings and update functions
 * 
 * @example
 * const { settings, updateSetting, resetSettings } = useLocalStorageSettings(
 *   'app-settings',
 *   { theme: 'light', pageSize: 10, notifications: true }
 * );
 */
export function useLocalStorageSettings<T extends Record<string, unknown>>(
    key: string,
    defaultSettings: T
) {
    const [settings, setSettings, removeSettings] = useLocalStorage<T>(key, defaultSettings);

    const updateSetting = useCallback(
        <K extends keyof T>(settingKey: K, value: T[K]) => {
            setSettings(prev => ({
                ...prev,
                [settingKey]: value,
            }));
        },
        [setSettings]
    );

    const updateSettings = useCallback(
        (updates: Partial<T>) => {
            setSettings(prev => ({
                ...prev,
                ...updates,
            }));
        },
        [setSettings]
    );

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, [setSettings, defaultSettings]);

    return {
        settings,
        updateSetting,
        updateSettings,
        resetSettings,
        clearSettings: removeSettings,
    };
}

export default useLocalStorage;
