/**
 * Validation result type
 */
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validate email format
 * 
 * @param email - Email string to validate
 * @returns ValidationResult
 * 
 * @example
 * validateEmail('user@example.com') // { isValid: true }
 * validateEmail('invalid-email') // { isValid: false, error: 'Invalid email format' }
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim() === '') {
        return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
}

/**
 * Validate password strength
 * 
 * @param password - Password string to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns ValidationResult
 * 
 * @example
 * validatePassword('weak') // { isValid: false, error: 'Password must be at least 8 characters' }
 * validatePassword('StrongPass123!') // { isValid: true }
 */
export function validatePassword(password: string, minLength: number = 8): ValidationResult {
    if (!password || password.trim() === '') {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < minLength) {
        return { isValid: false, error: `Password must be at least ${minLength} characters` };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }

    return { isValid: true };
}

/**
 * Validate required field
 * 
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult
 */
export function validateRequired(value: unknown, fieldName: string = 'Field'): ValidationResult {
    if (value === null || value === undefined) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (typeof value === 'string' && value.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
}

/**
 * Validate positive number
 * 
 * @param value - Number to validate
 * @param fieldName - Name of the field for error message
 * @param allowZero - Whether to allow zero (default: true)
 * @returns ValidationResult
 */
export function validatePositiveNumber(
    value: number,
    fieldName: string = 'Value',
    allowZero: boolean = true
): ValidationResult {
    if (isNaN(value)) {
        return { isValid: false, error: `${fieldName} must be a valid number` };
    }

    if (allowZero) {
        if (value < 0) {
            return { isValid: false, error: `${fieldName} must be 0 or greater` };
        }
    } else {
        if (value <= 0) {
            return { isValid: false, error: `${fieldName} must be greater than 0` };
        }
    }

    return { isValid: true };
}

/**
 * Validate stock level against reorder point
 * 
 * @param currentStock - Current stock level
 * @param reorderPoint - Reorder point threshold
 * @returns ValidationResult with warning if stock is low
 */
export function validateStockLevel(
    currentStock: number,
    reorderPoint: number
): ValidationResult & { warning?: string } {
    const positiveStockResult = validatePositiveNumber(currentStock, 'Current stock');
    if (!positiveStockResult.isValid) {
        return positiveStockResult;
    }

    const positiveReorderResult = validatePositiveNumber(reorderPoint, 'Reorder point');
    if (!positiveReorderResult.isValid) {
        return positiveReorderResult;
    }

    if (currentStock <= reorderPoint) {
        return {
            isValid: true,
            warning: `Stock is at or below reorder point (${reorderPoint})`
        };
    }

    return { isValid: true };
}

/**
 * Validate max stock level
 * 
 * @param currentStock - Current stock level
 * @param maxStock - Maximum stock capacity
 * @returns ValidationResult
 */
export function validateMaxStock(
    currentStock: number,
    maxStock: number
): ValidationResult & { warning?: string } {
    if (currentStock > maxStock) {
        return {
            isValid: true,
            warning: `Current stock exceeds maximum capacity (${maxStock})`
        };
    }

    return { isValid: true };
}

/**
 * Validate supplier reliability score
 * 
 * @param score - Reliability score (0-100)
 * @returns ValidationResult
 */
export function validateReliabilityScore(score: number): ValidationResult {
    if (isNaN(score)) {
        return { isValid: false, error: 'Reliability score must be a number' };
    }

    if (score < 0 || score > 100) {
        return { isValid: false, error: 'Reliability score must be between 0 and 100' };
    }

    return { isValid: true };
}

/**
 * Validate lead time
 * 
 * @param days - Lead time in days
 * @returns ValidationResult
 */
export function validateLeadTime(days: number): ValidationResult {
    if (isNaN(days)) {
        return { isValid: false, error: 'Lead time must be a number' };
    }

    if (!Number.isInteger(days)) {
        return { isValid: false, error: 'Lead time must be a whole number' };
    }

    if (days < 0) {
        return { isValid: false, error: 'Lead time cannot be negative' };
    }

    if (days > 365) {
        return { isValid: false, error: 'Lead time cannot exceed 365 days' };
    }

    return { isValid: true };
}

/**
 * Validate date is in the future
 * 
 * @param date - Date to validate
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult
 */
export function validateFutureDate(
    date: Date | string,
    fieldName: string = 'Date'
): ValidationResult {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return { isValid: false, error: `${fieldName} is not a valid date` };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj < today) {
        return { isValid: false, error: `${fieldName} must be in the future` };
    }

    return { isValid: true };
}

/**
 * Validate multiple fields at once
 * 
 * @param validations - Array of validation results with field names
 * @returns Object with overall validity and field-specific errors
 * 
 * @example
 * const result = validateAll([
 *   { field: 'email', result: validateEmail(email) },
 *   { field: 'password', result: validatePassword(password) },
 * ]);
 */
export function validateAll(
    validations: Array<{ field: string; result: ValidationResult }>
): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const { field, result } of validations) {
        if (!result.isValid && result.error) {
            errors[field] = result.error;
            isValid = false;
        }
    }

    return { isValid, errors };
}
