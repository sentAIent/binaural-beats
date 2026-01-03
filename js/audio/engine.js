import { state, els, SOUNDSCAPES, STATE_INSIGHTS, SOUND_INSIGHTS } from '../state.js';
import { initVisualizer } from '../visuals/visualizer.js';
import { stopRecording } from '../export/recorder.js';

let uiCallback = null;

export function registerUICallback(cb) {
    uiCallback = cb;
}

// Audio Context & Nodes
const AudioContext = window.AudioContext || window.webkitAudioContext;

// Worklet Code
const recorderWorkletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffers = [];
    }
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const left = new Float32Array(input[0]);
            const right = new Float32Array(input[1] || input[0]);
            this.port.postMessage([left, right], [left.buffer, right.buffer]);
        }
        return true;
    }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;

export function initAudio() {
    if (!state.audioCtx) {
        state.audioCtx = new AudioContext();
    }
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(e => console.warn("Resume aborted", e));
    }
}

async function setupWorklet() {
    if (state.workletInitialized) return;
    if (state.audioCtx && state.audioCtx.audioWorklet) {
        try {
            const blob = new Blob([recorderWorkletCode], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);
            await state.audioCtx.audioWorklet.addModule(url);
            state.workletInitialized = true;
        } catch (e) {
            console.warn("Worklet setup warning:", e);
        }
    }
}

export async function startAudio() {
    if (state.isStarting) return;
    state.isStarting = true;
    console.log("[Audio] Starting engine...");

    try {
        // Force new context creation inside user gesture if needed
        if (!state.audioCtx || state.audioCtx.state === 'closed') {
            state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            state.workletInitialized = false; // Reset worklet flag if context is new
        }

        // Resume context immediately if suspended (common browser requirement)
        if (state.audioCtx.state === 'suspended') {
            await state.audioCtx.resume();
            console.log("[Audio] Context resumed");
        }

        await setupWorklet();
        state.destStreamNode = state.audioCtx.createMediaStreamDestination();

        // Create Nodes
        state.oscLeft = state.audioCtx.createOscillator();
        state.oscRight = state.audioCtx.createOscillator();

        // StereoPanner fallback for older browsers just in case
        if (state.audioCtx.createStereoPanner) {
            state.panLeft = state.audioCtx.createStereoPanner();
            state.panRight = state.audioCtx.createStereoPanner();
            state.panLeft.pan.value = -1;
            state.panRight.pan.value = 1;
        } else {
            // Simple panner fallback if needed (rare now)
            state.panLeft = state.audioCtx.createPanner();
            state.panLeft.panningModel = 'equalpower';
            state.panLeft.setPosition(-1, 0, 0);
            state.panRight = state.audioCtx.createPanner();
            state.panRight.panningModel = 'equalpower';
            state.panRight.setPosition(1, 0, 0);
        }

        state.beatsGain = state.audioCtx.createGain();
        state.masterAtmosGain = state.audioCtx.createGain();
        state.masterGain = state.audioCtx.createGain();

        // Master Balance Panner
        if (state.audioCtx.createStereoPanner) {
            state.masterPanner = state.audioCtx.createStereoPanner();
        } else {
            console.warn("StereoPanner not supported for Master Balance");
            state.masterPanner = state.audioCtx.createGain(); // Dummy fallback
        }

        state.masterCompressor = state.audioCtx.createDynamicsCompressor();
        state.analyserLeft = state.audioCtx.createAnalyser();
        state.analyserRight = state.audioCtx.createAnalyser();
        state.analyserLeft.fftSize = 2048;
        state.analyserRight.fftSize = 2048;


        // Connections
        state.oscLeft.connect(state.panLeft);
        state.oscRight.connect(state.panRight);
        state.panLeft.connect(state.analyserLeft);
        state.panLeft.connect(state.beatsGain);
        state.panRight.connect(state.analyserRight);
        state.panRight.connect(state.beatsGain);
        state.beatsGain.connect(state.masterGain);
        state.masterAtmosGain.connect(state.masterGain);

        // Output Chain: Gain -> Panner -> Compressor -> Limiter -> Dest
        state.masterGain.connect(state.masterPanner);
        state.masterPanner.connect(state.masterCompressor);

        // Safety Limiter (Promoted to state to avoid GC)
        state.limiter = state.audioCtx.createDynamicsCompressor();
        state.limiter.threshold.value = -1.0;
        state.limiter.knee.value = 0;
        state.limiter.ratio.value = 20.0;
        state.limiter.attack.value = 0.001;
        state.limiter.release.value = 0.1;

        state.masterCompressor.connect(state.limiter);
        state.limiter.connect(state.audioCtx.destination);

        // Recording Route
        state.videoCaptureGain = state.audioCtx.createGain();
        state.videoCaptureGain.gain.value = 1;
        state.limiter.connect(state.videoCaptureGain);
        state.videoCaptureGain.connect(state.destStreamNode);

        // Compressor Settings
        state.masterCompressor.threshold.value = -3;
        state.masterCompressor.knee.value = 12;
        state.masterCompressor.ratio.value = 2;
        state.masterCompressor.attack.value = 0.05;
        state.masterCompressor.release.value = 0.1;

        // Worklet Node
        if (state.workletInitialized && !state.workletNode) {
            try {
                state.workletNode = new AudioWorkletNode(state.audioCtx, 'recorder-processor');
                // Ensure no direct output to destination here to avoid double audio
                // It listens via specific routing when recording starts
            } catch (e) { console.warn("Worklet node creation failed", e); }
        }

        // Initialize Frequencies & Volumes with Safe Defaults
        const baseFreq = parseFloat(els.baseSlider ? els.baseSlider.value : 200) || 200;
        const beatFreq = parseFloat(els.beatSlider ? els.beatSlider.value : 10) || 10;
        console.log(`[Audio] startAudio reading sliders: Base=${baseFreq}Hz, Beat=${beatFreq}Hz`);
        state.oscLeft.frequency.value = baseFreq;
        state.oscRight.frequency.value = baseFreq + beatFreq;

        const volVal = parseFloat(els.volSlider ? els.volSlider.value : 0.5);
        const safeVol = isNaN(volVal) ? 0.5 : volVal;

        const masterVal = parseFloat(els.masterVolSlider ? els.masterVolSlider.value : 1.0);
        const safeMaster = isNaN(masterVal) ? 1.0 : masterVal;

        const atmosVal = parseFloat(els.atmosMasterSlider ? els.atmosMasterSlider.value : 0.8);
        const safeAtmos = isNaN(atmosVal) ? 0.8 : atmosVal;

        updateFrequencies();
        const now = state.audioCtx.currentTime;

        // Initial Gain Ramp
        state.beatsGain.gain.cancelScheduledValues(now);
        state.beatsGain.gain.setValueAtTime(0, now);
        state.beatsGain.gain.linearRampToValueAtTime(safeVol, now + 0.5);

        state.masterAtmosGain.gain.cancelScheduledValues(now);
        state.masterAtmosGain.gain.setValueAtTime(safeAtmos, now);

        state.masterGain.gain.cancelScheduledValues(now);
        state.masterGain.gain.setValueAtTime(safeMaster, now);

        state.oscLeft.start(now);
        state.oscRight.start(now);
        state.isPlaying = true;

        // Setup Media Session for lock screen controls
        setupMediaSession();

        console.log(`[Audio] Started. Base: ${baseFreq}Hz, Beat: ${beatFreq}Hz, Vol: ${safeVol}`);
        console.log(`[Audio Diagnostics] Ctx State: ${state.audioCtx.state}`);
        console.log(`[Audio Diagnostics] Master Gain: ${state.masterGain.gain.value}`);
        console.log(`[Audio Diagnostics] Beats Gain Target: ${state.beatsGain.gain.value}`);
        console.log(`[Audio Diagnostics] Dest Node:`, state.destStreamNode);

        // Start Soundscapes
        if (state.soundscapeSettings) {
            Object.keys(state.soundscapeSettings).forEach(id => {
                const s = state.soundscapeSettings[id];
                if (s && s.vol > 0) {
                    startSingleSoundscape(id, s.vol, s.tone, s.speed);
                }
            });
        }

        if (uiCallback) uiCallback(true);
        initVisualizer();

    } catch (e) {
        console.error("Audio Start Error:", e);
        alert("Audio Engine Error: " + e.message);
        state.isPlaying = false;
        if (uiCallback) uiCallback(false);
    } finally {
        state.isStarting = false;
    }
}

