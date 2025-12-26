/**
 * DJ Sound Synthesizer - Web Audio based DJ sound library
 * Generates all sounds programmatically using Web Audio API
 * Inspired by Pioneer XDJ equipment
 */

import { state, els } from '../state.js';

// Active sound instances for loop management
const activeLoops = {};
const activeSounds = {};

// Master DJ gain node and filter
let djMasterGain = null;
let djMasterFilter = null;

// DJ Sound Controls - global settings that affect all sounds
const djSoundControls = {
    pitch: 0,       // Semitones (-12 to +12)
    tone: 4000,     // Filter cutoff frequency (200 - 8000 Hz)
    speed: 1        // Retrigger rate multiplier (0.5 - 2)
};

/**
 * Get pitch multiplier from semitones
 */
function getPitchMultiplier() {
    return Math.pow(2, djSoundControls.pitch / 12);
}

/**
 * Initialize DJ audio system
 */
export function initDJAudio() {
    if (!state.audioCtx) {
        console.warn('[DJ Synth] No audio context available');
        return false;
    }

    // Always recreate if context changed or not connected
    if (djMasterGain && djMasterGain.context === state.audioCtx) {
        return true; // Already initialized for this context
    }

    try {
        // Create master gain
        djMasterGain = state.audioCtx.createGain();
        djMasterGain.gain.value = 0.8;

        // Create master filter for tone control
        djMasterFilter = state.audioCtx.createBiquadFilter();
        djMasterFilter.type = 'lowpass';
        djMasterFilter.frequency.value = djSoundControls.tone;
        djMasterFilter.Q.value = 0.7;

        // Connect: djMasterGain -> djMasterFilter -> output
        djMasterGain.connect(djMasterFilter);

        // CRITICAL: Connect to masterGain first (for volume control), then ALSO to destination
        // This ensures DJ sounds go through the same chain as other audio
        if (state.masterGain) {
            djMasterFilter.connect(state.masterGain);
            console.log('[DJ Synth] Connected to masterGain chain');
        }

        // Always connect directly to destination as primary output
        // (not just as fallback, but as the main route)
        djMasterFilter.connect(state.audioCtx.destination);
        console.log('[DJ Synth] Connected directly to speakers (destination)');

        console.log('[DJ Synth] Initialized - Gain:', djMasterGain.gain.value,
            'Filter freq:', djMasterFilter.frequency.value,
            'Context state:', state.audioCtx.state);
        return true;
    } catch (e) {
        console.error('[DJ Synth] Init failed:', e);
        return false;
    }
}

/**
 * Set DJ master volume
 */
export function setDJVolume(vol) {
    if (djMasterGain) {
        djMasterGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.05);
    }
}

/**
 * Set pitch offset in semitones (-12 to +12)
 */
export function setDJPitch(semitones) {
    djSoundControls.pitch = Math.max(-12, Math.min(12, semitones));
    console.log('[DJ Synth] Pitch set to:', djSoundControls.pitch, 'semitones');
}

/**
 * Set tone (filter cutoff frequency)
 */
export function setDJTone(freq) {
    djSoundControls.tone = Math.max(200, Math.min(8000, freq));
    if (djMasterFilter && state.audioCtx) {
        djMasterFilter.frequency.setTargetAtTime(djSoundControls.tone, state.audioCtx.currentTime, 0.05);
    }
    console.log('[DJ Synth] Tone set to:', djSoundControls.tone, 'Hz');
}

/**
 * Set speed multiplier for retrigger rate
 */
export function setDJSpeed(multiplier) {
    djSoundControls.speed = Math.max(0.5, Math.min(2, multiplier));
    console.log('[DJ Synth] Speed set to:', djSoundControls.speed, 'x');
}

/**
 * Get current DJ sound controls
 */
export function getDJControls() {
    return { ...djSoundControls };
}

// =============================================================================
// SOUND DEFINITIONS
// =============================================================================

