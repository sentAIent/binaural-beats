// MindWave Onboarding Tutorial
// Step-by-step introduction for new users

const ONBOARDING_KEY = 'mindwave_onboarding_complete_v2';

const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: '✨ Welcome to MindWave',
        description: 'Your personal brainwave entrainment studio. Let\'s take a quick tour!',
        target: null,
        position: 'center'
    },
    {
        id: 'presets',
        title: '🎵 Brain Wave Presets',
        description: 'Open the sidebar to choose from Delta, Theta, Alpha, Beta, and Gamma frequencies.',
        target: '.preset-btn', // Target the first preset button specifically
        position: 'right',
        action: () => {
            const panel = document.getElementById('leftPanel');
            if (panel) panel.classList.remove('-translate-x-full');
        }
    },
    {
        id: 'play',
        title: '▶️ Start Your Session',
        description: 'Tap the play button to begin. Your brainwaves will sync with the audio.',
        target: '#playBtn',
        position: 'top',
        action: () => {
            // Close left panel to focus on play
            const left = document.getElementById('leftPanel');
            if (left) left.classList.add('-translate-x-full');
        }
    },
    {
        id: 'mixer',
        title: '🎛️ Studio Mixer',
        description: 'Fine-tune your experience with soundscapes, volume controls, and audio modes.',
        target: '#masterVolSlider', // Target the master volume inside right panel
        position: 'left',
        action: () => {
            const panel = document.getElementById('rightPanel');
            if (panel) panel.classList.remove('translate-x-full');
        }
    },
    {
        id: 'recording',
        title: '🎙️ Record & Export',
        description: 'Capture your sessions! Click the red record button to save audio. Enable the camera icon above (turns red) to record with visuals. Before audio export, set loops for seamless repetition (loops don\'t work for video).',
        target: '#recordBtn',
        position: 'top',
        action: () => {
            const right = document.getElementById('rightPanel');
            if (right) right.classList.add('translate-x-full');
        }
    },
    {
        id: 'modes',
        title: '🔊 Audio Modes',
        description: 'Switch between Binaural (headphones required), Isochronic (pulsing), or Monaural beats.',
        target: '#modeToggle', // Use the actual mode toggle in the header
        position: 'bottom',
        action: () => {
            const right = document.getElementById('rightPanel');
            if (right) right.classList.add('translate-x-full');
        }
    },
    {
        id: 'timer',
        title: '⏱️ Timed Sessions',
        description: 'Set a duration for guided sessions that fade out gently when complete.',
        target: '#durationSelector',
        position: 'top'
    },
    {
        id: 'complete',
        title: '🚀 You\'re Ready!',
        description: 'Put on headphones and start your mindfulness journey. Explore presets in the left panel!',
        target: null,
        position: 'center'
    }
];

let currentStep = 0;
let onboardingOverlay = null;
let onboardingHighlight = null;

// Check if onboarding should show
export function shouldShowOnboarding() {
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
}

// Mark onboarding as complete
export function markOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
}

// Reset onboarding (for testing)
export function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
}

// Start the onboarding flow
export function startOnboarding() {
    // Force reset for manual start
    // if (!shouldShowOnboarding()) return; 

    currentStep = 0;
    createOnboardingUI();
    showStep(currentStep);
}

