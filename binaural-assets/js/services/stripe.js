/**
 * Stripe Client Integration
 * Handles all client-side Stripe operations
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Stripe Configuration
export const STRIPE_CONFIG = {
    publishableKey: 'pk_test_51SQvm31b7ezAwuLWfK6L34HkCZUbr2x9DiN4erq1zD8NnPYhhFASzw2xFEfrxL4QKWX2p7lIS8bgapZZEiKrNZSb00NbmT6Ik9',
    prices: {
        monthly: {
            id: 'price_1SoKAv1b7ezAwuLWp87OwigM',
            amount: 9.99,
            interval: 'month',
            name: 'Monthly Premium'
        },
        yearly: {
            id: 'price_1SoKDZ1b7ezAwuLW76RSrVFw',
            amount: 79,
            interval: 'year',
            name: 'Yearly Premium',
            savings: '17% off'
        },
        lifetime: {
            id: 'price_1SoKEV1b7ezAwuLWiFjCeYaa',
            amount: 199,
            interval: 'one-time',
            name: 'Lifetime Access'
        }
    }
};

/**
 * Create Stripe checkout session and redirect
 */
export async function createCheckout(priceId, couponCode = null) {
    try {
        const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

        const result = await createCheckoutSession({
            priceId,
            couponCode: couponCode || null,
            successUrl: `${window.location.origin}?payment=success`,
            cancelUrl: `${window.location.origin}?payment=canceled`
        });

        // Redirect to Stripe Checkout
        if (result.data.url) {
            window.location.href = result.data.url;
        } else {
            throw new Error('No checkout URL returned');
        }
    } catch (error) {
        console.error('[Stripe] Checkout error:', error);
        throw error;
    }
}

/**
 * Open Stripe Customer Portal
 * For managing subscriptions (cancel, update payment, etc)
 */
export async function openCustomerPortal() {
    try {
        const createPortalSession = httpsCallable(functions, 'createPortalSession');

        const result = await createPortalSession({
            returnUrl: window.location.href
        });

        if (result.data.url) {
            window.location.href = result.data.url;
        }
    } catch (error) {
        console.error('[Stripe] Portal error:', error);
        throw error;
    }
}

/**
 * Validate coupon code
 * Shows discount preview before checkout
 */
export async function validateCoupon(code) {
    try {
        const validateCouponFn = httpsCallable(functions, 'validateCoupon');
        const result = await validateCouponFn({ code });
        return result.data;
    } catch (error) {
        console.error('[Stripe] Coupon validation error:', error);
        return { valid: false, error: error.message };
    }
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(userId) {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const db = getFirestore();

    try {
        const subDoc = await getDoc(doc(db, 'subscriptions', userId));

        if (!subDoc.exists()) {
            return { plan: 'free', status: 'free' };
        }

        const data = subDoc.data();

        // Check expiration for non-lifetime plans
        if (data.currentPeriodEnd && data.plan !== 'lifetime') {
            const expiryDate = data.currentPeriodEnd.toDate();
            if (expiryDate < new Date()) {
                return { plan: 'free', status: 'expired' };
            }
        }

        return {
            plan: data.plan || 'free',
            status: data.status || 'active',
            expiresAt: data.currentPeriodEnd ? data.currentPeriodEnd.toDate() : null,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd || false
        };
    } catch (error) {
        console.error('[Stripe] Get subscription error:', error);
        return { plan: 'free', status: 'error' };
    }
}

/**
 * Check if user has premium access
 */
export async function isPremiumUser(userId) {
    const subscription = await getSubscriptionStatus(userId);
    return subscription.plan !== 'free' && subscription.status === 'active';
}

/**
 * Calculate discounted price
 */
export function calculateDiscount(price, couponValue) {
    const discount = (price * couponValue) / 100;
    return {
        original: price,
        discount,
        final: price - discount,
        savings: couponValue
    };
}

/**
 * Format price for display
 */
export function formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
