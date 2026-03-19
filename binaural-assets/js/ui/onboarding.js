// MindWave Onboarding Tutorial - Premium Redesign
// Features: Pulsing Highlight Boxes, Dark Tooltips, Arrow Indicators

const ONBOARDING_KEY = 'mindwave_onboarding_complete_v5'; // Bumped version for new flow

// --- DEEP DIVE CONTENT (Unchanged) ---
const DEEP_DIVE_CONTENT = {
    'modes': `
        <h3 class="text-xl font-bold text-[var(--accent)] mb-4">Understanding Audio Modes</h3>
        <div class="space-y-4 text-sm text-slate-300">
            <p>MindWave offers three distinct entrainment methods:</p>
            <ul class="list-disc pl-5 space-y-2">
                <li><strong class="text-white">Binaural Beats:</strong> Requires headphones. Distinct frequencies are played in each ear, and your brain creates the "beat" from the difference. Best for deep meditation.</li>
                <li><strong class="text-white">Isochronic Tones:</strong> Regular pulses of sound. Works through speakers. The most effective method for quick entrainment.</li>
                <li><strong class="text-white">Monaural Beats:</strong> Two frequencies mixed before reaching the ear. Combining the benefits of both, works well on speakers.</li>
            </ul>
        </div>
    `,
    'presets': `
        <h3 class="text-xl font-bold text-[var(--accent)] mb-4">Brainwave Frequencies</h3>
        <div class="space-y-4 text-sm text-slate-300">
            <p>Our presets are tuned to specific mental states:</p>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/5 p-2 rounded">
                    <div class="text-[var(--accent)] font-bold">Delta (0.5-4Hz)</div>
                    <div class="text-xs">Deep sleep, healing, detachment from awareness.</div>
                </div>
                <div class="bg-white/5 p-2 rounded">
                    <div class="text-[var(--accent)] font-bold">Theta (4-8Hz)</div>
                    <div class="text-xs">Meditation, intuition, memory, REM sleep.</div>
                </div>
                <div class="bg-white/5 p-2 rounded">
                    <div class="text-[var(--accent)] font-bold">Alpha (8-14Hz)</div>
                    <div class="text-xs">Relaxation, visualization, creativity.</div>
                </div>
                <div class="bg-white/5 p-2 rounded">
                    <div class="text-[var(--accent)] font-bold">Beta (14-30Hz)</div>
                    <div class="text-xs">Focus, alertness, cognition, problem solving.</div>
                </div>
            </div>
        </div>
    `,
    'matrix': `
        <h3 class="text-xl font-bold text-[var(--accent)] mb-4">The Matrix Visualizer</h3>
        <div class="space-y-4 text-sm text-slate-300">
            <p>Enter the digital realm with our customizable Matrix rain.</p>
            <p>Click the <strong>Gear Icon</strong> inside the Matrix mode to access:</p>
            <ul class="list-disc pl-5 space-y-2">
                <li><strong>Custom Message:</strong> Type your own mantras or affirmations to rain down.</li>
                <li><strong>Rainbow Mode:</strong> Cycle through colors dynamically.</li>
                <li><strong>Speed & Density:</strong> Control the intensity of the visual flow.</li>
            </ul>
            <p class="text-xs text-slate-400 mt-2">Check '3D Mode' for an immersive perspective shift.</p>
        </div>
    `,
    'mixer': `
        <h3 class="text-xl font-bold text-[var(--accent)] mb-4">DJ Studio Mixer</h3>
        <div class="space-y-4 text-sm text-slate-300">
            <p>Become the architect of your soundscape.</p>
            <ul class="list-disc pl-5 space-y-2">
                <li><strong class="text-blue-400">Drops:</strong> Atmospheric swells and impacts.</li>
                <li><strong class="text-yellow-400">Texture:</strong> Constant background layers like rain, vinyl crackle, or space drone.</li>
                <li><strong class="text-red-400">Pulse:</strong> Rhythmic elements to drive focus.</li>
            </ul>
            <p>Click the <strong>Sequencer</strong> icon on any pad to create rhythmic loops!</p>
        </div>
    `
};

