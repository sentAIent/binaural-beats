import { state, els, THEMES, SOUNDSCAPES, PRESET_COMBOS } from '../state.js';
import { startAudio, stopAudio, updateFrequencies, updateBeatsVolume, updateMasterVolume, updateMasterBalance, updateAtmosMaster, updateSoundscape, registerUICallback, fadeIn, fadeOut, cancelFadeOut, isVolumeHigh, playCompletionChime, setAudioMode, getAudioMode, startSweep, stopSweep, startSweepPreset, isSweepActive, isAudioPlaying, SWEEP_PRESETS } from '../audio/engine.js';
import { initVisualizer, getVisualizer, pauseVisuals, resumeVisuals, isVisualsPaused } from '../visuals/visualizer.js';
import { startRecording, stopRecording, startExport, cancelExport, updateExportPreview } from '../export/recorder.js';
import { openAuthModal, renderLibraryList } from './auth-controller.js';
import { saveMixToCloud } from '../services/firebase.js';
import { auth, db, registerAuthCallback } from '../services/firebase.js';
import { startSession, stopSession, pauseSession, resumeSession, isSessionPaused, formatTimeRemaining, getProgress, isSessionActive, DURATION_PRESETS } from '../audio/session-timer.js';
import { startSessionTracking, endSessionTracking, getStats, getWeeklyData } from '../services/analytics.js';
import { setStoryVolume, storyState } from '../content/stories.js';
import { setCustomAudioVolume } from '../content/audio-library.js';
import { initClassical, isClassicalPlaying, stopClassical, onClassicalStateChange } from '../content/classical.js';
import { initDJAudio, setDJVolume, setDJPitch, setDJTone, setDJSpeed, triggerOneShot, startLoop, stopLoop, isLoopActive, stopAllLoops, DJ_SOUNDS } from '../audio/dj-synth.js';
import { createCursorUIInThemeModal } from './cursor.js';


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
    els.balanceSlider = document.getElementById('balanceSlider');
    els.balanceValue = document.getElementById('balanceValue');
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
    els.prevColorBtn = document.getElementById('prevColorBtn');
    els.colorPreview = document.getElementById('colorPreview');
    els.profileBtn = document.getElementById('profileBtn');
    els.recordBtn = document.getElementById('recordBtn');
    els.videoModal = document.getElementById('videoModal');
    els.playbackVideo = document.getElementById('playbackVideo');
    els.videoToggleBtn = document.getElementById('videoToggleBtn');
    els.saveMixBtn = document.getElementById('saveMixBtn');
    els.historyBtn = document.getElementById('historyBtn');
    els.journeyBtn = document.getElementById('journeyBtn');
    els.libraryPanel = document.getElementById('libraryPanel');
    els.libraryList = document.getElementById('libraryList');

    // Button Labels
    els.audioLabel = document.getElementById('audioLabel');
    els.sessionLabel = document.getElementById('sessionLabel');
    els.visualsLabel = document.getElementById('visualsLabel');

    // Sidebar & Layout Elements
    els.leftPanel = document.getElementById('leftPanel');
    els.rightPanel = document.getElementById('rightPanel');
    els.leftToggle = document.getElementById('leftToggle');
    els.rightToggle = document.getElementById('rightToggle');
    els.leftToggle = document.getElementById('leftToggle');
    els.rightToggle = document.getElementById('rightToggle');
    els.closeLeftBtn = document.getElementById('closeLeftBtn');
    els.disclaimerBackBtn = document.getElementById('disclaimerBackBtn'); // NEW Back Button
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
    els.lavaBtn = document.getElementById('lavaBtn');

    // Session Timer Elements
    els.sessionDuration = document.getElementById('sessionDuration');
    els.timerRing = document.getElementById('timerRing');
    els.timerProgress = document.getElementById('timerProgress');
    els.timerDisplay = document.getElementById('timerDisplay');

    // Disclaimer Elements
    els.disclaimerModal = document.getElementById('disclaimerModal');
    els.disclaimerAccept = document.getElementById('disclaimerAccept');
    els.disclaimerContinueBtn = document.getElementById('disclaimerContinueBtn');

    // Session Pause Button
    els.sessionPauseBtn = document.getElementById('sessionPauseBtn');

    // Audio and Visual Play Buttons
    els.audioPlayBtn = document.getElementById('audioPlayBtn');
    els.audioPlayIcon = document.getElementById('audioPlayIcon');
    els.audioPauseIcon = document.getElementById('audioPauseIcon');
    els.visualPlayBtn = document.getElementById('visualPlayBtn');
    els.visualPlayIcon = document.getElementById('visualPlayIcon');
    els.visualPauseIcon = document.getElementById('visualPauseIcon');

    // NEW: Mode Toggle Elements
    els.modeToggle = document.getElementById('modeToggle');
    els.modeLabel = document.getElementById('modeLabel');
    els.modeDescription = document.getElementById('modeDescription');

    // NEW: Sweep Elements
    els.sweepStatus = document.getElementById('sweepStatus');
    els.stopSweepBtn = document.getElementById('stopSweepBtn');

    // NEW: Hyper-Gamma Modal Elements
    els.hyperGammaModal = document.getElementById('hyperGammaModal');
    els.hyperGammaAccept = document.getElementById('hyperGammaAccept');
    els.hyperGammaUnlockBtn = document.getElementById('hyperGammaUnlockBtn');
    els.hyperGammaCancelBtn = document.getElementById('hyperGammaCancelBtn');
    els.hyperGammaBtn = document.getElementById('hyperGammaBtn');
    els.hyperGammaLock = document.getElementById('hyperGammaLock');

    // NEW: Stats Modal Elements
    els.statsModal = document.getElementById('statsModal');
    els.statsBtn = document.getElementById('statsBtn');
    els.closeStatsBtn = document.getElementById('closeStatsBtn');
    els.statStreak = document.getElementById('statStreak');
    els.statHours = document.getElementById('statHours');
    els.statSessions = document.getElementById('statSessions');
    els.weeklyChart = document.getElementById('weeklyChart');
    els.weeklyLabels = document.getElementById('weeklyLabels');
    els.statTopPreset = document.getElementById('statTopPreset');
    els.statAvgSession = document.getElementById('statAvgSession');

    // Mobile Navigation Elements
    els.mobileBottomNav = document.getElementById('mobileBottomNav');
    els.mobilePresetsBtn = document.getElementById('mobilePresetsBtn');
    els.mobilePlayBtn = document.getElementById('mobilePlayBtn');
    els.mobilePlayIcon = document.getElementById('mobilePlayIcon');
    els.mobilePauseIcon = document.getElementById('mobilePauseIcon');
    els.mobileMixerBtn = document.getElementById('mobileMixerBtn');

    // Bind Event Listeners

    if (els.playBtn) {
        els.playBtn.addEventListener('click', handlePlayClick);
    }

    // Audio Play Button - toggles audio only
    if (els.audioPlayBtn) {
        els.audioPlayBtn.addEventListener('click', handleAudioToggle);
    }

    // Visual Play Button - toggles visuals only
    if (els.visualPlayBtn) {
        els.visualPlayBtn.addEventListener('click', handleVisualToggle);
    }

    if (els.recordBtn) {
        els.recordBtn.addEventListener('click', () => {
            if (!state.isPlaying) alert("Start audio session first.");
            else if (state.isRecording) stopRecording();
            else startRecording();
        });
    }

    // Session Pause/Resume Button
    if (els.sessionPauseBtn) {
        els.sessionPauseBtn.addEventListener('click', () => {
            if (isSessionPaused()) {
                resumeSession();
                els.sessionPauseBtn.textContent = 'Pause';
                els.sessionPauseBtn.classList.remove('text-[var(--accent)]', 'border-[var(--accent)]');
                showToast('Session resumed', 'info');
            } else {
                pauseSession();
                els.sessionPauseBtn.textContent = 'Resume';
                els.sessionPauseBtn.classList.add('text-[var(--accent)]', 'border-[var(--accent)]');
                showToast('Session paused', 'info');
            }
        });
    }

    if (els.historyBtn) els.historyBtn.addEventListener('click', () => {
        // Open library panel (works offline with localStorage)
        els.libraryPanel.classList.toggle('translate-x-full');
        // Render library list when opening
        if (!els.libraryPanel.classList.contains('translate-x-full')) {
            // Load mixes from localStorage (offline-first)
            const localMixes = JSON.parse(localStorage.getItem('mindwave_mock_library') || '[]');
            renderLibraryList(localMixes);
        }
    });

    // Journey Program Button - opens journey modal
    if (els.journeyBtn) els.journeyBtn.addEventListener('click', () => {
        // Open the journey modal if it exists
        const journeyModal = document.getElementById('journeyModal');
        if (journeyModal) {
            journeyModal.classList.remove('hidden');
            journeyModal.classList.add('active');
        } else {
            showToast('🧭 Journey program coming soon!', 'info');
        }
    });

    // Close Journey Modal - X button and click outside
    const closeJourneyBtn = document.getElementById('closeJourneyBtn');
    const journeyModal = document.getElementById('journeyModal');

    if (closeJourneyBtn) {
        closeJourneyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (journeyModal) {
                journeyModal.classList.remove('active');
                journeyModal.classList.add('hidden');
            }
        });
    }

    // Click outside journey modal content to close
    if (journeyModal) {
        journeyModal.addEventListener('click', (e) => {
            // Only close if clicking the backdrop (not the content)
            if (e.target === journeyModal) {
                journeyModal.classList.remove('active');
                journeyModal.classList.add('hidden');
            }
        });
    }

    if (els.closeLibraryBtn) els.closeLibraryBtn.addEventListener('click', () => els.libraryPanel.classList.add('translate-x-full'));

    // Library backdrop click-outside-to-close
    const libraryBackdrop = document.getElementById('libraryBackdrop');
    if (libraryBackdrop) {
        libraryBackdrop.addEventListener('click', () => {
            els.libraryPanel.classList.add('translate-x-full');
        });
    }

    // Quick save button in library panel footer
    const quickSaveMixBtn = document.getElementById('quickSaveMixBtn');
    if (quickSaveMixBtn) {
        quickSaveMixBtn.addEventListener('click', () => {
            savePreset();
        });
    }

    // Escape key to close library panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (els.libraryPanel && !els.libraryPanel.classList.contains('translate-x-full')) {
                els.libraryPanel.classList.add('translate-x-full');
            }
        }
    });

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

    if (els.profileBtn) {
        els.profileBtn.addEventListener('click', () => {
            if (state.currentUser) {
                // Open Profile Modal (if implemented) or just Library/Stats
                // For now, let's open the Auth Modal which handles "Already Logged In" state or Library
                // Actually, let's open the library/profile logic.
                // If logged in, maybe show stats/profile modal?
                // Using openAuthModal for now as it handles sign-out/profile view placeholders
                openAuthModal();
            } else {
                openAuthModal();
            }
        });
    }

    // Sliders
    if (els.baseSlider) els.baseSlider.addEventListener('input', () => { updateFrequencies(); saveStateToLocal(); });
    if (els.beatSlider) els.beatSlider.addEventListener('input', () => { updateFrequencies(); saveStateToLocal(); });
    if (els.volSlider) els.volSlider.addEventListener('input', () => { updateBeatsVolume(); saveStateToLocal(); });
    if (els.masterVolSlider) els.masterVolSlider.addEventListener('input', () => {
        updateMasterVolume();
        // Also apply master volume to stories and custom audio
        const masterVol = parseFloat(els.masterVolSlider.value);
        setStoryVolume(masterVol);
        setCustomAudioVolume(masterVol);
        saveStateToLocal();
    });
    if (els.atmosMasterSlider) els.atmosMasterSlider.addEventListener('input', () => { updateAtmosMaster(); saveStateToLocal(); });
    if (els.balanceSlider) els.balanceSlider.addEventListener('input', () => { updateMasterBalance(); saveStateToLocal(); });

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
        // Enforce light theme styles when panel opens
        enforceLightThemeStyles();
    });
    if (els.closeRightBtn) els.closeRightBtn.addEventListener('click', () => {
        els.rightPanel.classList.add('translate-x-full');
        updateVisualizerScale();
    });

    // Enforce light theme styles on initial load (after a delay to ensure DOM is ready)
    setTimeout(enforceLightThemeStyles, 100);

    // Auto-open mixer on first load for desktop? Maybe not, keep immersive.

    // Auto-open mixer on first load for desktop? Maybe not, keep immersive.

    // Tap Zone Removed (per user request)

    // Immersive Mode
    document.addEventListener('touchstart', resetImmersiveTimer, { passive: true });
    document.addEventListener('mousemove', resetImmersiveTimer, { passive: true });
    document.addEventListener('click', resetImmersiveTimer);

    // --- KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        // Ignore shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                handlePlayClick();
                break;
            case 'KeyM':
                // Toggle mute (set master volume to 0 or restore)
                if (els.masterVolSlider) {
                    const currentVol = parseFloat(els.masterVolSlider.value);
                    if (currentVol > 0) {
                        els.masterVolSlider.dataset.prevVol = currentVol;
                        els.masterVolSlider.value = 0;
                        showToast('🔇 Muted', 'info');
                    } else {
                        els.masterVolSlider.value = els.masterVolSlider.dataset.prevVol || 1;
                        showToast('🔊 Unmuted', 'info');
                    }
                    updateMasterVolume();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (els.masterVolSlider) {
                    const newVol = Math.min(1, parseFloat(els.masterVolSlider.value) + 0.05);
                    els.masterVolSlider.value = newVol;
                    updateMasterVolume();
                    if (els.masterVolValue) els.masterVolValue.textContent = Math.round(newVol * 100) + '%';
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (els.masterVolSlider) {
                    const newVol = Math.max(0, parseFloat(els.masterVolSlider.value) - 0.05);
                    els.masterVolSlider.value = newVol;
                    updateMasterVolume();
                    if (els.masterVolValue) els.masterVolValue.textContent = Math.round(newVol * 100) + '%';
                }
                break;
        }
    });

    // Visual Modes
    if (els.sphereBtn) els.sphereBtn.addEventListener('click', () => setVisualMode('sphere'));
    if (els.flowBtn) els.flowBtn.addEventListener('click', () => setVisualMode('particles'));
    if (els.lavaBtn) els.lavaBtn.addEventListener('click', () => setVisualMode('lava'));
    if (els.visualSpeedSlider) {

        els.visualSpeedSlider.addEventListener('input', (e) => {
            console.log("Slider Input:", e.target.value);
            const viz = getVisualizer();
            if (viz) viz.setSpeed(parseFloat(e.target.value));
        });
    }

    // Mobile Bottom Navigation Handlers
    if (els.mobilePresetsBtn) {
        els.mobilePresetsBtn.addEventListener('click', () => {
            if (els.leftPanel) {
                els.leftPanel.classList.toggle('-translate-x-full');
            }
        });
    }

    if (els.mobilePlayBtn) {
        els.mobilePlayBtn.addEventListener('click', handlePlayClick);
    }

    if (els.mobileMixerBtn) {
        els.mobileMixerBtn.addEventListener('click', () => {
            if (els.rightPanel) {
                els.rightPanel.classList.toggle('translate-x-full');
            }
        });
    }

    initThemeModal();


    // Color Controls
    // Color history for back button
    let previousColor = null;
    let currentColor = '#60a9ff'; // Default

    function updateColorWithHistory(newColor) {
        previousColor = currentColor;
        currentColor = newColor;

        if (els.colorPreview) els.colorPreview.style.backgroundColor = newColor;
        if (els.visualColorPicker) els.visualColorPicker.value = newColor;

        const viz = getVisualizer();
        if (viz) viz.setColor(newColor);

        // Update button labels to match color
        if (els.audioLabel) els.audioLabel.style.color = newColor;
        if (els.sessionLabel) els.sessionLabel.style.color = newColor;
        if (els.visualsLabel) els.visualsLabel.style.color = newColor;

        // Show back button if we have a previous color
        if (els.prevColorBtn && previousColor) {
            els.prevColorBtn.classList.remove('hidden');
        }
    }

    if (els.visualColorPicker) {
        els.visualColorPicker.addEventListener('input', (e) => {
            updateColorWithHistory(e.target.value);
        });
    }

    if (els.randomColorBtn) {
        els.randomColorBtn.addEventListener('click', () => {
            // Generate random vibrant color
            const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            updateColorWithHistory(randomHex);
        });
    }

    if (els.prevColorBtn) {
        els.prevColorBtn.addEventListener('click', () => {
            if (previousColor) {
                // Swap colors
                const temp = currentColor;
                currentColor = previousColor;
                previousColor = temp;

                if (els.colorPreview) els.colorPreview.style.backgroundColor = currentColor;
                if (els.visualColorPicker) els.visualColorPicker.value = currentColor;

                const viz = getVisualizer();
                if (viz) viz.setColor(currentColor);
            }
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

    // Register Classical State Listener to sync Main Play Button
    onClassicalStateChange((isPlaying) => {
        updateUIState(isPlaying || state.isPlaying);
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

    // Check disclaimer acceptance from localStorage
    state.disclaimerAccepted = localStorage.getItem('mindwave_disclaimer_accepted') === 'true';

    // Initialize Timer & Disclaimer UI
    setupTimerUI();
    setupDisclaimerUI();
    setupModeToggle(); // NEW
    setupHyperGammaUI(); // NEW
    setupSweepUI(); // NEW
    setupStatsUI(); // NEW - Session Analytics
    setupDJPads(); // NEW - DJ Sound Pads

    // SYNC SLIDER VALUES - Ensure displays match slider positions on load
    syncSliderDisplays();

    // Volume Warning on Master Slider
    if (els.masterVolSlider) {
        els.masterVolSlider.addEventListener('change', () => {
            if (isVolumeHigh()) {
                showVolumeWarning();
            }
        });
    }

    // Expose Global Window Functions
    window.setTheme = setTheme;
    window.setVisualMode = setVisualMode;
    window.applyPreset = applyPreset;
    window.applyComboPreset = applyComboPreset;
    window.openProfile = openProfile;
    window.startSweepPreset = startSweepPresetUI; // NEW
    window.stopSweep = stopSweepUI; // NEW
    window.handleHyperGammaClick = handleHyperGammaClick; // NEW

    // NUCLEAR OPTION: Hijack beatSlider value setter to catch the 5.5Hz culprit
    try {
        const beatSlider = els.beatSlider;
        if (beatSlider) {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
            Object.defineProperty(beatSlider, 'value', {
                set: function (val) {
                    // Check if we are trying to set 5.5Hz (or close) while protected
                    // AND if we are not actively setting it ourselves via story (which sets 2.0, 3.0 etc)
                    if (Math.abs(parseFloat(val) - 5.5) < 0.1) {
                        if (storyState && (storyState.isPlaying || storyState.isTransitioning)) {
                            console.warn('[Controls] BLOCKED 5.5Hz Setting Attempt! Source Blocked.');
                            return; // BLOCK IT
                        }
                    }
                    // Otherwise allow
                    descriptor.set.call(this, val);
                },
                get: function () {
                    return descriptor.get.call(this); // Pass through getter
                }
            });
            console.log('[Controls] 5.5Hz Protection System Active');
        }
    } catch (e) {
        console.error("Failed to install protection:", e);
    }
}

// --- PLAY BUTTON HANDLER ---
async function handlePlayClick() {
    // Check disclaimer first
    if (!state.disclaimerAccepted) {
        showDisclaimerModal();
        return;
    }

    // RESUME CASE: If we are in the middle of stopping (fading out), cancel it and resume!
    if (state.isStopping) {
        console.log('[Controls] Fast Resume triggered!');
        cancelFadeOut();
        state.isStopping = false;
        // Ensure UI reflects playing immediately
        syncAllButtons();
        return;
    }

    if (isAudioPlaying() || isClassicalPlaying()) {
        // STOPPING
        console.log('[Controls] Play Click -> Stopping...');

        // 1. Mark as stopping so UI knows we are "paused" even if audio is fading
        state.isStopping = true;

        // 2. Force UI update immediately to show Play icon (Pause state)
        syncAllButtons();

        // 3. Perform the actual stop logic (with fade)
        stopSession();
        if (isClassicalPlaying()) stopClassical();
        endSessionTracking(false);

        // 4. Pause visuals when stopping via main button
        pauseVisuals();

        fadeOut(1.5, () => {
            stopAudio();
            state.isStopping = false; // Reset flag when actually stopped
            syncAllButtons(); // Sync after audio fully stopped
        });

        hideTimerUI();
    } else {
        // STARTING
        try {
            await startAudio();
            fadeIn(1.5);

            // Auto-start visuals when audio starts via main button
            resumeVisuals();

            // Start analytics tracking
            const beatFreq = parseFloat(els.beatSlider?.value || 10);
            let presetName = 'Custom';
            if (beatFreq < 4) presetName = 'Delta';
            else if (beatFreq < 8) presetName = 'Theta';
            else if (beatFreq < 14) presetName = 'Alpha';
            else if (beatFreq < 30) presetName = 'Beta';
            else if (beatFreq < 50) presetName = 'Gamma';
            else presetName = 'Hyper-Gamma';
            startSessionTracking(presetName);

            const duration = parseInt(els.sessionDuration?.value || 0);
            if (duration > 0) {
                startSession(duration, {
                    onTick: updateTimerUI,
                    onComplete: handleSessionComplete
                });
                showTimerUI();
            }

            syncAllButtons(); // Sync after audio started
        } catch (e) {
            console.error("Start Audio Failed", e);
        }
    }
}

// --- AUDIO TOGGLE HANDLER (Left button) ---
async function handleAudioToggle() {
    if (!state.disclaimerAccepted) {
        showDisclaimerModal();
        return;
    }

    const audioPlaying = isAudioPlaying() || isClassicalPlaying();

    if (audioPlaying) {
        // Stop audio only
        console.log('[Controls] Audio Toggle -> Stopping audio...');
        stopSession();
        if (isClassicalPlaying()) stopClassical();
        endSessionTracking(false);
        fadeOut(1.5, () => {
            stopAudio();
            syncAllButtons(); // Sync after audio fully stops
        });
        hideTimerUI();
        syncAllButtons(); // Immediate sync
    } else {
        // Start audio only
        try {
            await startAudio();
            fadeIn(1.5);

            const beatFreq = parseFloat(els.beatSlider?.value || 10);
            let presetName = 'Custom';
            if (beatFreq < 4) presetName = 'Delta';
            else if (beatFreq < 8) presetName = 'Theta';
            else if (beatFreq < 14) presetName = 'Alpha';
            else if (beatFreq < 30) presetName = 'Beta';
            else if (beatFreq < 50) presetName = 'Gamma';
            else presetName = 'Hyper-Gamma';
            startSessionTracking(presetName);

            syncAllButtons();
        } catch (e) {
            console.error("Start Audio Failed", e);
        }
    }
}

// --- VISUAL TOGGLE HANDLER (Right button) ---
function handleVisualToggle() {
    if (isVisualsPaused()) {
        // Resume visuals
        console.log('[Controls] Visual Toggle -> Resuming visuals...');
        resumeVisuals();
        syncAllButtons();
    } else {
        // Pause visuals
        console.log('[Controls] Visual Toggle -> Pausing visuals...');
        pauseVisuals();
        syncAllButtons();
    }
}

// --- SYNC AUDIO BUTTON ---
function syncAudioButton(isPlaying) {
    if (!els.audioPlayBtn) return;

    if (isPlaying) {
        els.audioPlayIcon?.classList.add('hidden');
        els.audioPauseIcon?.classList.remove('hidden');
        els.audioPlayBtn.classList.add('playing');
        els.audioPlayBtn.style.boxShadow = "0 0 20px var(--accent-glow)";
    } else {
        els.audioPlayIcon?.classList.remove('hidden');
        els.audioPauseIcon?.classList.add('hidden');
        els.audioPlayBtn.classList.remove('playing');
        els.audioPlayBtn.style.boxShadow = "";
    }
}

// --- SYNC VISUAL BUTTON ---
function syncVisualButton(isPlaying) {
    if (!els.visualPlayBtn) return;

    if (isPlaying) {
        els.visualPlayIcon?.classList.add('hidden');
        els.visualPauseIcon?.classList.remove('hidden');
        els.visualPlayBtn.classList.add('playing');
        els.visualPlayBtn.style.boxShadow = "0 0 20px var(--accent-glow)";
    } else {
        els.visualPlayIcon?.classList.remove('hidden');
        els.visualPauseIcon?.classList.add('hidden');
        els.visualPlayBtn.classList.remove('playing');
        els.visualPlayBtn.style.boxShadow = "";
    }
}


// --- SYNC MAIN PLAY BUTTON ---
function syncMainButton(isPlaying) {
    if (!els.playBtn) return;

    if (isPlaying) {
        els.playIcon?.classList.add('hidden');
        els.pauseIcon?.classList.remove('hidden');
        els.playBtn.classList.add('playing');
        els.playBtn.style.boxShadow = "0 0 30px var(--accent-glow)";
    } else {
        els.playIcon?.classList.remove('hidden');
        els.pauseIcon?.classList.add('hidden');
        els.playBtn.classList.remove('playing');
        els.playBtn.style.boxShadow = "";
    }

    // Mobile play button sync
    if (els.mobilePlayIcon) els.mobilePlayIcon.classList.toggle('hidden', isPlaying);
    if (els.mobilePauseIcon) els.mobilePauseIcon.classList.toggle('hidden', !isPlaying);
    if (els.mobilePlayBtn) els.mobilePlayBtn.classList.toggle('playing', isPlaying);
}

// --- UNIFIED BUTTON SYNC ---
// Single source of truth: queries actual state and syncs all three buttons
function syncAllButtons() {
    // Query actual states - these are the single sources of truth
    const audioPlaying = (isAudioPlaying() || isClassicalPlaying()) && !state.isStopping;
    const visualsPlaying = !isVisualsPaused();

    // Main button shows pause if EITHER audio OR visuals are active
    const isAnyPlaying = audioPlaying || visualsPlaying;

    // Sync all buttons based on actual state
    syncAudioButton(audioPlaying);
    syncVisualButton(visualsPlaying);
    syncMainButton(isAnyPlaying);

    // Update status indicator
    if (isAnyPlaying) {
        els.statusIndicator?.classList.remove('bg-slate-600');
        els.statusIndicator?.classList.add('bg-teal-400', 'animate-pulse');
    } else {
        els.statusIndicator?.classList.add('bg-slate-600');
        els.statusIndicator?.classList.remove('bg-teal-400', 'animate-pulse');
    }

    console.log(`[Buttons] Synced - audio: ${audioPlaying}, visual: ${visualsPlaying} → main: ${isAnyPlaying ? 'PAUSE' : 'PLAY'}`);
}


// --- TIMER UI FUNCTIONS ---

function setupTimerUI() {
    // Duration selector change handler
    if (els.sessionDuration) {
        els.sessionDuration.addEventListener('change', () => {
            const duration = parseInt(els.sessionDuration.value);
            if (duration === 0) {
                hideTimerUI();
            }
        });
    }
}

function showTimerUI() {
    if (els.timerRing) els.timerRing.style.opacity = '1';
    if (els.timerDisplay) els.timerDisplay.style.opacity = '1';
    // Show session pause button
    if (els.sessionPauseBtn) {
        els.sessionPauseBtn.classList.remove('hidden');
        els.sessionPauseBtn.textContent = 'Pause';
    }
}

function hideTimerUI() {
    if (els.timerRing) els.timerRing.style.opacity = '0';
    if (els.timerDisplay) els.timerDisplay.style.opacity = '0';
    // Reset progress ring
    if (els.timerProgress) els.timerProgress.style.strokeDashoffset = '339.292';
    // Hide session pause button
    if (els.sessionPauseBtn) els.sessionPauseBtn.classList.add('hidden');
}

function updateTimerUI(data) {
    // Update countdown text
    if (els.timerDisplay) {
        els.timerDisplay.textContent = data.formatted;
    }

    // Update progress ring (circumference = 2 * PI * 54 = 339.292)
    if (els.timerProgress) {
        const circumference = 339.292;
        const offset = circumference - (data.progress / 100) * circumference;
        els.timerProgress.style.strokeDashoffset = offset;
    }
}

function handleSessionComplete() {
    console.log('[Session] Complete - playing chime and fading out...');
    // Mark session as completed in analytics
    endSessionTracking(true);
    // Play gentle completion chime
    playCompletionChime();
    fadeOut(3, () => {
        stopAudio();
        hideTimerUI();
        showToast('Session complete! 🧘', 'success');
    });
}

// --- DISCLAIMER MODAL ---
function setupDisclaimerUI() {
    if (els.disclaimerAccept) {
        els.disclaimerAccept.addEventListener('change', () => {
            if (els.disclaimerContinueBtn) {
                els.disclaimerContinueBtn.disabled = !els.disclaimerAccept.checked;
            }
        });
    }

    if (els.disclaimerContinueBtn) {
        els.disclaimerContinueBtn.addEventListener('click', () => {
            state.disclaimerAccepted = true;
            localStorage.setItem('mindwave_disclaimer_accepted', 'true');
            hideDisclaimerModal();
            // Auto-start after accepting
            handlePlayClick();
        });
    }

    // Back button - close the disclaimer without accepting
    if (els.disclaimerBackBtn) {
        els.disclaimerBackBtn.addEventListener('click', () => {
            hideDisclaimerModal();
        });
    }
}

function showDisclaimerModal() {
    if (els.disclaimerModal) {
        els.disclaimerModal.classList.remove('hidden');
        els.disclaimerModal.classList.add('active');
    }
}

function hideDisclaimerModal() {
    if (els.disclaimerModal) {
        els.disclaimerModal.classList.remove('active');
        els.disclaimerModal.classList.add('hidden');
    }
}

// --- MODE TOGGLE SETUP ---
const MODE_DESCRIPTIONS = {
    binaural: 'Requires stereo headphones for brain entrainment',
    isochronic: 'Pulsed tones - works with speakers or headphones',
    monaural: 'Combined beat - works with speakers or headphones'
};

function setupModeToggle() {
    if (!els.modeToggle) return;

    const buttons = els.modeToggle.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            setAudioMode(mode);
            updateModeUI(mode);
        });
    });
}

