/**
 * Stripe Payment Links Integration
 * Simple client-side payment using Stripe's hosted checkout
 * NO Cloud Functions required!
 */

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Stripe Payment Links - with fallbacks for static file serving
// Note: Files in public/ don't get Vite env processing, so we need fallbacks
const ENV = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const PAYMENT_LINKS = {
    monthly: ENV.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/test/demo',
    yearly: ENV.VITE_STRIPE_YEARLY_LINK || 'https://buy.stripe.com/test/demo'
};

// Stripe Customer Portal (for managing subscriptions)
// Note: You need to enable Customer Portal in Stripe Dashboard → Settings → Billing → Customer portal
export const CUSTOMER_PORTAL_URL = ENV.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/test/demo';

// 3-Tier Pricing Structure: Free → Yogi → Buddha
export const PRICING_TIERS = {
    free: {
        name: 'Seeker',
        description: 'Start your journey',
        monthlyPrice: 0,
        annualPrice: 0,
        features: {
            presets: 3,
            sessionLimit: 15, // minutes
            dailySessions: 1,
            journeyLessons: 2,
            sleepStories: 0,
            visualizer: 'basic',
            customMixes: false,
            analytics: false,
            ads: true,
            offline: false
        }
    },
    yogi: {
        name: 'Yogi',
        description: 'Committed practitioner',
        monthlyPrice: 9.99,
        annualPrice: 79, // Save 33%
        stripe: {
            monthly: ENV.VITE_STRIPE_YOGI_MONTHLY_LINK || 'https://buy.stripe.com/test/demo',
            annual: ENV.VITE_STRIPE_YOGI_ANNUAL_LINK || 'https://buy.stripe.com/test/demo'
        },
        features: {
            presets: 15,
            sessionLimit: null, // unlimited
            dailySessions: null, // unlimited
            journeyLessons: 15,
            sleepStories: 10,
            visualizer: 'advanced',
            customMixes: true,
            analytics: true,
            ads: false,
            offline: true
        }
    },
    buddha: {
        name: 'Buddha',
        description: 'Enlightened mastery',
        monthlyPrice: 29,
        annualPrice: 249, // Save 28%
        stripe: {
            monthly: ENV.VITE_STRIPE_BUDDHA_MONTHLY_LINK || 'https://buy.stripe.com/test/demo',
            annual: ENV.VITE_STRIPE_BUDDHA_ANNUAL_LINK || 'https://buy.stripe.com/test/demo'
        },
        features: {
            presets: null, // all presets (40+)
            sessionLimit: null,
            dailySessions: null,
            journeyLessons: 30,
            sleepStories: 50,
            visualizer: 'premium',
            customMixes: true,
            analytics: true,
            ads: false,
            offline: true,
            aiRecommendations: true,
            breathingExercises: true,
            videoBackgrounds: true,
            prioritySupport: true,
            earlyAccess: true,
            exportMp3: true,
            healthIntegrations: true,
            community: true,
            pricelock: true
        }
    },
    lifetime: {
        name: 'Lifetime',
        description: 'One-time payment for forever access',
        oneTimePrice: 199,
        stripe: {
            oneTime: ENV.VITE_STRIPE_LIFETIME_LINK || 'https://buy.stripe.com/test/demo'
        },
        features: {
            presets: null,
            sessionLimit: null,
            dailySessions: null,
            journeyLessons: null,
            sleepStories: null,
            visualizer: 'premium',
            customMixes: true,
            analytics: true,
            ads: false,
            offline: true,
            aiRecommendations: true,
            breathingExercises: true,
            videoBackgrounds: true,
            prioritySupport: true,
            earlyAccess: true,
            exportMp3: true,
            healthIntegrations: true,
            community: true,
            pricelock: true
        }
    }
};

// Legacy pricing for backwards compatibility
export const PRICING = {
    monthly: { amount: 9.99, interval: 'month', name: 'Monthly Premium' },
    yearly: { amount: 99, interval: 'year', name: 'Yearly Premium', savings: '2 months free' }
};

/**
 * Redirect to Stripe checkout with user metadata
 * @param {string} tier - Pricing tier: 'yogi' or 'buddha'
 * @param {string} billingPeriod - 'monthly' or 'annual'
 * @param {string} discountCode - Optional discount code
 */
