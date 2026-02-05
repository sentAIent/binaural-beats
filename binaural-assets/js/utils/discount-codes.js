/**
 * Discount Code System
 * Manages coupon codes for beta testers, friends/family, and employees
 */

// Discount tiers and their codes
export const DISCOUNT_CODES = {
    // 10% Off - Beta Testers
    'BETA10': { discount: 10, type: 'beta', description: 'Beta Tester' },
    'EARLYBIRD': { discount: 10, type: 'beta', description: 'Early Access' },

    // 20% Off - Extended Beta / Supporters
    'BETA20': { discount: 20, type: 'supporter', description: 'Beta Supporter' },
    'FRIEND20': { discount: 20, type: 'friend', description: 'Friend Discount' },

    // 50% Off - Close Friends & Family
    'FAMILY50': { discount: 50, type: 'family', description: 'Friends & Family' },
    'VIP50': { discount: 50, type: 'vip', description: 'VIP Access' },

    // 100% Off - Employees & Core Team
    'TEAM100': { discount: 100, type: 'employee', description: 'Team Member' },
    'STAFF': { discount: 100, type: 'employee', description: 'Staff' },
    'FOUNDER': { discount: 100, type: 'employee', description: 'Founder Circle' }
};

/**
 * Validate discount code
 * @param {string} code - Coupon code to validate
 * @returns {Object|null} - Discount details or null if invalid
 */
export function validateDiscountCode(code) {
    const upperCode = code.trim().toUpperCase();

    if (DISCOUNT_CODES[upperCode]) {
        return {
            code: upperCode,
            ...DISCOUNT_CODES[upperCode]
        };
    }

    return null;
}

/**
 * Calculate discounted price
 * @param {number} originalPrice - Original price
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {number} - Discounted price
 */
export function calculateDiscountedPrice(originalPrice, discountPercent) {
    if (discountPercent >= 100) return 0;
    if (discountPercent <= 0) return originalPrice;

    const discount = (originalPrice * discountPercent) / 100;
    return originalPrice - discount;
}

/**
 * Format discount display
 * @param {number} discountPercent - Discount percentage
 * @returns {string} - Formatted discount text
 */
export function formatDiscount(discountPercent) {
    if (discountPercent >= 100) return 'FREE';
    return `-${discountPercent}%`;
}

/**
 * Get discount badge color
 * @param {number} discountPercent - Discount percentage
 * @returns {string} - Color class or style
 */
export function getDiscountBadgeColor(discountPercent) {
    if (discountPercent >= 100) return '#10b981'; // green
    if (discountPercent >= 50) return '#f59e0b'; // amber
    if (discountPercent >= 20) return '#60a9ff'; // blue
    return '#8b5cf6'; // purple
}

/**
 * Store applied discount code
 * @param {string} code - Coupon code
 */
export function storeDiscountCode(code) {
    localStorage.setItem('mindwave_discount_code', code);
    localStorage.setItem('mindwave_discount_applied_at', Date.now().toString());
}

/**
 * Get stored discount code
 * @returns {string|null} - Stored code or null
 */
export function getStoredDiscountCode() {
    const code = localStorage.getItem('mindwave_discount_code');
    const appliedAt = localStorage.getItem('mindwave_discount_applied_at');

    // Discount codes expire after 30 days
    if (code && appliedAt) {
        const daysSinceApplied = (Date.now() - parseInt(appliedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceApplied < 30) {
            return code;
        }
    }

    return null;
}

/**
 * Clear stored discount code
 */
export function clearDiscountCode() {
    localStorage.removeItem('mindwave_discount_code');
    localStorage.removeItem('mindwave_discount_applied_at');
}

/**
 * Generate Stripe coupon code parameter
 * Note: Codes must be created in Stripe Dashboard first
 * @param {string} code - Discount code
 * @returns {string} - URL parameter for Stripe
 */
export function getStripeCouponParam(code) {
    const discount = validateDiscountCode(code);
    if (!discount) return '';

    // Map our codes to Stripe coupon IDs
    // In Stripe Dashboard, create coupons with IDs matching our codes
    return `&discounts[0][coupon]=${encodeURIComponent(code)}`;
}

/**
 * Track discount code usage
 * @param {string} code - Applied code
 * @param {string} tier - Pricing tier
 */
export function trackDiscountUsage(code, tier) {
    if (window.trackFeatureUse) {
        window.trackFeatureUse('discount_applied', `${code}_${tier}`);
    }

    // Store in Firestore for analytics
    const { getAuth } = require('firebase/auth');
    const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

    try {
        const auth = getAuth();
        const db = getFirestore();

        addDoc(collection(db, 'discount_usage'), {
            code: code,
            tier: tier,
            userId: auth.currentUser?.uid || 'anonymous',
            userEmail: auth.currentUser?.email || null,
            appliedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('[Discount] Failed to track usage:', error);
    }
}