function updateModeUI(mode) {
    if (!els.modeToggle) return;

    const buttons = els.modeToggle.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
        if (btn.dataset.mode === mode) {
            // Active style - theme-aware
            btn.classList.add('toggle-active');
            btn.classList.remove('toggle-inactive');
        } else {
            // Inactive style - theme-aware
            btn.classList.remove('toggle-active');
            btn.classList.add('toggle-inactive');
        }
    });

    if (els.modeLabel) {
        els.modeLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }

    if (els.modeDescription) {
        els.modeDescription.textContent = MODE_DESCRIPTIONS[mode] || '';
    }
}

// --- JOURNEY UI SETUP (formerly Sweep) ---
function setupSweepUI() {
    // Listen for journey completion
    window.addEventListener('sweepComplete', () => {
        activeSweepPreset = null;
        updateSweepStatusUI(false, null);
        showToast('✨ Journey complete!', 'success');
    });
}

// --- STATS MODAL ---
function setupStatsUI() {
    if (els.statsBtn) {
        els.statsBtn.addEventListener('click', openStatsModal);
    }
    if (els.closeStatsBtn) {
        els.closeStatsBtn.addEventListener('click', closeStatsModal);
    }
    // Close on backdrop click
    if (els.statsModal) {
        els.statsModal.addEventListener('click', (e) => {
            if (e.target === els.statsModal) closeStatsModal();
        });
    }
}

