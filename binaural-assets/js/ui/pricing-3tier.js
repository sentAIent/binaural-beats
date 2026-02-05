/**
 * Founders Club Pricing Modal (Updated for Professional Tier)
 * Free (Seeker) vs Founders Club ($9.99/mo) vs Professional ($25/mo)
 */

import { goToCheckout, getUserTier } from '../services/stripe-simple.js';
import { getAuth } from 'firebase/auth';

// PRICING CONFIGURATION
// Easily toggle future price increases here
const PRICING_CONFIG = {
    free: {
        limitText: "15 mins / day",
        limitSubtext: "Daily limit",
        price: "$0",
        period: "/forever",
        active: true
    },
    founders: {
        name: "Founders Club",
        price: "$9.99",
        period: "/month",
        productId: "founders_club_monthly",
        description: "Everything unlocked. Forever.",
        warning: "⚠️ Price increases after 500 members",
        limitText: "Unlimited Play",
        active: true,
        // FUTURE: Set to false to hide, or update price to $15.00
    },
    professional: {
        name: "Professional",
        price: "$25.00",
        period: "/month",
        productId: "professional_monthly",
        description: "For coaches & power users",
        limitText: "Unlimited + Priority",
        active: true
    }
};

const TESTIMONIALS = [
    {
        quote: "MindWave completely cured my insomnia. The delta waves are magic.",
        author: "Sarah J.",
        role: "Verified Member"
    },
    {
        quote: "I use the Gamma/Focus mode for deep work. Productivity is through the roof.",
        author: "David K.",
        role: "Software Engineer"
    },
    {
        quote: "Better than Calm or Headspace. The visualizers make it immersive.",
        author: "Michelle R.",
        role: "Creative Director"
    }
];

