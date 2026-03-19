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
let isInfiniteSession = false; // New flag for Free mode

// Duration presets in minutes
export const DURATION_PRESETS = [5, 15, 30, 60, 90, 120, 180];

/**
 * Start a new session timer
 * @param {number} durationMinutes - Session duration in minutes (0 for infinite)
 * @param {Object} callbacks - { onTick, onComplete }
 */
export function startSession(durationMinutes, callbacks = {}) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    isInfiniteSession = (durationMinutes === 0);
    sessionDuration = durationMinutes * 60 * 1000;
    sessionStartTime = Date.now();
    pausedTimeRemaining = 0;
    onTickCallback = callbacks.onTick || null;
    onCompleteCallback = callbacks.onComplete || null;

    state.sessionActive = true;
    state.sessionDuration = durationMinutes;

    timerInterval = setInterval(tick, 1000);
    tick(); // Initial tick

    console.log(`[Session] Started: ${isInfiniteSession ? 'Infinite' : durationMinutes + ' minutes'}`);
}

/**
 * Pause the current session
 */
export function pauseSession() {
    if (!timerInterval) return;

    clearInterval(timerInterval);
    timerInterval = null;

    // For infinite, we store elapsed time effectively
    if (isInfiniteSession) {
        pausedTimeRemaining = getElapsed(); // terminology reuse, technically 'elapsed at pause'
    } else {
        pausedTimeRemaining = getTimeRemaining();
    }

    state.sessionPaused = true;

    console.log(`[Session] Paused`);
}

/**
 * Resume a paused session
 */
export function resumeSession() {
    if (timerInterval) return; // Already running

    // Recalculate start time based on paused state
    if (isInfiniteSession) {
        // New start time = Now - Previously Elapsed
        sessionStartTime = Date.now() - pausedTimeRemaining;
    } else {
        if (pausedTimeRemaining <= 0 && !isInfiniteSession) return;
        // New start time = Now - (Total Duration - Remaining)
        sessionStartTime = Date.now() - (sessionDuration - pausedTimeRemaining);
    }

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
    isInfiniteSession = false;

    console.log(`[Session] Stopped`);
}

/**
 * Get remaining time in milliseconds (Countdown)
 */
export function getTimeRemaining() {
    if (pausedTimeRemaining > 0 && !state.sessionActive) return pausedTimeRemaining; // Handle paused state correctly
    if (!sessionStartTime) return 0;

    const elapsed = Date.now() - sessionStartTime;
    return Math.max(0, sessionDuration - elapsed);
}

/**
 * Get elapsed time in milliseconds (Count-up)
 */
export function getElapsed() {
    if (state.sessionPaused) return pausedTimeRemaining;
    if (!sessionStartTime) return 0;
    return Date.now() - sessionStartTime;
}

/**
 * Get session progress as percentage (0-100)
 */
export function getProgress() {
    if (isInfiniteSession) return 100; // Always full for infinite? Or maybe 0? Let's say 100 or cycle.
    if (sessionDuration === 0) return 0;
    const remaining = getTimeRemaining();
    return ((sessionDuration - remaining) / sessionDuration) * 100;
}

/**
 * Format milliseconds as MM:SS or HH:MM:SS
 */
export function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
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
    let timeData;

    if (isInfiniteSession) {
        const elapsed = getElapsed();
        timeData = {
            remaining: elapsed, // For infinite, 'remaining' slot holds elapsed for display
            formatted: formatTime(elapsed),
            progress: 0, // No progress ring for infinite
            isInfinite: true
        };
    } else {
        const remaining = getTimeRemaining();
        timeData = {
            remaining: remaining,
            formatted: formatTime(remaining),
            progress: getProgress(),
            isInfinite: false
        };

        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            state.sessionActive = false;

            if (onCompleteCallback) {
                onCompleteCallback();
            }

            console.log(`[Session] Complete!`);
            return; // Stop here
        }
    }

    if (onTickCallback) {
        onTickCallback(timeData);
    }
}

/**
 * Check if session is currently active
 */
export function isSessionActive() {
    return state.sessionActive && (timerInterval !== null || state.sessionPaused);
}

/**
 * Check if session is paused
 */
export function isSessionPaused() {
    return state.sessionPaused;
}