export const DJ_SOUNDS = {
    // ── FX / Beat Effects ────────────────────────────────────────────────────
    fx: {
        label: 'FX',
        icon: '🎛️',
        color: 'from-purple-500 to-violet-600',
        sounds: {
            echo: { label: 'Echo', icon: '📢', canLoop: true },
            reverb: { label: 'Reverb', icon: '🌊', canLoop: true },
            flanger: { label: 'Flanger', icon: '✈️', canLoop: true },
            filter: { label: 'Filter', icon: '🔊', canLoop: true },
            beatroll: { label: 'Beat Roll', icon: '🔁', canLoop: true },
            gater: { label: 'Gater', icon: '⚡', canLoop: true }
        }
    },

    // ── Sampler / Pad Sounds ─────────────────────────────────────────────────
    sampler: {
        label: 'Samples',
        icon: '🎹',
        color: 'from-pink-500 to-rose-600',
        sounds: {
            airhorn: { label: 'Air Horn', icon: '📯', canLoop: true },
            siren: { label: 'Siren', icon: '🚨', canLoop: true },
            riser: { label: 'Riser', icon: '📈', canLoop: true },
            drop: { label: 'Drop', icon: '💥', canLoop: true },
            scratch: { label: 'Scratch', icon: '💿', canLoop: true },
            vocal: { label: 'Vocal', icon: '🎤', canLoop: true }
        }
    },

    // ── Atmospheric Textures ─────────────────────────────────────────────────
    atmosphere: {
        label: 'Atmos',
        icon: '🌌',
        color: 'from-cyan-500 to-teal-600',
        sounds: {
            pad: { label: 'Pad', icon: '🎹', canLoop: true },
            subbass: { label: 'Sub Bass', icon: '🔈', canLoop: true },
            sweepup: { label: 'Sweep ↑', icon: '⬆️', canLoop: true },
            sweepdown: { label: 'Sweep ↓', icon: '⬇️', canLoop: true },
            tension: { label: 'Tension', icon: '😰', canLoop: true },
            shimmer: { label: 'Shimmer', icon: '✨', canLoop: true }
        }
    },

    // ── Rhythmic Elements ────────────────────────────────────────────────────
    rhythm: {
        label: 'Rhythm',
        icon: '🥁',
        color: 'from-orange-500 to-amber-600',
        sounds: {
            kick808: { label: '808 Kick', icon: '🔊', canLoop: true },
            clap: { label: 'Clap', icon: '👏', canLoop: true },
            hihat: { label: 'Hi-Hat', icon: '🎩', canLoop: true },
            snare: { label: 'Snare', icon: '🥁', canLoop: true },
            shaker: { label: 'Shaker', icon: '🎵', canLoop: true },
            beatloop: { label: 'Beat', icon: '🎶', canLoop: true }
        }
    },

    // ── Transition FX ────────────────────────────────────────────────────────
    transition: {
        label: 'Trans',
        icon: '🔀',
        color: 'from-emerald-500 to-green-600',
        sounds: {
            risefx: { label: 'Rise FX', icon: '🚀', canLoop: true },
            fallfx: { label: 'Fall FX', icon: '🪂', canLoop: true },
            brake: { label: 'Brake', icon: '🛑', canLoop: true },
            revcymbal: { label: 'Rev Cym', icon: '🔔', canLoop: true },
            tapestop: { label: 'Tape Stop', icon: '⏹️', canLoop: true },
            noiseburst: { label: 'Noise', icon: '📻', canLoop: true }
        }
    }
};

// =============================================================================
// SOUND SYNTHESIZERS
// =============================================================================

/**
 * Generate an 808 kick drum
 */
function synth808Kick(ctx, output) {
    const now = ctx.currentTime;

    // Oscillator for the body
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Distortion for punch
    const dist = ctx.createWaveShaper();
    dist.curve = makeDistortionCurve(50);

    osc.connect(dist);
    dist.connect(gain);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + 0.5);

    return { duration: 0.5 };
}

/**
 * Generate a clap sound
 */
function synthClap(ctx, output) {
    const now = ctx.currentTime;

    // Multiple noise bursts for clap texture
    for (let i = 0; i < 4; i++) {
        const noise = createNoiseSource(ctx, 'white');
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 2;

        const gain = ctx.createGain();
        const startTime = now + (i * 0.01);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.8, startTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        noise.start(startTime);
        noise.stop(startTime + 0.2);
    }

    return { duration: 0.2 };
}

/**
 * Generate a hi-hat sound
 */
