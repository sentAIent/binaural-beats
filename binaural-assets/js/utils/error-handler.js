/**
 * Error Handler - Centralized error handling with user-friendly messages
 */

/**
 * Error message mappings
 */
const ERROR_MESSAGES = {
    // Firebase Auth Errors
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/requires-recent-login': 'For security, please sign out and sign in again to make this change.',

    // Firestore Errors
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'The requested item was not found.',
    'already-exists': 'This item already exists.',
    'resource-exhausted': 'You have exceeded the free tier limit. Please upgrade.',

    // Storage Errors
    'storage/unauthorized': 'You don\'t have permission to upload files.',
    'storage/object-not-found': 'File not found.',
    'storage/quota-exceeded': 'Storage quota exceeded. Please upgrade or delete some files.',

    // Generic
    'default': 'Something went wrong. Please try again.'
};

/**
 * Handle error and show user-friendly message
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'Login', 'Save File')
 * @param {Function} showToast - Optional toast function to display error
 * @returns {string} - User-friendly error message
 */
export function handleError(error, context = 'Action', showToast = null) {
    console.error(`[${context}] Error:`, error);

    let userMessage = ERROR_MESSAGES.default;

    // Extract error code from Firebase errors
    if (error.code) {
        const cleanCode = error.code.replace('Firebase: ', '').replace('Error (', '').replace(')', '');
        userMessage = ERROR_MESSAGES[cleanCode] || ERROR_MESSAGES.default;
    }
    // Check error message for known patterns
    else if (error.message) {
        const msg = error.message.toLowerCase();

        for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
            if (msg.includes(key.toLowerCase())) {
                userMessage = value;
                break;
            }
        }
    }

    // Show toast if function provided
    if (showToast && typeof showToast === 'function') {
        showToast(`${context} failed: ${userMessage}`, 'error');
    }

    return userMessage;
}

/**
 * Parse Firebase error to get clean message
 * @param {Error} error - Firebase error
 * @returns {string} - Clean error message
 */
export function parseFirebaseError(error) {
    if (!error) return ERROR_MESSAGES.default;

    // Remove "Firebase:" prefix and "auth/" prefix
    let message = error.message || error.toString();
    message = message.replace(/Firebase:\s*/g, '');
    message = message.replace(/auth\//g, '');
    message = message.replace(/Error \(.*?\)/g, '').trim();

    return message || ERROR_MESSAGES.default;
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{valid: boolean, message: string}}
 */
export function validatePassword(password) {
    if (!password || password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters long.'
        };
    }
    return {
        valid: true,
        message: 'Password is valid.'
    };
}

/**
 * Log error to analytics (placeholder for future implementation)
 * @param {Error} error
 * @param {string} context
 */
export function logErrorToAnalytics(error, context) {
    // TODO: Implement analytics logging
    console.log(`[Analytics] Error in ${context}:`, error.code || error.message);
}

// ✅ FIX Issue #5: Centralized error handling
