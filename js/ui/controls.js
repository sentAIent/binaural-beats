import { state, els, THEMES, SOUNDSCAPES } from '../state.js';
import { startAudio, stopAudio, updateFrequencies, updateBeatsVolume, updateMasterVolume, updateAtmosMaster, updateSoundscape, registerUICallback } from '../audio/engine.js';
import { initVisualizer, getVisualizer } from '../visuals/visualizer.js';
import { startRecording, stopRecording, startExport, cancelExport, updateExportPreview } from '../export/recorder.js';
import { openAuthModal } from './auth-controller.js';
import { saveMixToCloud } from '../services/firebase.js';
import { auth, db, registerAuthCallback } from '../services/firebase.js';

export function setupUI() {
    // Populate els (DOM Element References)
    els.playBtn = document.getElementById('playBtn');
    els.playIcon = document.getElementById('playIcon');
    els.pauseIcon = document.getElementById('pauseIcon');
    els.baseSlider = document.getElementById('baseSlider');
    els.beatSlider = document.getElementById('beatSlider');
    els.volSlider = document.getElementById('volSlider');
    els.masterVolSlider = document.getElementById('masterVolSlider');
    els.atmosMasterSlider = document.getElementById('atmosMasterSlider');
    els.baseValue = document.getElementById('baseValue');
    els.beatValue = document.getElementById('beatValue');
    els.volValue = document.getElementById('volValue');
    els.masterVolValue = document.getElementById('masterVolValue');
    els.atmosMasterValue = document.getElementById('atmosMasterValue');
    els.presetButtons = document.querySelectorAll('.preset-btn');
    els.soundscapeContainer = document.getElementById('soundscapeContainer');
    els.canvas = document.getElementById('visualizer');
    els.canvas = document.getElementById('visualizer');
    els.themeBtn = document.getElementById('themeBtn');
    els.visualSpeedSlider = document.getElementById('visualSpeedSlider');
    els.speedValue = document.getElementById('speedValue');
    els.speedSliderContainer = document.getElementById('speedSliderContainer'); // Container for opacity
    els.visualSyncBtn = document.getElementById('visualSyncBtn');
    els.visualColorPicker = document.getElementById('visualColorPicker');
    els.randomColorBtn = document.getElementById('randomColorBtn');
    els.colorPreview = document.getElementById('colorPreview');
    els.profileBtn = document.getElementById('profileBtn');
    els.recordBtn = document.getElementById('recordBtn');
    els.videoModal = document.getElementById('videoModal');
    els.playbackVideo = document.getElementById('playbackVideo');
    els.videoToggleBtn = document.getElementById('videoToggleBtn');
    els.saveMixBtn = document.getElementById('saveMixBtn');
    els.historyBtn = document.getElementById('historyBtn');
    els.libraryPanel = document.getElementById('libraryPanel');
    els.libraryList = document.getElementById('libraryList');

    // Sidebar & Layout Elements
    els.leftPanel = document.getElementById('leftPanel');
    els.rightPanel = document.getElementById('rightPanel');
    els.leftToggle = document.getElementById('leftToggle');
    els.rightToggle = document.getElementById('rightToggle');
    els.closeLeftBtn = document.getElementById('closeLeftBtn');
    els.closeRightBtn = document.getElementById('closeRightBtn');
    els.statusIndicator = document.getElementById('statusIndicator');
    els.aiPrompt = document.getElementById('aiPrompt');
    els.saveModal = document.getElementById('saveModal');
    els.saveNameInput = document.getElementById('saveNameInput');
    els.cancelSaveBtn = document.getElementById('cancelSaveBtn');
    els.confirmSaveBtn = document.getElementById('confirmSaveBtn');
    els.loopCountInput = document.getElementById('loopCountInput');
    els.formatSelect = document.getElementById('formatSelect');
    els.loopDurationDisplay = document.getElementById('loopDurationDisplay');
    els.durationText = document.getElementById('durationText');
    els.sizeText = document.getElementById('sizeText');
    els.modalDlBtn = document.getElementById('modalDlBtn');
    els.quickExportBtn = document.getElementById('quickExportBtn');
    els.loopProcessing = document.getElementById('loopProcessing');
    els.progressStep = document.getElementById('progressStep');
    els.progressDetail = document.getElementById('progressDetail');
    els.progressFill = document.getElementById('progressFill');
    els.progressPercent = document.getElementById('progressPercent');
    els.progressEta = document.getElementById('progressEta');
    els.cancelExportBtn = document.getElementById('cancelExportBtn');
    els.aiPrompt = document.getElementById('aiPrompt');
    els.statusIndicator = document.getElementById('statusIndicator');
    els.audioOnlyPlayer = document.getElementById('audioOnlyPlayer');
    els.playbackAudio = document.getElementById('playbackAudio');
    els.profileModal = document.getElementById('profileModal');
    els.profileNameInput = document.getElementById('profileNameInput');
    els.saveProfileBtn = document.getElementById('saveProfileBtn');
    els.profileAvatarBig = document.getElementById('profileAvatarBig');
    els.profileUid = document.getElementById('profileUid');
    els.closeProfileBtn = document.getElementById('closeProfileBtn');
    els.closeLibraryBtn = document.getElementById('closeLibraryBtn');
    els.closeModalBtn = document.getElementById('closeModalBtn'); // Playback modal close

    // Global Interactive Elements
    els.appOverlay = document.getElementById('appOverlay');
    els.tapZone = document.getElementById('tapZone');
    els.sphereBtn = document.getElementById('sphereBtn');
    els.flowBtn = document.getElementById('flowBtn');

    // Bind Event Listeners
    if (els.playBtn) {
        els.playBtn.addEventListener('click', () => {
            if (state.isPlaying) stopAudio();
            else startAudio().catch(e => console.error("Start Audio Failed", e));
        });
    }

    if (els.recordBtn) {
        els.recordBtn.addEventListener('click', () => {
            if (!state.isPlaying) alert("Start audio session first.");
            else if (state.isRecording) stopRecording();
            else startRecording();
        });
    }

    if (els.historyBtn) els.historyBtn.addEventListener('click', () => els.libraryPanel.classList.toggle('translate-x-full'));
    if (els.closeLibraryBtn) els.closeLibraryBtn.addEventListener('click', () => els.libraryPanel.classList.add('translate-x-full'));

    if (els.saveMixBtn) els.saveMixBtn.addEventListener('click', savePreset);
    if (els.cancelSaveBtn) els.cancelSaveBtn.addEventListener('click', () => els.saveModal.classList.remove('active'));
    if (els.confirmSaveBtn) els.confirmSaveBtn.addEventListener('click', confirmSave);

    if (els.closeModalBtn) els.closeModalBtn.addEventListener('click', () => {
        els.videoModal.classList.remove('active');
        if (els.playbackVideo) { els.playbackVideo.pause(); els.playbackVideo.src = ""; }
        if (els.playbackAudio) { els.playbackAudio.pause(); }
    });

    if (els.videoToggleBtn) {
        els.videoToggleBtn.addEventListener('click', () => {
            state.videoEnabled = !state.videoEnabled;
            if (state.videoEnabled) {
                els.videoToggleBtn.style.color = "var(--accent)";
                els.videoToggleBtn.style.backgroundColor = "rgba(45, 212, 191, 0.2)";
                els.videoToggleBtn.style.boxShadow = "0 0 15px var(--accent-glow)";
            } else {
                els.videoToggleBtn.style.color = "var(--text-muted)";
                els.videoToggleBtn.style.backgroundColor = "";
                els.videoToggleBtn.style.boxShadow = "";
            }
        });
    }

    // Sliders
    if (els.baseSlider) els.baseSlider.addEventListener('input', () => { updateFrequencies(); saveStateToLocal(); });
    if (els.beatSlider) els.beatSlider.addEventListener('input', () => { updateFrequencies(); saveStateToLocal(); });
    if (els.volSlider) els.volSlider.addEventListener('input', () => { updateBeatsVolume(); saveStateToLocal(); });
    if (els.masterVolSlider) els.masterVolSlider.addEventListener('input', () => { updateMasterVolume(); saveStateToLocal(); });
    if (els.atmosMasterSlider) els.atmosMasterSlider.addEventListener('input', () => { updateAtmosMaster(); saveStateToLocal(); });

    // Visual Speed & Sync Controls
    if (els.visualSpeedSlider) els.visualSpeedSlider.addEventListener('input', () => {
        const val = parseFloat(els.visualSpeedSlider.value);
        const viz = getVisualizer();
        if (viz) viz.setSpeed(val);
        if (els.speedValue) els.speedValue.textContent = val.toFixed(1) + 'x';
    });

    // Auto Sync Toggle
    if (els.visualSyncBtn) {
        els.visualSyncBtn.addEventListener('click', () => {
            state.visualSpeedAuto = !state.visualSpeedAuto;
            updateSyncUI();
            updateFrequencies(); // Recalculate speed immediately
        });
    }

    function updateSyncUI() {
        if (!els.visualSyncBtn || !els.visualSpeedSlider || !els.speedSliderContainer) return;

        if (state.visualSpeedAuto) {
            // Auto Mode: Active
            els.visualSyncBtn.style.backgroundColor = "var(--accent)";
            els.visualSyncBtn.style.color = "var(--bg-main)";
            els.visualSpeedSlider.disabled = true;
            els.speedSliderContainer.classList.add('opacity-50');
            els.speedSliderContainer.classList.remove('opacity-100');
        } else {
            // Manual Mode: Inactive
            els.visualSyncBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
            els.visualSyncBtn.style.color = "var(--text-muted)";
            els.visualSpeedSlider.disabled = false;
            els.speedSliderContainer.classList.remove('opacity-50');
            els.speedSliderContainer.classList.add('opacity-100');
        }
    }

    // Sidebar Toggles
    const updateVisualizerScale = () => {
        // On Desktop (Cockpit Mode), scaling is handled by CSS
        if (window.innerWidth >= 1024) return;

        const leftOpen = !els.leftPanel.classList.contains('-translate-x-full');
        const rightOpen = !els.rightPanel.classList.contains('translate-x-full');

        // Scale down if any panel is open (Mobile/Tablet)
        const canvas = document.getElementById('visualizer');
        if (canvas) {
            if (leftOpen || rightOpen) {
                canvas.style.transform = 'scale(0.85)';
                canvas.style.opacity = '0.6';
            } else {
                canvas.style.transform = 'scale(1)';
                canvas.style.opacity = '1';
            }
        }
    };

    if (els.leftToggle) els.leftToggle.addEventListener('click', () => {
        els.leftPanel.classList.remove('-translate-x-full');
        updateVisualizerScale();
    });
    if (els.closeLeftBtn) els.closeLeftBtn.addEventListener('click', () => {
        els.leftPanel.classList.add('-translate-x-full');
        updateVisualizerScale();
    });

    if (els.rightToggle) els.rightToggle.addEventListener('click', () => {
        els.rightPanel.classList.remove('translate-x-full');
        updateVisualizerScale();
    });
    if (els.closeRightBtn) els.closeRightBtn.addEventListener('click', () => {
        els.rightPanel.classList.add('translate-x-full');
        updateVisualizerScale();
    });

    // Auto-open mixer on first load for desktop? Maybe not, keep immersive.

    // Auto-open mixer on first load for desktop? Maybe not, keep immersive.

    // Tap Zone Removed (per user request)

    // Immersive Mode
    document.addEventListener('touchstart', resetImmersiveTimer, { passive: true });
    document.addEventListener('mousemove', resetImmersiveTimer, { passive: true });
    document.addEventListener('click', resetImmersiveTimer);



    // Visual Modes
    if (els.sphereBtn) els.sphereBtn.addEventListener('click', () => setVisualMode('sphere'));
    if (els.flowBtn) els.flowBtn.addEventListener('click', () => setVisualMode('particles'));
    if (els.visualSpeedSlider) {
        els.visualSpeedSlider.addEventListener('input', (e) => {
            console.log("Slider Input:", e.target.value);
            const viz = getVisualizer();
            if (viz) viz.setSpeed(parseFloat(e.target.value));
        });
    }

    initThemeModal();

    // Color Controls
    if (els.visualColorPicker) {
        els.visualColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            if (els.colorPreview) els.colorPreview.style.backgroundColor = color;
            const viz = getVisualizer();
            if (viz) viz.setColor(color);
        });
    }

    if (els.randomColorBtn) {
        els.randomColorBtn.addEventListener('click', () => {
            // Generate random vibrant color
            const h = Math.floor(Math.random() * 360);
            const s = 70 + Math.random() * 30; // High saturation
            const l = 50 + Math.random() * 10; // Medium-High lightness
            const color = `hsl(${h}, ${s}%, ${l}%)`;

            // Convert to Hex for input (helper or temp div trick)
            // Or just set directly if Three.js accepts hsl string (it does!)
            // But we need hex for the input value. Let's do a simple hex gen for safety.
            const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

            if (els.colorPreview) els.colorPreview.style.backgroundColor = randomHex;
            if (els.visualColorPicker) els.visualColorPicker.value = randomHex;

            const viz = getVisualizer();
            if (viz) viz.setColor(randomHex);
        });
    }

    // Export Controls
    if (els.modalDlBtn) els.modalDlBtn.addEventListener('click', startExport);
    if (els.quickExportBtn) els.quickExportBtn.addEventListener('click', () => {
        // Use current loop count value (don't reset)
        if (els.formatSelect) els.formatSelect.value = 'wav-16';
        startExport();
    });
    if (els.cancelExportBtn) els.cancelExportBtn.addEventListener('click', cancelExport);

    // Profile Modal
    if (els.closeProfileBtn) {
        els.closeProfileBtn.onclick = () => els.profileModal.classList.remove('active');
    }

    if (els.loopCountInput) els.loopCountInput.addEventListener('input', updateExportPreview);
    if (els.formatSelect) els.formatSelect.addEventListener('input', updateExportPreview);

    // Register Callbacks
    registerUICallback(updateUIState);
    registerAuthCallback((user) => {
        // Update Profile Button Avatar if user logs in
        // Handled by auth-controller
    });

    // Listen for custom load event from auth-controller
    window.addEventListener('load-mix', (e) => {
        loadSettings({ settings: e.detail.settings });
        // Ensure UI sidebars close if needed
        els.libraryPanel.classList.add('translate-x-full');
    });

    // Init Components


    // Safe Initialization Pattern
    try { initMixer(); } catch (e) { console.error("Mixer Init Failed:", e); }
    try { restoreStateFromLocal(); } catch (e) { console.error("State Restore Failed:", e); }
    try { initVisualizer(); } catch (e) { console.error("Visualizer Init Failed:", e); }

    // Theme
    const savedTheme = localStorage.getItem('mindwave_theme');
    if (savedTheme) setTheme(savedTheme);

    // Expose Global Window Functions
    window.setTheme = setTheme;
    window.setVisualMode = setVisualMode;
    window.applyPreset = applyPreset;
    window.openProfile = openProfile;
}

