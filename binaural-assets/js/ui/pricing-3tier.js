/**
 * Founders Club Pricing Modal (Updated for Professional Tier)
 * Free (Seeker) vs Founders Club ($9.99/mo) vs Professional ($25/mo)
 */

import { goToCheckout, getUserTier } from '../services/stripe-simple.js';
import { getAuth } from 'firebase/auth';
import { shareReferral } from '../services/referral.js';
import { getVariant, trackConversion } from '../utils/ab-testing.js';

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
    yogi: {
        name: "Founders Club",
        price: "$9.99",
        period: "/month",
        productId: "yogi",
        description: "Everything unlocked. Forever.",
        warning: "⚠️ Price increases after 500 members",
        limitText: "Unlimited Play",
        active: true,
    },
    buddha: {
        name: "Professional",
        price: "$29",
        period: "/month",
        productId: "buddha",
        description: "For coaches & power users",
        limitText: "Unlimited + Priority",
        active: true
    },
    lifetime: {
        name: "Lifetime Access",
        price: "$199",
        period: "/once",
        productId: "lifetime",
        description: "Pay once, own it forever",
        limitText: "Unlimited Forever",
        active: true,
        warning: "🔥 Best Value"
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

    // Get user's current tier (with fallback for offline/errors)
    let currentTier = 'free';
    try {
        currentTier = await getUserTier();
    } catch (err) {
        console.warn('[Pricing] Failed to get tier, defaulting to free:', err.message);
    }

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
    // Scarcity Logic
    let spots = parseInt(localStorage.getItem('mindwave_founders_spots') || '432');
    if (isNaN(spots)) spots = 432;

    // Decrement occasionally
    if (Math.random() > 0.5) {
        spots = Math.max(14, spots - Math.floor(Math.random() * 2) - 1);
        localStorage.setItem('mindwave_founders_spots', spots);
    }

    const modal = document.createElement('div');
    modal.id = 'pricingModal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 hidden';
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
                <h2 style="font-size: 42px; font-weight: 700; color: white; margin-bottom: 12px;">Upgrade Your Frequency</h2>
                <p style="font-size: 18px; color: var(--text-muted);">Choose the plan that fits your journey.</p>
            </div>

            <!-- Pricing Cards Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px; align-items: stretch;">
                
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
                    </ul>
                    <button disabled style="width: 100%; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: rgba(255, 255, 255, 0.4); font-weight: 600; margin-bottom: 12px;">Currently Active</button>
                    <button id="referralBtn" style="width: 100%; padding: 12px; background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; border-radius: 12px; color: #38bdf8; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; transition: all 0.2s;">
                        <span>🎁</span> Give 1 Month, Get 1 Month
                    </button>
                </div>

                <!-- Founders Club Tier (Yogi) -->
                <div class="pricing-tier" style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.2)); border: 2px solid #10b981; border-radius: 20px; padding: 32px; position: relative; display: flex; flex-direction: column; transform: scale(1.02); box-shadow: 0 0 30px rgba(16, 185, 129, 0.15); z-index: 10;">
                    <div style="position: absolute; top: -12px; right: 24px; background: #10b981; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; color: white; text-transform: uppercase;">Most Popular</div>
                    
                    <div style="padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(16, 185, 129, 0.3);">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">${PRICING_CONFIG.yogi.name}</h3>
                        <p style="font-size: 14px; color: #6ee7b7;">${PRICING_CONFIG.yogi.description}</p>
                        <div style="margin-top: 16px;">
                            <span style="font-size: 42px; font-weight: 700; color: white;">${PRICING_CONFIG.yogi.price}</span>
                            <span style="color: var(--text-muted);">${PRICING_CONFIG.yogi.period}</span>
                        </div>
                        <div style="font-size: 12px; color: #fbbf24; margin-top: 8px;">${PRICING_CONFIG.yogi.warning}</div>
                    </div>

                    <ul style="list-style: none; padding: 0; margin-bottom: 32px; flex-grow: 1;">
                        <li style="padding: 8px 0; color: white; display: flex; gap: 12px; font-weight: 500;">
                            <span style="color: #10b981;">✓</span> <strong>${PRICING_CONFIG.yogi.limitText}</strong>
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #10b981;">✓</span> All Brainwaves Unlocked
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #10b981;">✓</span> Full 30-Day Journey
                        </li>
                    </ul>

                    <button id="upgradeBtnFounders" style="width: 100%; padding: 16px; background: #10b981; border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        Join Founders Club
                    </button>
                </div>

                <!-- Professional Tier (Buddha) -->
                <div class="pricing-tier" style="background: rgba(124, 58, 237, 0.05); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 20px; padding: 32px; display: flex; flex-direction: column;">
                    <div style="padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(124, 58, 237, 0.3);">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">${PRICING_CONFIG.buddha.name}</h3>
                        <p style="font-size: 14px; color: #a78bfa;">${PRICING_CONFIG.buddha.description}</p>
                        <div style="margin-top: 16px;">
                            <span style="font-size: 32px; font-weight: 700; color: white;">${PRICING_CONFIG.buddha.price}</span>
                            <span style="color: var(--text-muted);">${PRICING_CONFIG.buddha.period}</span>
                        </div>
                    </div>
                    <ul style="list-style: none; padding: 0; margin-bottom: 32px; flex-grow: 1;">
                        <li style="padding: 8px 0; color: white; display: flex; gap: 12px; font-weight: 500;">
                            <span style="color: #a78bfa;">✓</span> Everything in Founders
                        </li>
                        <li style="padding: 8px 0; color: rgba(255, 255, 255, 0.8); display: flex; gap: 12px;">
                            <span style="color: #a78bfa;">✓</span> Priority Support
                        </li>
                    </ul>
                    <button id="upgradeBtnPro" style="width: 100%; padding: 16px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Go Professional
                    </button>
                </div>
            </div>

            <!-- Special Lifetime Offer Section - Spans Full Width -->
            <div id="lifetimeOfferSec" style="width: 100%; clear: both; background: linear-gradient(145deg, rgba(251, 191, 36, 0.15), rgba(180, 83, 9, 0.25)); border: 2px solid #fbbf24; border-radius: 24px; padding: 48px; position: relative; margin-bottom: 40px; box-shadow: 0 0 50px rgba(251, 191, 36, 0.25); overflow: hidden;">
                <!-- Animated background element -->
                <div style="position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%); pointer-events: none;"></div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 40px; align-items: center; position: relative; z-index: 1;">
                    <!-- Left Side: Price & CTA -->
                    <div style="flex: 1; min-width: 300px;">
                        <div style="background: #fbbf24; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 900; color: black; text-transform: uppercase; display: inline-block; margin-bottom: 16px; letter-spacing: 1px;">Special Limited Offer</div>
                        <h3 style="font-size: 36px; font-weight: 800; color: white; margin-bottom: 12px;">${PRICING_CONFIG.lifetime.name}</h3>
                        <p style="font-size: 18px; color: #fcd34d; margin-bottom: 24px;">One-time payment. Every feature. Forever.</p>
                        
                        <div style="margin-bottom: 32px;">
                            <span style="font-size: 64px; font-weight: 900; color: white;">${PRICING_CONFIG.lifetime.price}</span>
                            <span style="font-size: 18px; color: var(--text-muted); text-decoration: line-through; margin-left: 12px;">$999</span>
                            <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 8px; display: inline-block; margin-top: 12px; animation: pulse 2.5s infinite;">
                                🔥 Only ${spots} Founding Member spots left
                            </div>
                        </div>

                        <button id="upgradeBtnLifetime" style="width: 100%; max-width: 400px; padding: 20px 40px; background: #fbbf24; border: none; border-radius: 16px; color: black; font-size: 20px; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);">
                            Get Lifetime Access
                        </button>
                    </div>

                    <!-- Right Side: Features -->
                    <div style="flex: 1.2; min-width: 320px; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 32px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px; color: white; font-weight: 500;">
                                <span style="font-size: 20px; color: #fbbf24;">★</span> Unlimited Cloud Saves
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; color: white; font-weight: 500;">
                                <span style="font-size: 20px; color: #fbbf24;">★</span> All Premium Visuals
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; color: white; font-weight: 500;">
                                <span style="font-size: 20px; color: #fbbf24;">★</span> Commercial License
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; color: white; font-weight: 500;">
                                <span style="font-size: 20px; color: #fbbf24;">★</span> Future Beta Access
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; color: white; font-weight: 500;">
                                <span style="font-size: 20px; color: #fbbf24;">★</span> VIP Support
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; color: white; font-weight: 500;">
                                <span style="font-size: 20px; color: #fbbf24;">★</span> Ad-Free Forever
                            </div>
                        </div>
                        <div style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
                            <p style="font-size: 13px; color: var(--text-muted); font-style: italic;">"The best investment I've made in my mental performance." — David K., Software Engineer</p>
                        </div>
                    </div>
                </div>

                <!-- Testimonials Directly Under Lifetime Offer -->
                <div style="margin-top: 48px; border-top: 1px solid rgba(251, 191, 36, 0.2); padding-top: 40px;">
                    <h4 style="text-align: center; color: #fcd34d; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px; font-weight: 800;">Real Results from Lifetime Members</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        ${renderTestimonials()}
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px; margin-top: 48px;">
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.4);">Questions? Contact founders@mindwave.com</p>
            </div>

        </div>
    `;

    // Handle Founders Upgrade Click
    // Handle Founders (Yogi) Upgrade Click
    const upgradeBtnFounders = modal.querySelector('#upgradeBtnFounders');
    if (upgradeBtnFounders) {
        upgradeBtnFounders.addEventListener('click', () => {
            trackConversion('pricing_cta', 'upgrade_click', { tier: 'founders' });
            handleUpgrade(PRICING_CONFIG.yogi.productId, 'monthly');
        });
    }

    // Handle Professional (Buddha) Upgrade Click
    const upgradeBtnPro = modal.querySelector('#upgradeBtnPro');
    if (upgradeBtnPro) {
        upgradeBtnPro.addEventListener('click', () => {
            handleUpgrade(PRICING_CONFIG.buddha.productId, 'monthly');
        });
    }

    // Handle Lifetime Upgrade Click
    const upgradeBtnLifetime = modal.querySelector('#upgradeBtnLifetime');
    if (upgradeBtnLifetime) {
        upgradeBtnLifetime.addEventListener('click', () => {
            handleUpgrade(PRICING_CONFIG.lifetime.productId, 'oneTime');
        });
    }

    // Handle Referral Button
    const referralBtn = modal.querySelector('#referralBtn');
    if (referralBtn) {
        referralBtn.addEventListener('click', async () => {
            const result = await shareReferral();
            if (result.success) {
                const text = result.copied ? 'Link Copied!' : 'Shared!';
                referralBtn.innerHTML = `<span>✅</span> ${text}`;
                setTimeout(() => {
                    referralBtn.innerHTML = `<span>🎁</span> Give 1 Month, Get 1 Month`;
                }, 2000);
            } else if (result.error === 'not_logged_in') {
                alert("Please sign in to invite friends!");
            }
        });
    }

    // Hover effects
    [upgradeBtnFounders, upgradeBtnPro, upgradeBtnLifetime].forEach(btn => {
        if (btn) {
            btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-2px)');
            btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
        }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePricingModal();
        }
    });

    return modal;
}

// Separate function to update HTML to avoid undefined errors during refactor
// (Use multi_replace in next step if needed)

function handleUpgrade(productId, billingPeriod = 'monthly') {
    if (window.trackUpgradeClick) {
        window.trackUpgradeClick('pricing_modal', productId);
    }

    try {
        // Map products to existing stripe logic
        goToCheckout(productId, billingPeriod);
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

        // Defer attaching listeners until modal is created
    });
} else {
    window.showPricingModal = showPricingModal;
    window.hidePricingModal = hidePricingModal;
}