const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: '✨ Welcome to MindWave',
        description: 'Your personal neuro-audio studio. Let\'s get you set up in seconds.',
        target: null,
        position: 'center'
    },
    {
        id: 'modes',
        title: '🎧 Audio Technology',
        description: 'Choose your entrainment method. Binaural requires headphones, while Isochronic works great on speakers.',
        target: '#modeToggle',
        position: 'bottom',
        readMoreId: 'modes'
    },
    {
        id: 'presets',
        title: '🌊 Frequency Presets',
        description: 'Slide open the left panel to access curated states like "Deep Sleep" or "Laser Focus".',
        target: '#leftToggle',
        position: 'right',
        readMoreId: 'presets',
        action: () => {
            const panel = document.getElementById('leftPanel');
            if (panel && panel.classList.contains('-translate-x-full')) {
                if (window.toggleLeftPanel) window.toggleLeftPanel();
                else panel.classList.remove('-translate-x-full');
            }
        }
    },
    {
        id: 'mixer',
        title: '🎛️ DJ Mixer & Soundscapes',
        description: 'Open the right panel to layer rain, drones, and rhythms over your binaural beat.',
        target: '#rightToggle',
        position: 'left',
        readMoreId: 'mixer',
        action: () => {
            const left = document.getElementById('leftPanel');
            if (left) left.classList.add('-translate-x-full');

            const right = document.getElementById('rightPanel');
            if (right && right.classList.contains('translate-x-full')) {
                if (window.toggleRightPanel) window.toggleRightPanel();
                else right.classList.remove('translate-x-full');
            }
        }
    },
    {
        id: 'matrix',
        title: '🔮 The Matrix',
        description: 'Select "Matrix" from the bottom dock. Use the Gear icon to customize text and colors.',
        target: '#matrixSettingsPanel', // Target the panel if visible, or dock? Let's target the dock area generally if panel hidden
        fallbackTarget: '.visual-dock',
        position: 'top',
        readMoreId: 'matrix',
        action: () => {
            const right = document.getElementById('rightPanel');
            if (right) right.classList.add('translate-x-full');

            // Try to show matrix settings if possible, otherwise just point to dock
            if (window.toggleMatrixSettings) {
                const panel = document.getElementById('matrixSettingsPanel');
                if (panel && panel.classList.contains('hidden')) window.toggleMatrixSettings();
            }
        }
    },
    {
        id: 'timer',
        title: '⏱️ Session Timer',
        description: 'Set a duration for your session. The audio will gently fade out when time is up.',
        target: '#durationSelector',
        position: 'top'
    },
    {
        id: 'download',
        title: '💎 Go Pro',
        description: 'Get the downloadable app for offline use and source code access.',
        target: '#downloadAppBtn',
        position: 'right',
        action: () => {
            const panel = document.getElementById('leftPanel');
            if (panel && panel.classList.contains('-translate-x-full')) {
                panel.classList.remove('-translate-x-full');
            }
        }
    },
    {
        id: 'start',
        title: '🚀 Ready to Elevate?',
        description: 'Put on your headphones and press Play. Your journey begins now.',
        target: '#playBtn',
        position: 'top',
        action: () => {
            const left = document.getElementById('leftPanel');
            if (left) left.classList.add('-translate-x-full');
            const right = document.getElementById('rightPanel');
            if (right) right.classList.add('translate-x-full');

            const mPanel = document.getElementById('matrixSettingsPanel');
            if (mPanel && !mPanel.classList.contains('hidden')) mPanel.classList.add('hidden');
        }
    }
];

let currentStep = 0;
let onboardingOverlay = null;
let onboardingHighlight = null;
let onboardingTooltip = null;
let deepDiveModal = null;

