/**
 * Mindwave Controls V3 - Restored "PERFECT" Version (March 12th Afternoon)
 * ──────────────────────────────────────────────────────────────────────────
 * - 5-Slider Header (Pitch, Beat, Binaural, Main Out, L/R Fader)
 * - 12-Button Visual Dock (No Mandala)
 * - Restored internal naming convention (Matrix/Interstellar)
 */

import { state, els, THEMES } from '../state_vPERFECT.js';
import { 
    updateFrequencies, updateBeatsVolume, updateMasterVolume, updateMasterBalance, 
    updateAtmosMaster, updateSoundscape, startAudio, stopAudio 
} from '../audio/engine.js';
import { 
    toggleVisual, setVisualSpeed, setVisualColor, setVisualBrightness, 
    getVisualizer, pauseVisuals, resumeVisuals 
} from '../visuals/visualizer_nuclear_vPERFECT.js';

export function setupUI() {
    console.log('[Controls] Initializing PERFECT UI Logic...');

    // Sliders
    els.baseSlider = document.getElementById('baseSlider');
    els.beatSlider = document.getElementById('beatSlider');
    els.volSlider = document.getElementById('volSlider');
    els.masterVolSlider = document.getElementById('masterVolSlider');
    els.balanceSlider = document.getElementById('balanceSlider');
    
    // Labels/Values
    els.baseValue = document.getElementById('baseValue');
    els.beatValue = document.getElementById('beatValue');
    els.volValue = document.getElementById('volValue');
    els.masterVolValue = document.getElementById('masterVolValue');
    els.balanceValue = document.getElementById('balanceValue');

    // Visual Dock Buttons
    els.sphereBtn = document.getElementById('sphereBtn');
    els.cubeBtn = document.getElementById('cubeBtn');
    els.dragonBtn = document.getElementById('dragonBtn');
    els.galaxyBtn = document.getElementById('galaxyBtn');
    els.flowBtn = document.getElementById('flowBtn');
    els.lavaBtn = document.getElementById('lavaBtn');
    els.fireplaceBtn = document.getElementById('fireplaceBtn');
    els.rainBtn = document.getElementById('rainBtn');
    els.zenBtn = document.getElementById('zenBtn');
    els.oceanBtn = document.getElementById('oceanBtn');
    els.cyberBtn = document.getElementById('cyberBtn');   // Maps to internal 'matrix'
    els.matrixBtn = document.getElementById('matrixBtn'); // Maps to internal 'interstellar'

    // Controls Logic
    setupSliderListeners();
    setupVisualListeners();
    setupGalaxyControls();

    console.log('[Controls] PERFECT UI Ready');
}

function setupSliderListeners() {
    if (els.baseSlider) {
        els.baseSlider.addEventListener('input', () => {
            const val = parseFloat(els.baseSlider.value);
            state.baseFrequency = val;
            if (els.baseValue) els.baseValue.textContent = `${val}Hz`;
            updateFrequencies();
        });
    }

    if (els.beatSlider) {
        els.beatSlider.addEventListener('input', () => {
            const val = parseFloat(els.beatSlider.value);
            state.beatFrequency = val;
            if (els.beatValue) els.beatValue.textContent = `${val}Hz`;
            updateFrequencies();
        });
    }

    if (els.volSlider) {
        els.volSlider.addEventListener('input', () => {
            state.binauralVolume = parseFloat(els.volSlider.value);
            if (els.volValue) els.volValue.textContent = `${Math.round(state.binauralVolume * 100)}%`;
            updateBeatsVolume(state.binauralVolume);
        });
    }

    if (els.masterVolSlider) {
        els.masterVolSlider.addEventListener('input', () => {
            state.masterVolume = parseFloat(els.masterVolSlider.value);
            if (els.masterVolValue) els.masterVolValue.textContent = `${Math.round(state.masterVolume * 100)}%`;
            updateMasterVolume(state.masterVolume);
        });
    }

    if (els.balanceSlider) {
        els.balanceSlider.addEventListener('input', () => {
            state.balance = parseFloat(els.balanceSlider.value);
            if (els.balanceValue) els.balanceValue.textContent = state.balance.toFixed(2);
            updateMasterBalance(state.balance);
        });
    }
}

function setupVisualListeners() {
    const bind = (el, mode) => {
        if (el) el.addEventListener('click', () => toggleVisual(mode));
    };

    bind(els.sphereBtn, 'sphere');
    bind(els.cubeBtn, 'box');
    bind(els.dragonBtn, 'dragon');
    bind(els.galaxyBtn, 'galaxy');
    bind(els.flowBtn, 'particles');
    bind(els.lavaBtn, 'lava');
    bind(els.fireplaceBtn, 'fireplace');
    bind(els.rainBtn, 'rainforest');
    bind(els.zenBtn, 'zengarden');
    bind(els.oceanBtn, 'ocean');
    
    // PERFECT Key Mappings
    bind(els.cyberBtn, 'matrix');         // UI "Cyber" -> Internal 2D matrix
    bind(els.matrixBtn, 'interstellar');  // UI "Matrix" -> Internal 3D cyber
}

function setupGalaxyControls() {
    const rx = document.getElementById('galaxySunRX');
    const ry = document.getElementById('galaxySunRY');
    const rz = document.getElementById('galaxySunRZ');

    const updateSun = () => {
        const viz = getVisualizer();
        if (viz && viz.activeModes.has('galaxy')) {
            if (rx) viz.sunRotationSpeedX = parseFloat(rx.value);
            if (ry) viz.sunRotationSpeedY = parseFloat(ry.value);
            if (rz) viz.sunRotationSpeedZ = parseFloat(rz.value);
        }
    };

    [rx, ry, rz].forEach(el => {
        if (el) el.addEventListener('input', updateSun);
    });
}