function openStatsModal() {
    if (!els.statsModal) return;

    // Get stats data
    const stats = getStats();
    const weeklyData = getWeeklyData();
    const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

    // Find the card container inside the modal and replace its content
    const modalContent = els.statsModal.querySelector('.glass-card');
    if (modalContent) {
        modalContent.innerHTML = `
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
                        <span class="text-xl">📊</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white">Your Stats</h3>
                        <p class="text-[10px] text-[var(--text-muted)]">Track your meditation journey</p>
                    </div>
                </div>
                <button id="closeStatsBtn" class="p-2 rounded-full hover:bg-white/10 transition-colors" style="color: var(--text-muted);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Stats Grid - Revamped with proper icon placement -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                <!-- Day Streak -->
                <div class="rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 p-4 text-center">
                    <div class="text-2xl mb-1">🔥</div>
                    <div class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">${stats.currentStreak}</div>
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Day Streak</div>
                </div>
                <!-- Hours -->
                <div class="rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-cyan-500/10 border border-[var(--accent)]/30 p-4 text-center">
                    <div class="text-2xl mb-1">⏱️</div>
                    <div class="text-3xl font-bold bg-gradient-to-r from-[var(--accent)] to-cyan-400 bg-clip-text text-transparent">${stats.totalHours}</div>
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Hours</div>
                </div>
                <!-- Sessions -->
                <div class="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 p-4 text-center">
                    <div class="text-2xl mb-1">🧘</div>
                    <div class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">${stats.totalSessions}</div>
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Sessions</div>
                </div>
            </div>

            <!-- Weekly Chart -->
            <div class="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-xs font-semibold text-white">This Week</span>
                    <span class="text-[10px] text-[var(--accent)]">${stats.weeklyMinutes || 0} min total</span>
                </div>
                <div class="h-32 flex items-end gap-2 px-2">
                    ${weeklyData.map((d, i) => {
            // Calculate bar height in pixels (max 100px for chart area minus label space)
            const maxBarHeight = 100;
            const barHeight = d.minutes > 0
                ? Math.max(Math.round((d.minutes / maxMinutes) * maxBarHeight), 8)
                : 8;
            const isToday = i === 6;
            // Use inline styles for background to ensure visibility
            const barBg = d.minutes > 0
                ? (isToday
                    ? 'background: linear-gradient(to top, #00d4ff, #06b6d4);'
                    : 'background: linear-gradient(to top, #a855f7, #ec4899);')
                : 'background: rgba(255,255,255,0.15);';
            return `
                                <div class="flex-1 flex flex-col items-center justify-end h-full">
                                    <div class="w-full rounded-t-lg transition-all duration-500 ease-out hover:brightness-125 cursor-pointer relative group"
                                         style="height: ${barHeight}px; ${barBg}">
                                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
                                             style="background: rgba(0,0,0,0.9);">
                                            ${d.minutes} min
                                        </div>
                                    </div>
                                    <span class="text-[9px] mt-1 ${isToday ? 'text-cyan-400 font-bold' : 'text-gray-400'}">${d.label}</span>
                                </div>
                            `;
        }).join('')}
                </div>
            </div>

            <!-- Additional Stats -->
            <div class="space-y-3">
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">⭐</span>
                        <span class="text-xs text-[var(--text-muted)]">Favorite Preset</span>
                    </div>
                    <span class="text-sm font-bold text-[var(--accent)]">${stats.topPreset}</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">⏰</span>
                        <span class="text-xs text-[var(--text-muted)]">Avg. Session</span>
                    </div>
                    <span class="text-sm font-bold text-[var(--accent)]">${stats.avgMinutes} min</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🏆</span>
                        <span class="text-xs text-[var(--text-muted)]">Longest Streak</span>
                    </div>
                    <span class="text-sm font-bold text-[var(--accent)]">${stats.longestStreak} days</span>
                </div>
            </div>

            <!-- Animation styles -->
            <style>
                @keyframes barGrow {
                    from { height: 0%; }
                }
            </style>
        `;

        // Re-attach close button listener
        const closeBtn = modalContent.querySelector('#closeStatsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeStatsModal);
        }
    }

    // Show modal
    els.statsModal.classList.add('active');
}