// --- MEDIA SESSION API (Lock Screen / Background Controls) ---
function setupMediaSession() {
    if (!('mediaSession' in navigator)) {
        console.log('[MediaSession] Not supported');
        return;
    }

    // Get current preset info for metadata
    const beatFreq = parseFloat(els.beatSlider?.value || 10);
    let presetName = 'Custom Session';
    if (beatFreq < 4) presetName = 'Delta - Deep Sleep';
    else if (beatFreq < 8) presetName = 'Theta - Meditation';
    else if (beatFreq < 14) presetName = 'Alpha - Relaxation';
    else if (beatFreq < 30) presetName = 'Beta - Focus';
    else if (beatFreq < 50) presetName = 'Gamma - Awareness';
    else presetName = 'Hyper-Gamma - Peak Performance';

    navigator.mediaSession.metadata = new MediaMetadata({
        title: presetName,
        artist: 'MindWave',
        album: 'Binaural Beats Session',
        artwork: [
            { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
    });

    navigator.mediaSession.playbackState = 'playing';

    // Action handlers
    navigator.mediaSession.setActionHandler('play', () => {
        if (!state.isPlaying && state.audioCtx) {
            state.audioCtx.resume();
            console.log('[MediaSession] Play triggered');
        }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        if (state.isPlaying && state.audioCtx) {
            state.audioCtx.suspend();
            console.log('[MediaSession] Pause triggered');
        }
    });

    navigator.mediaSession.setActionHandler('stop', () => {
        stopAudio();
        console.log('[MediaSession] Stop triggered');
    });

    console.log('[MediaSession] Setup complete');
}

// Update media session when stopped
function clearMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
}

export function stopAudio() {
    if (!state.oscLeft) return;
    if (state.isRecording) stopRecording();

    // Mark as not playing IMMEDIATELY for accurate button sync
    state.isPlaying = false;

    // Stop any active sweep
    if (state.sweepInterval) {
        clearInterval(state.sweepInterval);
        state.sweepInterval = null;
        state.sweepActive = false;
    }

    // Stop isochronic LFO if active
    if (state.isochronicLFO) {
        state.isochronicLFO.stop();
        state.isochronicLFO.disconnect();
        state.isochronicLFO = null;
    }
    if (state.isochronicGain) {
        state.isochronicGain.disconnect();
        state.isochronicGain = null;
    }

    const now = state.audioCtx.currentTime;

    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setValueAtTime(state.masterGain.gain.value, now);
    state.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);

    // Delay oscillator cleanup to allow for volume fade
    setTimeout(() => {
        if (state.oscLeft) { state.oscLeft.stop(); state.oscLeft.disconnect(); }
        if (state.oscRight) { state.oscRight.stop(); state.oscRight.disconnect(); }
        state.oscLeft = null; state.oscRight = null;
        Object.keys(state.activeSoundscapes).forEach(id => stopSingleSoundscape(id));
        // canvas clear if needed
    }, 350);

    // Clear lock screen controls
    clearMediaSession();

    // Note: UI callback removed - caller manages UI state to prevent race conditions
}

