// MindWave Haptic Feedback
// Provides subtle haptic feedback for mobile devices

const HAPTIC_KEY = 'mindwave_haptics_enabled';

// Check if haptics are supported and enabled
export function isHapticsSupported() {
    return 'vibrate' in navigator;
}

export function isHapticsEnabled() {
    return isHapticsSupported() && localStorage.getItem(HAPTIC_KEY) !== 'false';
}

export function setHapticsEnabled(enabled) {
    localStorage.setItem(HAPTIC_KEY, enabled ? 'true' : 'false');
}

// --- HAPTIC PATTERNS ---

// Light tap (button press)
export function hapticTap() {
    if (!isHapticsEnabled()) return;
    try {
        navigator.vibrate(10);
    } catch (e) {
        console.warn('[Haptics] Vibration failed:', e);
    }
}

// Medium feedback (selection, toggle)
export function hapticSelection() {
    if (!isHapticsEnabled()) return;
    try {
        navigator.vibrate(20);
    } catch (e) {
        console.warn('[Haptics] Vibration failed:', e);
    }
}

// Success pattern (double tap)
export function hapticSuccess() {
    if (!isHapticsEnabled()) return;
    try {
        navigator.vibrate([15, 50, 15]);
    } catch (e) {
        console.warn('[Haptics] Vibration failed:', e);
    }
}

// Warning/error pattern
export function hapticWarning() {
    if (!isHapticsEnabled()) return;
    try {
        navigator.vibrate([30, 30, 30]);
    } catch (e) {
        console.warn('[Haptics] Vibration failed:', e);
    }
}

// Rhythm sync (for beat sync mode - experimental)
export function hapticPulse(durationMs = 25) {
    if (!isHapticsEnabled()) return;
    try {
        navigator.vibrate(durationMs);
    } catch (e) {
        // Silent fail for continuous pulses
    }
}

// Initialize haptics on interactive elements
export function initHaptics() {
    if (!isHapticsSupported()) {
        console.log('[Haptics] Not supported on this device');
        return;
    }

    // Add haptic feedback to preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('touchstart', () => hapticTap(), { passive: true });
    });

    // Add haptic feedback to play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('touchstart', () => hapticSelection(), { passive: true });
    }

    // Add haptic feedback to toggle buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('touchstart', () => hapticTap(), { passive: true });
    });

    console.log('[Haptics] Initialized');
}
