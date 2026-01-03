export const THEMES = {
    // Dark Themes
    default: { bg: '#0f172a', panel: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', accent: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.4)', volumeAccent: '#d42d48', volumeGlow: 'rgba(212, 45, 72, 0.4)' },
    midnight: { bg: '#0a1628', panel: '#162032', border: '#2a3a52', text: '#e2e8f0', muted: '#8ba3c4', accent: '#60a9ff', glow: 'rgba(96, 169, 255, 0.4)', volumeAccent: '#ffb660', volumeGlow: 'rgba(255, 182, 96, 0.4)' },
    abyss: { bg: '#09090b', panel: '#18181b', border: '#27272a', text: '#fafafa', muted: '#a1a1aa', accent: '#e4e4e7', glow: 'rgba(255, 255, 255, 0.2)', volumeAccent: '#a78bfa', volumeGlow: 'rgba(167, 139, 250, 0.4)' },
    ember: { bg: '#1a0505', panel: '#2d1010', border: '#4a1515', text: '#fce7e7', muted: '#e5a3a3', accent: '#fb7185', glow: 'rgba(251, 113, 133, 0.4)', volumeAccent: '#71fb85', volumeGlow: 'rgba(113, 251, 133, 0.4)' },
    cyberpunk: { bg: '#0a0512', panel: '#150a20', border: '#2a1540', text: '#f0e6ff', muted: '#b794f4', accent: '#d946ef', glow: 'rgba(217, 70, 239, 0.6)', volumeAccent: '#46ef69', volumeGlow: 'rgba(70, 239, 105, 0.5)' },
    nebula: { bg: '#10002b', panel: '#1a0040', border: '#2d0066', text: '#e8d5ff', muted: '#b794f6', accent: '#c77dff', glow: 'rgba(199, 125, 255, 0.5)', volumeAccent: '#c9ff7d', volumeGlow: 'rgba(201, 255, 125, 0.4)' },
    quantum: { bg: '#021a15', panel: '#0a3028', border: '#154540', text: '#d5fff5', muted: '#7eddc8', accent: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.6)', volumeAccent: '#d42d48', volumeGlow: 'rgba(212, 45, 72, 0.5)' },
    sunset: { bg: '#1a0a02', panel: '#301508', border: '#4a200a', text: '#fff0e0', muted: '#e8b080', accent: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', volumeAccent: '#1673f9', volumeGlow: 'rgba(22, 115, 249, 0.4)' },

    // NEW Premium Dark Themes
    aurora: { bg: '#051520', panel: '#0a2535', border: '#153a50', text: '#e0f8ff', muted: '#80d4f4', accent: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)', volumeAccent: '#ee22a8', volumeGlow: 'rgba(238, 34, 168, 0.4)' },
    forest: { bg: '#0a120a', panel: '#142014', border: '#1e3018', text: '#e8f5e8', muted: '#90c090', accent: '#4ade80', glow: 'rgba(74, 222, 128, 0.5)', volumeAccent: '#de804a', volumeGlow: 'rgba(222, 128, 74, 0.4)' },
    royal: { bg: '#0f0a1a', panel: '#1a1030', border: '#2a1850', text: '#f0e8ff', muted: '#b8a0e0', accent: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)', volumeAccent: '#8bfab0', volumeGlow: 'rgba(139, 250, 176, 0.4)' },
    ocean: { bg: '#041525', panel: '#082538', border: '#0c3850', text: '#e0f0ff', muted: '#80b8e0', accent: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', volumeAccent: '#f6b83b', volumeGlow: 'rgba(246, 184, 59, 0.4)' },
    rose: { bg: '#1a0a10', panel: '#2a1020', border: '#401830', text: '#ffe8f0', muted: '#e0a0b8', accent: '#f472b6', glow: 'rgba(244, 114, 182, 0.5)', volumeAccent: '#72f4a0', volumeGlow: 'rgba(114, 244, 160, 0.4)' },
    gold: { bg: '#151008', panel: '#251a0a', border: '#3a280f', text: '#fff8e8', muted: '#d4b880', accent: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)', volumeAccent: '#2496fb', volumeGlow: 'rgba(36, 150, 251, 0.4)' },
    obsidian: { bg: '#080808', panel: '#121212', border: '#1c1c1c', text: '#f5f5f5', muted: '#888888', accent: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)', volumeAccent: '#ff6b6b', volumeGlow: 'rgba(255, 107, 107, 0.4)' },
    arctic: { bg: '#081520', panel: '#102030', border: '#183045', text: '#e8f4ff', muted: '#a0c8e8', accent: '#7dd3fc', glow: 'rgba(125, 211, 252, 0.5)', volumeAccent: '#fca07d', volumeGlow: 'rgba(252, 160, 125, 0.4)' },

    // Soft Light Themes (with tinted backgrounds)
    cloud: { bg: '#e8f4fc', panel: '#d4ebf7', border: '#a8d4f0', text: '#0f172a', muted: '#3b6d8c', accent: '#0284c7', glow: 'rgba(2, 132, 199, 0.4)', volumeAccent: '#dc2626', volumeGlow: 'rgba(220, 38, 38, 0.4)', glassBg: 'rgba(212, 235, 247, 0.95)', glassBorder: 'rgba(100, 160, 200, 0.3)' },
    dawn: { bg: '#fef5eb', panel: '#fde8d4', border: '#f5c9a0', text: '#1c1917', muted: '#785a3a', accent: '#dc2626', glow: 'rgba(220, 38, 38, 0.4)', volumeAccent: '#16a34a', volumeGlow: 'rgba(22, 163, 74, 0.4)', glassBg: 'rgba(253, 232, 212, 0.95)', glassBorder: 'rgba(180, 140, 100, 0.3)' }
};

export const SOUNDSCAPES = [
    { id: 'pink', label: 'Pink Noise', type: 'nature', bpm: null },
    { id: 'white', label: 'White Noise', type: 'nature', bpm: null },
    { id: 'brown', label: 'Brown Noise', type: 'nature', bpm: null },
    { id: 'rain', label: 'Heavy Rain', type: 'nature', bpm: null },
    { id: 'wind', label: 'Mountain Wind', type: 'nature', bpm: null },
    { id: 'ocean', label: 'Ocean Waves', type: 'nature', bpm: null },
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
        atmosVolume: 0.7,
        color: '#0891b2'
    },
    {
        id: 'storm-focus',
        label: 'Storm Focus',
        description: 'Intense productivity',
        icon: '⛈️',
        preset: 'beta',
        soundscapes: ['rain', 'wind'],
        atmosVolume: 0.5,
        color: '#4b5563'
    },
    {
        id: 'temple-zen',
        label: 'Temple Zen',
        description: 'Spiritual tranquility',
        icon: '🔔',
        preset: 'theta',
        soundscapes: ['bells'],
        atmosVolume: 0.4,
        color: '#a855f7'
    }
];

export const STATE_INSIGHTS = {
    delta: ["Deep sleep approaches.", "Total regeneration.", "Unconscious healing."],
    theta: ["Dream state activated.", "Creativity flows.", "Access subconscious."],
    alpha: ["Relaxed awareness.", "Calm visualization.", "Bridge to meditation."],
    beta: ["Sharp focus engaged.", "Analytical problem solving.", "Active concentration."],
    gamma: ["Peak cognitive processing.", "High-level synthesis.", "Hyper-awareness."]
};

export const SOUND_INSIGHTS = {
    pink: "Noise masking distractions.", white: "Pure static clearing the mind.", brown: "Deep rumble grounding awareness.",
    rain: "Rainfall washing away stress.", wind: "Wind carrying thoughts away.", ocean: "Ocean waves calming the mind.",
    strings: "Harmonies evoking emotion.", brass: "Warmth expanding the mind.", winds: "Breath guiding the flow.",
    bells: "Chimes marking the present moment.", wood: "Rhythm grounding the body.", timpani: "Deep resonance strengthening will.",
    orch_perc: "Dynamic textures stimulating alertness."
};

export const state = {
    audioCtx: null,
    oscLeft: null, oscRight: null, panLeft: null, panRight: null,
    beatsGain: null, masterAtmosGain: null, masterGain: null, masterPanner: null,
    masterCompressor: null, analyserLeft: null, analyserRight: null,
    isPlaying: false, isRecording: false, isStopping: false, videoEnabled: false,
    animationId: null, visualMode: 'sphere',
    mediaRecorder: null, recordedChunks: [], destStreamNode: null,
    activeSoundscapes: {},
    soundscapeSettings: {},
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
    userTier: 'pro', // Unlocked for everyone
    visualSpeedAuto: true, // Default to Hz sync

    // Session Timer State
    sessionActive: false,
    sessionPaused: false,
    sessionDuration: 0, // in minutes

    // UI Refs that were global
    immersiveTimeout: null,
    fadeTimeout: null, // For cancellable fade-out

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
    sweepDuration: 60, // seconds
    sweepInterval: null,
    preSweepBeatFreq: null, // Original beat frequency before sweep started

    // NEW: Extended Hyper-Gamma unlock
    hyperGammaUnlocked: false,
    hyperGammaDisclaimerAccepted: false
};


// Global Elements Container
export const els = {
    // Core
    appOverlay: null, tapZone: null, visualizer: null,

    // Playback
    playBtn: null, playIcon: null, pauseIcon: null,
    recordBtn: null, videoToggleBtn: null,

    // Visuals
    sphereBtn: null, flowBtn: null, visualSpeedSlider: null, speedValue: null,
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
    baseSlider: null, beatSlider: null, volSlider: null,
    masterVolSlider: null, atmosMasterSlider: null, balanceSlider: null,
    baseValue: null, beatValue: null, volValue: null,
    masterVolValue: null, atmosMasterValue: null, balanceValue: null,
    soundscapeContainer: null,
    presetButtons: null,

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
    playbackVideo: null, playbackAudio: null
};