// --- AUDIO MODE SWITCHING ---
// Modes: 'binaural' (default), 'isochronic', 'monaural'

export function setAudioMode(mode) {
    if (!['binaural', 'isochronic', 'monaural'].includes(mode)) {
        console.warn('[Audio] Invalid mode:', mode);
        return;
    }

    const wasPlaying = state.isPlaying;
    const prevMode = state.audioMode;
    state.audioMode = mode;

    console.log(`[Audio] Mode changed: ${prevMode} → ${mode}`);

    // If audio is playing, we need to reconfigure the routing
    if (wasPlaying && state.oscLeft && state.oscRight) {
        applyAudioMode();
    }
}

function applyAudioMode() {
    if (!state.audioCtx || !state.oscLeft || !state.oscRight) return;

    const now = state.audioCtx.currentTime;
    const baseFreq = parseFloat(els.baseSlider?.value || 200);
    const beatFreq = parseFloat(els.beatSlider?.value || 10);

    // Clean up previous isochronic nodes if switching away
    if (state.isochronicLFO) {
        state.isochronicLFO.stop();
        state.isochronicLFO.disconnect();
        state.isochronicLFO = null;
    }
    if (state.isochronicGain) {
        state.isochronicGain.disconnect();
        state.isochronicGain = null;
    }

    switch (state.audioMode) {
        case 'binaural':
            // Standard binaural: left ear = base, right ear = base + beat
            state.oscLeft.frequency.setValueAtTime(baseFreq, now);
            state.oscRight.frequency.setValueAtTime(baseFreq + beatFreq, now);
            state.panLeft.pan.setValueAtTime(-1, now);
            state.panRight.pan.setValueAtTime(1, now);
            break;

        case 'monaural':
            // Monaural: both ears hear the same mixed beat (no headphones needed)
            // Both oscillators at same frequencies, let the interference happen
            state.oscLeft.frequency.setValueAtTime(baseFreq, now);
            state.oscRight.frequency.setValueAtTime(baseFreq + beatFreq, now);
            // Center both pans so the beat is heard in mono
            state.panLeft.pan.setValueAtTime(0, now);
            state.panRight.pan.setValueAtTime(0, now);
            break;

        case 'isochronic':
            // Isochronic: single tone pulsing at beat frequency (no headphones needed)
            // Set both oscillators to base frequency
            state.oscLeft.frequency.setValueAtTime(baseFreq, now);
            state.oscRight.frequency.setValueAtTime(baseFreq, now);
            // Center panning
            state.panLeft.pan.setValueAtTime(0, now);
            state.panRight.pan.setValueAtTime(0, now);

            // Create LFO to modulate gain (pulse effect)
            state.isochronicLFO = state.audioCtx.createOscillator();
            state.isochronicGain = state.audioCtx.createGain();

            state.isochronicLFO.type = 'square'; // Sharp on/off pulses
            state.isochronicLFO.frequency.setValueAtTime(beatFreq, now);

            // LFO controls gain amplitude (0 to 1)
            state.isochronicGain.gain.setValueAtTime(0.5, now);

            // Connect LFO to modulate the beatsGain
            state.isochronicLFO.connect(state.isochronicGain);
            state.isochronicGain.connect(state.beatsGain.gain);

            state.isochronicLFO.start(now);
            break;
    }

    console.log(`[Audio] Applied mode: ${state.audioMode}`);
}

export function getAudioMode() {
    return state.audioMode;
}

// --- FREQUENCY SWEEP FUNCTIONS ---

