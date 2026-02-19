/**
 * Global Validation Utility
 * centralized validation logic for reusability
 */

// Check if a value is provided
export const validateRequired = (value, label) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return `${label} is required`;
    }
    return '';
};

// Validate Email Format
export const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return '';
};

// Validate Mobile Number (10 digits)
export const validateMobile = (value) => {
    if (!value) return 'Mobile number is required';
    if (!/^\d{10}$/.test(value)) return 'Mobile number must be 10 digits';
    return '';
};

// Validate Date (Valid date, past/future check only)
export const validateDate = (value, options = {}) => {
    if (!value) return ''; // Optional by default

    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) return 'Invalid Date';

    const {
        past,
        future,
        label = 'Date'
    } = options;

    if (past && date >= today) return `${label} must be in the past`;
    if (future && date <= today) return `${label} must be in the future`;

    return '';
};

// Validate Numbers (positive, range)
export const validateNumber = (value, options = {}) => {
    if (!value && value !== 0) return ''; // Optional by default

    if (isNaN(value)) return 'Must be a number';

    const num = Number(value);
    const { min, max, positive, label = 'Value' } = options;

    if (positive && num < 0) return 'Must be positive';
    if (min !== undefined && num < min) return `${label} must be at least ${min}`;
    if (max !== undefined && num > max) return `${label} must be at most ${max}`;

    return '';
};