export function updateUIState(playing) {
    if (playing) {
        els.playIcon.classList.add('hidden');
        els.pauseIcon.classList.remove('hidden');
        els.statusIndicator.classList.remove('bg-slate-600');
        els.statusIndicator.classList.add('bg-teal-400', 'animate-pulse');
        els.recordBtn.disabled = false;
        resetImmersiveTimer();
    } else {
        els.playIcon.classList.remove('hidden');
        els.pauseIcon.classList.add('hidden');
        els.statusIndicator.classList.add('bg-slate-600');
        els.statusIndicator.classList.remove('bg-teal-400', 'animate-pulse');
        els.recordBtn.disabled = true;
        els.recordBtn.disabled = true;
        clearTimeout(state.immersiveTimeout);
        if (els.appOverlay) els.appOverlay.classList.remove('immersive-hidden');
    }
}

export function resetImmersiveTimer() {
    if (els.appOverlay) els.appOverlay.classList.remove('immersive-hidden');
    clearTimeout(state.immersiveTimeout);
    if (state.isPlaying) {
        state.immersiveTimeout = setTimeout(() => {
            if (state.isPlaying && els.appOverlay) {
                els.appOverlay.classList.add('immersive-hidden');
            }
        }, 5000);
    }
}

export function setVisualMode(mode) {
    state.visualMode = mode;
    const viz = getVisualizer();
    if (viz) viz.setMode(mode);
    if (els.sphereBtn && els.flowBtn) {
        if (mode === 'sphere') {
            els.sphereBtn.classList.add('active-mode', 'text-[var(--accent)]');
            els.sphereBtn.classList.remove('text-[var(--text-muted)]');
            els.flowBtn.classList.remove('active-mode', 'text-[var(--accent)]');
            els.flowBtn.classList.add('text-[var(--text-muted)]');
        } else {
            els.flowBtn.classList.add('active-mode', 'text-[var(--accent)]');
            els.flowBtn.classList.remove('text-[var(--text-muted)]');
            els.sphereBtn.classList.remove('active-mode', 'text-[var(--accent)]');
            els.sphereBtn.classList.add('text-[var(--text-muted)]');
        }
    }
}