// Sweep Preset Programs
export const SWEEP_PRESETS = {
    wakeUp: {
        name: 'Wake Up',
        description: 'Gentle transition from sleep to alertness',
        startFreq: 4,    // Theta
        endFreq: 20,     // Beta
        duration: 300,   // 5 minutes
        icon: '🌅'
    },
    windDown: {
        name: 'Wind Down',
        description: 'Transition from active to relaxed state',
        startFreq: 20,   // Beta
        endFreq: 8,      // Alpha
        duration: 600,   // 10 minutes
        icon: '🌙'
    },
    deepSleep: {
        name: 'Deep Sleep Journey',
        description: 'Guide into deep restorative sleep',
        startFreq: 10,   // Alpha
        endFreq: 2,      // Delta
        duration: 1200,  // 20 minutes
        icon: '💤'
    },
    focusBuilder: {
        name: 'Focus Builder',
        description: 'Build concentration gradually',
        startFreq: 8,    // Alpha
        endFreq: 18,     // Beta
        duration: 300,   // 5 minutes
        icon: '🎯'
    },
    meditation: {
        name: 'Meditation Descent',
        description: 'Descend into deep meditative state',
        startFreq: 12,   // Alpha
        endFreq: 5,      // Theta
        duration: 600,   // 10 minutes
        icon: '🧘'
    },
    creativity: {
        name: 'Creative Flow',
        description: 'Unlock creative theta state',
        startFreq: 14,   // Low Beta
        endFreq: 6,      // Theta
        duration: 480,   // 8 minutes
        icon: '🎨'
    }
};

export function startSweep(startFreq, endFreq, durationSec) {
    if (!state.isPlaying) {
        console.warn('[Sweep] Audio must be playing to start sweep');
        return false;
    }

    // Stop any existing sweep
    if (state.sweepInterval) {
        clearInterval(state.sweepInterval);
    }

    // Store original beat frequency BEFORE starting the sweep
    state.preSweepBeatFreq = parseFloat(els.beatSlider?.value || 10);
    console.log('[Sweep] Storing original beat frequency:', state.preSweepBeatFreq);

    state.sweepActive = true;
    state.sweepStartFreq = startFreq;
    state.sweepEndFreq = endFreq;
    state.sweepDuration = durationSec;

    const startTime = Date.now();
    const freqDiff = endFreq - startFreq;

    console.log(`[Sweep] Starting: ${startFreq}Hz → ${endFreq}Hz over ${durationSec}s`);

    state.sweepInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / durationSec, 1);

        // Calculate current frequency (linear interpolation)
        const currentFreq = startFreq + (freqDiff * progress);

        // Update the beat slider value
        // Update the beat slider value
        if (els.beatSlider) {
            els.beatSlider.value = currentFreq.toFixed(1);
            if (els.beatValue) {
                els.beatValue.textContent = currentFreq.toFixed(1) + ' Hz';
            }
        }

        // Apply the frequency change
        updateFrequencies();

        // Check if sweep complete
        if (progress >= 1) {
            clearInterval(state.sweepInterval);
            state.sweepInterval = null;
            state.sweepActive = false;
            console.log('[Sweep] Complete');

            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('sweepComplete', {
                detail: { endFreq }
            }));
        }
    }, 100); // Update every 100ms for smooth transitions

    return true;
}


export function stopSweep(restore = true) {
    if (state.sweepInterval) {
        clearInterval(state.sweepInterval);
        state.sweepInterval = null;
    }
    state.sweepActive = false;

    // If restore is false, we skip restoring old frequency (e.g. when Story takes over)
    if (!restore) {
        console.log('[Sweep] Skipping restore (restore=false)');
        return;
    }

    // Restore to original beat frequency (saved when sweep started)
    const originalBeat = state.preSweepBeatFreq || 10;
    console.log('[Sweep] Restoring original beat frequency:', originalBeat);

    if (els.beatSlider) {
        els.beatSlider.value = originalBeat;
        if (els.beatValue) {
            els.beatValue.textContent = originalBeat + ' Hz';
        }
    }

    // Apply the frequency change to audio
    if (state.isPlaying) {
        updateFrequencies();
    }

    // Clear the stored frequency
    state.preSweepBeatFreq = null;

    console.log('[Sweep] Stopped - Restored to', originalBeat, 'Hz');
}



export function startSweepPreset(presetKey) {
    const preset = SWEEP_PRESETS[presetKey];
    if (!preset) {
        console.warn('[Sweep] Unknown preset:', presetKey);
        return false;
    }

    console.log(`[Sweep] Starting preset: ${preset.name}`);
    return startSweep(preset.startFreq, preset.endFreq, preset.duration);
}

export function isSweepActive() {
    return state.sweepActive;
}

// Check if audio is currently playing
export function isAudioPlaying() {
    return state.isPlaying;
}

// Helpers
function createPinkNoiseBuffer() {
    const bs = 2 * state.audioCtx.sampleRate;
    const b = state.audioCtx.createBuffer(1, bs, state.audioCtx.sampleRate);
    const o = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bs; i++) {
        const w = (Math.random() * 2 - 1);
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        o[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
        o[i] *= 0.11;
        b6 = w * 0.115926;
    }
    let maxVal = 0;
    for (let i = 0; i < bs; i++) { if (Math.abs(o[i]) > maxVal) maxVal = Math.abs(o[i]); }
    if (maxVal > 0) { for (let i = 0; i < bs; i++) { o[i] = o[i] / maxVal; } }
    return b;
}

function createWhiteNoiseBuffer() {
    const bs = 2 * state.audioCtx.sampleRate;
    const b = state.audioCtx.createBuffer(1, bs, state.audioCtx.sampleRate);
    const o = b.getChannelData(0);
    for (let i = 0; i < bs; i++) {
        o[i] = Math.random() * 2 - 1;
    }
    return b;
}

