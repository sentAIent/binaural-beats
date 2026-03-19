/**
 * Daily Limit Service
 * Enforces 15-minute listening limit for free users
 */

import { isPremiumUser } from '../services/stripe-simple.js';

const KEY_USAGE = 'mindwave_daily_usage';
const KEY_DATE = 'mindwave_daily_date';
const LIMIT_SECONDS = 15 * 60; // 15 minutes

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
     * Returns true if limit reached (and user is not premium)
     */
    increment(seconds = 1, isPremium = false) {
        // Checking premium status is async, so we assume caller handles that
        // OR we just track everyone and only ENFORCE for free users

        const current = this.getUsage();
        const verifiedNew = current + seconds;
        localStorage.setItem(KEY_USAGE, verifiedNew);

        // If premium, we never return true (limit reached)
        if (isPremium) return false;

        return verifiedNew >= LIMIT_SECONDS;
    },

    /**
     * Check if user has reached limit
     * @returns {Promise<{allowed: boolean, remaining: number}>}
     */
    async checkLimit() {
        // Premium users have no limit
        const isPremium = await isPremiumUser();
        if (isPremium) {
            return { allowed: true, remaining: Infinity };
        }

        const usage = this.getUsage();
        const remaining = Math.max(0, LIMIT_SECONDS - usage);

        return {
            allowed: usage < LIMIT_SECONDS,
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
