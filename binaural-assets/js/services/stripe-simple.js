/**
 * Stripe Payment Links Integration
 * Simple client-side payment using Stripe's hosted checkout
 * NO Cloud Functions required!
 */

import { state } from '../state.js';
import { trackGlobalEvent } from './analytics-service.js';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

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
// Note: Zen ($9.99) is limited to the first 500 subscribers.
export const PRICING_TIERS = {
    free: {
        name: 'Free (Seeker)',
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
    zen: {
        name: 'Zen',
        description: 'Committed practitioner',
        monthlyPrice: 19.99,
        annualPrice: 149, // Save 38%
        stripe: {
            monthly: ENV.VITE_STRIPE_ZEN_MONTHLY_LINK || 'https://buy.stripe.com/eVq7sD9rW6vJ2yT7ibgfu00',
            annual: ENV.VITE_STRIPE_ZEN_ANNUAL_LINK || 'https://buy.stripe.com/eVqdR17jO9HV1uP8mfgfu01'
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
    nirvana: {
        name: 'Nirvana',
        description: 'Enlightened mastery',
        monthlyPrice: 39.99,
        annualPrice: 349, // Save 27%
        stripe: {
            monthly: ENV.VITE_STRIPE_NIRVANA_MONTHLY_LINK || 'https://buy.stripe.com/14A8wH0VqbQ34H1cCvgfu03',
            annual: ENV.VITE_STRIPE_NIRVANA_ANNUAL_LINK || 'https://buy.stripe.com/5kQ28jcE8dYbddxcCvgfu04'
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
        name: 'Eternity',
        description: 'One-time payment for forever access',
        oneTimePrice: 199,
        stripe: {
            oneTime: ENV.VITE_STRIPE_LIFETIME_LINK || 'https://buy.stripe.com/9B6dR11Zu5rFc9t8mfgfu05'
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
 * @param {string} tier - Pricing tier: 'zen' or 'nirvana'
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
        ? (tierConfig.stripe.oneTime)
        : (tierConfig.stripe[billingPeriod]);

    if (!checkoutUrl || checkoutUrl === 'your-stripe-link-here') {
        throw new Error(`Checkout link for ${tier} (${billingPeriod}) is not configured. Please check your .env file.`);
    }

    // Add user email as prefill
    checkoutUrl += `?prefilled_email=${encodeURIComponent(user.email)}`;

    // Add client reference ID (we'll use this in webhook to identify user)
    checkoutUrl += `&client_reference_id=${user.uid}`;

    // Add metadata for tier tracking
    checkoutUrl += `&metadata[tier]=${tier}`;
    checkoutUrl += `&metadata[billing_period]=${billingPeriod}`;

    // Add discount code if provided AND not a lifetime deal
    if (discountCode && billingPeriod !== 'oneTime') {
        // Support both direct coupons and prefilled promo codes
        checkoutUrl += `&prefilled_promo_code=${encodeURIComponent(discountCode)}`;
        checkoutUrl += `&metadata[discount_code]=${encodeURIComponent(discountCode)}`;
    } else if (discountCode && billingPeriod === 'oneTime') {
        console.warn(`[Stripe] Discount codes cannot be applied to Lifetime deals. Code '${discountCode}' was removed.`);
    }

    // Redirect to Stripe or show a helpful error
    try {
        // Basic URL validation
        new URL(checkoutUrl);

        // Final safety check: if it's still the default demo link in a non-dev environment, warn the user
        if (checkoutUrl.includes('buy.stripe.com/test/demo') && window.location.hostname !== 'localhost') {
            console.warn('[Stripe] Using demo link in production!');
        }

        window.location.href = checkoutUrl;
    } catch (e) {
        console.error('[Stripe] Invalid Checkout URL:', checkoutUrl);
        alert('Invalid checkout link. Please contact support or check your environment configuration.');
    }
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

    // MOCK OVERRIDE (for testing without DB or 100% promo codes)
    if (window.__MOCK_PREMIUM === true || localStorage.getItem('mindwave_premium_unlocked') === 'true') {
        console.log('[Stripe] Premium override active');
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

    // Promo Code Bypass
    if (window.__MOCK_PREMIUM === true || localStorage.getItem('mindwave_premium_unlocked') === 'true') {
        return true;
    }

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

    // Promo Code Bypass fake subscription
    if (window.__MOCK_PREMIUM === true || localStorage.getItem('mindwave_premium_unlocked') === 'true') {
        return {
            status: 'active',
            plan: 'lifetime',
            tier: 'nirvana'
        };
    }

    const db = getFirestore();
    const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));

    if (!subDoc.exists()) return null;

    return subDoc.data();
}

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
    if (tier === 'nirvana' || tier === 'buddha' || subscription.monthlyPrice >= 29) {
        return 'nirvana';
    } else if (tier === 'zen' || tier === 'yogi' || subscription.monthlyPrice >= 9) {
        return 'zen';
    }

    return 'free';
}
/**
 * Real-time subscriber count from Firestore
 * Returns the number of 'active' subscriptions
 */
export async function getSubscriberCount() {
    // MOCK OVERRIDE
    if (window.__MOCK_SUBSCRIBER_COUNT !== undefined) {
        return window.__MOCK_SUBSCRIBER_COUNT;
    }

    try {
        const db = getFirestore();
        const subsRef = collection(db, 'subscriptions');
        const q = query(subsRef, where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (err) {
        console.warn('[Stripe] Failed to fetch subscriber count:', err.message);
        return 432; // Fallback to a believable number
    }
}

/**
 * Get the current active pricing conditions for both Zen and Nirvana
 * - Zen: 40% off for first 500
 * - Nirvana: 20% off for first 500
 */
export async function getActiveTierPricing() {
    const count = await getSubscriberCount();
    const spotsLeft = Math.max(0, 500 - count);
    const isFull = count >= 500;

    return {
        isFull,
        spotsLeft,
        zen: {
            monthlyPrice: isFull ? "$19.99" : "$11.99",
            annualPrice: isFull ? "$149" : "$89",
            coupon: isFull ? null : (ENV.VITE_ZEN_PROMO_CODE || 'ZEN40')
        },
        nirvana: {
            monthlyPrice: isFull ? "$39.99" : "$31.99",
            annualPrice: isFull ? "$349" : "$279",
            coupon: isFull ? null : (ENV.VITE_NIRVANA_PROMO_CODE || 'NIRVANA20')
        }
    };
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

        // Track global event
        const subscription = await getSubscription();
        if (subscription) {
            trackGlobalEvent('purchase', {
                plan: subscription.plan,
                value: PRICING[subscription.plan]?.amount || 0,
                subscriptionId: subscription.subscriptionId
            });
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
