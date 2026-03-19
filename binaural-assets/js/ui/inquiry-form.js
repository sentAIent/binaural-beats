/**
 * Group Discount Inquiry Form
 * Allows users to request corporate/group rates directly on the site
 */

import {
    db,
    collection,
    addDoc,
    serverTimestamp
} from '../services/firebase.js';

/**
 * Show inquiry form modal
 */
export function showInquiryForm() {
    const modal = createInquiryModal();
    document.body.appendChild(modal);

    if (window.trackGlobalEvent) {
        window.trackGlobalEvent('inquiry_form_opened');
    }
}

/**
 * Create inquiry modal
 */
function createInquiryModal() {
    const modal = document.createElement('div');
    modal.id = 'inquiryModal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md opacity-0 transition-opacity duration-300';

    // We'll animate opacity in after append
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    modal.innerHTML = `
        <div class="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 md:p-10 rounded-3xl relative flex flex-col gap-6 shadow-2xl border border-white/10" style="background: linear-gradient(180deg, rgba(25, 25, 40, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%);">
            
            <!-- Close Button -->
            <button id="closeInquiryBtn" class="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <!-- Header -->
            <div class="text-center space-y-2 mt-2">
                <div class="text-5xl mb-4 animate-bounce-subtle">🏢</div>
                <h2 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent" style="color: white; margin-bottom: 8px;">
                    Group Discounts
                </h2>
                <p class="text-sm text-[var(--text-muted)]" style="color: rgba(255, 255, 255, 0.7);">
                    Get a custom rate for your team, company, or organization.
                </p>
            </div>

            <!-- Inquiry Form -->
            <form id="inquiryForm" class="flex flex-col gap-6" style="margin-top: 16px;">
                
                <!-- Name -->
                <div class="space-y-2">
                    <label class="block text-sm font-bold" style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Your Name *</label>
                    <input type="text" name="name" required placeholder="Jane Doe" class="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[var(--accent)] outline-none transition-all placeholder:text-white/20" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: white; width: 100%; box-sizing: border-box;">
                </div>

                <!-- Email -->
                <div class="space-y-2" style="margin-top: 16px;">
                    <label class="block text-sm font-bold" style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Work Email *</label>
                    <input type="email" name="email" required placeholder="jane@company.com" class="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[var(--accent)] outline-none transition-all placeholder:text-white/20" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: white; width: 100%; box-sizing: border-box;">
                </div>

                <!-- Organization -->
                <div class="space-y-2" style="margin-top: 16px;">
                    <label class="block text-sm font-bold" style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Organization/Company *</label>
                    <input type="text" name="organization" required placeholder="Acme Corp" class="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[var(--accent)] outline-none transition-all placeholder:text-white/20" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: white; width: 100%; box-sizing: border-box;">
                </div>

                <!-- Group Size -->
                <div class="space-y-2" style="margin-top: 16px;">
                    <label class="block text-sm font-bold" style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Estimated Group Size *</label>
                    <div style="position: relative;">
                        <select name="group_size" required style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: white; appearance: none; cursor: pointer; outline: none; box-sizing: border-box;">
                            <option value="">Select size...</option>
                            <option value="5-10">5 - 10 people</option>
                            <option value="11-50">11 - 50 people</option>
                            <option value="51-200">51 - 200 people</option>
                            <option value="201+">201+ people</option>
                        </select>
                        <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: rgba(255,255,255,0.5);">▼</div>
                    </div>
                </div>

                <!-- Details/Message -->
                <div class="space-y-2" style="margin-top: 16px;">
                    <label class="block text-sm font-bold" style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Any specific requirements?</label>
                    <textarea name="details" rows="3" placeholder="Tell us how your team plans to use MindWave..." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: white; outline: none; resize: none; box-sizing: border-box;"></textarea>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submitInquiryBtn" style="width: 100%; padding: 16px; background: #fbbf24; border: none; border-radius: 12px; color: black; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 24px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
                    Send Inquiry
                </button>
            </form>
        </div>
    `;

    // Set up event handlers
    setupInquiryHandlers(modal);

    return modal;
}

/**
 * Set up inquiry event handlers
 */
function setupInquiryHandlers(modal) {
    // Close button
    const closeBtn = modal.querySelector('#closeInquiryBtn');
    closeBtn.addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
        if (window.trackGlobalEvent) {
            window.trackGlobalEvent('inquiry_form_closed');
        }
    });

    // Handle background click to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.remove(), 300);
        }
    });

    // Form submission
    const form = modal.querySelector('#inquiryForm');
    const submitBtn = modal.querySelector('#submitInquiryBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        submitBtn.style.opacity = '0.7';

        try {
            const formData = new FormData(form);
            const inquiryData = {
                name: formData.get('name'),
                email: formData.get('email'),
                organization: formData.get('organization'),
                group_size: formData.get('group_size'),
                details: formData.get('details') || '',
                type: 'corporate_discount',
                source: 'web_pricing_modal',
                url: window.location.href,
                status: 'new'
            };

            // Add timeout race to prevent hanging
            const submitPromise = submitInquiry(inquiryData);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            await Promise.race([submitPromise, timeoutPromise]);

            // Show success message
            showSuccessMessage(modal);

            // Track completion
            if (window.trackGlobalEvent) {
                window.trackGlobalEvent('inquiry_submitted', { group_size: inquiryData.group_size });
            }

        } catch (error) {
            console.error('[Inquiry] Submission error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = '❌ Error - Try Again';
            submitBtn.style.background = '#ef4444';
            submitBtn.style.color = 'white';

            setTimeout(() => {
                submitBtn.textContent = 'Send Inquiry';
                submitBtn.style.background = '#fbbf24';
                submitBtn.style.color = 'black';
            }, 3000);
        }
    });
}

/**
 * Submit inquiry to Firestore
 */
async function submitInquiry(data) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    const inquiryDoc = {
        ...data,
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent
    };

    await addDoc(collection(db, 'inquiries'), inquiryDoc);
}

/**
 * Show success message
 */
function showSuccessMessage(modal) {
    const content = modal.querySelector('.glass-card');

    content.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 80px; margin-bottom: 24px; animation: bounce 0.6s ease-out;">
                ✅
            </div>
            <h3 style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 16px;">
                Inquiry Sent!
            </h3>
            <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin-bottom: 32px; line-height: 1.6;">
                Thank you for your interest. Our team will get back to you within 24 hours.
            </p>
            <button id="closeFinalBtn" style="padding: 14px 32px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; color: white; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                Return to Pricing
            </button>
        </div>

        <style>
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
        </style>
    `;

    const closeBtn = content.querySelector('#closeFinalBtn');
    closeBtn.addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    });

    // Hover effect for the new button
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.15)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.1)';
    });
}
