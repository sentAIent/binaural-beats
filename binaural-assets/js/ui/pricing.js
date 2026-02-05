/**
 * Pricing UI Component
 * Displays subscription plans and handles checkout
 */

import { goToCheckout, PRICING, formatPrice, openCustomerPortal } from '../services/stripe-simple.js';
import { getAuth } from 'firebase/auth';

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

    // Create or show pricing modal
    let modal = document.getElementById('pricingModal');

    if (!modal) {
        modal = createPricingModal();
        document.body.appendChild(modal);
    }

    // Fetch subscription status
    const { getSubscription } = await import('../services/stripe-simple.js');
    const subscription = await getSubscription();

    // Update modal to show subscription status if user has active plan
    if (subscription && subscription.status === 'active') {
        updateSubscriptionDisplay(modal, subscription);
    }

    // Apply Layout Constraints (Safe Area Awareness)
    if (window.adjustActiveModal) window.adjustActiveModal(modal);

    modal.classList.remove('hidden');
    // document.body.style.overflow = 'hidden';
}


export function hidePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.add('hidden');
        // document.body.style.overflow = '';
    }
}

function createPricingModal() {
    const modal = document.createElement('div');
    modal.id = 'pricingModal';
    modal.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4 hidden';
    modal.style.background = 'rgba(0, 0, 0, 0.9)';
    modal.style.backdropFilter = 'blur(20px)';

    modal.innerHTML = `
        <div style="max-width: 1000px; width: 100%; background: linear-gradient(180deg, rgba(25, 25, 40, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 48px 32px; position: relative;">
            
            <!-- Close Button -->
            <button onclick="document.getElementById('pricingModal').classList.add('hidden'); document.body.style.overflow = '';" style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                ×
            </button>

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 48px;">
                <h2 style="font-size: 42px; font-weight: 700; color: white; margin-bottom: 12px;">Choose Your Plan</h2>
                <p style="font-size: 18px; color: rgba(255, 255, 255, 0.6);">Unlock all features and content</p>
            </div>

            <!-- Pricing Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px;">
                
                <!-- Monthly Plan -->
                <div class="pricing-card" data-plan="monthly" style="background: rgba(255, 255, 255, 0.03); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; cursor: pointer; transition: all 0.3s;">
                    <div style="text-align: center;">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">Monthly</h3>
                        <div style="margin: 24px 0;">
                            <span style="font-size: 48px; font-weight: 700; color: white;">${formatPrice(PRICING.monthly.amount)}</span>

                            <span style="font-size: 18px; color: rgba(255, 255, 255, 0.6);">/month</span>
                        </div>
                        <div style="font-size: 14px; color: #60a9ff; margin-bottom: 16px; font-weight: 600;">For the first 500 subscribers</div>
                        <button class="checkout-btn" data-plan="monthly" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #60a9ff 0%, #60a9ff 100%); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                            Get Started
                        </button>
                    </div>
                    <ul style="margin-top: 32px; list-style: none; padding: 0;">
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> Unlimited access to all features
                        </li>
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> All Journey lessons
                        </li>
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> Premium presets
                        </li>
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> Cancel anytime
                        </li>
                    </ul>
                </div>

                <!-- Yearly Plan (Popular) -->
                <div class="pricing-card" data-plan="yearly" style="background: linear-gradient(135deg, rgba(96, 169, 255, 0.15) 0%, rgba(96, 169, 255, 0.05) 100%); border: 2px solid #60a9ff; border-radius: 16px; padding: 32px; cursor: pointer; transition: all 0.3s; position: relative;">
                    <div style="position: absolute; top: -12px; right: 24px; background: linear-gradient(135deg, #60a9ff 0%, #60a9ff 100%); padding: 6px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; color: white;">
                        BEST VALUE
                    </div>
                    <div style="text-align: center;">
                        <h3 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 8px;">Yearly</h3>
                        <div style="margin: 24px 0;">
                            <span style="font-size: 48px; font-weight: 700; color: white;">${formatPrice(PRICING.yearly.amount)}</span>
                            <span style="font-size: 18px; color: rgba(255, 255, 255, 0.6);">/year</span>
                        </div>
                        <div style="font-size: 14px; color: #60a9ff; margin-bottom: 16px; font-weight: 600;">2 months free</div>
                        <button class="checkout-btn" data-plan="yearly" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #60a9ff 0%, #60a9ff 100%); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                            Get Started
                        </button>
                    </div>
                    <ul style="margin-top: 32px; list-style: none; padding: 0;">
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> Everything in Monthly
                        </li>
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> 2 months free
                        </li>
                        <li style="padding: 12px 0; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; gap: 12px;">
                            <span style="color: #60a9ff;">✓</span> Priority support
                        </li>
                    </ul>
                </div>



            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.4);">7-day money-back guarantee • Secure payment via Stripe • Cancel anytime</p>
            </div>

        </div>
    `;

    // Add click handlers
    modal.querySelectorAll('.checkout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const plan = btn.dataset.plan;
            goToCheckout(plan);
        });

        btn.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'translateY(-2px)';
        });

        btn.addEventListener('mouseleave', (e) => {
            e.target.style.transform = 'translateY(0)';
        });
    });

    // Add hover effects to cards
    modal.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#60a9ff';
            card.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseleave', () => {
            if (card.dataset.plan !== 'yearly') {
                card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
            card.style.transform = 'translateY(0)';
        });
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePricingModal();
        }
    });

    return modal;
}

/**
 * Update pricing modal to show active subscription status
 */
function updateSubscriptionDisplay(modal, subscription) {
    if (!subscription || !modal) return;

    const planName = subscription.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Unknown';
    const status = subscription.status || 'Unknown';

    // Create subscription status banner
    const statusBanner = document.createElement('div');
    statusBanner.id = 'subscriptionStatusBanner';
    statusBanner.style.cssText = 'margin-bottom: 32px; padding: 20px; background: linear-gradient(135deg, rgba(96, 169, 255, 0.2) 0%, rgba(96, 169, 255, 0.1) 100%); border: 1px solid #60a9ff; border-radius: 12px;';

    let expiryText = '';
    if (subscription.plan === 'lifetime') {
        expiryText = '✨ Lifetime Access';
    } else if (subscription.expiresAt) {
        const expiryDate = subscription.expiresAt.toDate ? subscription.expiresAt.toDate() : new Date(subscription.expiresAt);
        expiryText = `Renews: ${expiryDate.toLocaleDateString()}`;
    }

    statusBanner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
                <div style="font-size: 20px; font-weight: 700; color: white; margin-bottom: 4px;">
                    🎉 ${planName} Plan Active
                </div>
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                    ${expiryText} • Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
            </div>
            <button id="manageSubscriptionBtn" style="padding: 10px 20px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                Manage Subscription
            </button>
        </div>
    `;

    // Insert before pricing cards
    const modalCard = modal.querySelector('div[style*="max-width: 1000px"]');
    const header = modalCard.querySelector('div[style*="text-align: center"]');
    if (header && header.nextElementSibling) {
        header.parentNode.insertBefore(statusBanner, header.nextElementSibling);
    }

    // Add click handler for Manage Subscription button
    const manageBtn = statusBanner.querySelector('#manageSubscriptionBtn');
    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            try {
                openCustomerPortal();
            } catch (error) {
                console.error('[Pricing] Customer Portal error:', error);
                alert(error.message);
            }
        });
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPricingUI);
} else {
    initPricingUI();
}

function initPricingUI() {
    // Expose global function
    window.showPricingModal = showPricingModal;
    window.hidePricingModal = hidePricingModal;
}
