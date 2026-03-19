/**
 * User Feedback Survey System
 * Measures product-market fit, feature value, and emotional resonance
 */

import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Survey trigger conditions
const TRIGGER_CONDITIONS = {
    AFTER_FIRST_SESSION: 'after_first_session',
    AFTER_THIRD_SESSION: 'after_third_session',
    AFTER_WEEK: 'after_week',
    BEFORE_UPGRADE: 'before_upgrade',
    AFTER_UPGRADE: 'after_upgrade',
    MANUAL: 'manual'
};

/**
 * Show feedback survey
 * @param {string} triggerType - Why survey is being shown
 */
export function showFeedbackSurvey(triggerType = TRIGGER_CONDITIONS.MANUAL) {
    // Don't show if already completed recently
    const lastSurvey = localStorage.getItem('mindwave_last_survey');
    const daysSinceLastSurvey = lastSurvey ? (Date.now() - parseInt(lastSurvey)) / (1000 * 60 * 60 * 24) : 999;

    // Only show survey once per week unless manual
    if (triggerType !== TRIGGER_CONDITIONS.MANUAL && daysSinceLastSurvey < 7) {
        console.log('[Survey] Skipping - surveyed recently');
        return;
    }

    const modal = createSurveyModal(triggerType);
    document.body.appendChild(modal);

    // Track survey shown
    if (window.trackFeatureUse) {
        window.trackFeatureUse('survey_shown', triggerType);
    }
}

/**
 * Create survey modal
 */
function createSurveyModal(triggerType) {
    const modal = document.createElement('div');
    modal.id = 'feedbackSurveyModal';
    // Use consistent overlay styles
    modal.className = 'fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300';

    // We'll animate opacity in after append
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    modal.innerHTML = `
        <div class="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 md:p-10 rounded-3xl relative flex flex-col gap-6 shadow-2xl border border-white/10">
            
            <!-- Close Button -->
            <button id="closeSurveyBtn" class="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <!-- Header -->
            <div class="text-center space-y-2 mt-2">
                <div class="text-5xl mb-4 animate-bounce-subtle">💫</div>
                <h2 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Help Us Improve
                </h2>
                <p class="text-sm text-[var(--text-muted)]">
                    Your feedback shapes the future of MindWave
                </p>
            </div>

            <!-- Survey Form -->
            <form id="feedbackSurveyForm" class="flex flex-col gap-8">
                
                <!-- Question 1: NPS Score -->
                <div class="space-y-3">
                    <label class="block text-sm font-bold text-white">
                        How likely are you to recommend MindWave? *
                    </label>
                    <div class="flex flex-wrap gap-2 justify-center">
                        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => `
                            <button type="button" class="nps-btn w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[var(--text-muted)] font-bold hover:bg-white/10 hover:border-[var(--accent)] hover:text-white transition-all focus:outline-none" data-score="${score}">
                                ${score}
                            </button>
                        `).join('')}
                    </div>
                    <div class="flex justify-between text-[10px] uppercase tracking-wider text-[var(--text-muted)] px-2">
                        <span>Not likely</span>
                        <span>Extremely likely</span>
                    </div>
                    <input type="hidden" name="nps_score" id="nps_score" required>
                </div>

                <!-- Question 2: Experience -->
                <div class="space-y-3">
                    <label class="block text-sm font-bold text-white">
                        How would you describe your experience? *
                    </label>
                    <div class="relative">
                        <select name="experience" required class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[var(--accent)] outline-none appearance-none cursor-pointer hover:bg-black/30 transition-all">
                            <option value="">Select an option...</option>
                            <option value="life_changing">🌟 Life-changing</option>
                            <option value="very_helpful">😊 Very helpful</option>
                            <option value="somewhat_helpful">👍 Somewhat helpful</option>
                            <option value="neutral">😐 Neutral</option>
                            <option value="disappointing">😞 Disappointing</option>
                        </select>
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">▼</div>
                    </div>
                </div>

                <!-- Question 3: Features -->
                <div class="space-y-3">
                    <label class="block text-sm font-bold text-white">
                        What feature creates the most value? *
                    </label>
                    <div class="relative">
                        <select name="best_feature" required class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[var(--accent)] outline-none appearance-none cursor-pointer hover:bg-black/30 transition-all">
                            <option value="">Select a feature...</option>
                            <option value="binaural_beats">🎵 Binaural Beats</option>
                            <option value="visualizer">✨ Visual Meditations</option>
                            <option value="sleep_stories">😴 Sleep Stories</option>
                            <option value="journey_program">🧘 Journey Program</option>
                            <option value="custom_mixes">🎛️ Custom Mixes</option>
                            <option value="ambient_sounds">🌊 Ambient Soundscapes</option>
                        </select>
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">▼</div>
                    </div>
                </div>

                <!-- Improvements -->
                <div class="space-y-3">
                    <label class="block text-sm font-bold text-white">
                        What would make MindWave better?
                    </label>
                    <textarea name="improvements" rows="3" placeholder="Share your ideas..." class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[var(--accent)] outline-none resize-none placeholder:text-white/20"></textarea>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submitSurveyBtn" class="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wide bg-[var(--accent)] text-[var(--bg-main)] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--accent-glow)]">
                    ✨ Submit Feedback
                </button>
                
                <p class="text-center text-xs text-[var(--text-muted)] opacity-60">
                    Thank you for your support! 🙏
                </p>
            </form>
        </div>

        <style>
            .nps-btn.selected {
                background: var(--accent) !important;
                border-color: var(--accent) !important;
                color: var(--bg-main) !important;
                box-shadow: 0 0 15px var(--accent-glow);
                transform: scale(1.05);
            }
        </style>
    `;

    // Set up event handlers
    setupSurveyHandlers(modal, triggerType);

    return modal;
}