export async function showPricingModal() {
    // Check if user is logged in
    const auth = getAuth();
    if (!auth.currentUser) {
        // Show auth modal first
        if (window.openAuthModal) {
            window.openAuthModal();
        }
        return;
    }

    // Get user's current tier
    const currentTier = await getUserTier();

    // Create or show pricing modal
    let modal = document.getElementById('pricingModal');

    if (!modal) {
        modal = createPricingModal(currentTier);
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
}

export function hidePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function createPricingModal(currentTier) {
    const modal = document.createElement('div');
    modal.id = 'pricingModal';
    modal.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4 hidden';
    modal.style.background = 'rgba(0, 0, 0, 0.95)';
    modal.style.backdropFilter = 'blur(20px)';

    // Testimonials HTML generator
    const renderTestimonials = () => {
        return TESTIMONIALS.map(t => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 0;">
                <p style="font-size: 13px; color: rgba(255,255,255,0.9); font-style: italic; margin-bottom: 12px;">"${t.quote}"</p>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">— ${t.author}, <span style="font-weight: 400; opacity: 0.7;">${t.role}</span></div>
            </div>
        `).join('');
    };

    modal.innerHTML = `
        <div style="max-width: 1100px; width: 100%; background: linear-gradient(180deg, rgba(25, 25, 40, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 48px 32px; position: relative; max-height: 90vh; overflow-y: auto;">
            
            <!-- Close Button -->
            <button onclick="document.getElementById('pricingModal').classList.add('hidden');" style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                ×
            </button>

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 48px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #facc15; letter-spacing: 2px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.3); display: inline-block; padding: 6px 12px; border-radius: 20px; background: rgba(250, 204, 21, 0.1);">Limited Time Offer</div>
                <h2 style="font-size: 42px; font-weight: 700; color: white; margin-bottom: 12px;">Upgrade Your Mind</h2>
                <p style="font-size: 18px; color: var(--text-muted);">Choose the plan that fits your journey.</p>
            </div>

            <!-- Pricing Cards Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 60px; align-items: stretch;">
                
                <!-- Free Tier -->
                <div class="pricing-tier" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 32px; display: flex; flex-direction: column;">
                    <div style="padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">Free</h3>
                        <p style="font-size: 14px; color: var(--text-muted);">Essentials for beginners</p>
                        <div style="margin-top: 16px;">
                            <span style="font-size: 32px; font-weight: 700; color: white;">${PRICING_CONFIG.free.price}</span>
                            <span style="color: var(--text-muted);">${PRICING_CONFIG.free.period}</span>
                        </div>
                        <div style="margin-top: 8px; font-size: 13px; color: #ef4444; font-weight: 600;">⚠️ ${PRICING_CONFIG.free.limitText}</div>
                    </div>
                    <ul style="list-style: none; padding: 0; margin-bottom: 32px; flex-grow: 1;">
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: var(--text-muted);">✓</span> Delta Waves Only
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: var(--text-muted);">✓</span> 15 Minutes / Day
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.5); display: flex; gap: 12px;">
                            <span style="color: var(--text-muted);">✕</span> No Visualizers
                        </li>
                    </ul>
                    <button disabled style="width: 100%; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: rgba(255, 255, 255, 0.4); font-weight: 600;">Currently Active</button>
                </div>

                <!-- Founders Club Tier -->
                <div class="pricing-tier" style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.2)); border: 2px solid #10b981; border-radius: 20px; padding: 32px; position: relative; display: flex; flex-direction: column; transform: scale(1.02); box-shadow: 0 0 30px rgba(16, 185, 129, 0.15); z-index: 10;">
                    <div style="position: absolute; top: -12px; right: 24px; background: #10b981; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; color: white; text-transform: uppercase;">Most Popular</div>
                    
                    <div style="padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(16, 185, 129, 0.3);">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">${PRICING_CONFIG.founders.name}</h3>
                        <p style="font-size: 14px; color: #6ee7b7;">${PRICING_CONFIG.founders.description}</p>
                        <div style="margin-top: 16px;">
                            <span style="font-size: 42px; font-weight: 700; color: white;">${PRICING_CONFIG.founders.price}</span>
                            <span style="color: var(--text-muted);">${PRICING_CONFIG.founders.period}</span>
                        </div>
                        <div style="font-size: 12px; color: #fbbf24; margin-top: 8px;">${PRICING_CONFIG.founders.warning}</div>
                    </div>

                    <ul style="list-style: none; padding: 0; margin-bottom: 32px; flex-grow: 1;">
                        <li style="padding: 8px 0; color: white; display: flex; gap: 12px; font-weight: 500;">
                            <span style="color: #10b981;">✓</span> <strong>${PRICING_CONFIG.founders.limitText}</strong>
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #10b981;">✓</span> All Brainwaves Unlocked
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #10b981;">✓</span> Full 30-Day Journey
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #10b981;">✓</span> Advanced Visualizers
                        </li>
                    </ul>

                    <button id="upgradeBtnFounders" style="width: 100%; padding: 16px; background: #10b981; border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        Join Founders Club
                    </button>
                    <p style="text-align: center; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 12px;">Cancel anytime.</p>
                </div>

                <!-- Professional Tier -->
                <div class="pricing-tier" style="background: rgba(124, 58, 237, 0.05); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 20px; padding: 32px; display: flex; flex-direction: column;">
                    <div style="padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(124, 58, 237, 0.3);">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">${PRICING_CONFIG.professional.name}</h3>
                        <p style="font-size: 14px; color: #a78bfa;">${PRICING_CONFIG.professional.description}</p>
                        <div style="margin-top: 16px;">
                            <span style="font-size: 32px; font-weight: 700; color: white;">${PRICING_CONFIG.professional.price}</span>
                            <span style="color: var(--text-muted);">${PRICING_CONFIG.professional.period}</span>
                        </div>
                    </div>
                    <ul style="list-style: none; padding: 0; margin-bottom: 32px; flex-grow: 1;">
                        <li style="padding: 8px 0; color: white; display: flex; gap: 12px; font-weight: 500;">
                            <span style="color: #a78bfa;">✓</span> Everything in Founders
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #a78bfa;">✓</span> Priority Support
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #a78bfa;">✓</span> Early Access Features
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #a78bfa;">✓</span> Commercial License
                        </li>
                    </ul>
                    <button id="upgradeBtnPro" style="width: 100%; padding: 16px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Go Professional
                    </button>
                </div>
            </div>

            <!-- Social Proof / Testimonials -->
            <div style="margin-bottom: 24px;">
                <h4 style="text-align: center; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px;">Trusted by 10,000+ Meditators</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    ${renderTestimonials()}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px; margin-top: 48px;">
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.4);">Questions? Contact founders@mindwave.com</p>
            </div>

        </div>
    `;

    // Handle Founders Upgrade Click
    const upgradeBtnFounders = modal.querySelector('#upgradeBtnFounders');
    upgradeBtnFounders.addEventListener('click', () => {
        handleUpgrade(PRICING_CONFIG.founders.productId);
    });

    // Handle Professional Upgrade Click
    const upgradeBtnPro = modal.querySelector('#upgradeBtnPro');
    upgradeBtnPro.addEventListener('click', () => {
        handleUpgrade(PRICING_CONFIG.professional.productId);
    });

    // Hover effects
    [upgradeBtnFounders, upgradeBtnPro].forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-2px)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePricingModal();
        }
    });

    return modal;
}

function handleUpgrade(productId) {
    if (window.trackUpgradeClick) {
        window.trackUpgradeClick('pricing_modal', productId);
    }

    try {
        // Map products to existing stripe logic if needed, or pass through
        // Using 'monthly' billing period default for both for now
        goToCheckout(productId, 'monthly');
    } catch (error) {
        console.error('[Pricing] Checkout error:', error);
        alert(error.message);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.showPricingModal = showPricingModal;
        window.hidePricingModal = hidePricingModal;
    });
} else {
    window.showPricingModal = showPricingModal;
    window.hidePricingModal = hidePricingModal;
}