function createBrownNoiseBuffer() {
    const bs = 2 * state.audioCtx.sampleRate;
    const b = state.audioCtx.createBuffer(1, bs, state.audioCtx.sampleRate);
    const o = b.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bs; i++) {
        const white = Math.random() * 2 - 1;
        o[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = o[i];
        o[i] *= 3.5; // Normalize
    }
    // Normalize
    let maxVal = 0;
    for (let i = 0; i < bs; i++) { if (Math.abs(o[i]) > maxVal) maxVal = Math.abs(o[i]); }
    if (maxVal > 0) { for (let i = 0; i < bs; i++) { o[i] = o[i] / maxVal; } }
    return b;
}

/**
 * Fade in master audio over specified duration
 * @param {number} duration - Fade duration in seconds (default 2s)
 */
export function fadeIn(duration = 2) {
    if (!state.masterGain || !state.audioCtx) return;
    const now = state.audioCtx.currentTime;
    const targetVol = parseFloat(els.masterVolSlider?.value || 1);
    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setValueAtTime(0, now);
    state.masterGain.gain.linearRampToValueAtTime(targetVol, now + duration);
    console.log(`[Audio] Fade in: ${duration}s`);
}

/**
/**
 * Fade out master audio over specified duration (Cancellable)
 * @param {number} duration - Fade duration in seconds (default 2s)
 * @param {Function} onComplete - Callback when fade completes
 */
export function fadeOut(duration = 2, onComplete = null) {
    if (!state.masterGain || !state.audioCtx) return;
    const now = state.audioCtx.currentTime;

    // Clear any existing timeout
    if (state.fadeTimeout) {
        clearTimeout(state.fadeTimeout);
        state.fadeTimeout = null;
    }

    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setValueAtTime(state.masterGain.gain.value, now);
    state.masterGain.gain.linearRampToValueAtTime(0, now + duration);
    console.log(`[Audio] Fade out: ${duration}s`);

    // Store timeout so we can cancel it if user resumes
    state.fadeTimeout = setTimeout(() => {
        state.fadeTimeout = null;
        if (onComplete) onComplete();
    }, duration * 1000);
}

/**
 * Cancel any active fade out and restore volume target
 */
export function cancelFadeOut() {
    if (state.fadeTimeout) {
        console.log('[Audio] Cancelling fade out - RESUMING');
        clearTimeout(state.fadeTimeout);
        state.fadeTimeout = null;

        // Restore volume
        fadeIn(0.5); // Quick fade back in
    }
}

/**
 * Check if volume is above safe threshold and return warning
 * @returns {boolean} true if volume is above 85%
 */
export function isVolumeHigh() {
    const masterVol = parseFloat(els.masterVolSlider?.value || 0);
    return masterVol > 0.85;
}

/**
 * Play a gentle completion chime when session ends
 * Uses FM synthesis for a pleasant bell-like tone
 */
export function playCompletionChime() {
    if (!state.audioCtx) return;

    const ctx = state.audioCtx;
    const now = ctx.currentTime;

    // Create a gentle bell-like chime using FM synthesis
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)

    frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const oscGain = ctx.createGain();

        // Modulator for FM synthesis
        modulator.frequency.value = freq * 2;
        modGain.gain.setValueAtTime(freq * 0.5, now);
        modGain.gain.exponentialRampToValueAtTime(0.01, now + 2);

        // Carrier oscillator
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Amplitude envelope
        const startTime = now + (i * 0.1); // Stagger notes
        oscGain.gain.setValueAtTime(0, startTime);
        oscGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.5);

        // Connections
        modulator.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        // Start and stop
        modulator.start(startTime);
        osc.start(startTime);
        modulator.stop(startTime + 3);
        osc.stop(startTime + 3);
    });

    console.log('[Audio] Completion chime played');
}


export function updateFrequencies() {
    const base = parseFloat(els.baseSlider.value);
    const beat = parseFloat(els.beatSlider.value);
    console.log(`[Freq] Update: Base=${base}Hz, Beat=${beat}Hz`);
    if (els.baseValue) els.baseValue.textContent = `${base} Hz`;
    if (els.beatValue) els.beatValue.textContent = `${beat} Hz`;
    if (state.oscLeft && state.isPlaying) { state.oscLeft.frequency.setValueAtTime(base, state.audioCtx.currentTime); }
    if (state.oscRight && state.isPlaying) { state.oscRight.frequency.setValueAtTime(base + beat, state.audioCtx.currentTime); }

    // Auto Visual Speed Calculation
    if (state.visualSpeedAuto) {
        // For healing presets (high base Hz), use base frequency to influence speed
        // For brainwave presets, use beat frequency
        // Hyper-gamma (80Hz beat) should be faster than gamma (40Hz)
        // New range: 0.1 - 40.0 (8x higher max)
        let targetSpeed;

        if (base >= 100) {
            // Healing frequencies: speed based on base Hz (higher = faster) 
            // 174Hz -> 1.74x, 528Hz -> 5.28x, 963Hz -> 9.63x
            targetSpeed = base / 100;
        } else {
            // Brainwave presets: LINEAR proportional to Hz
            // Alpha (10Hz) = 1.0x baseline, all others scale proportionally
            // Delta (2.5Hz) -> 0.25x, Theta (6Hz) -> 0.6x, Alpha (10Hz) -> 1x
            // Beta (18Hz) -> 1.8x, Gamma (40Hz) -> 4x, Hyper-Gamma (80Hz) -> 8x
            targetSpeed = beat / 10;
        }

        if (targetSpeed < 0.1) targetSpeed = 0.1;
        if (targetSpeed > 40.0) targetSpeed = 40.0;

        // Update Visualizer
        import('../visuals/visualizer.js').then(m => {
            const viz = m.getVisualizer();
            if (viz) viz.setSpeed(targetSpeed);
        });

        // Update disabled slider for feedback
        if (els.visualSpeedSlider) els.visualSpeedSlider.value = targetSpeed;
        if (els.speedValue) els.speedValue.textContent = targetSpeed.toFixed(1) + 'x';
    }

    updateAIContext();
}

