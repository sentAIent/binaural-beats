/**
 * Session Timer for Free Users
 * Limits session duration for non-premium users
 */

import { isPremiumUser } from '../services/stripe-simple.js';

// Configuration
const FREE_SESSION_LIMIT_MINUTES = 30; // 30 minute limit for free users
const WARNING_TIME_MINUTES = 5; // Show warning 5 minutes before limit

let sessionStartTime = null;
let sessionTimer = null;
let warningTimer = null;
let isSessionActive = false;

/**
 * Start session timer for free users
 * Call this when audio/binaural playback starts
 */
export async function startSessionTimer() {
    // Check if user is premium
    const isPremium = await isPremiumUser();

    if (isPremium) {
        console.log('[SessionTimer] Premium user - no time limit');
        return;
    }

    // Don't start multiple timers
    if (isSessionActive) {
        console.log('[SessionTimer] Session already active');
        return;
    }

    sessionStartTime = Date.now();
    isSessionActive = true;

    console.log(`[SessionTimer] Started - ${FREE_SESSION_LIMIT_MINUTES} min limit for free users`);

    // Set warning timer (5 minutes before limit)
    const warningTime = (FREE_SESSION_LIMIT_MINUTES - WARNING_TIME_MINUTES) * 60 * 1000;
    warningTimer = setTimeout(showWarning, warningTime);

    // Set limit timer
    const limitTime = FREE_SESSION_LIMIT_MINUTES * 60 * 1000;
    sessionTimer = setTimeout(endSession, limitTime);
}

/**
 * Stop session timer
 * Call this when audio/binaural playback stops
 */
export function stopSessionTimer() {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }

    if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = null;
    }

    isSessionActive = false;
    sessionStartTime = null;

    console.log('[SessionTimer] Stopped');
}

/**
 * Get remaining session time in minutes
 */
export function getRemainingTime() {
    if (!isSessionActive || !sessionStartTime) {
        return FREE_SESSION_LIMIT_MINUTES;
    }

    const elapsed = (Date.now() - sessionStartTime) / 1000 / 60; // in minutes
    const remaining = Math.max(0, FREE_SESSION_LIMIT_MINUTES - elapsed);

    return Math.round(remaining);
}

/**
 * Check if session has time remaining
 */
export function hasTimeRemaining() {
    return getRemainingTime() > 0;
}

/**
 * Show warning before session limit
 */
function showWarning() {
    console.log('[SessionTimer] Warning - 5 minutes remaining');

    const toast = createToast(
        `⏰ ${WARNING_TIME_MINUTES} minutes remaining in your free session`,
        'warning',
        8000
    );

    document.body.appendChild(toast);

    // Auto-remove toast
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 8000);
}

/**
 * End session when limit is reached
 */
function endSession() {
    console.log('[SessionTimer] Session limit reached');

    isSessionActive = false;

    // Stop audio playback
    if (window.stopBinaural) {
        window.stopBinaural();
    }

    // Show upgrade prompt
    showLimitReachedModal();
}

/**
 * Show modal when session limit is reached
 */
function showLimitReachedModal() {
    const modal = document.createElement('div');
    modal.id = 'sessionLimitModal';
    modal.className = 'fixed inset-0 z-[400] flex items-center justify-center p-4';
    modal.style.background = 'rgba(0, 0, 0, 0.95)';
    modal.style.backdropFilter = 'blur(20px)';

    modal.innerHTML = `
        <div style="max-width: 500px; width: 100%; background: linear-gradient(180deg, rgba(25, 25, 40, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%); border: 2px solid rgba(96, 169, 255, 0.3); border-radius: 24px; padding: 48px 32px; text-align: center;">
            
            <div style="font-size: 64px; margin-bottom: 24px;">⏰</div>
            
            <h2 style="font-size: 32px; font-weight: 700; color: var(--accent); margin-bottom: 16px;">
                Free Session Complete
            </h2>
            
            <p style="font-size: 16px; color: var(--text-muted); margin-bottom: 32px; line-height: 1.6;">
                You've reached the ${FREE_SESSION_LIMIT_MINUTES}-minute limit for free sessions. 
                Upgrade to Premium for unlimited meditation time.
            </p>
            
            <div style="display: flex; gap: 12px; flex-direction: column;">
                <button id="upgradeLimitBtn" style="width: 100%; padding: 16px; background: var(--accent); border: none; border-radius: 12px; color: var(--bg-main); font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                    ✨ Upgrade to Premium
                </button>
                <button id="closeLimitBtn" style="width: 100%; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: var(--text-muted); font-size: 16px; font-weight: 600; cursor: pointer;">
                    Continue Later
                </button>
            </div>
            
            <div style="margin-top: 24px; padding: 16px; background: rgba(96, 169, 255, 0.1); border-radius: 12px; border: 1px solid rgba(96, 169, 255, 0.2);">
                <div style="font-size: 14px; color: var(--accent); font-weight: 600; margin-bottom: 4px;">
                    Premium Benefits:
                </div>
                <div style="font-size: 13px; color: var(--text-muted);">
                    ✓ Unlimited session time • ✓ All premium presets • ✓ All journey lessons
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    const upgradeBtn = modal.querySelector('#upgradeLimitBtn');
    const closeBtn = modal.querySelector('#closeLimitBtn');

    upgradeBtn.addEventListener('click', () => {
        modal.remove();
        if (window.showPricingModal) {
            window.showPricingModal();
        }

        // Track upgrade click
        if (window.trackUpgradeClick) {
            window.trackUpgradeClick('session_limit', 'monthly');
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Hover effects
    upgradeBtn.addEventListener('mouseenter', () => {
        upgradeBtn.style.transform = 'translateY(-2px)';
    });
    upgradeBtn.addEventListener('mouseleave', () => {
        upgradeBtn.style.transform = 'translateY(0)';
    });
}

/**
 * Create toast notification
 */
function createToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');

    const colors = {
        info: 'var(--accent)',
        warning: 'rgba(255, 193, 7, 0.95)',
        error: 'rgba(239, 68, 68, 0.95)',
        success: 'rgba(16, 185, 129, 0.95)'
    };

    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        max-width: 90%;
        text-align: center;
    `;

    toast.textContent = message;

    return toast;
}

/**
 * Display remaining time in UI
 * Call this periodically (every minute) to update UI
 */
export function updateTimeDisplay() {
    const timeDisplay = document.getElementById('sessionTimeRemaining');
    if (!timeDisplay) return;

    if (!isSessionActive) {
        timeDisplay.textContent = '';
        timeDisplay.style.display = 'none';
        return;
    }

    const remaining = getRemainingTime();

    if (remaining <= 0) {
        timeDisplay.textContent = '';
        timeDisplay.style.display = 'none';
        return;
    }

    timeDisplay.style.display = 'block';
    timeDisplay.textContent = `⏱️ ${remaining} min remaining`;

    // Change color when low on time
    if (remaining <= WARNING_TIME_MINUTES) {
        timeDisplay.style.color = '#fbbf24'; // amber warning color
    } else {
        timeDisplay.style.color = 'rgba(255, 255, 255, 0.6)';
    }
}

// Export configuration for external use
export const SESSION_CONFIG = {
    FREE_LIMIT_MINUTES: FREE_SESSION_LIMIT_MINUTES,
    WARNING_TIME_MINUTES: WARNING_TIME_MINUTES
};