function synthHiHat(ctx, output, isLoop = false) {
    const now = ctx.currentTime;

    // Metallic oscillators
    const freqs = [300, 600, 800, 1000, 1200];
    const oscs = freqs.map(f => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = f * (1 + Math.random() * 0.02);
        return osc;
    });

    // High-pass filter for brightness (lowered from 7000 for audibility)
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 4000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    oscs.forEach(osc => {
        osc.connect(hpf);
        osc.start(now);
        osc.stop(now + 0.1);
    });

    hpf.connect(gain);
    gain.connect(output);

    return { duration: 0.1 };
}

/**
 * Generate a snare drum
 */
function synthSnare(ctx, output) {
    const now = ctx.currentTime;

    // Body oscillator
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    // Noise for snares
    const noise = createNoiseSource(ctx, 'white');
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(oscGain);
    oscGain.connect(output);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(output);

    osc.start(now);
    osc.stop(now + 0.2);
    noise.start(now);
    noise.stop(now + 0.3);

    return { duration: 0.3 };
}

/**
 * Generate an air horn sound
 */
function synthAirhorn(ctx, output) {
    const now = ctx.currentTime;

    // Multiple detuned sawtooth oscillators
    const freqs = [440, 554.37, 659.25]; // A4, C#5, E5 - A major chord
    const oscs = freqs.map(f => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = (Math.random() - 0.5) * 20;
        return osc;
    });

    // Low-pass filter for brass-like tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(4000, now + 0.1);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.8);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.05);
    gain.gain.setValueAtTime(0.6, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    oscs.forEach(osc => {
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 1.0);
    });

    filter.connect(gain);
    gain.connect(output);

    return { duration: 1.0 };
}

/**
 * Generate a siren sound (loopable)
 */
function synthSiren(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 2;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';

    // LFO for siren sweep
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 3; // 3 Hz sweep rate

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300; // Sweep depth

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    osc.connect(gain);
    gain.connect(output);

    lfo.start(now);
    osc.start(now);

    if (!isLoop) {
        lfo.stop(now + duration);
        osc.stop(now + duration);
    }

    return {
        duration,
        stop: () => {
            const stopTime = ctx.currentTime;
            gain.gain.setTargetAtTime(0, stopTime, 0.05);
            setTimeout(() => {
                try { osc.stop(); lfo.stop(); } catch (e) { }
            }, 100);
        },
        nodes: [osc, lfo, gain]
    };
}

/**
 * Generate a riser/build-up sweep
 */
function synthRiser(ctx, output) {
    const now = ctx.currentTime;
    const duration = 2;

    // Noise-based riser
    const noise = createNoiseSource(ctx, 'white');

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(8000, now + duration);
    filter.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.7, now + duration * 0.9);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    noise.start(now);
    noise.stop(now + duration);

    return { duration };
}

/**
 * Generate an impact/drop sound
 */
function synthDrop(ctx, output) {
    const now = ctx.currentTime;

    // Sub bass hit
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    // Noise burst
    const noise = createNoiseSource(ctx, 'white');
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(5000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 1);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(oscGain);
    oscGain.connect(output);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(output);

    osc.start(now);
    osc.stop(now + 1);
    noise.start(now);
    noise.stop(now + 0.3);

    return { duration: 1 };
}

/**
 * Generate a scratch sound
 */
function synthScratch(ctx, output) {
    const now = ctx.currentTime;

    // Noise with pitch modulation for scratch effect
    const noise = createNoiseSource(ctx, 'pink');

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 10;

    // Pitch wobble
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 15;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.setValueAtTime(0.6, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    noise.start(now);
    noise.stop(now + 0.3);
    lfo.start(now);
    lfo.stop(now + 0.3);

    return { duration: 0.3 };
}

/**
 * Generate a vocal chop ("Yeah!")
 */
function synthVocal(ctx, output) {
    const now = ctx.currentTime;

    // Formant synthesis for vowel sound
    const carrier = ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.value = 200; // Approx male voice fundamental

    // Formant filters (simplified vowel)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 800; // First formant
    f1.Q.value = 10;

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 1200; // Second formant
    f2.Q.value = 10;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
    gain.gain.setValueAtTime(0.5, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    carrier.connect(f1);
    carrier.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(output);

    carrier.start(now);
    carrier.stop(now + 0.4);

    return { duration: 0.4 };
}

/**
 * Generate an ambient pad (loopable)
 */
function synthPad(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 4;

    // Multiple detuned oscillators for rich pad
    const oscs = [];
    const baseFreq = 220;

    [1, 1.5, 2, 2.5].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = baseFreq * mult;
        osc.detune.value = (Math.random() - 0.5) * 10;
        oscs.push(osc);
    });

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 1);

    if (!isLoop) {
        gain.gain.setValueAtTime(0.3, now + duration - 1);
        gain.gain.linearRampToValueAtTime(0, now + duration);
    }

    oscs.forEach(osc => {
        osc.connect(filter);
        osc.start(now);
        if (!isLoop) osc.stop(now + duration);
    });

    filter.connect(gain);
    gain.connect(output);

    return {
        duration,
        stop: () => {
            const stopTime = ctx.currentTime;
            gain.gain.setTargetAtTime(0, stopTime, 0.5);
            setTimeout(() => {
                oscs.forEach(osc => { try { osc.stop(); } catch (e) { } });
            }, 1000);
        },
        nodes: [...oscs, filter, gain]
    };
}

