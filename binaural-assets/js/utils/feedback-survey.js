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
    modal.className = 'fixed inset-0 z-[500] flex items-center justify-center p-4';
    modal.style.background = 'rgba(0, 0, 0, 0.95)';
    modal.style.backdropFilter = 'blur(20px)';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
        <div style="max-width: 600px; width: 100%; background: linear-gradient(180deg, rgba(25, 25, 40, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%); border: 2px solid rgba(96, 169, 255, 0.2); border-radius: 24px; padding: 40px; padding-bottom: 140px; position: relative; max-height: 90vh; overflow-y: auto;">
            
            <!-- Close Button -->
            <button id="closeSurveyBtn" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                ×
            </button>

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 48px; margin-bottom: 16px;">💫</div>
                <h2 style="font-size: 28px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">
                    Help Us Improve MindWave
                </h2>
                <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                    Your feedback shapes the future of meditation technology
                </p>
            </div>

            <!-- Survey Form -->
            <form id="feedbackSurveyForm" style="display: flex; flex-direction: column; gap: 24px;">
                
                <!-- Question 1: NPS Score -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        How likely are you to recommend MindWave to a friend? *
                    </label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => `
                            <button type="button" class="nps-btn" data-score="${score}" style="width: 44px; height: 44px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.2s;">
                                ${score}
                            </button>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: rgba(255, 255, 255, 0.4);">
                        <span>Not likely</span>
                        <span>Extremely likely</span>
                    </div>
                    <input type="hidden" name="nps_score" id="nps_score" required>
                </div>

                <!-- Question 2: Experience -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        How would you describe your experience with MindWave? *
                    </label>
                    <select name="experience" required style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: var(--text-main); font-size: 14px;">
                        <option value="">Select...</option>
                        <option value="life_changing">Life-changing 🌟</option>
                        <option value="very_helpful">Very helpful 😊</option>
                        <option value="somewhat_helpful">Somewhat helpful 👍</option>
                        <option value="neutral">Neutral 😐</option>
                        <option value="disappointing">Disappointing 😞</option>
                    </select>
                </div>

                <!-- Question 3: Most Valuable Feature -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        What feature creates the most value for you? *
                    </label>
                    <select name="best_feature" required style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: var(--text-main); font-size: 14px;">
                        <option value="">Select...</option>
                        <option value="binaural_beats">🎵 Binaural Beats Technology</option>
                        <option value="visualizer">✨ Visual Meditations</option>
                        <option value="sleep_stories">😴 Sleep Stories</option>
                        <option value="journey_program">🧘 Journey Program</option>
                        <option value="custom_mixes">🎛️ Custom Mix Creation</option>
                        <option value="ambient_sounds">🌊 Ambient Soundscapes</option>
                        <option value="ease_of_use">⚡ Ease of Use</option>
                        <option value="design">🎨 Beautiful Design</option>
                    </select>
                </div>

                <!-- Question 4: Use Case -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        What do you primarily use MindWave for? *
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${[
            { value: 'sleep', label: '😴 Better Sleep' },
            { value: 'focus', label: '🎯 Focus & Productivity' },
            { value: 'anxiety', label: '😌 Reduce Anxiety/Stress' },
            { value: 'meditation', label: '🧘 Meditation Practice' },
            { value: 'creativity', label: '🎨 Boost Creativity' },
            { value: 'relaxation', label: '🌊 General Relaxation' },
            { value: 'other', label: '🌟 Other' }
        ].map(option => `
                            <label style="display: flex; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 2px solid rgba(255, 255, 255, 0.05); border-radius: 12px; cursor: pointer; transition: all 0.2s;" class="use-case-option">
                                <input type="radio" name="use_case" value="${option.value}" required style="margin-right: 12px; width: 20px; height: 20px;">
                                <span style="color: white; font-size: 14px;">${option.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Question 5: Emotional Impact -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        How does MindWave make you feel? (Select all that apply)
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                        ${[
            'Calm', 'Focused', 'Peaceful', 'Energized',
            'Creative', 'Inspired', 'Relaxed', 'Happy'
        ].map(feeling => `
                            <label style="display: flex; align-items: center; padding: 10px; background: rgba(255, 255, 255, 0.03); border: 2px solid rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="feeling-option">
                                <input type="checkbox" name="feelings" value="${feeling.toLowerCase()}" style="margin-right: 8px; width: 18px; height: 18px;">
                                <span style="color: white; font-size: 13px;">${feeling}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Question 6: Improvement Suggestions -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        What would make MindWave even better?
                    </label>
                    <textarea name="improvements" rows="3" placeholder="Share your ideas..." style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: var(--text-main); font-size: 14px; resize: vertical; font-family: inherit;"></textarea>
                </div>

                <!-- Question 7: Comparison (for context) -->
                <div class="survey-question">
                    <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 12px; font-size: 15px;">
                        Have you tried other meditation/wellness apps?
                    </label>
                    <select name="competitors_used" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: var(--text-main); font-size: 14px;">
                        <option value="">Select...</option>
                        <option value="none">No, MindWave is my first</option>
                        <option value="calm">Calm</option>
                        <option value="headspace">Headspace</option>
                        <option value="insight_timer">Insight Timer</option>
                        <option value="brain_fm">Brain.fm</option>
                        <option value="other">Other apps</option>
                        <option value="multiple">Multiple apps</option>
                    </select>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submitSurveyBtn" style="width: 100%; padding: 16px; background: var(--accent); border: none; border-radius: 12px; color: var(--bg-main); font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 8px;">
                    ✨ Submit Feedback
                </button>

                <p style="text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.4); margin-top: -8px;">
                    Thank you for helping us improve! 🙏
                </p>
            </form>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .nps-btn.selected {
                background: var(--accent) !important;
                border-color: var(--accent) !important;
                color: var(--bg-main) !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px var(--accent-glow);
            }
            .nps-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: var(--accent);
                color: var(--accent);
            }

            .use-case-option:hover,
            .feeling-option:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(96, 169, 255, 0.3);
            }

            #submitSurveyBtn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(96, 169, 255, 0.3);
            }

            #closeSurveyBtn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }

            /* Custom scrollbar */
            #feedbackSurveyModal > div::-webkit-scrollbar {
                width: 8px;
            }

            #feedbackSurveyModal > div::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }

            #feedbackSurveyModal > div::-webkit-scrollbar-thumb {
                background: rgba(96, 169, 255, 0.3);
                border-radius: 4px;
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
