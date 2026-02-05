/**
 * Session Timer Module
 * Handles timed sessions with countdown, callbacks, and persistence
 */

import { state, els } from '../state.js';

let timerInterval = null;
let sessionStartTime = null;
let sessionDuration = 0; // in milliseconds
let pausedTimeRemaining = 0;
let onTickCallback = null;
let onCompleteCallback = null;

// Duration presets in minutes
export const DURATION_PRESETS = [5, 15, 30, 60, 90, 120, 180];

/**
 * Start a new session timer
 * @param {number} durationMinutes - Session duration in minutes
 * @param {Object} callbacks - { onTick, onComplete }
 */
export function startSession(durationMinutes, callbacks = {}) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    sessionDuration = durationMinutes * 60 * 1000;
    sessionStartTime = Date.now();
    pausedTimeRemaining = 0;
    onTickCallback = callbacks.onTick || null;
    onCompleteCallback = callbacks.onComplete || null;

    state.sessionActive = true;
    state.sessionDuration = durationMinutes;

    timerInterval = setInterval(tick, 1000);
    tick(); // Initial tick

    console.log(`[Session] Started: ${durationMinutes} minutes`);
}

/**
 * Pause the current session
 */
export function pauseSession() {
    if (!timerInterval) return;

    clearInterval(timerInterval);
    timerInterval = null;
    pausedTimeRemaining = getTimeRemaining();
    state.sessionPaused = true;

    console.log(`[Session] Paused: ${Math.floor(pausedTimeRemaining / 1000)}s remaining`);
}

/**
 * Resume a paused session
 */
export function resumeSession() {
    if (timerInterval || pausedTimeRemaining <= 0) return;

    sessionStartTime = Date.now() - (sessionDuration - pausedTimeRemaining);
    state.sessionPaused = false;

    timerInterval = setInterval(tick, 1000);
    tick();

    console.log(`[Session] Resumed`);
}

/**
 * Stop and reset the session timer
 */
export function stopSession() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    state.sessionActive = false;
    state.sessionPaused = false;
    sessionStartTime = null;
    sessionDuration = 0;
    pausedTimeRemaining = 0;

    console.log(`[Session] Stopped`);
}

/**
 * Get remaining time in milliseconds
 */
export function getTimeRemaining() {
    if (pausedTimeRemaining > 0) return pausedTimeRemaining;
    if (!sessionStartTime) return 0;

    const elapsed = Date.now() - sessionStartTime;
    return Math.max(0, sessionDuration - elapsed);
}

/**
 * Get session progress as percentage (0-100)
 */
export function getProgress() {
    if (sessionDuration === 0) return 0;
    const remaining = getTimeRemaining();
    return ((sessionDuration - remaining) / sessionDuration) * 100;
}

/**
 * Format time remaining as MM:SS or HH:MM:SS
 */
export function formatTimeRemaining() {
    const ms = getTimeRemaining();
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Internal tick function
 */
function tick() {
    const remaining = getTimeRemaining();

    if (onTickCallback) {
        onTickCallback({
            remaining,
            formatted: formatTimeRemaining(),
            progress: getProgress()
        });
    }

    if (remaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        state.sessionActive = false;

        if (onCompleteCallback) {
            onCompleteCallback();
        }

        console.log(`[Session] Complete!`);
    }
}

/**
 * Check if session is currently active
 */
export function isSessionActive() {
    return state.sessionActive && timerInterval !== null;
}

/**
 * Check if session is paused
 */
export function isSessionPaused() {
    return state.sessionPaused && pausedTimeRemaining > 0;
}