export function setTheme(themeName) {
    const t = THEMES[themeName] || THEMES.default;
    const r = document.documentElement.style;
    r.setProperty('--bg-main', t.bg); r.setProperty('--bg-panel', t.panel); r.setProperty('--border', t.border);
    r.setProperty('--text-main', t.text); r.setProperty('--text-muted', t.muted); r.setProperty('--accent', t.accent);
    r.setProperty('--accent-glow', t.glow); r.setProperty('--slider-track', t.border);
    localStorage.setItem('mindwave_theme', themeName);
}

export function initMixer() {
    els.soundscapeContainer.innerHTML = '';
    SOUNDSCAPES.forEach(s => {
        // Force Bells to 0 volume per user request, or init missing
        if (!state.soundscapeSettings[s.id] || s.id === 'bells') {
            state.soundscapeSettings[s.id] = { vol: 0, tone: 0.5, speed: 0.5 };
        }
        const settings = state.soundscapeSettings[s.id];
        const item = document.createElement('div');
        item.className = "p-2 rounded border border-[var(--border)] flex flex-col gap-1";
        item.style.backgroundColor = "rgba(0,0,0,0.2)";
        item.innerHTML = `<label class="text-[10px] font-semibold truncate mb-1 block" style="color: var(--accent);" title="${s.label}">${s.label}</label>
<div class="flex items-center gap-2"><span class="text-[8px] w-6" style="color: var(--text-muted);">VOL</span><input type="range" min="0" max="0.5" step="0.01" value="${settings.vol}" class="flex-1 h-1" data-id="${s.id}" data-type="vol"><span class="text-[9px] font-mono w-8 text-right tabular-nums" style="color: var(--accent);" data-val="vol">${Math.round(settings.vol * 200)}%</span></div>
<div class="flex items-center gap-2"><span class="text-[8px] w-6" style="color: var(--text-muted);">TONE</span><input type="range" min="0" max="1" step="0.01" value="${settings.tone}" class="flex-1 tone-slider h-1" data-id="${s.id}" data-type="tone"><span class="text-[9px] font-mono w-8 text-right tabular-nums" style="color: var(--accent);" data-val="tone">${Math.round(settings.tone * 100)}%</span></div>
<div class="flex items-center gap-2"><span class="text-[8px] w-6" style="color: var(--text-muted);">SPD</span><input type="range" min="0" max="1" step="0.01" value="${settings.speed}" class="flex-1 speed-slider h-1" data-id="${s.id}" data-type="speed"><span class="text-[9px] font-mono w-8 text-right tabular-nums" style="color: var(--accent);" data-val="speed">${Math.round(settings.speed * 100)}%</span></div>`;

        // Vol slider with value update
        const volInput = item.querySelector('input[data-type="vol"]');
        const volVal = item.querySelector('[data-val="vol"]');
        volInput.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            volVal.textContent = Math.round(v * 200) + '%';
            updateSoundscape(s.id, 'vol', v);
            saveStateToLocal();
        });

        // Tone slider with value update
        const toneInput = item.querySelector('input[data-type="tone"]');
        const toneVal = item.querySelector('[data-val="tone"]');
        toneInput.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            toneVal.textContent = Math.round(v * 100) + '%';
            updateSoundscape(s.id, 'tone', v);
            saveStateToLocal();
        });

        // Speed slider with value update
        const speedInput = item.querySelector('input[data-type="speed"]');
        const speedVal = item.querySelector('[data-val="speed"]');
        speedInput.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            speedVal.textContent = Math.round(v * 100) + '%';
            updateSoundscape(s.id, 'speed', v);
            saveStateToLocal();
        });

        els.soundscapeContainer.appendChild(item);
    });
}

