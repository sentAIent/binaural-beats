/**
 * Exit Intent Popup
 * Shows a special offer when user tries to leave the page
 * Integrates with A/B testing for variant offers
 */

import { getVariant, trackConversion } from '../utils/ab-testing.js';

const EXIT_INTENT_KEY = 'mindwave_exit_intent_shown';
const SESSION_KEY = 'mindwave_session_id';

let exitIntentShown = false;

export function initExitIntent() {
    // Only on desktop (mouseout doesn't work well on mobile)
    if ('ontouchstart' in window) return;

    // Don't show if already shown this session
    const sessionId = sessionStorage.getItem(SESSION_KEY) || Date.now().toString();
    sessionStorage.setItem(SESSION_KEY, sessionId);

    if (sessionStorage.getItem(`${EXIT_INTENT_KEY}_${sessionId}`)) {
        return;
    }

    // Wait a bit before enabling (don't trigger immediately)
    setTimeout(() => {
        document.addEventListener('mouseout', handleMouseOut);
    }, 10000); // Wait 10 seconds before enabling
}

function handleMouseOut(e) {
    // Only trigger when mouse leaves at the top
    if (e.clientY > 50 || exitIntentShown) return;

    // Don't show if premium user
    if (localStorage.getItem('mindwave_premium') === 'true') return;

    // Don't show if user is logged in and already subscribed
    // (We'll check this client-side for simplicity)

    showExitIntentModal();
    exitIntentShown = true;

    const sessionId = sessionStorage.getItem(SESSION_KEY);
    sessionStorage.setItem(`${EXIT_INTENT_KEY}_${sessionId}`, 'true');

    // Remove listener after showing
    document.removeEventListener('mouseout', handleMouseOut);
}

function showExitIntentModal() {
    // Check if modal already exists
    if (document.getElementById('exitIntentModal')) return;

    // Get A/B variant
    const variant = getVariant('exit_intent_offer');
    console.log('[ExitIntent] Showing variant:', variant);

    // Variant-specific content
    const variantContent = {
        '50_percent': {
            emoji: '🎁',
            title: "Wait! Don't Leave Empty-Handed",
            subtitle: 'Get <span style="color: #10b981; font-weight: 700;">50% off</span> your first month of MindWave Premium',
            badge: '<div style="font-size: 32px; font-weight: 800; color: white;">$4.99</div><div style="font-size: 12px; color: rgba(255,255,255,0.8);"><s>$9.99</s> First Month</div>',
            cta: 'Claim 50% Off Now',
            dismiss: "No thanks, I'll pay full price later"
        },
        '7_day_trial': {
            emoji: '🚀',
            title: 'Try MindWave PRO Free',
            subtitle: 'Get <span style="color: #8b5cf6; font-weight: 700;">7 days free</span> to unlock all brainwave frequencies',
            badge: '<div style="font-size: 32px; font-weight: 800; color: white;">7 Days</div><div style="font-size: 12px; color: rgba(255,255,255,0.8);">Completely Free</div>',
            cta: 'Start Free Trial',
            dismiss: 'Maybe later'
        },
        'countdown': {
            emoji: '⏰',
            title: 'Special Offer Expiring Soon',
            subtitle: 'This deal disappears when the timer hits zero',
            badge: '<div id="exitCountdown" style="font-size: 32px; font-weight: 800; color: white; font-family: monospace;">14:59</div><div style="font-size: 12px; color: rgba(255,255,255,0.8);">Time Remaining</div>',
            cta: 'Claim Before It Expires',
            dismiss: "I don't mind paying more"
        }
    };

    const content = variantContent[variant] || variantContent['50_percent'];
    const borderColor = variant === '7_day_trial' ? '#8b5cf6' : '#10b981';
    const bgGradient = variant === '7_day_trial'
        ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.1), rgba(15, 23, 42, 0.98))'
        : 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.98))';
    const btnColor = variant === '7_day_trial' ? '#8b5cf6' : '#10b981';

    const modal = document.createElement('div');
    modal.id = 'exitIntentModal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.style.cssText = `
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        </style>
        <div style="
            max-width: 480px;
            width: 100%;
            background: ${bgGradient};
            border: 2px solid ${borderColor};
            border-radius: 24px;
            padding: 40px 32px;
            text-align: center;
            animation: slideIn 0.4s ease;
            position: relative;
        ">
            <button id="exitIntentClose" style="
                position: absolute; top: 16px; right: 16px; width: 32px; height: 32px;
                border-radius: 50%; background: rgba(255, 255, 255, 0.1); border: none;
                color: white; font-size: 18px; cursor: pointer; display: flex;
                align-items: center; justify-content: center;
            ">×</button>
            
            <div style="font-size: 64px; margin-bottom: 16px;">${content.emoji}</div>
            <h2 style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 12px;">${content.title}</h2>
            <p style="font-size: 16px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5;">${content.subtitle}</p>
            
            <div style="display: inline-block; background: linear-gradient(135deg, ${btnColor}, ${btnColor}cc); padding: 12px 24px; border-radius: 12px; margin-bottom: 24px;">
                ${content.badge}
            </div>
            
            <div style="text-align: left; background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; color: white; font-size: 14px;">
                    <span style="color: ${btnColor};">✓</span> Unlimited access to all brainwaves
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; color: white; font-size: 14px;">
                    <span style="color: ${btnColor};">✓</span> All 8 premium visualizers
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; color: white; font-size: 14px;">
                    <span style="color: ${btnColor};">✓</span> Cancel anytime, no questions asked
                </div>
            </div>
            
            <button id="exitIntentCta" style="
                width: 100%; padding: 16px; background: ${btnColor}; border: none;
                border-radius: 12px; color: white; font-size: 16px; font-weight: 700;
                cursor: pointer; transition: transform 0.2s; animation: pulse 2s infinite;
            ">${content.cta}</button>
            
            <button id="exitIntentDismiss" style="
                background: none; border: none; color: #64748b; font-size: 13px;
                margin-top: 16px; cursor: pointer;
            ">${content.dismiss}</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Start countdown timer for countdown variant
    if (variant === 'countdown') {
        let seconds = 899; // 14:59
        const countdownEl = modal.querySelector('#exitCountdown');
        const timer = setInterval(() => {
            seconds--;
            if (seconds <= 0) { clearInterval(timer); return; }
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            if (countdownEl) countdownEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    }

    document.body.appendChild(modal);

    // Event Listeners
    modal.querySelector('#exitIntentClose').addEventListener('click', hideExitIntent);
    modal.querySelector('#exitIntentDismiss').addEventListener('click', hideExitIntent);
    modal.querySelector('#exitIntentCta').addEventListener('click', () => {
        // Track conversion for A/B test
        trackConversion('exit_intent_offer', 'cta_click', { variant });

        // Store discount code
        localStorage.setItem('mindwave_discount_code', 'EXIT50');

        // Redirect to pricing modal with discount
        hideExitIntent();

        if (window.showPricingModal) {
            window.showPricingModal();
        }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideExitIntent();
    });

    // Close on Escape
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            hideExitIntent();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function hideExitIntent() {
    const modal = document.getElementById('exitIntentModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}
