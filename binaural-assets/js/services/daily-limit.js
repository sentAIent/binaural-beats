/**
 * Daily Limit Service
 * Enforces listening limits based on user tier (Free = 15m, Yogi = 2h, Pro = Unlimited)
 */

import { getUserTier } from '../services/stripe-simple.js';

const KEY_USAGE = 'mindwave_daily_usage';
const KEY_DATE = 'mindwave_daily_date';

const LIMITS_SECONDS = {
    free: 15 * 60,       // 15 minutes
    zen: 120 * 60,       // 2 hours
    nirvana: Infinity,   // Unlimited
    lifetime: Infinity   // Unlimited
};

export const DailyLimitService = {
    /**
     * Initialize usage tracking
     */
    init() {
        // Check if day changed
        const savedDate = localStorage.getItem(KEY_DATE);
        const today = new Date().toDateString();

        if (savedDate !== today) {
            // New day, reset
            this.resetUsage();
            localStorage.setItem(KEY_DATE, today);
        }
    },

    /**
     * Get current usage in seconds
     */
    getUsage() {
        return parseInt(localStorage.getItem(KEY_USAGE) || '0');
    },

    /**
     * Increment usage by seconds
     * Returns true if limit reached based on provided tier
     */
    increment(seconds = 1, tier = 'free') {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) return false; // Bypass limit on localhost

        const current = this.getUsage();
        const verifiedNew = current + seconds;
        localStorage.setItem(KEY_USAGE, verifiedNew);

        const limit = LIMITS_SECONDS[tier] || LIMITS_SECONDS.free;

        // If unlimited tier, never return true (limit reached)
        if (limit === Infinity) return false;

        return verifiedNew >= limit;
    },

    /**
     * Check if user has reached limit
     * @returns {Promise<{allowed: boolean, remaining: number}>}
     */
    async checkLimit() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
            return { allowed: true, remaining: Infinity };
        }

        const tier = await getUserTier();
        const limit = LIMITS_SECONDS[tier] || LIMITS_SECONDS.free;

        if (limit === Infinity) {
            return { allowed: true, remaining: Infinity };
        }

        const usage = this.getUsage();
        const remaining = Math.max(0, limit - usage);

        return {
            allowed: usage < limit,
            remaining
        };
    },

    /**
     * Reset usage (for testing or new day)
     */
    resetUsage() {
        localStorage.setItem(KEY_USAGE, '0');
    }
};

// Initialize on load
DailyLimitService.init();