export function updateBeatsVolume() {
    const vol = parseFloat(els.volSlider.value);
    if (els.volValue) els.volValue.textContent = `${Math.round(vol * 100)}%`;
    if (state.beatsGain && state.isPlaying) state.beatsGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1);
}

export function updateMasterVolume() {
    const vol = parseFloat(els.masterVolSlider.value);
    if (els.masterVolValue) els.masterVolValue.textContent = `${Math.round(vol * 100)}%`;
    if (state.masterGain && state.isPlaying) state.masterGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1);
}

export function updateMasterBalance() {
    const val = parseFloat(els.balanceSlider.value); // -1 to 1
    if (els.balanceValue) {
        const percent = Math.round(val * 100);
        const text = percent === 0 ? "0" : percent < 0 ? `L ${Math.abs(percent)}` : `R ${percent}`;
        els.balanceValue.textContent = text;
    }
    if (state.masterPanner && state.masterPanner.pan && state.isPlaying) {
        state.masterPanner.pan.setTargetAtTime(val, state.audioCtx.currentTime, 0.1);
    }
}

export function updateAtmosMaster() {
    const vol = parseFloat(els.atmosMasterSlider.value);
    if (els.atmosMasterValue) els.atmosMasterValue.textContent = `${Math.round(vol * 100)}%`;
    if (state.masterAtmosGain && state.isPlaying) { state.masterAtmosGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1); }
}

export function updateSoundscape(id, type, val) {
    state.soundscapeSettings[id][type] = val;
    if (type === 'vol') {
        updateAIContext();
        if (!state.isPlaying) return;
        if (val > 0 && !state.activeSoundscapes[id]) startSingleSoundscape(id, val, state.soundscapeSettings[id].tone, state.soundscapeSettings[id].speed);
        else if (val > 0 && state.activeSoundscapes[id]) state.activeSoundscapes[id].gainNode.gain.setTargetAtTime(val, state.audioCtx.currentTime, 0.1);
        else if (val === 0 && state.activeSoundscapes[id]) stopSingleSoundscape(id);
    } else {
        if (!state.isPlaying) return;
        if (type === 'tone' && state.activeSoundscapes[id]) updateSoundscapeTone(id, val);
        else if (type === 'speed' && state.activeSoundscapes[id]) updateSoundscapeSpeed(id, val);
    }
}

function updateAIContext() {
    const beatFreq = parseFloat(els.beatSlider.value);
    let cat = beatFreq < 4 ? 'delta' : beatFreq < 8 ? 'theta' : beatFreq < 14 ? 'alpha' : beatFreq < 30 ? 'beta' : 'gamma';
    let text = STATE_INSIGHTS[cat][Math.floor(beatFreq * 10) % STATE_INSIGHTS[cat].length];
    const activeIds = Object.keys(state.soundscapeSettings).filter(id => state.soundscapeSettings[id].vol > 0.1);
    if (activeIds.length > 0) {
        const dominantId = activeIds.sort((a, b) => state.soundscapeSettings[b].vol - state.soundscapeSettings[a].vol)[0];
        text += ` ${SOUND_INSIGHTS[dominantId] || ""}`;
    }
    if (els.aiPrompt && els.aiPrompt.textContent !== `"${text}"`) {
        els.aiPrompt.style.opacity = 0;
        setTimeout(() => { els.aiPrompt.textContent = `"${text}"`; els.aiPrompt.style.opacity = 1; }, 200);
    }
}

function updateSoundscapeTone(id, toneVal) {
    const sc = state.activeSoundscapes[id]; if (!sc) return; const t = state.audioCtx.currentTime;
    const filter = sc.nodes.find(n => n instanceof BiquadFilterNode);
    if (filter) {
        let min = 200, max = 5000;
        if (id === 'pink') { min = 200; max = 10000; } else if (id === 'rain') { min = 200; max = 2000; } else if (id === 'strings') { min = 500; max = 8000; }
        filter.frequency.setTargetAtTime(min + (toneVal * (max - min)), t, 0.2);
    }
    if (['strings', 'brass', 'winds'].includes(id)) {
        const detune = (toneVal - 0.5) * 2400;
        sc.nodes.filter(n => n instanceof OscillatorNode && n.frequency.value > 20).forEach(osc => osc.detune.setTargetAtTime(detune, t, 0.1));
    }
}

