/**
 * Google Analytics 4 Integration
 * Tracks user events and behavior
 */

// Environment variable fallback for static files
const ENV = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = ENV.VITE_GOOGLE_ANALYTICS_ID || null;

/**
 * Initialize Google Analytics
 * Call this once in your main.js
 */
export function initAnalytics() {
    try {
        if (!GA_MEASUREMENT_ID) {
            console.warn('[Analytics] No GA_MEASUREMENT_ID found - analytics disabled');
            return;
        }

        // Load Google Analytics script
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script1);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            send_page_view: true
        });

        console.log('[Analytics] Google Analytics initialized');
    } catch (error) {
        console.warn('[Analytics] Initialization failed:', error);
    }
}

/**
 * Track custom event
 */
export function trackEvent(eventName, eventParams = {}) {
    if (!window.gtag) {
        console.warn('[Analytics] gtag not initialized');
        return;
    }

    window.gtag('event', eventName, eventParams);
    console.log('[Analytics] Event tracked:', eventName, eventParams);
}

/**
 * Track page view
 */
export function trackPageView(pagePath, pageTitle) {
    if (!window.gtag) return;

    window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle
    });
}

/**
 * Track user signup
 */
export function trackSignup(method = 'email') {
    trackEvent('sign_up', {
        method: method
    });
}

/**
 * Track user login
 */
export function trackLogin(method = 'email') {
    trackEvent('login', {
        method: method
    });
}

/**
 * Track checkout initiation
 */
export function trackBeginCheckout(plan, amount) {
    trackEvent('begin_checkout', {
        currency: 'USD',
        value: amount,
        items: [{
            item_id: plan,
            item_name: `${plan} subscription`,
            price: amount,
            quantity: 1
        }]
    });
}

/**
 * Track successful purchase
 */
export function trackPurchase(transactionId, plan, amount) {
    trackEvent('purchase', {
        transaction_id: transactionId,
        value: amount,
        currency: 'USD',
        items: [{
            item_id: plan,
            item_name: `${plan} subscription`,
            price: amount,
            quantity: 1
        }]
    });
}

/**
 * Track feature usage
 */
export function trackFeatureUse(featureName, featureCategory = 'engagement') {
    trackEvent('feature_use', {
        feature_name: featureName,
        feature_category: featureCategory
    });
}

/**
 * Track session start
 */
export function trackSessionStart(presetId, presetName) {
    trackEvent('session_start', {
        preset_id: presetId,
        preset_name: presetName
    });
}

/**
 * Track session end
 */
export function trackSessionEnd(presetId, durationMinutes) {
    trackEvent('session_end', {
        preset_id: presetId,
        session_duration: durationMinutes,
        engagement_time_msec: durationMinutes * 60 * 1000
    });
}

/**
 * Track paywall shown
 */
export function trackPaywallShown(reason, featureType) {
    trackEvent('paywall_shown', {
        reason: reason,
        feature_type: featureType
    });
}

/**
 * Track upgrade click
 */
export function trackUpgradeClick(source, plan) {
    trackEvent('upgrade_click', {
        source: source,
        plan: plan
    });
}

/**
 * Set user properties (call after login)
 */
export function setUserProperties(userId, isPremium = false) {
    if (!window.gtag) return;

    try {
        window.gtag('set', {
            'user_id': userId,
            'user_properties': {
                'premium_status': isPremium ? 'premium' : 'free'
            }
        });
    } catch (error) {
        console.warn('[Analytics] setUserProperties failed:', error);
    }
}