/**
 * Generate sub bass (loopable)
 */
function synthSubBass(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 4;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60; // Raised from 40Hz for laptop speaker audibility

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.3); // Faster attack, higher volume

    osc.connect(gain);
    gain.connect(output);

    osc.start(now);
    if (!isLoop) osc.stop(now + duration);

    return {
        duration,
        stop: () => {
            const stopTime = ctx.currentTime;
            gain.gain.setTargetAtTime(0, stopTime, 0.2);
            setTimeout(() => { try { osc.stop(); } catch (e) { } }, 500);
        },
        nodes: [osc, gain]
    };
}

/**
 * Generate sweep up
 */
function synthSweepUp(ctx, output) {
    const now = ctx.currentTime;
    const duration = 1.5;

    const noise = createNoiseSource(ctx, 'white');

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(10000, now + duration);
    filter.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.6, now + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    noise.start(now);
    noise.stop(now + duration);

    return { duration };
}

/**
 * Generate sweep down
 */
function synthSweepDown(ctx, output) {
    const now = ctx.currentTime;
    const duration = 1.5;

    const noise = createNoiseSource(ctx, 'white');

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(10000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);
    filter.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    noise.start(now);
    noise.stop(now + duration);

    return { duration };
}

/**
 * Generate tension drone (loopable)
 */
function synthTension(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 4;

    // Dissonant frequencies for tension
    const freqs = [55, 58, 110, 116];
    const oscs = freqs.map(f => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        return osc;
    });

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 1);

    oscs.forEach(osc => {
        osc.connect(filter);
        osc.start(now);
        if (!isLoop) osc.stop(now + duration);
    });

    filter.connect(gain);
    gain.connect(output);

    return {
        duration,
        stop: () => {
            const stopTime = ctx.currentTime;
            gain.gain.setTargetAtTime(0, stopTime, 0.3);
            setTimeout(() => {
                oscs.forEach(osc => { try { osc.stop(); } catch (e) { } });
            }, 600);
        },
        nodes: [...oscs, gain]
    };
}

/**
 * Generate shimmer texture (loopable)
 */
function synthShimmer(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 4;

    // High frequency oscillators with LFO modulation
    const oscs = [2000, 3000, 4000, 5000].map(f => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f + (Math.random() - 0.5) * 50;
        return osc;
    });

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 100;

    lfo.connect(lfoGain);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);

    oscs.forEach(osc => {
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        osc.start(now);
        if (!isLoop) osc.stop(now + duration);
    });

    lfo.start(now);
    if (!isLoop) lfo.stop(now + duration);

    gain.connect(output);

    return {
        duration,
        stop: () => {
            const stopTime = ctx.currentTime;
            gain.gain.setTargetAtTime(0, stopTime, 0.3);
            setTimeout(() => {
                oscs.forEach(osc => { try { osc.stop(); } catch (e) { } });
                try { lfo.stop(); } catch (e) { }
            }, 600);
        },
        nodes: [...oscs, lfo, gain]
    };
}

/**
 * Generate shaker loop
 */
