export const THEMES = {
    default: { bg: '#0f172a', panel: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', accent: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.4)' },
    midnight: { bg: '#202733', panel: '#2a3441', border: '#3b4758', text: '#e2e8f0', muted: '#94a3b8', accent: '#60a9ff', glow: 'rgba(96, 169, 255, 0.4)' },
    ember: { bg: '#450a0a', panel: '#7f1d1d', border: '#991b1b', text: '#fff1f2', muted: '#fca5a5', accent: '#fb7185', glow: 'rgba(251, 113, 133, 0.4)' },
    abyss: { bg: '#09090b', panel: '#18181b', border: '#27272a', text: '#fafafa', muted: '#a1a1aa', accent: '#e4e4e7', glow: 'rgba(255, 255, 255, 0.2)' },
    cloud: { bg: '#f0f9ff', panel: '#e0f2fe', border: '#bae6fd', text: '#0c4a6e', muted: '#7dd3fc', accent: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' },
    dawn: { bg: '#fff1f2', panel: '#ffe4e6', border: '#fecdd3', text: '#881337', muted: '#f472b6', accent: '#fb7185', glow: 'rgba(251, 113, 133, 0.4)' },
    // New High-Tech Themes
    cyberpunk: { bg: '#09090b', panel: '#18181b', border: '#3f3f46', text: '#e4e4e7', muted: '#a1a1aa', accent: '#d946ef', glow: 'rgba(217, 70, 239, 0.6)' }, // Neon Pink
    nebula: { bg: '#10002b', panel: '#240046', border: '#3c096c', text: '#e0aaff', muted: '#9d4edd', accent: '#c77dff', glow: 'rgba(199, 125, 255, 0.5)' }, // Deep Cosmic Purple
    quantum: { bg: '#022c22', panel: '#0f766e', border: '#115e59', text: '#ccfbf1', muted: '#5eead4', accent: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.6)' }, // Matrix Teal
    sunset: { bg: '#431407', panel: '#7c2d12', border: '#9a3412', text: '#ffedd5', muted: '#fdba74', accent: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' } // Synthwave Orange
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
    isPlaying: false, isRecording: false, videoEnabled: false,
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