function closeStatsModal() {
    if (els.statsModal) els.statsModal.classList.remove('active');
}


let activeSweepPreset = null; // Track which preset button is active

function startSweepPresetUI(presetKey) {
    // If clicking the same journey that's active, stop it (toggle off)
    if (activeSweepPreset === presetKey) {
        stopSweepUI();
        return;
    }

    if (!state.isPlaying) {
        showToast('▶️ Start audio first to use journeys', 'warning');
        return;
    }

    // If another journey is active, stop it first
    if (activeSweepPreset) {
        stopSweep();
    }

    const success = startSweepPreset(presetKey);
    if (success) {
        activeSweepPreset = presetKey;
        updateSweepStatusUI(true, presetKey);
        const preset = SWEEP_PRESETS[presetKey];
        if (preset) {
            showToast(`${preset.icon} ${preset.name} started`, 'success');
        }
    }
}

function stopSweepUI() {
    console.log('[UI] stopSweepUI called');
    stopSweep();
    console.log('[UI] stopSweep returned, beatSlider value now:', els.beatSlider?.value);
    activeSweepPreset = null;
    updateSweepStatusUI(false, null);
    showToast('⏹ Journey stopped - Restored to original frequency', 'info');
}



function updateSweepStatusUI(active, activePresetKey = null) {
    if (els.sweepStatus) {
        els.sweepStatus.classList.toggle('hidden', !active);
    }
    if (els.stopSweepBtn) {
        els.stopSweepBtn.classList.toggle('hidden', !active);
    }

    // Highlight the active journey button using data attribute
    const journeyBtns = document.querySelectorAll('.sweep-btn[data-journey]');
    journeyBtns.forEach(btn => {
        const presetKey = btn.dataset.journey;
        if (active && presetKey === activePresetKey) {
            // Add active class for highlighting
            btn.classList.add('journey-active');
        } else {
            btn.classList.remove('journey-active');
        }
    });
}

