/**
 * Format a number as currency
 * 
 * @param value - The number to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 */
export function formatCurrency(
    value: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format a number with commas
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.567, 2) // "1,234.57"
 */
export function formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format a number as a percentage
 * 
 * @param value - The number to format (0-1 or 0-100)
 * @param isDecimal - Whether value is decimal (0-1) or percentage (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(0.756, true) // "75.6%"
 * formatPercentage(75.6, false) // "75.6%"
 */
export function formatPercentage(
    value: number,
    isDecimal: boolean = false,
    decimals: number = 1
): string {
    const percentValue = isDecimal ? value * 100 : value;
    return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Format a date to a readable string
 * 
 * @param date - Date to format (Date, string, or timestamp)
 * @param format - Format type: 'short', 'long', 'datetime', 'time', 'relative'
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate('2024-01-15', 'long') // "January 15, 2024"
 * formatDate('2024-01-15T14:30:00', 'datetime') // "Jan 15, 2024, 2:30 PM"
 */
export function formatDate(
    date: Date | string | number,
    format: 'short' | 'long' | 'datetime' | 'time' | 'relative' = 'short',
    locale: string = 'en-US'
): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    switch (format) {
        case 'short':
            return dateObj.toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

        case 'long':
            return dateObj.toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });

        case 'datetime':
            return dateObj.toLocaleString(locale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });

        case 'time':
            return dateObj.toLocaleTimeString(locale, {
                hour: 'numeric',
                minute: '2-digit',
            });

        case 'relative':
            return formatRelativeTime(dateObj);

        default:
            return dateObj.toLocaleDateString(locale);
    }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * 
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
        return formatDate(dateObj, 'short');
    }
}

/**
 * Format stock quantity with units
 * 
 * @param quantity - The quantity value
 * @param unit - Unit label (default: 'units')
 * @returns Formatted quantity string
 * 
 * @example
 * formatQuantity(1500) // "1,500 units"
 * formatQuantity(1500, 'kg') // "1,500 kg"
 */
export function formatQuantity(quantity: number, unit: string = 'units'): string {
    return `${formatNumber(quantity)} ${unit}`;
}

/**
 * Format lead time in days
 * 
 * @param days - Number of days
 * @returns Formatted lead time string
 * 
 * @example
 * formatLeadTime(1) // "1 day"
 * formatLeadTime(14) // "14 days"
 */
export function formatLeadTime(days: number): string {
    if (days === 1) {
        return '1 day';
    }
    return `${days} days`;
}

/**
 * Truncate text with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 * 
 * @example
 * truncateText('Long product name here', 15) // "Long product..."
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format file size
 * 
 * @param bytes - Size in bytes
 * @returns Formatted file size string
 * 
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