function saveStateToLocal() {
    const s = {
        base: els.baseSlider.value,
        beat: els.beatSlider.value,
        beatsVol: els.volSlider.value,
        masterVol: els.masterVolSlider.value,
        atmosMaster: els.atmosMasterSlider.value,
        soundscapes: state.soundscapeSettings
    };
    localStorage.setItem('mindwave_state_v2', JSON.stringify(s));
}

function restoreStateFromLocal() {
    try {
        const saved = localStorage.getItem('mindwave_state_v2');
        if (saved) {
            const s = JSON.parse(saved);
            loadSettings({ settings: s });
        } else {
            applyPreset('alpha');
        }
    } catch (e) { console.warn("Failed to restore state", e); }
}

export function loadSettings(payload) {
    if (!payload || !payload.settings) return;
    const settings = payload.settings;
    if (settings.base) els.baseSlider.value = settings.base;
    if (settings.beat) els.beatSlider.value = settings.beat;
    if (settings.beatsVol) els.volSlider.value = settings.beatsVol;
    if (settings.masterVol) els.masterVolSlider.value = settings.masterVol;
    if (settings.atmosMaster) els.atmosMasterSlider.value = settings.atmosMaster;

    // Update Frequencies immediately
    updateFrequencies();
    updateBeatsVolume();
    updateMasterVolume();
    updateAtmosMaster();

    if (settings.soundscapes) {
        state.soundscapeSettings = settings.soundscapes;
        SOUNDSCAPES.forEach(s => {
            const id = s.id;
            const saved = settings.soundscapes[id];

            // Force Volume to 0 on reload per user request (was: saved.vol)
            const newVol = 0;
            const newTone = saved ? (saved.tone || 0.5) : 0.5;
            const newSpeed = saved ? (saved.speed || 0.5) : 0.5;
            state.soundscapeSettings[id] = { vol: newVol, tone: newTone, speed: newSpeed };

            // Update Inputs
            const vIn = els.soundscapeContainer.querySelector(`input[data-id="${id}"][data-type="vol"]`);
            const tIn = els.soundscapeContainer.querySelector(`input[data-id="${id}"][data-type="tone"]`);
            const sIn = els.soundscapeContainer.querySelector(`input[data-id="${id}"][data-type="speed"]`);
            if (vIn) vIn.value = newVol;
            if (tIn) tIn.value = newTone;
            if (sIn) sIn.value = newSpeed;

            // Update Audio if playing
            if (state.isPlaying) {
                updateSoundscape(id, 'vol', newVol);
                updateSoundscape(id, 'tone', newTone);
                updateSoundscape(id, 'speed', newSpeed);
            }
        });
    }
}