// --- HYPER-GAMMA UNLOCK ---
function setupHyperGammaUI() {
    // Check if already unlocked from localStorage
    state.hyperGammaUnlocked = localStorage.getItem('mindwave_hypergamma_unlocked') === 'true';

    // Update UI based on unlock state
    if (state.hyperGammaUnlocked) {
        updateHyperGammaUnlockedUI();
    } else {
        // Ensure lock icon is shown if not unlocked
        if (els.hyperGammaLock) {
            els.hyperGammaLock.textContent = '🔒';
        }
    }

    // Checkbox enable/disable unlock button
    if (els.hyperGammaAccept) {
        els.hyperGammaAccept.addEventListener('change', () => {
            if (els.hyperGammaUnlockBtn) {
                els.hyperGammaUnlockBtn.disabled = !els.hyperGammaAccept.checked;
            }
        });
    }

    // Unlock button
    if (els.hyperGammaUnlockBtn) {
        els.hyperGammaUnlockBtn.addEventListener('click', () => {
            state.hyperGammaUnlocked = true;
            state.hyperGammaDisclaimerAccepted = true;
            localStorage.setItem('mindwave_hypergamma_unlocked', 'true');
            hideHyperGammaModal();
            updateHyperGammaUnlockedUI();
            showToast('⚡ Hyper-Gamma mode unlocked!', 'success');
            // Apply the preset
            applyPreset('hyper-gamma', els.hyperGammaBtn);
        });
    }

    // Cancel button
    if (els.hyperGammaCancelBtn) {
        els.hyperGammaCancelBtn.addEventListener('click', () => {
            hideHyperGammaModal();
        });
    }
}

function handleHyperGammaClick(btnElement) {
    if (state.hyperGammaUnlocked) {
        // Already unlocked, just apply preset
        applyPreset('hyper-gamma', btnElement);
    } else {
        // Show unlock modal
        showHyperGammaModal();
    }
}

function showHyperGammaModal() {
    if (els.hyperGammaModal) {
        els.hyperGammaModal.classList.remove('hidden');
        els.hyperGammaModal.classList.add('active');
    }
}

function hideHyperGammaModal() {
    if (els.hyperGammaModal) {
        els.hyperGammaModal.classList.remove('active');
        els.hyperGammaModal.classList.add('hidden');
    }
    // Reset checkbox
    if (els.hyperGammaAccept) {
        els.hyperGammaAccept.checked = false;
    }
    if (els.hyperGammaUnlockBtn) {
        els.hyperGammaUnlockBtn.disabled = true;
    }
}

function updateHyperGammaUnlockedUI() {
    // Remove lock icon
    if (els.hyperGammaLock) {
        els.hyperGammaLock.textContent = '🔓';
    }
    // Update button styling
    if (els.hyperGammaBtn) {
        els.hyperGammaBtn.classList.remove('border-amber-500/30');
        els.hyperGammaBtn.classList.add('border-amber-500/50');
    }
}

