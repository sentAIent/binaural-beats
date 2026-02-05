/**
 * Paywall System
 * Controls access to premium features
 */

import { isPremiumUser } from '../services/stripe-simple.js';
import { getAuth } from 'firebase/auth';

// Free tier limits
const FREE_TIER = {
    // Only Delta (Sleep) and Beta (Focus) are free
    freePresets: ['delta', 'beta'],
    maxPresets: 2,
    maxJourneyLessons: 1, // Only lesson 1 is free
    canExport: false,
    canUseAdvancedFeatures: false
};

/**
 * Check if user can access a feature
 */
export async function canAccessFeature(featureType, featureId) {
    // ✅ FIX: Check if Firebase is initialized first to prevent race condition
    let auth;
    try {
        const firebaseModule = await import('../services/firebase.js');
        auth = firebaseModule.auth;

        // If auth not initialized yet, wait a bit
        if (!auth) {
            console.warn('[Paywall] Firebase not initialized yet, allowing access temporarily');
            return { allowed: true }; // Fail open during initialization
        }
    } catch (e) {
        console.warn('[Paywall] Could not load Firebase, allowing access:', e);
        return { allowed: true }; // Fail open if Firebase has issues
    }

    if (!auth.currentUser) {
        // Not logged in - show auth modal
        return { allowed: false, reason: 'not_logged_in' };
    }

    const isPremium = await isPremiumUser();

    if (isPremium) {
        // Premium users get everything
        return { allowed: true };
    }

    // Check free tier limits
    switch (featureType) {
        case 'preset':
            // featureId is the preset code (e.g., 'alpha', 'theta')
            if (FREE_TIER.freePresets.includes(featureId)) {
                return { allowed: true };
            }
            return { allowed: false, reason: 'premium_preset' };

        case 'journey_lesson':
            const lessonNumber = parseInt(featureId);
            if (lessonNumber <= FREE_TIER.maxJourneyLessons) {
                return { allowed: true };
            }
            return { allowed: false, reason: 'premium_lesson' };

        case 'export':
            return { allowed: false, reason: 'premium_feature' };

        case 'advanced':
            return { allowed: false, reason: 'premium_feature' };

        default:
            return { allowed: true };
    }
}

/**
 * Show upgrade modal when hitting paywall
 */