function synthShaker(ctx, output, isLoop = false) {
    const now = ctx.currentTime;

    const playShake = (time) => {
        const noise = createNoiseSource(ctx, 'white');
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4000; // Lowered from 6000 for audibility

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, time); // Increased gain
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        noise.start(time);
        noise.stop(time + 0.06);
    };

    if (isLoop) {
        // Play shaker pattern
        const bpm = 120;
        const interval = 60 / bpm / 4; // 16th notes
        let time = now;

        for (let i = 0; i < 16; i++) {
            playShake(time);
            time += interval;
        }

        // Schedule next batch
        const loopId = setInterval(() => {
            const t = ctx.currentTime;
            for (let i = 0; i < 16; i++) {
                playShake(t + (i * interval));
            }
        }, 16 * interval * 1000);

        return {
            duration: 999,
            stop: () => clearInterval(loopId),
            loopId
        };
    } else {
        playShake(now);
        return { duration: 0.06 };
    }
}

/**
 * Generate beat loop
 */
function synthBeatLoop(ctx, output, isLoop = false) {
    if (!isLoop) {
        // Just play one bar
        synth808Kick(ctx, output);
        return { duration: 0.5 };
    }

    const bpm = 120;
    const beatInterval = 60 / bpm;

    const playPattern = (startTime) => {
        // Kick on 1 and 3
        setTimeout(() => synth808Kick(ctx, output), 0);
        setTimeout(() => synth808Kick(ctx, output), beatInterval * 2 * 1000);

        // Snare on 2 and 4
        setTimeout(() => synthSnare(ctx, output), beatInterval * 1 * 1000);
        setTimeout(() => synthSnare(ctx, output), beatInterval * 3 * 1000);

        // Hi-hats on every 8th
        for (let i = 0; i < 8; i++) {
            setTimeout(() => synthHiHat(ctx, output), beatInterval * (i * 0.5) * 1000);
        }
    };

    playPattern(ctx.currentTime);

    const loopId = setInterval(() => {
        playPattern(ctx.currentTime);
    }, beatInterval * 4 * 1000);

    return {
        duration: 999,
        stop: () => clearInterval(loopId),
        loopId
    };
}

/**
 * Generate rise FX
 */
function synthRiseFX(ctx, output) {
    const now = ctx.currentTime;
    const duration = 4;

    // Combination of noise sweep and pitch rise
    const noise = createNoiseSource(ctx, 'white');
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + duration);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(100, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(8000, now + duration);
    noiseFilter.Q.value = 5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.linearRampToValueAtTime(0.3, now + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(output);

    osc.connect(oscGain);
    oscGain.connect(output);

    noise.start(now);
    noise.stop(now + duration);
    osc.start(now);
    osc.stop(now + duration);

    return { duration };
}

/**
 * Generate fall FX
 */
function synthFallFX(ctx, output) {
    const now = ctx.currentTime;
    const duration = 2;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + duration);

    return { duration };
}

/**
 * Generate brake/stop effect
 */
function synthBrake(ctx, output) {
    const now = ctx.currentTime;
    const duration = 1;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration);

    // Simulate slowing down
    const playbackRate = ctx.createConstantSource ? ctx.createConstantSource() : null;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + duration);

    return { duration };
}

/**
 * Generate reverse cymbal
 */
function synthRevCymbal(ctx, output) {
    const now = ctx.currentTime;
    const duration = 1.5;

    const noise = createNoiseSource(ctx, 'white');

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 5000;

    const gain = ctx.createGain();
    // Reverse envelope - quiet to loud
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + duration);

    noise.connect(hpf);
    hpf.connect(gain);
    gain.connect(output);

    noise.start(now);
    noise.stop(now + duration);

    return { duration };
}

/**
 * Generate tape stop effect
 */
function synthTapeStop(ctx, output) {
    const now = ctx.currentTime;
    const duration = 1.5;

    // Oscillator slowing down
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + duration);

    return { duration };
}

/**
 * Generate white noise burst
 */
function synthNoiseBurst(ctx, output) {
    const now = ctx.currentTime;
    const duration = 0.15;

    const noise = createNoiseSource(ctx, 'white');

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(gain);
    gain.connect(output);

    noise.start(now);
    noise.stop(now + duration);

    return { duration };
}

/**
 * Generate echo effect (loops audio with decay)
 */
function synthEcho(ctx, output, isLoop = false) {
    const now = ctx.currentTime;

    // Create a ping sound that echoes
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.3;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(output);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + 0.1);

    return { duration: 2 };
}

/**
 * Generate reverb wash
 */