// --- VOLUME WARNING ---
function showVolumeWarning() {

    showToast('⚠️ High volume! Recommended max: 85%', 'warning');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium z-[200] transition-all duration-300 opacity-0 transform -translate-y-2`;

    if (type === 'success') {
        toast.style.backgroundColor = 'rgba(16, 185, 129, 0.95)';
        toast.style.color = 'white';
    } else if (type === 'warning') {
        toast.style.backgroundColor = 'rgba(245, 158, 11, 0.95)';
        toast.style.color = 'black';
    } else {
        toast.style.backgroundColor = 'rgba(59, 130, 246, 0.95)';
        toast.style.color = 'white';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function updateUIState(isPlaying) {
    // Sync all buttons based on actual state (single source of truth)
    syncAllButtons();

    // Determine if any audio/visual is active for non-button UI updates
    const isAudioActive = (state.isPlaying || isClassicalPlaying()) && !state.isStopping;
    const isVisualsActive = !isVisualsPaused();
    const isAnyActive = isAudioActive || isVisualsActive;

    // Non-button UI updates
    if (isAnyActive) {
        els.recordBtn.disabled = false;
        resetImmersiveTimer();
    } else {
        els.recordBtn.disabled = true;
        clearTimeout(state.immersiveTimeout);
        if (els.appOverlay) els.appOverlay.classList.remove('immersive-hidden');

        // Reset active preset type so next click starts fresh
        state.activePresetType = null;
        if (typeof updatePresetButtons === 'function') updatePresetButtons(null);
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
    if (viz) {
        viz.setMode(mode);
        // Render a single frame so the mode is visible even when paused
        if (isVisualsPaused()) {
            viz.renderSingleFrame();
        }
    }

    // Update button states with theme-aware styling
    const buttons = [
        { el: els.sphereBtn, mode: 'sphere' },
        { el: els.flowBtn, mode: 'particles' },
        { el: els.lavaBtn, mode: 'lava' }
    ];

    buttons.forEach(({ el, mode: btnMode }) => {
        if (!el) return;
        if (mode === btnMode) {
            // Active style - theme-aware
            el.classList.add('toggle-active');
            el.classList.remove('toggle-inactive');
        } else {
            // Inactive style - theme-aware
            el.classList.remove('toggle-active');
            el.classList.add('toggle-inactive');
        }
    });
}


export function setTheme(themeName) {
    const t = THEMES[themeName] || THEMES.default;
    const r = document.documentElement.style;

    // Core theme colors
    r.setProperty('--bg-main', t.bg);
    r.setProperty('--bg-panel', t.panel);
    r.setProperty('--border', t.border);
    r.setProperty('--text-main', t.text);
    r.setProperty('--text-muted', t.muted);
    r.setProperty('--accent', t.accent);
    r.setProperty('--accent-glow', t.glow);
    r.setProperty('--slider-track', t.border);

    // CRITICAL: Set data-theme on body for CSS selectors to work
    document.body.dataset.theme = themeName;

    // Dispatch event for components that need to react (e.g. Cursor)
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: {
            theme: t,
            name: themeName
        }
    }));

    // Volume slider colors (all themes have these)
    if (t.volumeAccent) {
        r.setProperty('--volume-accent', t.volumeAccent);
        r.setProperty('--volume-glow', t.volumeGlow);
    }

    // Glass properties for light themes (with dark theme fallbacks)
    r.setProperty('--glass-bg', t.glassBg || 'rgba(30, 41, 59, 0.8)');
    r.setProperty('--glass-border', t.glassBorder || 'rgba(255, 255, 255, 0.1)');

    localStorage.setItem('mindwave_theme', themeName);

    // DIRECT INLINE STYLE ENFORCEMENT for light themes
    // This bypasses any CSS specificity issues
    const isLightTheme = themeName === 'cloud' || themeName === 'dawn';
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    if (isLightTheme) {
        const bgColor = t.panel;
        if (leftPanel) leftPanel.style.backgroundColor = bgColor;
        if (rightPanel) rightPanel.style.backgroundColor = bgColor;

        // Also fix all preset buttons text
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.7)';
            btn.querySelectorAll('*').forEach(child => {
                child.style.color = t.text;
            });
        });
    } else {
        // Clear inline styles for dark themes
        if (leftPanel) leftPanel.style.backgroundColor = '';
        if (rightPanel) rightPanel.style.backgroundColor = '';
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.style.backgroundColor = '';
            btn.querySelectorAll('*').forEach(child => {
                child.style.color = '';
            });
        });
    }
}

/**
 * Enforce light theme styles on sidebars and buttons
 * Called when: panel opens, page loads, theme changes
 */
function enforceLightThemeStyles() {
    const themeName = localStorage.getItem('mindwave_theme') || 'default';
    const isLightTheme = themeName === 'cloud' || themeName === 'dawn';

    if (!isLightTheme) return;

    const t = THEMES[themeName];
    if (!t) return;

    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    // Apply light backgrounds
    if (leftPanel) leftPanel.style.backgroundColor = t.panel;
    if (rightPanel) rightPanel.style.backgroundColor = t.panel;

    // Fix preset button text - make it DARK
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.8)';
        btn.style.borderColor = t.border;
        btn.querySelectorAll('*').forEach(child => {
            child.style.color = t.text;
        });
    });

    // Fix all text labels in sidebars
    const textElements = document.querySelectorAll('#leftPanel span, #leftPanel label, #rightPanel span, #rightPanel label');
    textElements.forEach(el => {
        // Don't override accent-colored headers
        if (!el.style.color.includes('var(--accent)') && !el.classList.contains('text-\\[var\\(--accent\\)\\]')) {
            el.style.color = t.text;
        }
    });
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
        item.innerHTML = `<label class="text-[10px] font-semibold truncate mb-1 block" style="color: var(--accent);" title="${s.label}">${s.label}${s.bpm ? ` <span class="text-[8px] text-[var(--text-muted)] font-normal">${s.bpm} BPM</span>` : ''}</label>
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

// Sync all slider value displays to match their actual positions
function syncSliderDisplays() {
    // Base/Pitch slider
    if (els.baseSlider && els.baseValue) {
        els.baseValue.textContent = `${els.baseSlider.value}Hz`;
    }
    // Beat slider
    if (els.beatSlider && els.beatValue) {
        els.beatValue.textContent = `${els.beatSlider.value}Hz`;
    }
    // Volume slider
    if (els.volSlider && els.volValue) {
        els.volValue.textContent = `${Math.round(els.volSlider.value * 100)}%`;
    }
    // Master volume slider
    if (els.masterVolSlider && els.masterVolValue) {
        els.masterVolValue.textContent = `${Math.round(els.masterVolSlider.value * 100)}%`;
    }
    // LR Balance slider
    if (els.masterBalanceSlider && els.masterBalanceValue) {
        const val = parseFloat(els.masterBalanceSlider.value);
        if (Math.abs(val) < 0.05) {
            els.masterBalanceValue.textContent = 'C';
        } else if (val < 0) {
            els.masterBalanceValue.textContent = `L ${Math.round(Math.abs(val) * 100)}%`;
        } else {
            els.masterBalanceValue.textContent = `R ${Math.round(val * 100)}%`;
        }
    }
    // Atmos Master slider
    if (els.atmosMasterSlider && els.atmosMasterValue) {
        els.atmosMasterValue.textContent = `${Math.round(els.atmosMasterSlider.value * 100)}%`;
    }
    // Visual Speed slider
    if (els.visualSpeedSlider && els.speedValue) {
        els.speedValue.textContent = `${parseFloat(els.visualSpeedSlider.value).toFixed(1)}x`;
    }
    console.log('[Controls] Slider displays synchronized');
}

function restoreStateFromLocal() {
    try {
        const saved = localStorage.getItem('mindwave_state_v2');
        if (saved) {
            const s = JSON.parse(saved);
            loadSettings({ settings: s });
        } else {
            applyPreset('alpha', null, false); // Don't auto-start during page load
        }
    } catch (e) { console.warn("Failed to restore state", e); }
}

export function loadSettings(payload) {
    if (!payload || !payload.settings) return;
    const settings = payload.settings;
    if (settings.base) {
        // Block frequency overwrite if story is playing or transitioning
        if (!storyState.isPlaying && !storyState.isTransitioning) els.baseSlider.value = settings.base;
    }
    if (settings.beat) {
        if (!storyState.isPlaying && !storyState.isTransitioning) els.beatSlider.value = settings.beat;
    }
    if (settings.beatsVol) els.volSlider.value = settings.beatsVol;
    if (settings.masterVol) els.masterVolSlider.value = settings.masterVol;
    if (settings.atmosMaster) els.atmosMasterSlider.value = settings.atmosMaster;

    // Update Frequencies immediately
    updateFrequencies();
    updateBeatsVolume();
    updateMasterVolume();
    updateAtmosMaster();

    // NEW: Restore enhanced settings
    if (settings.audioMode) {
        setAudioMode(settings.audioMode);
        // Update mode toggle UI
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === settings.audioMode) {
                btn.classList.add('bg-[var(--accent)]', 'text-[var(--bg-main)]');
                btn.classList.remove('text-[var(--text-muted)]');
            } else {
                btn.classList.remove('bg-[var(--accent)]', 'text-[var(--bg-main)]');
                btn.classList.add('text-[var(--text-muted)]');
            }
        });
        if (els.modeLabel) {
            els.modeLabel.textContent = settings.audioMode.charAt(0).toUpperCase() + settings.audioMode.slice(1);
        }
    }

    if (settings.visualColor) {
        if (els.visualColorPicker) els.visualColorPicker.value = settings.visualColor;
        if (els.colorPreview) els.colorPreview.style.backgroundColor = settings.visualColor;
        const viz = getVisualizer();
        if (viz) viz.setColor(settings.visualColor);
    }

    if (settings.visualMode) {
        setVisualMode(settings.visualMode);
    }

    if (settings.theme) {
        setTheme(settings.theme);
    }

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

    showToast('✨ Preset loaded!', 'success');
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

// --- Auth Logic (Profile Button) ---
if (els.profileBtn) {
    els.profileBtn.addEventListener('click', () => {
        // Check if already logged in? maybe show different menu?
        // For now, open Auth Modal which handles state (or could show profile details)
        // If logged in, maybe show logout option?
        // auth-controller.js usually handles the view logic.
        // We'll just open it for now.
        openAuthModal();
    });
}

// --- Journey Logic (Phase 2B) ---

// Helper to categorize presets by brainwave type
function detectCategory(beatFreq) {
    if (beatFreq < 4) return 'sleep';
    if (beatFreq < 8) return 'meditation';
    if (beatFreq < 14) return 'relaxation';
    if (beatFreq < 30) return 'focus';
    if (beatFreq < 50) return 'awareness';
    return 'peak-performance';
}

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
            soundscapes: { ...state.soundscapeSettings },
            // NEW: Enhanced settings
            audioMode: state.audioMode || 'binaural',
            visualColor: els.visualColorPicker?.value || '#2dd4bf',
            visualMode: state.visualMode || 'particles',
            theme: localStorage.getItem('mindwave_theme') || 'default'
        },
        // NEW: Sharing flag (for Phase 4)
        isPublic: false,
        category: detectCategory(parseFloat(els.beatSlider.value))
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