function updateSoundscapeSpeed(id, speedVal) {
    const sc = state.activeSoundscapes[id]; if (!sc) return; const t = state.audioCtx.currentTime;
    const rate = 0.2 + (speedVal * 3.8);
    if (['pink', 'rain', 'wind', 'ocean'].includes(id)) sc.nodes.filter(n => n instanceof AudioBufferSourceNode).forEach(src => src.playbackRate.setTargetAtTime(rate * (id === 'ocean' ? 0.5 : 1), t, 0.1));
    if (['brass', 'strings', 'winds'].includes(id)) {
        sc.nodes.filter(n => n instanceof OscillatorNode && n.frequency.value < 20).forEach(lfo => {
            let base = 0.1; if (id === 'strings') base = 3.0; if (id === 'brass') base = 0.2; if (id === 'winds') base = 4.0;
            lfo.frequency.setTargetAtTime(base * rate, t, 0.2);
        });
    }
}

function startSingleSoundscape(id, vol, tone, speed) {
    if (!state.masterAtmosGain) return;
    const channelGain = state.audioCtx.createGain();
    channelGain.gain.setValueAtTime(vol, state.audioCtx.currentTime);
    channelGain.connect(state.masterAtmosGain);
    let nodes = [], cleanupFn = null;

    const rate = 0.2 + (speed * 3.8);

    const createDrone = (freqs, type, fFreq, fType, lfoBase) => {
        fFreq = fFreq * (0.5 + tone);
        const f = state.audioCtx.createBiquadFilter(); f.type = fType; f.frequency.value = fFreq; f.connect(channelGain); nodes.push(f);
        const lfo = state.audioCtx.createOscillator(); lfo.frequency.value = lfoBase * rate;
        const lfoG = state.audioCtx.createGain(); lfoG.gain.value = 200; lfo.connect(lfoG);
        if (type === 'strings') { lfoG.gain.value = 15; } else { lfoG.connect(f.frequency); }
        lfo.start(); nodes.push(lfo, lfoG);
        const detuneOffset = (tone - 0.5) * 2400;
        freqs.forEach(fr => { [0, -5, 5].forEach(d => { const osc = state.audioCtx.createOscillator(); osc.type = type; osc.frequency.value = fr; osc.detune.value = d + detuneOffset; if (type === 'strings') lfoG.connect(osc.detune); osc.connect(f); osc.start(); nodes.push(osc); }); });
    }

    if (id === 'pink') { const n = state.audioCtx.createBufferSource(); n.buffer = createPinkNoiseBuffer(); n.loop = true; n.playbackRate.value = rate; const f = state.audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200 + (tone * 10000); n.connect(f); f.connect(channelGain); n.start(); nodes.push(n, f); }
    else if (id === 'white') {
        const n = state.audioCtx.createBufferSource();
        n.buffer = createWhiteNoiseBuffer();
        n.loop = true;
        n.playbackRate.value = rate;
        const f = state.audioCtx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 500 + (tone * 15000); // Full range for white noise
        n.connect(f);
        f.connect(channelGain);
        n.start();
        nodes.push(n, f);
    }
    else if (id === 'brown') {
        const n = state.audioCtx.createBufferSource();
        n.buffer = createBrownNoiseBuffer();
        n.loop = true;
        n.playbackRate.value = rate;
        const f = state.audioCtx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 100 + (tone * 800); // Lower range for brown noise
        n.connect(f);
        f.connect(channelGain);
        n.start();
        nodes.push(n, f);
    }
    else if (id === 'rain') { const n = state.audioCtx.createBufferSource(); n.buffer = createPinkNoiseBuffer(); n.loop = true; n.playbackRate.value = rate; const f = state.audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200 + (tone * 1800); n.connect(f); f.connect(channelGain); n.start(); nodes.push(n, f); }
    else if (id === 'wind') { const n = state.audioCtx.createBufferSource(); n.buffer = createPinkNoiseBuffer(); n.loop = true; n.playbackRate.value = rate; const f = state.audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 200 + (tone * 800); f.Q.value = 1; const lfo = state.audioCtx.createOscillator(); lfo.frequency.value = 0.1 * rate; const lfoG = state.audioCtx.createGain(); lfoG.gain.value = 200; lfo.connect(lfoG); lfoG.connect(f.frequency); n.connect(f); f.connect(channelGain); n.start(); lfo.start(); nodes.push(n, f, lfo, lfoG); }
    else if (id === 'ocean') {
        // Ocean waves: noise with slow amplitude modulation for wave rhythm
        const n = state.audioCtx.createBufferSource();
        n.buffer = createPinkNoiseBuffer();
        n.loop = true;
        n.playbackRate.value = rate * 0.5; // Slower playback for deeper sound

        // Low pass filter for rumble
        const f = state.audioCtx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 200 + (tone * 600);
        f.Q.value = 0.7;

        // LFO for wave rhythm (amplitude modulation)
        const lfo = state.audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08 * rate; // ~5 second wave cycle at speed 1

        const lfoGain = state.audioCtx.createGain();
        lfoGain.gain.value = 0.4; // Modulation depth

        const ampGain = state.audioCtx.createGain();
        ampGain.gain.value = 0.6; // Base amplitude

        lfo.connect(lfoGain);
        lfoGain.connect(ampGain.gain);

        // Second LFO for filter sweep (higher freq for "spray" effect)
        const lfo2 = state.audioCtx.createOscillator();
        lfo2.type = 'sine';
        lfo2.frequency.value = 0.12 * rate;
        const lfo2Gain = state.audioCtx.createGain();
        lfo2Gain.gain.value = 150 + (tone * 200);
        lfo2.connect(lfo2Gain);
        lfo2Gain.connect(f.frequency);

        n.connect(f);
        f.connect(ampGain);
        ampGain.connect(channelGain);

        n.start();
        lfo.start();
        lfo2.start();
        nodes.push(n, f, lfo, lfoGain, ampGain, lfo2, lfo2Gain);
    }
    else if (id === 'strings') createDrone([65.41, 98.00, 130.81], 'sawtooth', 1500, 'lowpass', 3.0);
    else if (id === 'brass') createDrone([130.81, 196.00, 261.63], 'sawtooth', 400, 'lowpass', 0.2);
    else if (id === 'winds') createDrone([261.63, 329.63, 392.00], 'triangle', 1000, 'bandpass', 4.0);
    else if (['bells', 'wood', 'timpani', 'orch_perc'].includes(id)) {
        let active = true;
        const loop = () => {
            if (!active || !state.isPlaying) return;
            // Safety check for settings existence
            const sSettings = state.soundscapeSettings[id];
            const currentTone = sSettings ? sSettings.tone : 0.5;
            playOneShot(id, channelGain, currentTone);
            const baseInterval = id === 'bells' ? 4000 : id === 'wood' ? 1500 : 3000;
            const currentSpeed = state.soundscapeSettings[id].speed;
            const currentRate = 0.2 + (currentSpeed * 3.8);
            setTimeout(loop, (baseInterval / currentRate) + (Math.random() * (500 / currentRate)));
        };
        loop(); cleanupFn = () => { active = false; };
    }
    state.activeSoundscapes[id] = { gainNode: channelGain, nodes: nodes, cleanup: cleanupFn };
}

