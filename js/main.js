import { setupUI } from './ui/controls.js';
import { initCursor } from './ui/cursor.js';
import { initFirebase } from './services/firebase.js';
import { initAuthUI } from './ui/auth-controller.js';
import { startOnboarding, shouldShowOnboarding } from './ui/onboarding.js';
import { initHaptics } from './utils/haptics.js';
import { initShareFeature, copyShareLink } from './services/share.js';
import { recordVisit } from './services/analytics.js';
import { setupSwipeGestures } from './ui/layout.js';
import { initResizablePanels } from './ui/resize-panels.js';

// Content Modules - Loaded dynamically after UI is ready
// import { initStoryPlayer, renderStoryCards, playStory, stopStory, setStoryVolume } from './content/stories.js';
// import { initAudioLibrary, setupUploadHandler } from './content/audio-library.js';
// import { initJourney, renderJourneyUI } from './content/journey.js';
// import { initClassical } from './content/classical.js';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Main] DOMLoaded - Initializing UI...");

    // Firebase & Auth (non-blocking)
    try {
        initFirebase();
        initAuthUI();
    } catch (e) {
        console.warn("[Main] Firebase/Auth Init Failed:", e);
    }

    // Core UI Setup - Critical path
    setupUI();

    // Mobile features
    initHaptics();
    setupSwipeGestures();

    // Resizable side panels
    initResizablePanels();

    // Analytics
    recordVisit();

    // URL sharing
    initShareFeature();

    // Custom Cursor
    initCursor();

    // Hide loading screen immediately once core UI is ready
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.remove(), 500);
    }

    console.log("[Main] Core UI Ready - Loading content modules...");

    // Defer content module loading to after paint (non-blocking)
    requestIdleCallback ? requestIdleCallback(loadContentModules) : setTimeout(loadContentModules, 100);

    // Expose share function globally for UI buttons
    window.shareCurrentPreset = async () => {
        const result = await copyShareLink();
        if (result.success) {
            const toast = document.createElement('div');
            toast.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(45,212,191,0.9);color:#0f172a;padding:12px 24px;border-radius:12px;font-size:12px;font-weight:bold;z-index:9999;`;
            toast.textContent = '🔗 Share link copied!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    };

    // Show onboarding for new users (after disclaimer is accepted)
    if (shouldShowOnboarding()) {
        const checkAndStartOnboarding = () => {
            if (localStorage.getItem('mindwave_disclaimer_accepted') === 'true') {
                setTimeout(startOnboarding, 500);
            } else {
                setTimeout(checkAndStartOnboarding, 1000);
            }
        };
        checkAndStartOnboarding();
    }

    console.log("[Main] App Initialization Complete.");
});

// Load non-critical content modules after initial render
async function loadContentModules() {
    try {
        // Dynamic imports - only loaded when needed
        const [storiesModule, audioLibModule, journeyModule, classicalModule] = await Promise.all([
            import('./content/stories.js'),
            import('./content/audio-library.js'),
            import('./content/journey.js'),
            import('./content/classical.js')
        ]);

        // Sleep Stories
        storiesModule.initStoryPlayer();
        const storyContainer = document.getElementById('storyContainer');
        if (storyContainer) {
            storiesModule.renderStoryCards(storyContainer);
        }

        // Story volume slider
        const storyVolumeSlider = document.getElementById('storyVolumeSlider');
        const storyVolumeValue = document.getElementById('storyVolumeValue');
        if (storyVolumeSlider) {
            storyVolumeSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                storiesModule.setStoryVolume(vol);
                if (storyVolumeValue) storyVolumeValue.textContent = Math.round(vol * 100) + '%';
            });
        }

        // Stop story button
        const stopStoryBtn = document.getElementById('stopStoryBtn');
        if (stopStoryBtn) {
            stopStoryBtn.addEventListener('click', storiesModule.stopStory);
        }

        // Classical Library
        console.log("[Main] Initializing Classical...");
        classicalModule.initClassical();
        console.log("[Main] Classical initialized successfully");

        // Audio Library
        await audioLibModule.initAudioLibrary();
        audioLibModule.setupUploadHandler();

        // Journey Program
        journeyModule.initJourney();
        const journeyBtn = document.getElementById('journeyBtn');
        const journeyModal = document.getElementById('journeyModal');
        const closeJourneyBtn = document.getElementById('closeJourneyBtn');
        const journeyContainer = document.getElementById('journeyContainer');

        if (journeyBtn && journeyModal) {
            journeyBtn.addEventListener('click', () => {
                journeyModal.classList.remove('hidden');
                if (journeyContainer) journeyModule.renderJourneyUI(journeyContainer);
            });
        }

        if (closeJourneyBtn && journeyModal) {
            closeJourneyBtn.addEventListener('click', () => {
                journeyModal.classList.add('hidden');
            });
            journeyModal.addEventListener('click', (e) => {
                if (e.target === journeyModal) journeyModal.classList.add('hidden');
            });
        }

        console.log("[Main] Content modules loaded successfully");
    } catch (e) {
        console.warn("[Main] Content module loading failed:", e);
    }
}