export function openProfile() {
    if (!state.currentUser) return;
    if (!els.profileModal) return;
    els.profileModal.classList.add('active');
    const user = state.currentUser;
    if (els.profileNameInput) els.profileNameInput.value = user.displayName || "";
    if (els.profileUid) els.profileUid.textContent = `ID: ${user.uid.slice(0, 6)}...`;
    if (els.profileAvatarBig) els.profileAvatarBig.textContent = (user.displayName || "A")[0].toUpperCase();
}

// --- Library Logic ---



function savePreset() {
    if (!state.currentUser) {
        // Not logged in -> Open Auth
        openAuthModal();
        return;
    }
    els.saveModal.classList.add('active');
    els.saveNameInput.value = `Mix ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setTimeout(() => els.saveNameInput.select(), 50);
}

async function confirmSave() {
    const name = els.saveNameInput.value || "Untitled Mix";
    els.saveModal.classList.remove('active');

    // Spinner
    const originalContent = els.saveMixBtn.innerHTML;
    els.saveMixBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;
    els.saveMixBtn.style.color = "var(--accent)";

    const sessionData = {
        name: name,
        settings: {
            base: els.baseSlider.value,
            beat: els.beatSlider.value,
            beatsVol: els.volSlider.value,
            masterVol: els.masterVolSlider.value,
            atmosMaster: els.atmosMasterSlider.value,
            soundscapes: { ...state.soundscapeSettings }
        }
    };

    try {
        await saveMixToCloud(sessionData);
        // Success Tick
        els.saveMixBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        // Open library to show result
        els.libraryPanel.classList.remove('translate-x-full');
    } catch (e) {
        console.error("Save failed", e);
        els.saveMixBtn.style.color = "#ef4444";
        alert("Save failed: " + e.message);
    } finally {
        setTimeout(() => {
            els.saveMixBtn.innerHTML = originalContent;
            els.saveMixBtn.style.color = "var(--text-muted)";
        }, 2000);
    }
}
// Remove old setupLibraryListener and renderLibrary as they are handled by auth-controller now.

export async function applyPreset(type, btnElement) {
    console.log("[Controls] applyPreset called:", type);

    // 0. Auto-Play FIRST (Critical for UX)
    // We try to start audio immediately on the click event
    if (!state.isPlaying) {
        console.log("[Controls] Auto-starting audio...");
        try {
            await startAudio();
        } catch (e) {
            console.error("[Controls] Auto-start failed:", e);
            alert("Audio Auto-Start Error: " + e.message);
        }
    }

    // 1. Update UI Buttons
    if (els.presetButtons) {
        els.presetButtons.forEach(b => {
            b.classList.remove('bg-white/10', 'border-white/20');
            b.classList.add('bg-white/5', 'border-white/10');
        });

        // Find button by type if not specific element passed
        const targetBtn = btnElement || document.querySelector(`.preset-btn[onclick*="'${type}'"]`);
        if (targetBtn) {
            targetBtn.classList.remove('bg-white/5', 'border-white/10');
            targetBtn.classList.add('bg-white/10', 'border-white/20');
        }
    }

    // 2. Set Frequencies & Colors
    let base = 200, beat = 10;
    let color = '#ffffff';

    switch (type) {
        case 'delta': base = 100; beat = 2.5; color = '#6366f1'; break;
        case 'theta': base = 144; beat = 5.5; color = '#a855f7'; break;
        case 'alpha': base = 200; beat = 10; color = '#2dd4bf'; break;
        case 'beta': base = 250; beat = 20; color = '#f59e0b'; break;
        case 'gamma': base = 320; beat = 40; color = '#f43f5e'; break;

        // Healing Frequencies (Solfeggio)
        // using Theta (5.5Hz) beat for relaxation, except 963Hz (Gamma/40Hz)
        case 'heal-174': base = 174; beat = 5.5; color = '#2dd4bf'; break; // Teal
        case 'heal-285': base = 285; beat = 5.5; color = '#2dd4bf'; break; // Teal
        case 'heal-396': base = 396; beat = 5.5; color = '#f43f5e'; break; // Rose
        case 'heal-417': base = 417; beat = 5.5; color = '#f43f5e'; break; // Rose
        case 'heal-432': base = 432; beat = 5.5; color = '#10b981'; break; // Emerald
        case 'heal-528': base = 528; beat = 5.5; color = '#06b6d4'; break; // Cyan
        case 'heal-639': base = 639; beat = 5.5; color = '#3b82f6'; break; // Blue
        case 'heal-741': base = 741; beat = 5.5; color = '#6366f1'; break; // Indigo
        case 'heal-852': base = 852; beat = 5.5; color = '#8b5cf6'; break; // Violet
        case 'heal-963': base = 963; beat = 40; color = '#d946ef'; break; // Fuchsia (Hyper-Gamma)
        case 'hyper-gamma': base = 640; beat = 80; color = '#e879f9'; break; // Higher octave than gamma (2x)
    }

    if (els.baseSlider) { els.baseSlider.value = base; if (els.baseValue) els.baseValue.textContent = base + ' Hz'; }
    if (els.beatSlider) { els.beatSlider.value = beat; if (els.beatValue) els.beatValue.textContent = beat + ' Hz'; }

    // 3. Update Audio (Safely)
    try {
        updateFrequencies();
    } catch (e) {
        console.warn("[Controls] updateFrequencies warning (audio might trigger this later):", e);
    }

    // 4. Update Visualizer
    const viz = getVisualizer();
    if (viz) viz.setColor(color);
    if (els.visualColorPicker) els.visualColorPicker.value = color;
    if (els.colorPreview) els.colorPreview.style.backgroundColor = color;

    // 5. Save
    saveStateToLocal();
}

// --- THEME MODAL LOGIC ---

export function initThemeModal() {
    const grid = document.getElementById('themeGrid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    Object.keys(THEMES).forEach(key => {
        const theme = THEMES[key];
        const card = document.createElement('div');
        card.className = `theme-card group ${els.themeBtn && document.body.dataset.theme === key ? 'active' : ''}`;
        card.style.setProperty('--theme-bg', theme.bg);

        // Card HTML
        // Determine text color for card (dark background)
        // For light themes (dawn/cloud), theme.text is dark, so we use theme.muted (light) or accent suitable for dark bg
        let titleColor = theme.text;
        if (key === 'cloud' || key === 'dawn') {
            titleColor = theme.muted;
        }

        const displayName = key === 'default' ? 'Emerald' : key;

        card.innerHTML = `
            <div class="theme-preview">
                <div class="absolute inset-0 opacity-50" style="background: radial-gradient(circle at 50% 50%, ${theme.accent}, transparent 70%);"></div>
            </div>
            <div class="p-3">
                <div class="text-sm font-bold capitalize mb-1" style="color: ${titleColor}">${displayName}</div>
                <div class="text-[10px]" style="color: ${theme.muted}">
                    ${getThemeDesc(key)}
                </div>
            </div>
        `;

        card.onclick = () => {
            setTheme(key);
            // Flash "active" state
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            // Optional: Close modal after short delay or stay open? 
            // Let's stay open so they can browse, but maybe close if they click outside.
        };

        grid.appendChild(card);
    });

    // Close Button
    const closeBtn = document.getElementById('closeThemeBtn');
    if (closeBtn) closeBtn.onclick = closeThemeModal;

    // Trigger button
    if (els.themeBtn) els.themeBtn.addEventListener('click', openThemeModal);

    // Click outside to close
    const modal = document.getElementById('themeModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeThemeModal();
        });
    }
}

function getThemeDesc(key) {
    switch (key) {
        case 'default': return "Clean Slate";
        case 'midnight': return "Deep Blue Focus";
        case 'ember': return "Warm Intensity";
        case 'abyss': return "Total Darkness";
        case 'cloud': return "Light & Airy";
        case 'dawn': return "Soft Morning";
        case 'cyberpunk': return "Neon & High-Contrast";
        case 'nebula': return "Cosmic Depth";
        case 'quantum': return "Matrix Grid";
        case 'sunset': return "Synthwave Glow";
        default: return "Custom Theme";
    }
}

export function openThemeModal() {
    const modal = document.getElementById('themeModal');
    const card = document.getElementById('themeModalCard');
    if (modal && card) {
        // Re-render to update 'active' state
        initThemeModal();

        modal.classList.remove('hidden');
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('active');

        setTimeout(() => {
            card.classList.remove('scale-95', 'opacity-0');
            card.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

export function closeThemeModal() {
    const modal = document.getElementById('themeModal');
    const card = document.getElementById('themeModalCard');
    if (modal && card) {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }, 300);
    }
}
