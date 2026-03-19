/**
 * Session Timer Module
 * Handles timed sessions with countdown, callbacks, and persistence,
 * including cyclic Pomodoro modes.
 */

import { state, els } from '../state.js';

let timerInterval = null;
let sessionStartTime = null;
let sessionDuration = 0; // in milliseconds
let pausedTimeRemaining = 0;
let onTickCallback = null;
let onCompleteCallback = null;
let onPhaseChangeCallback = null;
let isInfiniteSession = false; // New flag for Free mode

// Pomodoro / Phase state
let isPomodoro = false;
let currentPhase = 'NONE'; // 'FOCUS' | 'REST' | 'NONE'
let pomodoroPhaseQueue = []; // array of duration info { phase: 'FOCUS', durationMs: 1500000 }
let currentPhaseIndex = 0;

// Duration presets in minutes
export const DURATION_PRESETS = [5, 15, 30, 60, 90, 120, 180];

/**
 * Parses duration argument (can be int minutes or 'pomodoro_X_Y' string)
 * Returns config object for the timer sequence.
 */
function parseDurationConfig(durationInput) {
    if (typeof durationInput === 'string' && durationInput.startsWith('pomodoro_')) {
        const parts = durationInput.split('_');

        const focusMins = parseInt(parts[1], 10);
        const restMins = parseInt(parts[2], 10);
        return {
            isInfinite: false,
            isPomodoro: true,
            phases: [
                { phase: 'FOCUS', durationMs: focusMins * 60 * 1000 },
                { phase: 'REST', durationMs: restMins * 60 * 1000 }
            ]
        };
    }

    const mins = parseInt(durationInput, 10);
    return {
        isInfinite: (mins === 0),
        isPomodoro: false,
        phases: [
            { phase: 'NONE', durationMs: mins * 60 * 1000 }
        ]
    };
}


/**
 * Start a new session timer
 * @param {number|string} durationInput - Session duration in minutes (0 for infinite) or 'pomodoro_25_5'
 * @param {Object} callbacks - { onTick, onComplete, onPhaseChange }
 */
export function startSession(durationInput, callbacks = {}) {
    if (timerInterval) clearInterval(timerInterval);

    const config = parseDurationConfig(durationInput);

    isInfiniteSession = config.isInfinite;
    isPomodoro = config.isPomodoro;
    pomodoroPhaseQueue = config.phases;
    currentPhaseIndex = 0;

    const currentPhaseConfig = pomodoroPhaseQueue[currentPhaseIndex];
    currentPhase = currentPhaseConfig.phase;
    sessionDuration = currentPhaseConfig.durationMs;

    sessionStartTime = Date.now();
    pausedTimeRemaining = 0;

    onTickCallback = callbacks.onTick || null;
    onCompleteCallback = callbacks.onComplete || null;
    onPhaseChangeCallback = callbacks.onPhaseChange || null;

    state.sessionActive = true;
    state.sessionDuration = typeof durationInput === 'number' ? durationInput : durationInput;

    timerInterval = setInterval(tick, 1000);

    // Fire initial phase change before first tick
    if (isPomodoro && onPhaseChangeCallback) {
        onPhaseChangeCallback(currentPhase);
    }

    tick(); // Initial tick

    console.log(`[Session] Started: ${isInfiniteSession ? 'Infinite' : durationInput} mode`);
}

/**
 * Handles transitioning to the next phase in a Pomodoro queue
 */
function advancePhase() {
    currentPhaseIndex = (currentPhaseIndex + 1) % pomodoroPhaseQueue.length;
    const nextPhaseConfig = pomodoroPhaseQueue[currentPhaseIndex];

    currentPhase = nextPhaseConfig.phase;
    sessionDuration = nextPhaseConfig.durationMs;
    sessionStartTime = Date.now();
    pausedTimeRemaining = 0;

    console.log(`[Session] Advancing phase to: ${currentPhase}`);

    if (onPhaseChangeCallback) {
        onPhaseChangeCallback(currentPhase);
    }
}


/**
 * Pause the current session
 */
export function pauseSession() {
    if (!timerInterval) return;

    clearInterval(timerInterval);
    timerInterval = null;

    if (isInfiniteSession) {
        pausedTimeRemaining = getElapsed();
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
    if (timerInterval) return;

    if (isInfiniteSession) {
        sessionStartTime = Date.now() - pausedTimeRemaining;
    } else {
        if (pausedTimeRemaining <= 0 && !isInfiniteSession) return;
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
    isPomodoro = false;
    currentPhase = 'NONE';
    currentPhaseIndex = 0;
    pomodoroPhaseQueue = [];

    // Notify main controller we dropped out of phased modes
    if (onPhaseChangeCallback) onPhaseChangeCallback('NONE');

    console.log(`[Session] Stopped`);
}

/**
 * Get remaining time in milliseconds (Countdown)
 */
export function getTimeRemaining() {
    if (pausedTimeRemaining > 0 && !state.sessionActive) return pausedTimeRemaining;
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
    if (isInfiniteSession) return 100;
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
            remaining: elapsed,
            formatted: formatTime(elapsed),
            progress: 0,
            isInfinite: true,
            phase: currentPhase
        };
    } else {
        const remaining = getTimeRemaining();
        timeData = {
            remaining: remaining,
            formatted: formatTime(remaining),
            progress: getProgress(),
            isInfinite: false,
            phase: currentPhase
        };

        if (remaining <= 0) {
            // Loop Pomodoro or finish Standard timer
            if (isPomodoro) {
                advancePhase();
                return; // Let next tick() pick it up on 1000ms
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                state.sessionActive = false;

                if (onCompleteCallback) {
                    onCompleteCallback();
                }

                console.log(`[Session] Complete!`);
                return;
            }
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