// Create the onboarding UI elements
function createOnboardingUI() {
    // Overlay
    onboardingOverlay = document.createElement('div');
    onboardingOverlay.id = 'onboardingOverlay';
    onboardingOverlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: auto; /* Catch clicks */
    `;

    // Tooltip container
    const tooltip = document.createElement('div');
    tooltip.id = 'onboardingTooltip';
    tooltip.style.cssText = `
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.5rem;
        max-width: 320px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        transition: all 0.3s ease;
    `;

    tooltip.innerHTML = `
        <h3 id="onboardingTitle" style="color: var(--accent); font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; min-height: 32px;"></h3>
        <p id="onboardingDesc" style="color: var(--text-muted); font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; min-height: 84px;"></p>
        <div style="display: flex; gap: 0.5rem; justify-content: center; min-height: 40px;">
            <button id="onboardingPrev" style="
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-muted);
                font-size: 0.75rem;
                border: none;
                cursor: pointer;
                min-width: 60px;
            ">Back</button>
            <button id="onboardingSkip" style="
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-muted);
                font-size: 0.75rem;
                border: none;
                cursor: pointer;
                min-width: 60px;
            ">Skip</button>
            <button id="onboardingNext" style="
                padding: 0.5rem 1.5rem;
                border-radius: 0.5rem;
                background: var(--accent);
                color: var(--bg-main);
                font-size: 0.75rem;
                font-weight: bold;
                border: none;
                cursor: pointer;
                min-width: 80px;
            ">Next</button>
        </div>
        <div id="onboardingDots" style="margin-top: 1rem; display: flex; justify-content: center; gap: 0.25rem;"></div>
    `;

    onboardingOverlay.appendChild(tooltip);
    document.body.appendChild(onboardingOverlay);

    // Bind events
    document.getElementById('onboardingPrev').addEventListener('click', prevStep);
    document.getElementById('onboardingSkip').addEventListener('click', endOnboarding);
    document.getElementById('onboardingNext').addEventListener('click', nextStep);

    // Fade in
    requestAnimationFrame(() => {
        onboardingOverlay.style.opacity = '1';
    });
}

// Show a specific step
function showStep(index) {
    const step = TUTORIAL_STEPS[index];
    if (!step) return;

    // EXECUTE ACTION (Open panels etc)
    if (step.action) {
        step.action();
    }

    // Update content
    document.getElementById('onboardingTitle').textContent = step.title;
    document.getElementById('onboardingDesc').textContent = step.description;

    // Update button text on last step
    const nextBtn = document.getElementById('onboardingNext');
    nextBtn.textContent = index === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next';

    // Show/Hide Prev Button (use visibility to maintain layout)
    const prevBtn = document.getElementById('onboardingPrev');
    if (prevBtn) {
        prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    }

    // Update dots
    const dotsContainer = document.getElementById('onboardingDots');
    dotsContainer.innerHTML = TUTORIAL_STEPS.map((_, i) => `
        <div style="
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${i === index ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)'};
            transition: background 0.3s;
        "></div>
    `).join('');

    // Highlight target element if exists
    // Wait for transition (sidebar slide)
    setTimeout(() => {
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                // Create highlight around target
                if (onboardingHighlight) onboardingHighlight.remove();
                onboardingHighlight = document.createElement('div');
                onboardingHighlight.style.cssText = `
                    position: fixed;
                    z-index: 9998;
                    border: 2px solid var(--accent);
                    border-radius: 0.5rem;
                    box-shadow: 0 0 20px var(--accent-glow), 0 0 0 9999px rgba(0,0,0,0.5); /* Dim EVERYTHING ELSE */
                    pointer-events: none;
                    transition: all 0.3s ease;
                `;
                const rect = targetEl.getBoundingClientRect();
                onboardingHighlight.style.left = (rect.left - 4) + 'px';
                onboardingHighlight.style.top = (rect.top - 4) + 'px';
                onboardingHighlight.style.width = (rect.width + 8) + 'px';
                onboardingHighlight.style.height = (rect.height + 8) + 'px';
                document.body.appendChild(onboardingHighlight);
            }
        } else {
            if (onboardingHighlight) {
                onboardingHighlight.remove();
                onboardingHighlight = null;
            }
        }
    }, 400); // 400ms delay for CSS transition
}

// Go to previous step
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
}

// Go to next step
function nextStep() {
    currentStep++;
    if (currentStep >= TUTORIAL_STEPS.length) {
        endOnboarding();
    } else {
        showStep(currentStep);
    }
}

// End onboarding
function endOnboarding() {
    markOnboardingComplete();

    if (onboardingOverlay) {
        onboardingOverlay.style.opacity = '0';
        setTimeout(() => {
            onboardingOverlay.remove();
            onboardingOverlay = null;
        }, 300);
    }

    if (onboardingHighlight) {
        onboardingHighlight.remove();
        onboardingHighlight = null;
    }
}

// Expose for manual trigger via UI
window.startOnboarding = (force = true) => {
    if (force) localStorage.removeItem(ONBOARDING_KEY);
    startOnboarding();
};
