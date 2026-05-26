import { THRESHOLDS, STOCK_STATUS } from './constants';
import type { StockStatus } from './constants';

/**
 * Calculate stock status based on current stock and reorder point
 * 
 * @param currentStock - Current stock level
 * @param reorderPoint - Reorder point threshold
 * @param maxStock - Maximum stock capacity
 * @returns Stock status
 */
export function getStockStatus(
    currentStock: number,
    reorderPoint: number,
    maxStock: number
): StockStatus {
    if (currentStock > maxStock) {
        return STOCK_STATUS.OVERSTOCK;
    }

    if (currentStock <= reorderPoint * THRESHOLDS.STOCK_CRITICAL) {
        return STOCK_STATUS.CRITICAL;
    }

    if (currentStock <= reorderPoint) {
        return STOCK_STATUS.LOW;
    }

    return STOCK_STATUS.HEALTHY;
}

/**
 * Calculate stock percentage relative to max capacity
 * 
 * @param currentStock - Current stock level
 * @param maxStock - Maximum stock capacity
 * @returns Percentage (0-100)
 */
export function getStockPercentage(currentStock: number, maxStock: number): number {
    if (maxStock === 0) return 0;
    return Math.min(100, Math.max(0, (currentStock / maxStock) * 100));
}

/**
 * Calculate supplier reliability status based on score
 * 
 * @param reliabilityScore - Reliability score (0-100)
 * @returns Status string
 */
export function getSupplierStatus(reliabilityScore: number): 'reliable' | 'moderate' | 'risky' {
    if (reliabilityScore >= THRESHOLDS.SUPPLIER_RELIABLE) {
        return 'reliable';
    }
    if (reliabilityScore >= THRESHOLDS.SUPPLIER_RISKY) {
        return 'moderate';
    }
    return 'risky';
}

/**
 * Calculate lead time status based on days
 * 
 * @param days - Lead time in days
 * @returns Status string
 */
export function getLeadTimeStatus(days: number): 'short' | 'medium' | 'long' {
    if (days <= THRESHOLDS.LEAD_TIME_SHORT) {
        return 'short';
    }
    if (days <= THRESHOLDS.LEAD_TIME_MEDIUM) {
        return 'medium';
    }
    return 'long';
}

/**
 * Sort array of objects by a key
 * 
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param direction - Sort direction (asc or desc)
 * @returns Sorted array
 */
export function sortByKey<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T,
    direction: 'asc' | 'desc' = 'asc'
): T[] {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
    });
}

/**
 * Filter array by search term across multiple fields
 * 
 * @param array - Array to filter
 * @param searchTerm - Search term
 * @param fields - Fields to search in
 * @returns Filtered array
 */
export function filterBySearch<T extends Record<string, unknown>>(
    array: T[],
    searchTerm: string,
    fields: (keyof T)[]
): T[] {
    if (!searchTerm.trim()) {
        return array;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return array.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(lowerSearchTerm);
        });
    });
}

/**
 * Group array of objects by a key
 * 
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 */
export function groupBy<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T
): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key] ?? 'undefined');
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

/**
 * Calculate sum of array values by key
 * 
 * @param array - Array to sum
 * @param key - Key to sum by
 * @returns Sum
 */
export function sumByKey<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T
): number {
    return array.reduce((sum, item) => {
        const value = item[key];
        return sum + (typeof value === 'number' ? value : 0);
    }, 0);
}

/**
 * Calculate average of array values by key
 * 
 * @param array - Array to average
 * @param key - Key to average by
 * @returns Average
 */
export function averageByKey<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T
): number {
    if (array.length === 0) return 0;
    return sumByKey(array, key) / array.length;
}

/**
 * Get unique values from array by key
 * 
 * @param array - Array to extract from
 * @param key - Key to extract
 * @returns Array of unique values
 */
export function uniqueByKey<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T
): unknown[] {
    return [...new Set(array.map(item => item[key]))];
}

/**
 * Debounce a function
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Throttle a function
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Deep clone an object
 * 
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two objects are equal (shallow comparison)
 * 
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns Whether objects are equal
 */
export function shallowEqual(obj1: Record<string, unknown>, obj2: Record<string, unknown>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => obj1[key] === obj2[key]);
}

/**
 * Generate a random ID
 * 
 * @param length - Length of ID (default: 8)
 * @returns Random ID string
 */
export function generateId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Sleep for a specified duration
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