// --- CSS STYLES INJECTION ---
const styleId = 'onboarding-styles';
if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes border-pulse {
            0% { box-shadow: 0 0 0 0px rgba(45, 212, 191, 0.7); border-color: rgba(45, 212, 191, 1); }
            50% { box-shadow: 0 0 0 10px rgba(45, 212, 191, 0); border-color: rgba(45, 212, 191, 0.5); }
            100% { box-shadow: 0 0 0 0px rgba(45, 212, 191, 0); border-color: rgba(45, 212, 191, 1); }
        }
        .highlight-box {
            position: fixed;
            z-index: 10002;
            pointer-events: none;
            border: 3px solid var(--accent);
            border-radius: 8px;
            animation: border-pulse 2s infinite;
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .tooltip-arrow {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #0f172a; /* Match tooltip bg */
            border: 1px solid var(--accent);
            transform: rotate(45deg);
            z-index: -1;
        }
    `;
    document.head.appendChild(style);
}

export function shouldShowOnboarding() {
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
}

export function markOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function startOnboarding(force = false) {
    if (!force && !shouldShowOnboarding()) return;

    currentStep = 0;
    createOnboardingUI();
    showStep(currentStep);
}

window.startOnboarding = () => startOnboarding(true);

function createOnboardingUI() {
    if (document.getElementById('onboardingOverlay')) return;

    // Dark Overlay
    onboardingOverlay = document.createElement('div');
    onboardingOverlay.id = 'onboardingOverlay';
    onboardingOverlay.className = 'fixed inset-0 z-[10000] bg-black/80 backdrop-blur-[1px] transition-opacity duration-300 opacity-0';

    // Highlight Box
    onboardingHighlight = document.createElement('div');
    onboardingHighlight.className = 'highlight-box opacity-0';

    // Tooltip Container
    onboardingTooltip = document.createElement('div');
    onboardingTooltip.className = 'fixed z-[10003] opacity-0 transition-opacity duration-300 pointer-events-auto';

    // Explicit Width handling: min(320px, 90vw) to ensure mobile fit
    onboardingTooltip.innerHTML = `
        <div class="relative bg-[#0f172a] border border-[var(--accent)] text-white p-5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] w-[90vw] max-w-[320px]">
            <div class="tooltip-arrow absolute w-4 h-4 bg-[#0f172a] border border-[var(--accent)] rotate-45 z-[-1]"></div>
            
            <div class="flex justify-between items-start mb-3">
                <h3 id="onboardingTitle" class="text-lg font-bold text-[var(--accent)] leading-tight"></h3>
                <span id="onboardingCounter" class="text-[10px] text-slate-500 font-mono mt-1"></span>
            </div>
            
            <p id="onboardingDesc" class="text-xs text-slate-200 leading-relaxed mb-5 min-h-[48px] font-medium"></p>
            
            <div class="flex items-center justify-between mt-auto">
                <button id="onboardingPrev" class="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1">Back</button>
                
                <div class="flex gap-2">
                     <button id="onboardingReadMore" class="hidden text-[10px] text-[var(--accent)] border border-[var(--accent)] px-2 py-1 rounded hover:bg-[var(--accent)] hover:text-black transition-colors font-bold">
                        Read More
                     </button>
                    <button id="onboardingNext" class="text-xs font-bold bg-[var(--accent)] text-black px-4 py-1.5 rounded-lg hover:brightness-110 transition-transform active:scale-95 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                        Next
                    </button>
                </div>
            </div>
            
             <button id="onboardingSkip" class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/50 hover:text-white transition-colors">Skip Tutorial</button>
        </div>
    `;

    document.body.appendChild(onboardingOverlay);
    document.body.appendChild(onboardingHighlight);
    document.body.appendChild(onboardingTooltip);

    // Initial Fade In
    requestAnimationFrame(() => {
        onboardingOverlay.classList.remove('opacity-0');
        onboardingHighlight.classList.remove('opacity-0');
        onboardingTooltip.classList.remove('opacity-0');
    });

    // Listeners
    document.getElementById('onboardingPrev').onclick = prevStep;
    document.getElementById('onboardingNext').onclick = nextStep;
    document.getElementById('onboardingSkip').onclick = endOnboarding;
    document.getElementById('onboardingReadMore').onclick = () => {
        const step = TUTORIAL_STEPS[currentStep];
        if (step.readMoreId) showDeepDive(step.readMoreId);
    };
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
}

function nextStep() {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
        currentStep++;
        showStep(currentStep);
    } else {
        endOnboarding();
    }
}

function showStep(index) {
    const step = TUTORIAL_STEPS[index];
    if (!step) return;

    if (step.action) step.action();

    // Update Text
    document.getElementById('onboardingTitle').textContent = step.title;
    document.getElementById('onboardingDesc').textContent = step.description;
    document.getElementById('onboardingCounter').textContent = `${index + 1}/${TUTORIAL_STEPS.length}`;

    document.getElementById('onboardingNext').textContent = index === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
    document.getElementById('onboardingPrev').style.visibility = index === 0 ? 'hidden' : 'visible';

    // Read More visibility
    const rmBtn = document.getElementById('onboardingReadMore');
    if (step.readMoreId && DEEP_DIVE_CONTENT[step.readMoreId]) {
        rmBtn.classList.remove('hidden');
    } else {
        rmBtn.classList.add('hidden');
    }

    // Position Highlight & Tooltip
    updatePosition(step);
}

function updatePosition(step) {
    const highlight = onboardingHighlight;
    const tooltip = onboardingTooltip;
    const arrow = tooltip.querySelector('.tooltip-arrow');

    // Helper to get element
    let el = null;
    if (step.target) el = document.querySelector(step.target);
    if (!el && step.fallbackTarget) el = document.querySelector(step.fallbackTarget);

    if (!el) {
        // Center Fallback (Welcome Screen)
        highlight.style.opacity = '0';
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        arrow.style.display = 'none';
        return;
    }

    // Show Highlight
    highlight.style.opacity = '1';

    const rect = el.getBoundingClientRect();
    const padding = 6;

    // Set Highlight Box
    highlight.style.left = (rect.left - padding) + 'px';
    highlight.style.top = (rect.top - padding) + 'px';
    highlight.style.width = (rect.width + padding * 2) + 'px';
    highlight.style.height = (rect.height + padding * 2) + 'px';

    // Get Tooltip Dimensions (Actual Rendered Size)
    const tRect = tooltip.firstElementChild.getBoundingClientRect();
    const tWidth = tRect.width;
    const tHeight = tRect.height;

    const gap = 15; // Gap between target and tooltip

    // Reset styles
    tooltip.style.transform = 'none';
    arrow.style.display = 'block';

    // Reset arrow styles
    arrow.style.top = ''; arrow.style.bottom = ''; arrow.style.left = ''; arrow.style.right = '';

    let pos = step.position || 'bottom';

    // --- FLIP LOGIC ---
    // Check available space
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    // Flip if needed
    if (pos === 'top' && spaceTop < tHeight + gap) pos = 'bottom';
    else if (pos === 'bottom' && spaceBottom < tHeight + gap) pos = 'top';
    else if (pos === 'left' && spaceLeft < tWidth + gap) pos = 'right';
    else if (pos === 'right' && spaceRight < tWidth + gap) pos = 'left';


    let tLeft, tTop;
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;

    // --- MAIN POSITIONING ---
    if (pos === 'top') {
        tTop = rect.top - tHeight - gap;
        tLeft = targetCenterX - (tWidth / 2);
    } else if (pos === 'bottom') {
        tTop = rect.bottom + gap;
        tLeft = targetCenterX - (tWidth / 2);
    } else if (pos === 'left') {
        tLeft = rect.left - tWidth - gap;
        tTop = targetCenterY - (tHeight / 2);
    } else if (pos === 'right') {
        tLeft = rect.right + gap;
        tTop = targetCenterY - (tHeight / 2);
    }

    // --- CLAMP TOOLTIP TO VIEWPORT ---
    // Keep 10px padding from screen edges
    const screenPad = 10;

    // Horizontal Clamp
    if (tLeft < screenPad) tLeft = screenPad;
    if (tLeft + tWidth > window.innerWidth - screenPad) tLeft = window.innerWidth - tWidth - screenPad;

    // Vertical Clamp
    if (tTop < screenPad) tTop = screenPad;
    if (tTop + tHeight > window.innerHeight - screenPad) tTop = window.innerHeight - tHeight - screenPad;

    // Apply Tooltip Position
    tooltip.style.left = tLeft + 'px';
    tooltip.style.top = tTop + 'px';

    // --- DYNAMIC ARROW SLIDING ---
    // Calculate where the arrow *should* be to point at target center
    // Relative to the tooltip's top-left corner

    // Borders reset
    arrow.style.borderWidth = '1px';
    arrow.style.borderColor = 'var(--accent)';

    if (pos === 'top' || pos === 'bottom') {
        // Arrow moves horizontally along the edge
        let arrowX = targetCenterX - tLeft;

        // Clamp arrow to keep it inside rounded corners (e.g., 20px from edge)
        const cornerSafe = 20;
        if (arrowX < cornerSafe) arrowX = cornerSafe;
        if (arrowX > tWidth - cornerSafe) arrowX = tWidth - cornerSafe;

        arrow.style.left = arrowX + 'px';
        arrow.style.transform = 'translateX(-50%) rotate(45deg)';

        if (pos === 'top') {
            arrow.style.bottom = '-8px'; // Push out
            // Hide Top/Left borders to look like it points down
            arrow.style.borderTopColor = 'transparent';
            arrow.style.borderLeftColor = 'transparent';
        } else {
            arrow.style.top = '-8px'; // Push out
            // Hide Bottom/Right borders to look like it points up
            arrow.style.borderBottomColor = 'transparent';
            arrow.style.borderRightColor = 'transparent';
        }
    }
    else { // Left or Right
        // Arrow moves vertically along the edge
        let arrowY = targetCenterY - tTop;

        const cornerSafe = 20;
        if (arrowY < cornerSafe) arrowY = cornerSafe;
        if (arrowY > tHeight - cornerSafe) arrowY = tHeight - cornerSafe;

        arrow.style.top = arrowY + 'px';
        arrow.style.transform = 'translateY(-50%) rotate(45deg)';

        if (pos === 'left') {
            arrow.style.right = '-8px';
            // Hide Left/Bottom
            arrow.style.borderLeftColor = 'transparent';
            arrow.style.borderBottomColor = 'transparent';
        } else {
            arrow.style.left = '-8px';
            // Hide Right/Top
            arrow.style.borderRightColor = 'transparent';
            arrow.style.borderTopColor = 'transparent';
        }
    }
}

function endOnboarding() {
    markOnboardingComplete();
    if (onboardingOverlay) onboardingOverlay.remove();
    if (onboardingHighlight) onboardingHighlight.remove();
    if (onboardingTooltip) onboardingTooltip.remove();

    onboardingOverlay = null;
    onboardingHighlight = null;
    onboardingTooltip = null;
}

// --- DEEP DIVE MODAL (Unchanged Logic, just styling check) ---
function showDeepDive(contentId) {
    if (deepDiveModal) deepDiveModal.remove();

    const content = DEEP_DIVE_CONTENT[contentId];
    if (!content) return;

    deepDiveModal = document.createElement('div');
    deepDiveModal.className = 'fixed inset-0 z-[11000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fade-in_0.2s]';
    deepDiveModal.innerHTML = `
        <div class="bg-[#0f172a] border border-[var(--accent)] max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl p-8 shadow-2xl relative" onclick="event.stopPropagation()">
            <button class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors" onclick="this.closest('.fixed').remove()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="prose prose-invert max-w-none">
                ${content}
            </div>
            <div class="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <button class="px-6 py-2 bg-[var(--accent)] text-[#0f172a] font-bold rounded-lg hover:brightness-110 transition-all" onclick="this.closest('.fixed').remove()">
                    Got it
                </button>
            </div>
        </div>
    `;
    deepDiveModal.onclick = (e) => {
        if (e.target === deepDiveModal) deepDiveModal.remove();
    };
    document.body.appendChild(deepDiveModal);
}
