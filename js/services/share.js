// MindWave Preset Sharing
// Share presets via URL parameters and QR codes

import { state } from '../state.js';

// Generate a shareable URL for current settings
export function generateShareableURL() {
    const params = new URLSearchParams();

    // Get current settings
    const baseSlider = document.getElementById('baseSlider');
    const beatSlider = document.getElementById('beatSlider');
    const visualColorPicker = document.getElementById('visualColorPicker');

    params.set('base', baseSlider?.value || 200);
    params.set('beat', beatSlider?.value || 10);
    params.set('mode', state.audioMode || 'binaural');

    if (visualColorPicker?.value) {
        params.set('color', visualColorPicker.value.replace('#', ''));
    }

    // Optional: add preset name
    const beatFreq = parseFloat(beatSlider?.value || 10);
    let presetName = 'custom';
    if (beatFreq < 4) presetName = 'delta';
    else if (beatFreq < 8) presetName = 'theta';
    else if (beatFreq < 14) presetName = 'alpha';
    else if (beatFreq < 30) presetName = 'beta';
    else if (beatFreq < 50) presetName = 'gamma';
    else presetName = 'hypergamma';
    params.set('preset', presetName);

    const url = new URL(window.location.origin + window.location.pathname);
    url.search = params.toString();

    return url.toString();
}

// Parse URL parameters and apply shared preset
export function parseSharedPreset() {
    const params = new URLSearchParams(window.location.search);

    if (!params.has('base') && !params.has('beat') && !params.has('preset')) {
        return null; // No shared preset in URL
    }

    const preset = {
        base: parseInt(params.get('base')) || 200,
        beat: parseFloat(params.get('beat')) || 10,
        mode: params.get('mode') || 'binaural',
        color: params.get('color') ? '#' + params.get('color') : null,
        presetName: params.get('preset') || 'custom'
    };

    console.log('[Share] Loaded shared preset:', preset);
    return preset;
}

// Apply a shared preset to the UI
export function applySharedPreset(preset) {
    if (!preset) return;

    const baseSlider = document.getElementById('baseSlider');
    const beatSlider = document.getElementById('beatSlider');
    const baseValue = document.getElementById('baseValue');
    const beatValue = document.getElementById('beatValue');
    const visualColorPicker = document.getElementById('visualColorPicker');
    const colorPreview = document.getElementById('colorPreview');

    if (baseSlider) {
        baseSlider.value = preset.base;
        if (baseValue) baseValue.textContent = preset.base + ' Hz';
    }

    if (beatSlider) {
        beatSlider.value = preset.beat;
        if (beatValue) beatValue.textContent = preset.beat + ' Hz';
    }

    if (preset.color && visualColorPicker) {
        visualColorPicker.value = preset.color;
        if (colorPreview) colorPreview.style.backgroundColor = preset.color;
    }

    // Show toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 24px;
        border-radius: 12px;
        color: var(--text-main);
        font-size: 14px;
        z-index: 9999;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = `🎵 Shared preset loaded: ${preset.presetName}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);

    // Clear URL params to avoid re-applying on refresh
    window.history.replaceState({}, '', window.location.pathname);
}

// Copy share link to clipboard
export async function copyShareLink() {
    const url = generateShareableURL();

    try {
        await navigator.clipboard.writeText(url);
        return { success: true, url };
    } catch (e) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return { success: true, url };
    }
}

// Generate QR code data URL (using simple QR library if available)
export function generateQRCode(url) {
    // This would integrate with a QR library like qrcode.js
    // For now, return a placeholder
    console.log('[Share] QR code generation would use:', url);
    return null;
}

// Initialize share feature - check for shared preset on load
export function initShareFeature() {
    const sharedPreset = parseSharedPreset();
    if (sharedPreset) {
        // Apply after a short delay to let UI initialize
        setTimeout(() => applySharedPreset(sharedPreset), 500);
    }
}