export async function applyPreset(type, btnElement, autoStart = true) {
    // BLOCKER: If a story is playing, do NOT apply presets that would override story frequency
    if (storyState && (storyState.isPlaying || storyState.isTransitioning)) {
        console.log('[Controls] Blocked applyPreset because Story is Playing/Transitioning');
        return;
    }

    console.log("[Controls] applyPreset called:", type, "autoStart:", autoStart);

    // 0. Toggle Logic (Stop if clicking same active preset)
    if (state.isPlaying && state.activePresetType === type) {
        console.log('[Controls] Toggle: Stopping active preset', type);
        handlePlayClick(); // This toggles play/pause
        state.activePresetType = null;
        updatePresetButtons(null);
        return;
    }

    state.activePresetType = type;

    // 1. Auto-Play FIRST (Critical for UX) - Only if triggered by user gesture
    // We try to start audio immediately on the click event
    // Skip auto-start if called during page load (autoStart = false)
    if (autoStart && !state.isPlaying) {
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
        case 'alpha': base = 120; beat = 10; color = '#60a5fa'; break;
        case 'beta': base = 200; beat = 20; color = '#facc15'; break;
        case 'gamma': base = 200; beat = 40; color = '#f472b6'; break;
        // case 'hyper-gamma': base = 300; beat = 100; color = '#ffffff'; break; // REMOVED: Duplicate causing glitch

        // Solfeggio Healing Frequencies
        // We combine Solfeggio Base with Theta Beat for deep healing state
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

        // Mu Waves (Motor Cortex / Body Awareness) - 8-13Hz range
        // Using significantly different base frequency (150Hz vs Alpha's 200Hz) for audible distinction
        // Beat at 9Hz (lower end of Mu range) for a more grounding/body-focused feel
        case 'mu': base = 150; beat = 9; color = '#10b981'; break; // Emerald


        // Hyper-Gamma (40-100Hz) - Extended range
        case 'hyper-gamma': base = 640; beat = 80; color = '#f59e0b'; break; // Amber - higher octave
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

    // 5. Auto-start visuals when applying preset (only if autoStart is true)
    if (autoStart) {
        resumeVisuals();
        syncAllButtons();
    }

    // 6. Save
    saveStateToLocal();
}

// --- COMBO PRESET LOGIC (Ambient Presets) ---
// Combines binaural frequency presets with atmospheric soundscapes
export async function applyComboPreset(comboId, btnElement) {
    const combo = PRESET_COMBOS.find(c => c.id === comboId);
    if (!combo) {
        console.warn('[Controls] Unknown combo preset:', comboId);
        return;
    }

    console.log('[Controls] Applying combo preset:', comboId, combo);

    // 1. Apply the base preset (alpha, theta, beta, delta, gamma)
    await applyPreset(combo.preset, null, true);

    // 2. Reset all soundscape volumes to 0 first
    const soundscapeContainer = document.getElementById('soundscapeContainer');
    if (soundscapeContainer) {
        const allVolInputs = soundscapeContainer.querySelectorAll('input[data-type="vol"]');
        allVolInputs.forEach(input => {
            input.value = 0;
            const soundscapeId = input.getAttribute('data-id');
            updateSoundscape(soundscapeId, 'vol', 0);
            // Update display
            const valSpan = input.closest('div').querySelector('[data-val="vol"]');
            if (valSpan) valSpan.textContent = '0%';
        });
    }

    // 3. Activate the specified soundscapes with default volume (0.25)
    if (soundscapeContainer && combo.soundscapes) {
        combo.soundscapes.forEach(soundscapeId => {
            const volInput = soundscapeContainer.querySelector(`input[data-id="${soundscapeId}"][data-type="vol"]`);
            if (volInput) {
                const vol = 0.25; // 50% when displayed (0.25 * 200)
                volInput.value = vol;
                updateSoundscape(soundscapeId, 'vol', vol);
                // Update display
                const valSpan = volInput.closest('div').querySelector('[data-val="vol"]');
                if (valSpan) valSpan.textContent = Math.round(vol * 200) + '%';
            }
        });
    }

    // 4. Set atmosphere master volume
    if (combo.atmosVolume !== undefined && els.atmosMasterSlider) {
        els.atmosMasterSlider.value = combo.atmosVolume;
        updateAtmosMaster();
        if (els.atmosMasterValue) {
            els.atmosMasterValue.textContent = Math.round(combo.atmosVolume * 100) + '%';
        }
    }

    // 5. Update visualizer color
    if (combo.color) {
        const viz = getVisualizer();
        if (viz) viz.setColor(combo.color);
        if (els.visualColorPicker) els.visualColorPicker.value = combo.color;
        if (els.colorPreview) els.colorPreview.style.backgroundColor = combo.color;
    }

    // 6. Update UI buttons (highlight selected combo)
    if (els.presetButtons) {
        els.presetButtons.forEach(b => {
            b.classList.remove('bg-white/10', 'border-white/20');
            b.classList.add('bg-white/5', 'border-white/10');
        });
    }
    if (btnElement) {
        btnElement.classList.remove('bg-white/5', 'border-white/10');
        btnElement.classList.add('bg-white/10', 'border-white/20');
    }

    // 7. Show toast
    showToast(`🎧 ${combo.label}: ${combo.description}`, 'success');

    // 8. Save state
    saveStateToLocal();

    // 9. Ensure buttons synced after combo preset
    syncAllButtons();
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

        // Card HTML - use CSS classes for theme-aware text colors
        const displayName = key === 'default' ? 'Emerald' : key;

        card.innerHTML = `
            <div class="theme-preview">
                <div class="absolute inset-0 opacity-50" style="background: radial-gradient(circle at 50% 50%, ${theme.accent}, transparent 70%);"></div>
            </div>
            <div class="p-3 theme-card-content">
                <div class="theme-card-title text-sm font-bold capitalize mb-1">${displayName}</div>
                <div class="theme-card-desc text-[10px]">
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

        // Add cursor settings UI to the modal
        createCursorUIInThemeModal();

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
export function updatePresetButtons(activeType) {
    if (!els.presetButtons) return;

    els.presetButtons.forEach(b => {
        b.classList.remove('bg-white/10', 'border-white/20');
        b.classList.add('bg-white/5', 'border-white/10');

        // Check if this button matches the active type
        // Note: onclick string matching is fragile, but consistent with existing app structure
        if (activeType && b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${activeType}'`)) {
            b.classList.remove('bg-white/5', 'border-white/10');
            b.classList.add('bg-white/10', 'border-white/20');
        }
    });
}

// =============================================================================
// DJ PADS CONTROLLER
// =============================================================================

let djCurrentCategory = 'ambient';
let djMode = 'oneshot'; // 'oneshot' or 'loop'

function setupDJPads() {
    const grid = document.getElementById('djPadsGrid');
    const categoryTabs = document.getElementById('djCategoryTabs');
    const masterVolume = document.getElementById('djMasterVolume');
    const masterValue = document.getElementById('djMasterValue');
    const modeOneShot = document.getElementById('djModeOneShot');
    const modeLoop = document.getElementById('djModeLoop');
    const stopAllBtn = document.getElementById('djStopAll');

    if (!grid) {
        console.log('[DJ Pads] UI elements not found, skipping setup');
        return;
    }

    console.log('[DJ Pads] Initializing...');

    // Render initial category (ambient is the first category in DJ_SOUNDS)
    renderDJPads('ambient');
    updateCategoryTabs(); // Ensure Ambient tab is highlighted on load

    // Category Tab Clicks
    if (categoryTabs) {
        categoryTabs.querySelectorAll('.dj-cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                if (category && category !== djCurrentCategory) {
                    djCurrentCategory = category;
                    updateCategoryTabs();
                    renderDJPads(category);
                }
            });
        });
    }

    // Mode Toggle
    if (modeOneShot) {
        modeOneShot.addEventListener('click', () => {
            if (djMode !== 'oneshot') {
                djMode = 'oneshot';
                updateModeButtons();
            }
        });
    }

    if (modeLoop) {
        modeLoop.addEventListener('click', () => {
            if (djMode !== 'loop') {
                djMode = 'loop';
                updateModeButtons();
            }
        });
    }

    // Master Volume
    if (masterVolume) {
        masterVolume.addEventListener('input', () => {
            const vol = parseFloat(masterVolume.value);
            if (masterValue) masterValue.textContent = Math.round(vol * 100) + '%';
            setDJVolume(vol);
        });
    }

    // Stop All
    if (stopAllBtn) {
        stopAllBtn.addEventListener('click', () => {
            console.log('[DJ Pads] Stop All clicked');
            stopAllLoops();
            updateAllPadStates();
            showToast('All DJ sounds stopped', 'info');
        });
    } else {
        console.warn('[DJ Pads] Stop All button not found');
    }

    // Pitch Slider
    const pitchSlider = document.getElementById('djSoundPitch');
    const pitchValue = document.getElementById('djSoundPitchVal');
    if (pitchSlider) {
        pitchSlider.addEventListener('input', () => {
            const val = parseInt(pitchSlider.value);
            setDJPitch(val);
            pitchValue.textContent = val > 0 ? `+${val}` : val;
        });
    }

    // Tone Slider
    const toneSlider = document.getElementById('djSoundTone');
    const toneValue = document.getElementById('djSoundToneVal');
    if (toneSlider) {
        toneSlider.addEventListener('input', () => {
            const val = parseInt(toneSlider.value);
            setDJTone(val);
            // Format value display (e.g., 4000 -> "4k")
            if (val >= 1000) {
                toneValue.textContent = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
            } else {
                toneValue.textContent = val;
            }
        });
    }

    // Speed Slider
    const speedSlider = document.getElementById('djSoundSpeed');
    const speedValue = document.getElementById('djSoundSpeedVal');
    if (speedSlider) {
        speedSlider.addEventListener('input', () => {
            const val = parseFloat(speedSlider.value);
            setDJSpeed(val);
            speedValue.textContent = val.toFixed(1) + 'x';
        });
    }

    console.log('[DJ Pads] Setup complete');
}

