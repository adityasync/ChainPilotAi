/**
 * Application-wide constants
 */

// Risk levels for inventory
export const RISK_LEVELS = {
    NORMAL: 'Normal',
    LOW: 'Low Risk',
    MEDIUM: 'Medium Risk',
    HIGH: 'High Risk',
    CRITICAL: 'Critical',
} as const;

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

// Risk level colors for UI
export const RISK_COLORS = {
    [RISK_LEVELS.NORMAL]: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        hex: '#10B981',
    },
    [RISK_LEVELS.LOW]: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        hex: '#3B82F6',
    },
    [RISK_LEVELS.MEDIUM]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        hex: '#F59E0B',
    },
    [RISK_LEVELS.HIGH]: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        hex: '#F97316',
    },
    [RISK_LEVELS.CRITICAL]: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        hex: '#EF4444',
    },
} as const;

// Insight severity levels
export const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
} as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[keyof typeof SEVERITY_LEVELS];

// Severity colors for insights
export const SEVERITY_COLORS = {
    [SEVERITY_LEVELS.LOW]: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        hex: '#3B82F6',
    },
    [SEVERITY_LEVELS.MEDIUM]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        hex: '#F59E0B',
    },
    [SEVERITY_LEVELS.HIGH]: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        hex: '#F97316',
    },
    [SEVERITY_LEVELS.CRITICAL]: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        hex: '#EF4444',
    },
} as const;

// Insight status values
export const INSIGHT_STATUS = {
    NEW: 'new',
    ACKNOWLEDGED: 'acknowledged',
    RESOLVED: 'resolved',
} as const;

export type InsightStatus = typeof INSIGHT_STATUS[keyof typeof INSIGHT_STATUS];

// Stock status values
export const STOCK_STATUS = {
    HEALTHY: 'healthy',
    LOW: 'low',
    CRITICAL: 'critical',
    OVERSTOCK: 'overstock',
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

// Stock status colors
export const STOCK_STATUS_COLORS = {
    [STOCK_STATUS.HEALTHY]: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        hex: '#10B981',
    },
    [STOCK_STATUS.LOW]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        hex: '#F59E0B',
    },
    [STOCK_STATUS.CRITICAL]: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        hex: '#EF4444',
    },
    [STOCK_STATUS.OVERSTOCK]: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        hex: '#8B5CF6',
    },
} as const;

// Product categories
export const PRODUCT_CATEGORIES = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Home & Garden',
    'Health & Beauty',
    'Sports & Outdoors',
    'Automotive',
    'Office Supplies',
    'Raw Materials',
    'Other',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Industry types
export const INDUSTRIES = [
    'Manufacturing',
    'Retail',
    'Wholesale',
    'E-commerce',
    'Healthcare',
    'Food & Beverage',
    'Automotive',
    'Electronics',
    'Logistics',
    'Other',
] as const;

export type Industry = typeof INDUSTRIES[number];

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// API configuration
export const API = {
    BASE_URL: 'http://localhost:8000',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    THEME: 'theme',
    SETTINGS: 'app-settings',
} as const;

// Date formats
export const DATE_FORMATS = {
    API: 'YYYY-MM-DD',
    DISPLAY_SHORT: 'MMM D, YYYY',
    DISPLAY_LONG: 'MMMM D, YYYY',
    DISPLAY_DATETIME: 'MMM D, YYYY h:mm A',
} as const;

// Threshold values for supply chain metrics
export const THRESHOLDS = {
    // Stock thresholds (as percentages of reorder point)
    STOCK_CRITICAL: 0.25, // Below 25% of reorder point
    STOCK_LOW: 0.5, // Below 50% of reorder point

    // Supplier reliability thresholds
    SUPPLIER_RELIABLE: 80, // 80%+ is reliable
    SUPPLIER_RISKY: 60, // Below 60% is risky

    // Lead time thresholds (in days)
    LEAD_TIME_SHORT: 3,
    LEAD_TIME_MEDIUM: 7,
    LEAD_TIME_LONG: 14,

    // Delay probability thresholds
    DELAY_LOW: 0.3, // 30% or below
    DELAY_HIGH: 0.7, // 70% or above
} as const;

// Chart colors for data visualization
export const CHART_COLORS = {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    TERTIARY: '#F59E0B',
    QUATERNARY: '#EF4444',
    QUINARY: '#8B5CF6',
    SENARY: '#EC4899',
    GRID: '#E5E7EB',
    TEXT: '#6B7280',
    BACKGROUND: '#F9FAFB',
} as const;