export function goToCheckout(tier, billingPeriod = 'monthly', discountCode = null) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Must be logged in to purchase');
    }

    const tierConfig = PRICING_TIERS[tier];
    if (!tierConfig || !tierConfig.stripe) {
        throw new Error(`Invalid tier: ${tier}`);
    }

    const price = billingPeriod === 'oneTime'
        ? tierConfig.oneTimePrice
        : (billingPeriod === 'monthly' ? tierConfig.monthlyPrice : tierConfig.annualPrice);

    // Track checkout initiation
    if (window.trackBeginCheckout) {
        window.trackBeginCheckout(`${tier}_${billingPeriod}`, price);
    }

    // Get Payment Link URL
    let checkoutUrl = billingPeriod === 'oneTime'
        ? tierConfig.stripe.oneTime
        : tierConfig.stripe[billingPeriod];

    // Add user email as prefill
    checkoutUrl += `?prefilled_email=${encodeURIComponent(user.email)}`;

    // Add client reference ID (we'll use this in webhook to identify user)
    checkoutUrl += `&client_reference_id=${user.uid}`;

    // Add metadata for tier tracking
    checkoutUrl += `&metadata[tier]=${tier}`;
    checkoutUrl += `&metadata[billing_period]=${billingPeriod}`;

    // Add discount code if provided
    if (discountCode) {
        // Note: Coupon must exist in Stripe Dashboard with this exact ID
        checkoutUrl += `&discounts[0][coupon]=${encodeURIComponent(discountCode)}`;
        checkoutUrl += `&metadata[discount_code]=${encodeURIComponent(discountCode)}`;
    }

    // Redirect to Stripe
    window.location.href = checkoutUrl;
}

/**
 * Open Stripe Customer Portal
 * Allows users to manage their subscription (cancel, update payment, view invoices)
 */
export function openCustomerPortal() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Must be logged in to access Customer Portal');
    }

    // Redirect to Stripe Customer Portal
    // The portal will handle authentication via the email
    window.location.href = CUSTOMER_PORTAL_URL;
}

/**
 * Check if user has active subscription
 */
export async function isPremiumUser() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return false;

    // MOCK OVERRIDE (for testing without DB)
    if (window.__MOCK_PREMIUM === true) {
        console.log('[Stripe] Mock premium active');
        return true;
    }

    const db = getFirestore();
    const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));

    if (!subDoc.exists()) return false;

    const data = subDoc.data();

    // Check if active
    if (data.status !== 'active') return false;

    // Check expiration for non-lifetime plans
    if (data.plan === 'lifetime') return true;

    if (data.expiresAt) {
        const expiryDate = data.expiresAt.toDate();
        return expiryDate > new Date();
    }

    return false;
}

/**
 * Check if user has purchased the full app (Lifetime)
 */
export async function hasPurchasedApp() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return false;

    const db = getFirestore();
    const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));

    if (!subDoc.exists()) return false;
    const data = subDoc.data();

    return data.status === 'active' && data.plan === 'lifetime';
}

/**
 * Get user's subscription details
 */
export async function getSubscription() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return null;

    const db = getFirestore();
    const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));

    if (!subDoc.exists()) return null;

    return subDoc.data();
}

/**
 * Get user's current pricing tier
 * @returns {string} 'free', 'yogi', or 'buddha'
 */
export async function getUserTier() {
    const isPremium = await isPremiumUser();

    if (!isPremium) {
        return 'free';
    }

    const subscription = await getSubscription();

    if (!subscription) {
        return 'free';
    }

    // Check tier from metadata or plan name
    const tier = subscription.tier || subscription.plan;

    // Map old plans to new tiers
    if (tier === 'buddha' || subscription.monthlyPrice >= 29) {
        return 'buddha';
    } else if (tier === 'yogi' || subscription.monthlyPrice >= 9) {
        return 'yogi';
    }

    return 'free';
}

/**
 * Check if user can access feature based on tier
 * @param {string} featureName - Name of feature to check
 * @returns {boolean}
 */
export async function canAccessFeature(featureName) {
    const userTier = await getUserTier();
    const tierConfig = PRICING_TIERS[userTier];

    if (!tierConfig) return false;

    // Check feature access
    const featureValue = tierConfig.features[featureName];

    // If feature doesn't exist in tier config, allow access
    if (featureValue === undefined) return true;

    // If feature is boolean, return its value
    if (typeof featureValue === 'boolean') return featureValue;

    // If feature is a number (limits), check if non-zero
    if (typeof featureValue === 'number') return featureValue > 0;

    // If feature is null (unlimited), allow access
    if (featureValue === null) return true;

    // Default deny
    return false;
}

/**
 * Listen to subscription changes in real-time
 */
export function subscribeToUserSubscription(callback) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        callback(null);
        return () => { };
    }

    const db = getFirestore();
    return onSnapshot(doc(db, 'subscriptions', user.uid), (doc) => {
        callback(doc.exists() ? doc.data() : null);
    });
}

/**
 * Handle successful payment return
 * Called when user returns from Stripe checkout
 */
export async function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('payment') === 'success') {
        // Show success message
        showSuccessToast();

        // Track purchase completion
        if (window.trackPurchase) {
            const subscription = await getSubscription();
            if (subscription) {
                window.trackPurchase(
                    subscription.subscriptionId,
                    subscription.plan,
                    PRICING[subscription.plan]?.amount || 0
                );
            }
        }

        // Wait a moment, then check subscription status
        setTimeout(async () => {
            const isPremium = await isPremiumUser();
            if (isPremium) {
                // Refresh UI to show premium features
                window.location.reload();
            }
        }, 2000);

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }
}

function showSuccessToast() {
    // Use your existing toast system
    if (window.showToast) {
        window.showToast('Welcome to Premium! 🎉', 'success');
    } else {
        alert('Payment successful! Welcome to Premium!');
    }
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
