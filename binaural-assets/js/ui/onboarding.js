/**
 * Interactive User Onboarding (Shepherd.js)
 * Highlights core MindWave features for first-time visitors.
 */

const ONBOARDING_KEY = 'mindwave_tour_completed';

export function initializeOnboarding() {
    // Check if the user has already completed the tour
    if (localStorage.getItem(ONBOARDING_KEY) === 'true') {
        return;
    }

    // Delay the tour slightly to allow heavy WebGL and Audio contexts to settle
    setTimeout(() => {
        startTour();
    }, 2500);
}

function startTour() {
    if (typeof Shepherd === 'undefined') {
        console.warn('[Onboarding] Shepherd.js not loaded. Skipping tour.');
        return;
    }

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shadow-2xl bg-[#11111a] border border-white/10 text-white rounded-xl p-4 font-sans',
            scrollTo: true,
            cancelIcon: {
                enabled: true
            }
        }
    });

    // Step 1: The Audio Mixer (Left Sidebar)
    tour.addStep({
        id: 'step-mixer',
        text: `<b>Welcome to MindWave! 🧠</b><br><br>This is your Audio Mixer. Here you can blend Binaural Beats (Focus/Sleep frequencies) with soothing atmospheres like Heavy Rain or Brown Noise.`,
        attachTo: {
            element: '.md\\:flex.w-80', // The left sidebar container
            on: 'right'
        },
        buttons: [
            {
                text: 'Skip',
                action: tour.cancel,
                classes: 'text-white/50 hover:text-white px-4 py-2 text-sm transition-colors'
            },
            {
                text: 'Next',
                action: tour.next,
                classes: 'bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
            }
        ]
    });

    // Step 2: The Visualizer Background (Right Controls)
    tour.addStep({
        id: 'step-visualizer',
        text: `<b>Interactive Visuals 🎨</b><br><br>Need a different vibe? Click here to open the Visuals Gallery. The background reacts in real-time to the audio frequencies you select!`,
        attachTo: {
            element: '#themeBtn',
            on: 'left'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                classes: 'text-white/50 hover:text-white px-4 py-2 text-sm transition-colors'
            },
            {
                text: 'Next',
                action: tour.next,
                classes: 'bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
            }
        ]
    });

    // Step 3: The Pomodoro Engine (Bottom Center)
    tour.addStep({
        id: 'step-pomodoro',
        text: `<b>Deep Work Engine ⏱️</b><br><br>When you're ready to focus, set your intent and hit Play. We'll automatically guide your brainwaves through 25-minute Deep Focus cycles and 5-minute Rest periods. Good luck!`,
        attachTo: {
            element: '#playControlsContainer',
            on: 'top'
        },
        buttons: [
            {
                text: 'Finish',
                action: tour.complete,
                classes: 'bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
            }
        ]
    });

    // Mark as completed when the tour finishes or is dismissed
    tour.on('complete', () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        console.log('[Onboarding] Tour completed.');
    });
    tour.on('cancel', () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        console.log('[Onboarding] Tour dismissed.');
    });

    tour.start();
}