function updateCategoryTabs() {
    const tabs = document.querySelectorAll('.dj-cat-tab');
    tabs.forEach(tab => {
        const cat = tab.dataset.category;
        const catData = DJ_SOUNDS[cat];

        if (cat === djCurrentCategory) {
            // Active state with category color
            const colorClass = catData?.color || 'from-purple-500 to-violet-600';
            tab.className = `dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide whitespace-nowrap`;

            // Apply category-specific colors based on DJ_SOUNDS categories
            if (cat === 'ambient') {
                tab.classList.add('bg-purple-500/20', 'text-purple-400', 'border', 'border-purple-500/30');
            } else if (cat === 'pulse') {
                tab.classList.add('bg-pink-500/20', 'text-pink-400', 'border', 'border-pink-500/30');
            } else if (cat === 'texture') {
                tab.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border', 'border-cyan-500/30');
            } else if (cat === 'healing') {
                tab.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border', 'border-emerald-500/30');
            } else if (cat === 'drops') {
                tab.classList.add('bg-red-500/20', 'text-red-400', 'border', 'border-red-500/30');
            }
        } else {
            // Inactive state
            tab.className = 'dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-white/5 text-[var(--text-muted)] border border-white/10 whitespace-nowrap hover:bg-white/10';
        }
    });
}

function updateModeButtons() {
    const modeOneShot = document.getElementById('djModeOneShot');
    const modeLoop = document.getElementById('djModeLoop');

    if (modeOneShot) {
        if (djMode === 'oneshot') {
            modeOneShot.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30';
        } else {
            modeOneShot.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10';
        }
    }

    if (modeLoop) {
        if (djMode === 'loop') {
            modeLoop.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30';
        } else {
            modeLoop.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10';
        }
    }
}

function renderDJPads(category) {
    const grid = document.getElementById('djPadsGrid');
    if (!grid) return;

    const catData = DJ_SOUNDS[category];
    if (!catData) {
        console.warn('[DJ Pads] Unknown category:', category);
        return;
    }

    // Get gradient colors based on category
    let gradientFrom = 'from-purple-500';
    let gradientTo = 'to-violet-600';
    let borderColor = 'border-purple-500/30';
    let textColor = 'text-purple-400';
    let glowColor = 'shadow-purple-500/30';

    if (category === 'ambient') {
        gradientFrom = 'from-purple-500'; gradientTo = 'to-violet-600';
        borderColor = 'border-purple-500/30'; textColor = 'text-purple-400'; glowColor = 'shadow-purple-500/30';
    } else if (category === 'pulse') {
        gradientFrom = 'from-pink-500'; gradientTo = 'to-rose-600';
        borderColor = 'border-pink-500/30'; textColor = 'text-pink-400'; glowColor = 'shadow-pink-500/30';
    } else if (category === 'texture') {
        gradientFrom = 'from-cyan-500'; gradientTo = 'to-teal-600';
        borderColor = 'border-cyan-500/30'; textColor = 'text-cyan-400'; glowColor = 'shadow-cyan-500/30';
    } else if (category === 'healing') {
        gradientFrom = 'from-emerald-500'; gradientTo = 'to-green-600';
        borderColor = 'border-emerald-500/30'; textColor = 'text-emerald-400'; glowColor = 'shadow-emerald-500/30';
    } else if (category === 'drops') {
        gradientFrom = 'from-red-500'; gradientTo = 'to-orange-600';
        borderColor = 'border-red-500/30'; textColor = 'text-red-400'; glowColor = 'shadow-red-500/30';
    } else if (category === 'bass') {
        gradientFrom = 'from-indigo-500'; gradientTo = 'to-blue-600';
        borderColor = 'border-indigo-500/30'; textColor = 'text-indigo-400'; glowColor = 'shadow-indigo-500/30';
    }

    grid.innerHTML = '';

    Object.entries(catData.sounds).forEach(([id, sound]) => {
        const isActive = isLoopActive(id);
        const canLoop = sound.canLoop;

        const pad = document.createElement('button');
        pad.className = `dj-pad group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 active:scale-95
            ${isActive
                ? `bg-gradient-to-br ${gradientFrom}/30 ${gradientTo}/20 ${borderColor} shadow-lg ${glowColor}`
                : `bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20`}`;
        pad.dataset.soundId = id;
        pad.dataset.canLoop = canLoop;

        // Add loop indicator if looping
        const loopIndicator = isActive ? `<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} animate-pulse"></div>` : '';

        // Use CSS classes instead of inline styles for theme-aware text colors
        const activeClass = isActive ? 'dj-pad-active' : '';

        pad.innerHTML = `
            ${loopIndicator}
            <span class="dj-pad-icon text-2xl mb-1">${sound.icon}</span>
            <span class="dj-pad-label text-[10px] font-bold uppercase tracking-wide ${activeClass}">${sound.label}</span>
            ${canLoop ? `<span class="dj-pad-loop text-[8px] mt-0.5">● LOOP</span>` : ''}
        `;

        // Click handler
        pad.addEventListener('click', () => handlePadClick(id, canLoop, category));

        // Touch feedback
        pad.addEventListener('touchstart', () => {
            pad.classList.add('scale-95');
        }, { passive: true });
        pad.addEventListener('touchend', () => {
            pad.classList.remove('scale-95');
        }, { passive: true });

        grid.appendChild(pad);
    });
}

async function handlePadClick(soundId, canLoop, category) {
    // Initialize audio context if not already
    if (!state.audioCtx || state.audioCtx.state === 'closed') {
        console.log('[DJ Pads] No audio context, initializing...');
        try {
            // Import and call initAudio to create the audio context
            const { initAudio } = await import('../audio/engine.js');
            initAudio();

            // Give it a moment to initialize
            await new Promise(r => setTimeout(r, 100));

            if (!state.audioCtx) {
                console.error('[DJ Pads] Failed to create audio context');
                showToast('Could not start audio. Please try again.', 'error');
                return;
            }
        } catch (e) {
            console.error('[DJ Pads] Audio init error:', e);
            showToast('Audio initialization failed', 'error');
            return;
        }
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (state.audioCtx.state === 'suspended') {
        try {
            await state.audioCtx.resume();
            console.log('[DJ Pads] Audio context resumed');
        } catch (e) {
            console.warn('[DJ Pads] Could not resume audio context:', e);
        }
    }

    // Initialize DJ audio system
    initDJAudio();

    if (djMode === 'loop' && canLoop) {
        // Toggle loop
        if (isLoopActive(soundId)) {
            stopLoop(soundId);
        } else {
            startLoop(soundId);
        }
        // Re-render to update pad state
        setTimeout(() => renderDJPads(category), 50);
    } else {
        // One-shot
        triggerOneShot(soundId);

        // Visual feedback for one-shot
        const pad = document.querySelector(`[data-sound-id="${soundId}"]`);
        if (pad) {
            pad.classList.add('ring-2', 'ring-white/50');
            setTimeout(() => {
                pad.classList.remove('ring-2', 'ring-white/50');
            }, 150);
        }
    }
}

function updateAllPadStates() {
    // Re-render current category to update all pad states
    renderDJPads(djCurrentCategory);
}