function synthReverb(ctx, output, isLoop = false) {
    const now = ctx.currentTime;

    // Impulse sound with convolution-like tail
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;

    // Multiple delays for reverb simulation
    const delays = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4].map(t => {
        const d = ctx.createDelay(1);
        d.delayTime.value = t;
        return d;
    });

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;

    const impulseGain = ctx.createGain();
    impulseGain.gain.setValueAtTime(0.3, now);
    impulseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(impulseGain);
    impulseGain.connect(output);

    delays.forEach((d, i) => {
        const g = ctx.createGain();
        g.gain.value = 0.3 / (i + 1);
        impulseGain.connect(d);
        d.connect(g);
        g.connect(masterGain);
    });

    masterGain.connect(output);

    osc.start(now);
    osc.stop(now + 0.05);

    return { duration: 1 };
}

/**
 * Generate flanger effect
 */
function synthFlanger(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 3;

    const noise = createNoiseSource(ctx, 'pink');

    const delay = ctx.createDelay(0.02);

    // LFO for modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.005;

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    delay.delayTime.value = 0.01;

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    noise.connect(delay);
    noise.connect(gain);
    delay.connect(gain);
    gain.connect(output);

    noise.start(now);
    lfo.start(now);

    if (!isLoop) {
        noise.stop(now + duration);
        lfo.stop(now + duration);
    }

    return {
        duration,
        stop: () => {
            gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
            setTimeout(() => {
                try { noise.stop(); lfo.stop(); } catch (e) { }
            }, 200);
        },
        nodes: [noise, lfo, gain]
    };
}

/**
 * Generate filter sweep
 */
function synthFilter(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 4;

    const noise = createNoiseSource(ctx, 'pink');

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 10;

    // LFO for filter sweep
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.25;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 3000;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    noise.start(now);
    lfo.start(now);

    if (!isLoop) {
        noise.stop(now + duration);
        lfo.stop(now + duration);
    }

    return {
        duration,
        stop: () => {
            gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
            setTimeout(() => {
                try { noise.stop(); lfo.stop(); } catch (e) { }
            }, 200);
        },
        nodes: [noise, lfo, gain]
    };
}

/**
 * Generate beat roll effect
 */
function synthBeatRoll(ctx, output, isLoop = false) {
    const bpm = 120;
    const rollInterval = 60 / bpm / 8; // 32nd notes for fast roll

    const playHit = (time) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        osc.connect(gain);
        gain.connect(output);

        osc.start(time);
        osc.stop(time + 0.06);
    };

    const now = ctx.currentTime;

    if (isLoop) {
        for (let i = 0; i < 32; i++) {
            playHit(now + (i * rollInterval));
        }

        const loopId = setInterval(() => {
            const t = ctx.currentTime;
            for (let i = 0; i < 32; i++) {
                playHit(t + (i * rollInterval));
            }
        }, 32 * rollInterval * 1000);

        return {
            duration: 999,
            stop: () => clearInterval(loopId),
            loopId
        };
    } else {
        for (let i = 0; i < 8; i++) {
            playHit(now + (i * rollInterval));
        }
        return { duration: 8 * rollInterval };
    }
}

/**
 * Generate gater effect
 */