/**
 * Set up survey event handlers
 */
function setupSurveyHandlers(modal, triggerType) {
    // Close button
    const closeBtn = modal.querySelector('#closeSurveyBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();

        if (window.trackFeatureUse) {
            window.trackFeatureUse('survey_closed', 'dismissed');
        }
    });

    // NPS score buttons
    const npsButtons = modal.querySelectorAll('.nps-btn');
    const npsInput = modal.querySelector('#nps_score');

    npsButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all
            npsButtons.forEach(b => b.classList.remove('selected'));

            // Add to clicked
            btn.classList.add('selected');

            // Set hidden input value
            npsInput.value = btn.dataset.score;
        });
    });

    // Form submission
    const form = modal.querySelector('#feedbackSurveyForm');
    const submitBtn = modal.querySelector('#submitSurveyBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const formData = new FormData(form);
            const feedbackData = {
                nps_score: parseInt(formData.get('nps_score')),
                experience: formData.get('experience'),
                best_feature: formData.get('best_feature'),
                use_case: formData.get('use_case'),
                feelings: formData.getAll('feelings'),
                improvements: formData.get('improvements') || '',
                competitors_used: formData.get('competitors_used') || '',
                trigger_type: triggerType,
                timestamp: new Date().toISOString()
            };

            // Add timeout race to prevent hanging
            const submitPromise = submitFeedback(feedbackData);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            await Promise.race([submitPromise, timeoutPromise]);

            // Store that survey was completed
            localStorage.setItem('mindwave_last_survey', Date.now().toString());

            // Show success message
            showSuccessMessage(modal);

            // Track completion
            if (window.trackFeatureUse) {
                window.trackFeatureUse('survey_completed', triggerType);
            }

        } catch (error) {
            console.error('[Survey] Submission error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = '❌ Error - Try Again';

            setTimeout(() => {
                submitBtn.textContent = '✨ Submit Feedback';
            }, 2000);
        }
    });
}

/**
 * Submit feedback to Firestore
 */
async function submitFeedback(data) {
    const auth = getAuth();
    const db = getFirestore();

    const feedbackDoc = {
        ...data,
        userId: auth.currentUser?.uid || 'anonymous',
        userEmail: auth.currentUser?.email || null,
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
    };

    await addDoc(collection(db, 'feedback'), feedbackDoc);

    console.log('[Survey] Feedback submitted successfully');
}

/**
 * Show success message
 */
function showSuccessMessage(modal) {
    const content = modal.querySelector('form').parentElement;

    content.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 80px; margin-bottom: 24px; animation: bounce 0.6s ease-out;">
                🙏
            </div>
            <h3 style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 16px;">
                Thank You!
            </h3>
            <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin-bottom: 32px; line-height: 1.6;">
                Your feedback helps us create better meditation experiences for everyone.
            </p>
            <button id="closeFinalBtn" style="padding: 14px 32px; background: linear-gradient(135deg, #60a9ff 0%, #4c94ff 100%); border: none; border-radius: 12px; color: white; font-size: 15px; font-weight: 600; cursor: pointer;">
                Continue Meditation
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
        modal.remove();
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 3000);
}

/**
 * Check if survey should be triggered
 * Call this strategically throughout the app
 */
export function checkSurveyTrigger() {
    const sessionCount = parseInt(localStorage.getItem('mindwave_session_count') || '0');
    const accountAge = localStorage.getItem('mindwave_account_created');

    if (!accountAge) return;

    const daysSinceSignup = (Date.now() - parseInt(accountAge)) / (1000 * 60 * 60 * 24);

    // After first session
    if (sessionCount === 1) {
        setTimeout(() => showFeedbackSurvey(TRIGGER_CONDITIONS.AFTER_FIRST_SESSION), 5000);
    }

    // After third session
    if (sessionCount === 3) {
        setTimeout(() => showFeedbackSurvey(TRIGGER_CONDITIONS.AFTER_THIRD_SESSION), 5000);
    }

    // After a week
    if (daysSinceSignup >= 7 && daysSinceSignup < 8) {
        setTimeout(() => showFeedbackSurvey(TRIGGER_CONDITIONS.AFTER_WEEK), 10000);
    }
}

// Export for global access
export { TRIGGER_CONDITIONS };
