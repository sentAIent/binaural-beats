export const THEMES = {
    // Dark Themes
    default: { type: 'dark', bg: '#0f172a', panel: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', accent: '#2dd4bf', secondary: '#fb7185', glow: 'rgba(45, 212, 191, 0.4)', volumeAccent: '#d42d48', volumeGlow: 'rgba(212, 45, 72, 0.4)' },
    midnight: { type: 'dark', bg: '#0a1628', panel: '#162032', border: '#2a3a52', text: '#e2e8f0', muted: '#8ba3c4', accent: '#60a9ff', secondary: '#fbbf24', glow: 'rgba(96, 169, 255, 0.4)', volumeAccent: '#ffb660', volumeGlow: 'rgba(255, 182, 96, 0.4)' },
    abyss: { type: 'dark', bg: '#09090b', panel: '#18181b', border: '#27272a', text: '#fafafa', muted: '#a1a1aa', accent: '#e4e4e7', secondary: '#a78bfa', glow: 'rgba(255, 255, 255, 0.2)', volumeAccent: '#a78bfa', volumeGlow: 'rgba(167, 139, 250, 0.4)' },
    ember: { type: 'dark', bg: '#1a0505', panel: '#2d1010', border: '#4a1515', text: '#fce7e7', muted: '#e5a3a3', accent: '#fb7185', secondary: '#4ade80', glow: 'rgba(251, 113, 133, 0.4)', volumeAccent: '#71fb85', volumeGlow: 'rgba(113, 251, 133, 0.4)' },
    cyberpunk: { type: 'dark', bg: '#0a0512', panel: '#150a20', border: '#2a1540', text: '#f0e6ff', muted: '#b794f4', accent: '#d946ef', secondary: '#22d3ee', glow: 'rgba(217, 70, 239, 0.6)', volumeAccent: '#46ef69', volumeGlow: 'rgba(70, 239, 105, 0.5)' },
    nebula: { type: 'dark', bg: '#10002b', panel: '#1a0040', border: '#2d0066', text: '#e8d5ff', muted: '#b794f6', accent: '#c77dff', secondary: '#34d399', glow: 'rgba(199, 125, 255, 0.5)', volumeAccent: '#c9ff7d', volumeGlow: 'rgba(201, 255, 125, 0.4)' },
    quantum: { type: 'dark', bg: '#021a15', panel: '#0a3028', border: '#154540', text: '#d5fff5', muted: '#7eddc8', accent: '#2dd4bf', secondary: '#f472b6', glow: 'rgba(45, 212, 191, 0.6)', volumeAccent: '#d42d48', volumeGlow: 'rgba(212, 45, 72, 0.5)' },
    sunset: { type: 'dark', bg: '#1a0a10', panel: '#301508', border: '#4a200a', text: '#fff0e0', muted: '#e8b080', accent: '#f97316', secondary: '#3b82f6', glow: 'rgba(249, 115, 22, 0.5)', volumeAccent: '#1673f9', volumeGlow: 'rgba(22, 115, 249, 0.4)' },

    // Ambassador Themes (Referral Unlocks)
    platinum: { type: 'dark', bg: '#0f172a', panel: '#1e293b', border: '#334155', text: '#f8fafc', muted: '#94a3b8', accent: '#94a3b8', secondary: '#60a9ff', glow: 'rgba(148, 163, 184, 0.4)', volumeAccent: '#38bdf8', volumeGlow: 'rgba(56, 189, 248, 0.4)', threshold: 3 },
    titanium: { type: 'dark', bg: '#09090b', panel: '#18181b', border: '#27272a', text: '#fafafa', muted: '#a1a1aa', accent: '#6366f1', secondary: '#f43f5e', glow: 'rgba(99, 102, 241, 0.4)', volumeAccent: '#f43f5e', volumeGlow: 'rgba(244, 63, 94, 0.4)', threshold: 5 },
    supernova: { type: 'dark', bg: '#020617', panel: '#0f172a', border: '#1e293b', text: '#fff1f2', muted: '#fda4af', accent: '#f43f5e', secondary: '#fbbf24', glow: 'rgba(244, 63, 94, 0.6)', volumeAccent: '#fbbf24', volumeGlow: 'rgba(251, 191, 36, 0.5)', threshold: 10 },

    // NEW Premium Dark Themes
    aurora: { type: 'dark', bg: '#051520', panel: '#0a2535', border: '#153a50', text: '#e0f8ff', muted: '#80d4f4', accent: '#22d3ee', secondary: '#4ade80', glow: 'rgba(34, 211, 238, 0.5)', volumeAccent: '#ee22a8', volumeGlow: 'rgba(238, 34, 168, 0.4)' },
    forest: { type: 'dark', bg: '#0a120a', panel: '#142014', border: '#1e3018', text: '#e8f5e8', muted: '#90c090', accent: '#4ade80', secondary: '#f97316', glow: 'rgba(74, 222, 128, 0.5)', volumeAccent: '#de804a', volumeGlow: 'rgba(222, 128, 74, 0.4)' },
    royal: { type: 'dark', bg: '#0f0a1a', panel: '#1a1030', border: '#2a1850', text: '#f0e8ff', muted: '#b8a0e0', accent: '#a78bfa', secondary: '#fbbf24', glow: 'rgba(167, 139, 250, 0.5)', volumeAccent: '#8bfab0', volumeGlow: 'rgba(139, 250, 176, 0.4)' },
    ocean: { type: 'dark', bg: '#041525', panel: '#082538', border: '#0c3850', text: '#e0f0ff', muted: '#80b8e0', accent: '#3b82f6', secondary: '#34d399', glow: 'rgba(59, 130, 246, 0.5)', volumeAccent: '#f6b83b', volumeGlow: 'rgba(246, 184, 59, 0.4)' },
    rose: { type: 'dark', bg: '#1a0a10', panel: '#2a1020', border: '#401830', text: '#ffe8f0', muted: '#e0a0b8', accent: '#f472b6', secondary: '#38bdf8', glow: 'rgba(244, 114, 182, 0.5)', volumeAccent: '#72f4a0', volumeGlow: 'rgba(114, 244, 160, 0.4)' },
    gold: { type: 'dark', bg: '#151008', panel: '#251a0a', border: '#3a280f', text: '#fff8e8', muted: '#d4b880', accent: '#fbbf24', secondary: '#a78bfa', glow: 'rgba(251, 191, 36, 0.5)', volumeAccent: '#2496fb', volumeGlow: 'rgba(36, 150, 251, 0.4)' },
    obsidian: { type: 'dark', bg: '#080808', panel: '#121212', border: '#1c1c1c', text: '#f5f5f5', muted: '#888888', accent: '#ffffff', secondary: '#60a9ff', glow: 'rgba(255, 255, 255, 0.3)', volumeAccent: '#ff6b6b', volumeGlow: 'rgba(255, 107, 107, 0.4)' },
    arctic: { type: 'dark', bg: '#081520', panel: '#102030', border: '#183045', text: '#e8f4ff', muted: '#a0c8e8', accent: '#7dd3fc', secondary: '#f472b6', glow: 'rgba(125, 211, 252, 0.5)', volumeAccent: '#fca07d', volumeGlow: 'rgba(252, 160, 125, 0.4)' },
    sentaient: { type: 'dark', bg: '#202733', panel: '#2a3445', border: '#3a475c', text: '#60a9ff', muted: '#8bb6e8', accent: '#60a9ff', secondary: '#fbbf24', glow: 'rgba(96, 169, 255, 0.4)', volumeAccent: '#60a9ff', volumeGlow: 'rgba(96, 169, 255, 0.3)' },

    // Soft Light Themes (with tinted backgrounds)
    cloud: { type: 'light', bg: '#e8f4fc', panel: '#d4ebf7', border: '#a8d4f0', text: '#0f172a', muted: '#3b6d8c', accent: '#0284c7', secondary: '#f43f5e', glow: 'rgba(2, 132, 199, 0.4)', volumeAccent: '#dc2626', volumeGlow: 'rgba(220, 38, 38, 0.4)', glassBg: 'rgba(212, 235, 247, 0.95)', glassBorder: 'rgba(100, 160, 200, 0.3)' },
    dawn: { type: 'light', bg: '#fef2f2', panel: '#fecdd3', border: '#fda4af', text: '#dc2626', muted: '#991b1b', accent: '#dc2626', secondary: '#16a34a', glow: 'rgba(220, 38, 38, 0.4)', volumeAccent: '#16a34a', volumeGlow: 'rgba(22, 163, 74, 0.4)', glassBg: 'rgba(254, 205, 211, 0.95)', glassBorder: 'rgba(252, 165, 165, 0.3)' },
    paper: { type: 'light', bg: '#ffffff', panel: '#f8f9fa', border: '#dee2e6', text: '#000000', muted: '#495057', accent: '#6c757d', secondary: '#0284c7', glow: 'rgba(108, 117, 125, 0.4)', volumeAccent: '#dc2626', volumeGlow: 'rgba(220, 38, 38, 0.4)', glassBg: 'rgba(248, 249, 250, 0.95)', glassBorder: 'rgba(222, 226, 230, 0.3)' },
    ash: { type: 'light', bg: '#ffffff', panel: '#f1f3f5', border: '#ced4da', text: '#6c757d', muted: '#adb5bd', accent: '#000000', secondary: '#60a9ff', glow: 'rgba(0, 0, 0, 0.3)', volumeAccent: '#dc2626', volumeGlow: 'rgba(220, 38, 38, 0.4)', glassBg: 'rgba(241, 243, 245, 0.95)', glassBorder: 'rgba(206, 212, 218, 0.3)' }
};

export const SOUNDSCAPES = [
    { id: 'pink', label: 'Pink Noise', type: 'nature', bpm: null },
    { id: 'white', label: 'White Noise', type: 'nature', bpm: null },
    { id: 'brown', label: 'Brown Noise', type: 'nature', bpm: null },
    { id: 'rain', label: 'Heavy Rain', type: 'nature', bpm: null },
    { id: 'fireplace', label: 'Fireplace', type: 'nature', bpm: null },
    { id: 'ocean', label: 'Waves', type: 'nature', bpm: null },
    { id: 'river', label: 'Mountain River', type: 'nature', bpm: null },
    { id: 'mountain_wind', label: 'Alpine Wind', type: 'nature', bpm: null },
    { id: 'forest_birds', label: 'Forest Birds', type: 'nature', bpm: null },
    { id: 'strings', label: 'Orchestral Strings', type: 'drone', bpm: null },
    { id: 'brass', label: 'Brass Swell', type: 'drone', bpm: null },
    { id: 'winds', label: 'Woodwinds', type: 'drone', bpm: null },
    { id: 'bells', label: 'Temple Bells', type: 'perc', bpm: 40 },
    { id: 'wood', label: 'Woodblocks', type: 'perc', bpm: 60 },
    { id: 'timpani', label: 'Grand Timpani', type: 'perc', bpm: 45 },
    { id: 'orch_perc', label: 'Orchestral Perc', type: 'perc', bpm: 80 }
];

// Ambient Preset Combos - combine binaural frequencies with soundscapes
export const PRESET_COMBOS = [
    {
        id: 'lofi-rain',
        label: 'Lofi Rain',
        description: 'Chill beats + rain',
        icon: '🌧️',
        preset: 'alpha',
        soundscapes: ['rain'],
        visuals: ['rainforest', 'ocean', 'zengarden'],
        atmosVolume: 0.6,
        color: '#6b7280'
    },
    {
        id: 'night-ambient',
        label: 'Night Ambience',
        description: 'Peaceful night sounds',
        icon: '🌙',
        preset: 'delta',
        soundscapes: ['wind'],
        visuals: ['galaxy', 'ocean', 'zengarden'],
        atmosVolume: 0.5,
        color: '#1e3a5f'
    },
    {
        id: 'epic-focus',
        label: 'Epic Focus',
        description: 'Triumphant concentration',
        icon: '⚔️',
        preset: 'beta',
        soundscapes: ['strings', 'brass'],
        visuals: ['dragon', 'matrix', 'particles'],
        atmosVolume: 0.4,
        color: '#b45309'
    },
    {
        id: 'ocean-drift',
        label: 'Ocean Drift',
        description: 'Deep wave meditation',
        icon: '🌊',
        preset: 'theta',
        soundscapes: ['ocean'],
        visuals: ['ocean', 'particles', 'flow'],
        atmosVolume: 0.7,
        color: '#0891b2'
    },
    {
        id: 'storm-focus',
        label: 'Storm Focus',
        description: 'Intense productivity',
        icon: '⛈️',
        preset: 'gamma',
        soundscapes: ['rain', 'wind'],
        visuals: ['rainforest', 'matrix', 'interstellar'],
        atmosVolume: 0.5,
        color: '#4b5563'
    },
    {
        id: 'temple-zen',
        label: 'Temple Zen',
        description: 'Spiritual tranquility',
        icon: '🔔',
        preset: 'mu',
        soundscapes: ['bells'],
        visuals: ['zengarden', 'sphere', 'particles'],
        atmosVolume: 0.4,
        color: '#a855f7'
    },
    {
        id: 'cozy-fireplace',
        label: 'Cozy Fireplace',
        description: 'Warm crackling comfort',
        icon: '🔥',
        preset: 'alpha',
        soundscapes: ['fireplace'],
        visuals: ['fireplace', 'lava', 'particles'],
        atmosVolume: 0.6,
        color: '#f97316'
    },
    {
        id: 'forest-retreat',
        label: 'Forest Retreat',
        description: 'Deep nature immersion',
        icon: '🌲',
        preset: 'theta',
        soundscapes: ['winds', 'brown', 'forest_birds'],
        visuals: ['rainforest', 'zengarden', 'particles'],
        atmosVolume: 0.5,
        color: '#10b981'
    },
    {
        id: 'mountain-zen',
        label: 'Mountain Zen',
        description: 'Alpine tranquility',
        icon: '🏔️',
        preset: 'alpha',
        soundscapes: ['mountain_wind', 'forest_birds'],
        visuals: ['zengarden', 'galaxy', 'sphere'],
        atmosVolume: 0.5,
        color: '#94a3b8'
    },
    {
        id: 'river-flow',
        label: 'River Flow',
        description: 'Serene water journey',
        icon: '🛶',
        preset: 'theta',
        soundscapes: ['river', 'forest_birds'],
        visuals: ['particles', 'ocean', 'interstellar'],
        atmosVolume: 0.7,
        color: '#38bdf8'
    },
    {
        id: 'cosmic-journey',
        label: 'Cosmic Journey',
        description: 'Creative exploration',
        icon: '🌌',
        preset: 'gamma',
        soundscapes: ['strings', 'white'],
        visuals: ['galaxy', 'dragon', 'matrix'],
        atmosVolume: 0.45,
        color: '#8b5cf6'
    },
    {
        id: 'morning-clarity',
        label: 'Morning Clarity',
        description: 'Gentle awakening',
        icon: '☀️',
        preset: 'beta',
        soundscapes: ['pink', 'wood'],
        visuals: ['sphere', 'zengarden', 'particles'],
        atmosVolume: 0.5,
        color: '#fbbf24'
    }
];

// Brainwave-to-Visual mapping for standard presets
export const BRAINWAVE_VISUALS = {
    delta: ['ocean', 'zengarden'],
    theta: ['particles', 'ocean'],
    alpha: ['zengarden', 'sphere'],
    beta: ['matrix', 'dragon'],
    gamma: ['galaxy', 'dragon', 'matrix'],
    mu: ['sphere', 'particles'],
    'hyper-gamma': ['dragon', 'matrix', 'interstellar']
};

export const HEALING_VISUALS = {
    'heal-174': ['ocean', 'zengarden'],      // Pain Relief
    'heal-285': ['particles', 'sphere'],    // Tissue Regen
    'heal-396': ['fireplace', 'dragon'],    // Liberation
    'heal-417': ['lava', 'particles'],      // Change
    'heal-432': ['zengarden', 'ocean'],       // Nature
    'heal-528': ['galaxy', 'sphere', 'particles'],  // DNA Repair
    'heal-639': ['sphere', 'particles', 'interstellar'],    // Connection
    'heal-741': ['matrix', 'interstellar', 'galaxy'],  // Intuition
    'heal-852': ['galaxy', 'dragon', 'lava'],  // Spirit
    'heal-963': ['dragon', 'interstellar', 'matrix'] // Oneness
};

export const STATE_INSIGHTS = {
    delta: ["Deep sleep approaches.", "Total regeneration.", "Unconscious healing."],
    theta: ["Dream state activated.", "Creativity flows.", "Access subconscious."],
    alpha: ["Relaxed awareness.", "Calm visualization.", "Bridge to meditation."],
    beta: ["Sharp focus engaged.", "Analytical problem solving.", "Active concentration."],
    gamma: ["Peak cognitive processing.", "High-level synthesis.", "Hyper-awareness."]
};

export const SOUND_INSIGHTS = {
    pink: "Noise masking distractions.", white: "Pure static clearing the mind.", brown: "Deep rumble grounding awareness.",
    rain: "Rainfall washing away stress.", wind: "Wind carrying thoughts away.", fireplace: "Crackling warmth embracing comfort.", ocean: "Ocean waves calming the mind.",
    strings: "Harmonies evoking emotion.", brass: "Warmth expanding the mind.", winds: "Breath guiding the flow.",
    bells: "Chimes marking the present moment.", wood: "Rhythm grounding the body.", timpani: "Deep resonance strengthening will.",
    orch_perc: "Dynamic textures stimulating alertness."
};

export const state = {
    audioCtx: null,
    oscLeft: null, oscRight: null, panLeft: null, panRight: null,
    beatsGain: null, masterAtmosGain: null, masterGain: null, masterPanner: null,
    masterCompressor: null, analyserLeft: null, analyserRight: null,
    isPlaying: false, isRecording: false, isStopping: false, isAudioStopping: false, videoEnabled: false,
    animationId: null, visualMode: 'particles',
    mediaRecorder: null, recordedChunks: [], destStreamNode: null,
    activeSoundscapes: {},
    soundscapeSettings: {},
    matrixPanelOpen: true, // Default open when Matrix/Interstellar active
    currentSessions: [],
    currentModalBlob: null,
    currentModalIsVideo: false,
    currentModalName: "MindWave_Session",
    rawAudioChunks: [],
    scriptProcessor: null,
    workletNode: null,
    recordedBuffers: [],
    workletInitialized: false,
    videoCaptureGain: null,
    cleanRecordedBuffers: [],
    currentRecordingDuration: 0,
    currentUser: null,
    userTier: 'pro', // Reverted to Pro for everyone as per Perfect criteria
    isLifetime: true,
    visualVibration: false,
    visualSpeedAuto: true,
    aiVisualsLocked: false,

    // Preset tracking
    activePresetType: null,
    activeComboPreset: null,

    // Session Timer State
    sessionActive: false,
    sessionPaused: false,
    sessionDuration: 0, // in minutes

    // UI Refs that were global
    immersiveTimeout: null,
    fadeTimeout: null,

    // Safety
    disclaimerAccepted: false,

    // NEW: Audio Mode (binaural, isochronic, monaural)
    audioMode: 'binaural',

    // NEW: Isochronic pulse state
    isochronicGain: null,
    isochronicLFO: null,

    // NEW: Frequency Sweep state
    sweepActive: false,
    sweepStartFreq: 10,
    sweepEndFreq: 40,
    sweepDuration: 60,
    sweepInterval: null,
    preSweepBeatFreq: null,

    // NEW: Extended Hyper-Gamma unlock
    hyperGammaUnlocked: false,
    hyperGammaDisclaimerAccepted: false,

    // NEW: Phase 7 Haptic Sync
    hapticInterval: null,

    // NEW: Phase 7 AI Sequence Queue
    sessionQueue: [],

    // NEW (Ghost Mode): Idle UI Fade-out
    uiLocked: false,
    idleTimeout: null,

    // NEW (Lotus State Options)
    lotusState: 'full'
};

export const VISUALIZER_VERSION = 'PERFECT_V11';

// Global Elements Container
export const els = {
    // Core
    appOverlay: null, tapZone: null, visualizer: null,

    // Playback
    playBtn: null, playIcon: null, pauseIcon: null,
    recordBtn: null, videoToggleBtn: null,

    // Visuals
    sphereBtn: null, cubeBtn: null, dragonBtn: null, galaxyBtn: null, themeBtn: null,
    galleryBtn: null,
    visualSpeedSlider: null,
    speedValue: null,
    vibrationToggleBtn: null,
    visualColorPicker: null, randomColorBtn: null, colorPreview: null,

    // Navigation / Sidebars
    leftPanel: null, rightPanel: null,
    leftToggle: null, rightToggle: null,
    closeLeftBtn: null, closeRightBtn: null,

    // Header
    themeBtn: null, profileBtn: null, saveMixBtn: null, historyBtn: null,
    statusIndicator: null, aiPrompt: null,

    // Mixer
    baseSlider: null, beatSlider: null, volSlider: null,
    masterVolSlider: null, atmosMasterSlider: null, balanceSlider: null,
    baseValue: null, beatValue: null, volValue: null,
    masterVolValue: null, atmosMasterValue: null, balanceValue: null,
    soundscapeContainer: null,
    presetButtons: null,
    hapticSyncToggle: null,

    // Modals & Panels
    libraryPanel: null, libraryList: null,
    profileModal: null, videoModal: null, saveModal: null,

    // Modal Inputs
    saveNameInput: null, cancelSaveBtn: null, confirmSaveBtn: null,
    profileNameInput: null, saveProfileBtn: null, closeProfileBtn: null,
    closeLibraryBtn: null, closeModalBtn: null,

    // Export/Download
    loopCountInput: null, formatSelect: null,
    modalDlBtn: null, quickExportBtn: null, cancelExportBtn: null,

    // Media
    playbackVideo: null, playbackAudio: null,

    // Memory Guard (Performance Monitoring)
    performanceMonitor: {
        fpsThreshold: 15,
        lowPerformanceCount: 0,
        lowPerformanceLimit: 120,
        isSafeModeActive: false,
        triggerSafeMode: function () {
            if (this.isSafeModeActive) return;
            this.isSafeModeActive = true;
            console.warn("⚠️ Memory Guard: High System Load or Low Performance detected.");

            window.dispatchEvent(new CustomEvent('mindwave:safe-mode-start'));

            if (window.state && window.state.visualizer && window.state.visualizer.activeModes) {
                const viz = window.state.visualizer;
                const modes = Array.from(viz.activeModes);
                // Aggressively disable complex modes if in Safe Mode
                const complexModes = ['dragon', 'galaxy', 'matrix', 'interstellar', 'lava', 'ocean'];
                const activeComplex = modes.filter(m => complexModes.includes(m));

                if (activeComplex.length > 0) {
                    activeComplex.forEach(m => viz.toggleMode(m));
                    console.log("Memory Guard: Disabled complex visual modes.");
                }
                
                // Also halve particle count or similar if possible (implementation specific)
                if (viz.particles) {
                    viz.particles.visible = false;
                }
            }
        },
        reset: function () {
            this.lowPerformanceCount = 0;
            this.isSafeModeActive = false;
        }
    }
};