function playOneShot(type, dest, tone) {
    const t = state.audioCtx.currentTime;
    const safeTone = isNaN(tone) ? 0.5 : tone;
    const pitchMult = 0.5 + (safeTone * 1.5);

    if (type === 'bells') {
        const fund = (200 + Math.random() * 300) * pitchMult;
        const osc = state.audioCtx.createOscillator(), mod = state.audioCtx.createOscillator();
        const oscGain = state.audioCtx.createGain(), modGain = state.audioCtx.createGain();

        mod.frequency.value = fund * 1.4;
        modGain.gain.setValueAtTime(fund, t);
        modGain.gain.exponentialRampToValueAtTime(0.01, t + 2);

        osc.frequency.value = fund;
        oscGain.gain.setValueAtTime(0.3, t); // Boosted from 0.1 to 0.3
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(oscGain);
        oscGain.connect(dest);

        mod.start(t); osc.start(t);
        mod.stop(t + 4); osc.stop(t + 4);
    }
    else if (type === 'wood') { const osc = state.audioCtx.createOscillator(), env = state.audioCtx.createGain(); osc.frequency.setValueAtTime((800 + Math.random() * 200) * pitchMult, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); env.gain.setValueAtTime(0.3, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.15); osc.connect(env); env.connect(dest); osc.start(t); osc.stop(t + 0.2); }
    else if (type === 'timpani') { const osc = state.audioCtx.createOscillator(), gain = state.audioCtx.createGain(); const freq = (60 + Math.random() * 30) * pitchMult; osc.frequency.setValueAtTime(freq + (50 * pitchMult), t); osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.6, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0); osc.connect(gain); gain.connect(dest); osc.start(t); osc.stop(t + 2.5); }
    else if (type === 'orch_perc') { const r = Math.random(); if (r < 0.33) { const osc = state.audioCtx.createOscillator(), gain = state.audioCtx.createGain(); osc.frequency.setValueAtTime(80 * pitchMult, t); osc.frequency.exponentialRampToValueAtTime(10, t + 0.5); gain.gain.setValueAtTime(0.7, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6); osc.connect(gain); gain.connect(dest); osc.start(t); osc.stop(t + 0.7); } else if (r < 0.66) { const noise = state.audioCtx.createBufferSource(); noise.buffer = createPinkNoiseBuffer(); const filter = state.audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 2000 * pitchMult; const gain = state.audioCtx.createGain(); gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2); noise.connect(filter); filter.connect(gain); gain.connect(dest); noise.start(t); noise.stop(t + 0.3); } else { const noise = state.audioCtx.createBufferSource(); noise.buffer = createPinkNoiseBuffer(); const filter = state.audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 5000 * pitchMult; const gain = state.audioCtx.createGain(); gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0.15, t + 0.2); gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5); noise.connect(filter); filter.connect(gain); gain.connect(dest); noise.start(t); noise.stop(t + 4.0); } }
}

function stopSingleSoundscape(id) {
    const sc = state.activeSoundscapes[id]; if (!sc) return;
    sc.gainNode.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.5);
    setTimeout(() => {
        if (sc.cleanup) sc.cleanup();
        sc.nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch (e) { } });
        sc.gainNode.disconnect();
        delete state.activeSoundscapes[id];
    }, 600);
}
