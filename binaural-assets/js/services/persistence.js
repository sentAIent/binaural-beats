/**
 * Persistence Service
 * Handles saving and loading user preferences to LocalStorage.
 * 
 * Keys:
 * - mindwave_prefs: Main preferences object (volumes, theme, lock state)
 */

import { state } from '../state.js';
const STORAGE_KEY = 'mindwave_prefs_v1';
const AUTOSAVE_DELAY = 1000; // 1 second debounce

let saveTimeout = null;

// Default Preferences
const DEFAULTS = {
    theme: 'sentaient', // Default to brand theme
    volumes: {
        master: 0.8,
        binaural: 0.5,
        atmos: 0.3
    },
    visuals: {
        aiLocked: false,
        speed: 1.0,
        brightness: 1.0,
        activeMode: 'particles' // Default mode
    },
    ui: {
        sidebarLeftOpen: false,
        sidebarRightOpen: false
    }
};

/**
 * Load preferences from LocalStorage and apply them to the state/engine.
 * Returns the loaded preferences object for UI synchronization.
 */
export function loadUserPreferences() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULTS;

        const prefs = { ...DEFAULTS, ...JSON.parse(raw) };

        // 1. Apply State
        state.aiVisualsLocked = prefs.visuals.aiLocked;

        // 2. Return for UI to handle slider Application
        // (Audio engine might not be ready yet, so we return values for controls.js to apply)
        console.log('[Persistence] Loaded preferences:', prefs);
        return prefs;

    } catch (e) {
        console.error('[Persistence] Failed to load preferences:', e);
        return DEFAULTS;
    }
}

/**
 * Save current application state to LocalStorage.
 * Debounced to prevent excessive writes during slider dragging.
 */
export function saveUserPreferences() {
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        try {
            // Gatrer current state
            const prefs = {
                theme: document.body.dataset.theme || DEFAULTS.theme,
                volumes: {
                    master: state.masterVolume, // Assuming state tracks this or we get from sliders
                    binaural: state.binauralVolume,
                    atmos: state.atmosVolume
                },
                visuals: {
                    aiLocked: state.aiVisualsLocked,
                    speed: state.visualSpeed || 1.0,
                    brightness: state.visualBrightness || 1.0,
                    // activeMode: ... (We might need to ask visualizer for this)
                },
                ui: {
                    sidebarLeftOpen: document.getElementById('leftPanel')?.classList.contains('open') || false,
                    sidebarRightOpen: document.getElementById('rightPanel')?.classList.contains('open') || false
                }
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            console.log('[Persistence] Saved preferences');
        } catch (e) {
            console.warn('[Persistence] Save failed:', e);
        }
    }, AUTOSAVE_DELAY);
}

// Helper to manually trigger save (e.g. on button click)
export function forceSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = null;
    // ... Instant save logic if needed, or just call saveUserPreferences with 0 delay copy
}
