/**
 * Stripe Payment Links Integration
 * Simple client-side payment using Stripe's hosted checkout
 * NO Cloud Functions required!
 */

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Stripe Payment Links (from Stripe Dashboard)
export const PAYMENT_LINKS = {
    monthly: 'https://buy.stripe.com/test_eVq7sD9rW6vJ2yT7ibgfu00',
    yearly: 'https://buy.stripe.com/test_eVqdR17jO9HV1uP8mfgfu01',
    lifetime: 'https://buy.stripe.com/test_cNi5kvcE87zNc9tfOHgfu02'
};

// Stripe Customer Portal (for managing subscriptions)
// Note: You need to enable Customer Portal in Stripe Dashboard → Settings → Billing → Customer portal
export const CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/test_00g3eg8TC6gFfM4bII';

export const PRICING = {
    monthly: { amount: 9.99, interval: 'month', name: 'Monthly Premium' },
    yearly: { amount: 79, interval: 'year', name: 'Yearly Premium', savings: '17% off' },
    lifetime: { amount: 199, interval: 'lifetime', name: 'Lifetime Access' }
};

/**
 * Redirect to Stripe checkout with user metadata
 */
export function goToCheckout(plan, couponCode = null) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Must be logged in to purchase');
    }

    // Build Payment Link URL with prefilled customer email
    let checkoutUrl = PAYMENT_LINKS[plan];

    // Add user email as prefill
    checkoutUrl += `?prefilled_email=${encodeURIComponent(user.email)}`;

    // Add client reference ID (we'll use this in webhook to identify user)
    checkoutUrl += `&client_reference_id=${user.uid}`;

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
