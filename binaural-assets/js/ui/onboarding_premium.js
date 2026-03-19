// MindWave Premium Tour - Powered by Driver.js
// "Tesla-Style" Cinematic Onboarding
// Dependencies: Driver.js (window.driver.js.driver)

const ONBOARDING_KEY = 'mindwave_tour_v1_premium';

const GOAL_KEY = 'mindwave_user_goal';

export function shouldShowOnboarding() {
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
}

export function markOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
}

/**
 * Show a sleek goal selection modal before the tour
 */
export function showGoalSelection(callback) {
    if (localStorage.getItem(GOAL_KEY)) {
        if (callback) callback();
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'goalSelectionModal';
    modal.className = 'fixed inset-0 flex items-center justify-center p-4';
    modal.style.cssText = `
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        animation: fadeIn 0.4s ease;
        z-index: 100000;
        pointer-events: auto;
    `;

    const goals = [
        { id: 'focus', title: 'Deep Focus', emoji: '🧠', color: '#2dd4bf', desc: 'Crush work and study sessions' },
        { id: 'sleep', title: 'Better Sleep', emoji: '🌙', color: '#818cf8', desc: 'Drift off to curated delta waves' },
        { id: 'relax', title: 'Relaxation', emoji: '🌊', color: '#38bdf8', desc: 'Reduce stress and anxiety' },
        { id: 'energy', title: 'Productivity', emoji: '⚡', color: '#fbbf24', desc: 'Boost alertness and coffee-free energy' }
    ];

    modal.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>
        <div style="
            max-width: 500px;
            width: 100%;
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        ">
            <h2 style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 12px;">Personalize Your Mind</h2>
            <p style="font-size: 16px; color: #94a3b8; margin-bottom: 32px;">What brings you to MindWave today?</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                ${goals.map(g => `
                    <button class="goal-btn" data-goal="${g.id}" style="
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 16px;
                        padding: 24px 16px;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                    ">
                        <span style="font-size: 32px;">${g.emoji}</span>
                        <span style="font-weight: 600; color: white; font-size: 14px;">${g.title}</span>
                        <span style="font-size: 11px; color: #64748b; line-height: 1.2;">${g.desc}</span>
                    </button>
                `).join('')}
            </div>

            <p style="font-size: 12px; color: #475569;">You can change this later in settings.</p>
        </div>
    `;

    document.body.appendChild(modal);

    // Track selection
    modal.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            btn.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.03)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            btn.style.transform = 'translateY(0)';
        });
        btn.addEventListener('click', () => {
            const goal = btn.dataset.goal;
            localStorage.setItem(GOAL_KEY, goal);

            // Visual feedback
            btn.style.borderColor = '#2dd4bf';
            btn.style.background = 'rgba(45, 212, 191, 0.1)';

            setTimeout(() => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    if (callback) callback();
                }, 400);
            }, 300);
        });
    });
}

export function startOnboarding(force = false) {
    if (!force && !shouldShowOnboarding()) return;

    // Show Goal Selection first
    if (!localStorage.getItem(GOAL_KEY)) {
        showGoalSelection(() => {
            // Once goal is selected, run the tour
            runTour();
        });
    } else {
        runTour();
    }

    function runTour() {
        const driverObj = window.driver.js.driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(0, 0, 0, 0.85)',
            theme: { color: '#2dd4bf' },
            popoverClass: 'driverjs-theme-premium',
            steps: [
                {
                    element: '#nothing',
                    popover: {
                        title: '✨ Welcome to MindWave',
                        description: `Your personal neuro-audio studio is ready.<br><br>We've optimized your dashboard for <strong>${localStorage.getItem(GOAL_KEY)?.toUpperCase() || 'Wellness'}</strong>.<br><br>Let's take a quick tour.`,
                        side: 'center',
                        align: 'center'
                    }
                },
                {
                    element: '#modeToggle',
                    popover: {
                        title: 'Entrainment Modes',
                        description: 'Choose your method:<br>• <strong>Binaural</strong> (Headphones required)<br>• <strong>Isochronic</strong> (Speaker friendly)<br>• <strong>Monaural</strong> (Hybrid)',
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '#leftToggle',
                    popover: {
                        title: 'Frequency Presets',
                        description: 'Slide open the <strong>Left Panel</strong> to access curated brainwave states like <em>Deep Sleep</em>, <em>Focus</em>, and <em>Meditation</em>.',
                        side: 'right',
                        align: 'center',
                        onHighlightStarted: () => {
                            const panel = document.getElementById('leftPanel');
                            if (panel && !panel.classList.contains('-translate-x-full')) panel.classList.add('-translate-x-full');
                        }
                    }
                },
                {
                    element: '#rightToggle',
                    popover: {
                        title: 'DJ Mixer Access',
                        description: 'Click here or slide open to access the <strong>Studio Mixer</strong>.',
                        side: 'left',
                        align: 'center',
                        onHighlightStarted: () => {
                            const panel = document.getElementById('rightPanel');
                            if (panel && !panel.classList.contains('translate-x-full')) panel.classList.add('translate-x-full');
                        }
                    }
                },
                {
                    element: '#rightPanel',
                    popover: {
                        title: 'Studio Mixer',
                        description: 'Layer powerful sounds over your session.',
                        side: 'left',
                        align: 'center',
                        onHighlightStarted: () => {
                            const panel = document.getElementById('rightPanel');
                            if (panel && panel.classList.contains('translate-x-full')) panel.classList.remove('translate-x-full');
                        }
                    }
                },
                {
                    element: '.visual-dock',
                    popover: {
                        title: 'Visual Matrix',
                        description: 'Select <strong>Matrix</strong> or <strong>Flow</strong> modes for visual immersion.',
                        side: 'top',
                        align: 'center',
                        onHighlightStarted: () => {
                            const panel = document.getElementById('rightPanel');
                            if (panel && !panel.classList.contains('translate-x-full')) panel.classList.add('translate-x-full');
                        }
                    }
                },
                {
                    element: '#playBtn',
                    popover: {
                        title: 'Ready to Launch?',
                        description: 'Put on your headphones. Set your intention.<br><strong>Press Play</strong> to begin your journey.',
                        side: 'top',
                        align: 'center'
                    }
                }
            ],
            onDestroyStarted: () => {
                if (!driverObj.hasNextStep() || confirm('Skip the tour?')) {
                    markOnboardingComplete();
                    driverObj.destroy();
                }
            },
        });

        driverObj.drive();
    }
}

// Make globally available for button clicks
window.startOnboarding = () => startOnboarding(true);