function synthGater(ctx, output, isLoop = false) {
    const now = ctx.currentTime;
    const duration = isLoop ? 999 : 2;

    const noise = createNoiseSource(ctx, 'pink');

    // Amplitude modulation for gating
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 8; // 8th note gate at 120bpm

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;

    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    noise.connect(masterGain);
    masterGain.connect(output);

    noise.start(now);
    lfo.start(now);

    if (!isLoop) {
        noise.stop(now + duration);
        lfo.stop(now + duration);
    }

    return {
        duration,
        stop: () => {
            masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
            setTimeout(() => {
                try { noise.stop(); lfo.stop(); } catch (e) { }
            }, 100);
        },
        nodes: [noise, lfo, masterGain]
    };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a noise buffer source
 */
function createNoiseSource(ctx, type = 'white') {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
}

/**
 * Create distortion curve
 */
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    return curve;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Map sound IDs to synthesizer functions
 */
const SYNTH_MAP = {
    // FX
    echo: synthEcho,
    reverb: synthReverb,
    flanger: synthFlanger,
    filter: synthFilter,
    beatroll: synthBeatRoll,
    gater: synthGater,

    // Sampler
    airhorn: synthAirhorn,
    siren: synthSiren,
    riser: synthRiser,
    drop: synthDrop,
    scratch: synthScratch,
    vocal: synthVocal,

    // Atmosphere
    pad: synthPad,
    subbass: synthSubBass,
    sweepup: synthSweepUp,
    sweepdown: synthSweepDown,
    tension: synthTension,
    shimmer: synthShimmer,

    // Rhythm
    kick808: synth808Kick,
    clap: synthClap,
    hihat: synthHiHat,
    snare: synthSnare,
    shaker: synthShaker,
    beatloop: synthBeatLoop,

    // Transition
    risefx: synthRiseFX,
    fallfx: synthFallFX,
    brake: synthBrake,
    revcymbal: synthRevCymbal,
    tapestop: synthTapeStop,
    noiseburst: synthNoiseBurst
};

/**
 * Trigger a one-shot sound
 */
export function triggerOneShot(soundId) {
    if (!state.audioCtx) {
        console.warn('[DJ Synth] No audio context');
        return;
    }

    if (!djMasterGain) {
        initDJAudio();
    }

    const synthFn = SYNTH_MAP[soundId];
    if (!synthFn) {
        console.warn('[DJ Synth] Unknown sound:', soundId);
        return;
    }

    console.log('[DJ Synth] Trigger:', soundId);
    const result = synthFn(state.audioCtx, djMasterGain, false);

    return result;
}

/**
 * Start a looping sound
 */
export function startLoop(soundId) {
    if (!state.audioCtx) {
        console.warn('[DJ Synth] No audio context');
        return;
    }

    if (!djMasterGain) {
        initDJAudio();
    }

    // Stop existing loop if running
    if (activeLoops[soundId]) {
        stopLoop(soundId);
    }

    const synthFn = SYNTH_MAP[soundId];
    if (!synthFn) {
        console.warn('[DJ Synth] Unknown sound:', soundId);
        return;
    }

    console.log('[DJ Synth] Start loop:', soundId);

    // Try to call with isLoop=true first
    let result = synthFn(state.audioCtx, djMasterGain, true);

    // If the synth function doesn't natively support loops (returns just duration),
    // create a retriggering loop
    if (result && result.duration && result.duration < 100 && !result.stop && !result.loopId) {
        // This is a one-shot sound - create auto-retrigger loop
        // Apply speed multiplier (higher speed = shorter interval)
        const baseInterval = Math.max(result.duration * 1000 + 100, 500);
        const retriggerInterval = Math.round(baseInterval / djSoundControls.speed);

        console.log('[DJ Synth] Creating retrigger loop for one-shot sound:', soundId, 'at interval:', retriggerInterval, 'ms (speed:', djSoundControls.speed, 'x)');

        // Use a flag to track if this loop is still active (since activeLoops may not be set yet)
        let isActive = true;

        const loopId = setInterval(() => {
            if (isActive && state.audioCtx && djMasterGain) {
                console.log('[DJ Synth] Retrigger:', soundId);
                try {
                    synthFn(state.audioCtx, djMasterGain, false);
                } catch (e) {
                    console.error('[DJ Synth] Retrigger error:', e);
                }
            } else if (!isActive) {
                // Clean up if loop was stopped
                clearInterval(loopId);
            }
        }, retriggerInterval);

        result = {
            duration: 999,
            loopId: loopId,
            stop: () => {
                console.log('[DJ Synth] Stopping retrigger loop:', soundId);
                isActive = false;
                clearInterval(loopId);
            }
        };

        console.log('[DJ Synth] Created retrigger loop for:', soundId, 'interval:', retriggerInterval);
    }

    activeLoops[soundId] = result;

    return result;
}

/**
 * Stop a looping sound
 */
export function stopLoop(soundId) {
    const loop = activeLoops[soundId];
    if (loop) {
        console.log('[DJ Synth] Stop loop:', soundId);
        if (loop.stop) {
            loop.stop();
        }
        if (loop.loopId) {
            clearInterval(loop.loopId);
        }
        delete activeLoops[soundId];
    }
}

/**
 * Check if a loop is active
 */
export function isLoopActive(soundId) {
    return !!activeLoops[soundId];
}

/**
 * Stop all active loops
 */
export function stopAllLoops() {
    Object.keys(activeLoops).forEach(id => stopLoop(id));
}

/**
 * Get all sound categories
 */
export function getCategories() {
    return DJ_SOUNDS;
}

console.log('[DJ Synth] Module loaded');