export function showUpgradePrompt(reason, onContinue = null) {
    // Track paywall shown
    if (window.trackPaywallShown) {
        window.trackPaywallShown(reason, reason);
    }

    const messages = {
        'premium_preset': {
            title: '🔒 Unlock Founders Club',
            description: 'This wave is reserved for Founders Club members. Join the first 500 to lock in $9.99/mo forever.',
            cta: 'Join & Unlock'
        },
        'premium_lesson': {
            title: '🧘 Continue Your Journey',
            description: 'Unlock the full 30-day program with the Founders Club.',
            cta: 'Join & Unlock'
        },
        'premium_feature': {
            title: '✨ Premium Feature',
            description: 'Upgrade to the Founders Club to access advanced tools.',
            cta: 'Go Premium'
        },
        'not_logged_in': {
            title: '🔐 Sign In Required',
            description: 'Create a free account to get started.',
            cta: 'Sign In'
        }
    };

    const message = messages[reason] || messages['premium_feature'];

    // Create upgrade modal if not exists
    let modal = document.getElementById('upgradePromptModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'upgradePromptModal';
        modal.className = 'fixed inset-0 flex items-center justify-center p-4 hidden';
        modal.style.background = 'rgba(0, 0, 0, 0.9)';
        modal.style.backdropFilter = 'blur(20px)';
        modal.style.zIndex = '1000'; // ✅ FIX: Use inline style to ensure proper z-index above footer

        modal.innerHTML = `
      <div style="max-width: 500px; width: 100%; background: linear-gradient(180deg, rgba(25, 25, 40, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 48px 32px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 24px;" id="upgradeIcon">🔒</div>
        <h2 id="upgradeTitle" style="font-size: 32px; font-weight: 700; color: var(--accent); margin-bottom: 16px;">Premium Feature</h2>
        <p id="upgradeDescription" style="font-size: 16px; color: var(--text-muted); margin-bottom: 32px; line-height: 1.6;">Upgrade to unlock this feature.</p>
        
        <div style="display: flex; gap: 12px;">
          <button id="upgradeBtn" style="flex: 1; padding: 16px; background: var(--accent); border: none; border-radius: 12px; color: var(--bg-main); font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
            Upgrade Now
          </button>
          <button id="closeUpgradeBtn" style="flex: 0.5; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: var(--text-muted); font-size: 16px; font-weight: 600; cursor: pointer;">
            Later
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);
    }

    // Store current reason for button handler
    modal.dataset.currentReason = reason;

    // Update content
    const icon = modal.querySelector('#upgradeIcon');
    const title = modal.querySelector('#upgradeTitle');
    const description = modal.querySelector('#upgradeDescription');
    const btn = modal.querySelector('#upgradeBtn');

    icon.textContent = message.title.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨';
    title.textContent = message.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    description.textContent = message.description;
    btn.textContent = message.cta;

    // ✅ SIMPLIFIED FIX: Use onclick properties (naturally overrides previous handlers)
    const upgradeBtn = modal.querySelector('#upgradeBtn');
    const closeBtn = modal.querySelector('#closeUpgradeBtn');

    upgradeBtn.onclick = (e) => {
        console.log('[Paywall] Upgrade button clicked, reason:', modal.dataset.currentReason);
        e.stopPropagation();
        try {
            modal.classList.remove('flex'); // ✅ FIX: Remove flex before adding hidden
            modal.classList.add('hidden');
            // document.body.style.overflow = '';

            const currentReason = modal.dataset.currentReason;
            if (currentReason === 'not_logged_in') {
                console.log('[Paywall] Opening auth modal...');
                if (window.openAuthModal) {
                    window.openAuthModal();
                } else {
                    console.error('[Paywall] window.openAuthModal not found!');
                    alert('Please sign in to continue');
                }
            } else {
                console.log('[Paywall] Opening pricing modal...');
                if (window.showPricingModal) {
                    window.showPricingModal();
                } else {
                    console.error('[Paywall] window.showPricingModal not found!');
                    alert('Premium feature - please upgrade');
                }
            }
        } catch (error) {
            console.error('[Paywall] Error in upgrade button handler:', error);
        }
    };

    closeBtn.onclick = (e) => {
        console.log('[Paywall] Later button clicked');
        e.stopPropagation();
        try {
            modal.classList.remove('flex'); // ✅ FIX: Remove flex before adding hidden
            modal.classList.add('hidden');
            // document.body.style.overflow = '';
        } catch (error) {
            console.error('[Paywall] Error closing upgrade modal:', error);
        }
    };

    // Background click to close
    modal.onclick = (e) => {
        if (e.target === modal) {
            console.log('[Paywall] Background clicked, closing modal');
            e.stopPropagation();
            try {
                modal.classList.remove('flex'); // ✅ FIX: Remove flex before adding hidden
                modal.classList.add('hidden');
                // document.body.style.overflow = '';
            } catch (error) {
                console.error('[Paywall] Error closing modal on background click:', error);
            }
        }
    };

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex'); // ✅ FIX: Add flex when showing
    // document.body.style.overflow = 'hidden'; // FIX: Removed to prevent lock
}

/**
 * Add "Premium" badge to locked content
 */
export function addPremiumBadge(element) {
    if (element.querySelector('.premium-badge')) return; // Already has badge

    const badge = document.createElement('div');
    badge.className = 'premium-badge';
    badge.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: var(--accent);
    color: var(--bg-main);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    z-index: 10;
    pointer-events: none;
  `;
    badge.textContent = 'Premium';

    element.style.position = 'relative';
    element.appendChild(badge);
}

/**
 * Initialize paywall system
 */
export function initPaywall() {
    console.log('[Paywall] Initialized');

    // Expose globally for UI
    window.canAccessFeature = canAccessFeature;
    window.showUpgradePrompt = showUpgradePrompt;
}
