console.log("CONTROLS V3 LOADED - ID: NUCLEAR_CHECK_777");
import { state, els, THEMES, SOUNDSCAPES, PRESET_COMBOS } from '../state.js';
import { startAudio, stopAudio, updateFrequencies, updateBeatsVolume, updateMasterVolume, updateMasterBalance, updateAtmosMaster, updateSoundscape, registerUICallback, fadeIn, fadeOut, cancelFadeOut, cancelStopAudio, resetAllSoundscapes, isVolumeHigh, playCompletionChime, setAudioMode, getAudioMode, startSweep, stopSweep, startSweepPreset, isSweepActive, isAudioPlaying, SWEEP_PRESETS } from '../audio/engine.js';
import { initVisualizer, toggleVisual, setVisualSpeed, setVisualColor, setVisualBrightness, setVisualLogoOpacity, pauseVisuals, resumeVisuals, getVisualizer, isVisualsPaused, preloadVisualizer } from '../visuals/visualizer_lazy.js?v=2';
import { startRecording, stopRecording, startExport, cancelExport, updateExportPreview } from '../export/recorder.js';
import { openAuthModal, renderLibraryList } from './auth-controller.js';
import { saveMixToCloud, saveUserPreferences } from '../services/firebase.js';

// Debounce Utility (if not available globally)
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ... existing code ...

// Logic moved to setupMatrixControls
import { auth, db, registerAuthCallback } from '../services/firebase.js';
import { startSession, stopSession, pauseSession, resumeSession, isSessionPaused, formatTime, getProgress, isSessionActive, DURATION_PRESETS } from '../audio/session-timer.js';
import { startSessionTracking, endSessionTracking, getStats, getWeeklyData, getImpactStats } from '../services/analytics.js';
import { setStoryVolume, playStory, stopStory as stopCurrentStory, storyState } from '../content/stories.js';
import { setCustomAudioVolume } from '../content/audio-library.js';
import { initClassical, isClassicalPlaying, stopClassical, onClassicalStateChange } from '../content/classical.js';
import { initDJAudio, setDJVolume, setDJPitch, setDJTone, setDJSpeed, triggerOneShot, startLoop, stopLoop, isLoopActive, stopAllLoops, getActiveLoopCount, DJ_SOUNDS } from '../audio/dj-synth.js';
import { goToCheckout, hasPurchasedApp, getUserTier, openCustomerPortal } from '../services/stripe-simple.js';
import { getLeaderboard } from '../services/leaderboard-service.js';
import { initGallery } from './gallery-modal.js';
import { getReferralCount, shareReferral } from '../services/referral.js';
import { calculateFrequencyFromGoal, parseComplexGoal, findBestStoryForGoal } from '../services/ai-intent-service.js';
import { startPresenceHeartbeat, stopPresenceHeartbeat, subscribeToPresenceCounts, syncPresence, setPresencePhase } from '../services/presence-service.js';
// ... (existing code)
import { updateTopBarWidth, updateBottomBarWidth } from './resize-panels.js';
import { loadUserPreferences, saveUserPreferences } from '../services/persistence.js?v=NUCLEAR_FIX_V2';

// Global reference for restored prefs to be used during initialization
let restoredPrefs = null;

// Use MultiReplace for multiple chunks? No, I'll use multi_replace tool.
// This block is just for thought process.

// Cursor logic imports removed for inlined UI generation


export function setupUI() {
    console.log('[Controls] setupUI CALLED');
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
    els.canvas = document.getElementById('visualizer-canvas');
    els.themeBtn = document.getElementById('themeBtn');
    els.galleryBtn = document.getElementById('galleryBtn');
    els.visualSpeedSlider = document.getElementById('visualSpeedSlider');
    els.speedValue = document.getElementById('speedValue');
    els.speedSliderContainer = document.getElementById('speedSliderContainer'); // Container for opacity
    els.visualSyncBtn = document.getElementById('visualSyncBtn');
    els.visualColorPicker = document.getElementById('visualColorPicker');
    els.randomColorBtn = document.getElementById('randomColorBtn');
    els.prevColorBtn = document.getElementById('prevColorBtn');
    els.vibrationToggleBtn = document.getElementById('vibrationToggleBtn');
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
    els.hapticSyncToggle = document.getElementById('hapticSyncToggle');

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
    els.lockUIBtn = document.getElementById('lockUIBtn');
    els.lockIcon = document.getElementById('lockIcon');
    els.unlockIcon = document.getElementById('unlockIcon');
    els.visualDock = document.getElementById('visualDock');
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

    // INITIAL LAYOUT SYNC:
    // Force immediate calculation before reveal to prevent shift
    updateTopBarWidth();
    updateBottomBarWidth();

    console.log('[Controls] Initial layout synchronized');
    els.playbackAudio = document.getElementById('playbackAudio');
    els.profileModal = document.getElementById('profileModal');
    els.profileNameInput = document.getElementById('profileNameInput');
    els.saveProfileBtn = document.getElementById('saveProfileBtn');
    els.profileAvatarBig = document.getElementById('profileAvatarBig');
    els.profileUid = document.getElementById('profileUid');
    els.closeProfileBtn = document.getElementById('closeProfileBtn');
    els.closeLibraryBtn = document.getElementById('closeLibraryBtn');
    els.closeModalBtn = document.getElementById('closeModalBtn'); // Playback modal close

    // AI Goal Elements
    els.aiGoalInput = document.getElementById('aiGoalInput');
    els.aiGenerateBtn = document.getElementById('aiGenerateBtn');
    els.aiBtnText = document.getElementById('aiBtnText');
    els.aiBtnSpinner = document.getElementById('aiBtnSpinner');
    els.aiInsight = document.getElementById('aiInsight');

    // Presence Elements
    els.presenceCounter = document.getElementById('presenceCounter');
    els.presenceText = document.getElementById('presenceText');

    // Global Interactive Elements
    els.appOverlay = document.getElementById('appOverlay');
    els.tapZone = document.getElementById('tapZone');
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
    els.matrixBtn = document.getElementById('matrixBtn');

    // Matrix Elements (Added to setupUI to ensure early availability)
    els.matrixSettingsPanel = document.getElementById('matrixSettingsPanel');
    els.matrixCloseBtn = document.getElementById('matrixCloseBtn');
    els.matrixResetBtn = document.getElementById('matrixResetBtn');
    els.matrixColorPicker = document.getElementById('matrixColorPicker');
    els.matrixRainbowToggle = document.getElementById('matrixRainbowToggle');

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

    // --- PERSISTENCE RESTORATION ---
    restoredPrefs = loadUserPreferences();
    if (restoredPrefs) {
        // 1. Apply Volumes to State & UI
        if (restoredPrefs.volumes) {
            state.masterVolume = restoredPrefs.volumes.master;
            state.binauralVolume = restoredPrefs.volumes.binaural;
            state.atmosVolume = restoredPrefs.volumes.atmos;

            if (els.masterVolSlider) els.masterVolSlider.value = state.masterVolume;
            if (els.beatSlider) els.beatSlider.value = state.binauralVolume;
            if (els.atmosMasterSlider) els.atmosMasterSlider.value = state.atmosVolume;

            // Trigger updates to engine
            updateMasterVolume(state.masterVolume);
            updateBeatsVolume(state.binauralVolume);
            updateAtmosMaster(state.atmosVolume);
        }

        // 2. Apply Visual State
        if (restoredPrefs.visuals) {
            state.aiVisualsLocked = restoredPrefs.visuals.aiLocked;
            // Update lock UI
            if (els.lockUIBtn) {
                if (state.aiVisualsLocked) {
                    els.lockUIBtn.classList.add('locked');
                    els.lockIcon.style.display = 'block';
                    els.unlockIcon.style.display = 'none';
                } else {
                    els.lockUIBtn.classList.remove('locked');
                    els.lockIcon.style.display = 'none';
                    els.unlockIcon.style.display = 'block';
                }
            }

            // Speed/Brightness
            if (restoredPrefs.visuals.speed !== undefined) setVisualSpeed(restoredPrefs.visuals.speed);
            if (restoredPrefs.visuals.brightness !== undefined) setVisualBrightness(restoredPrefs.visuals.brightness);
        }

        // 3. Theme
        // Theme application usually happens in main.js or separate init, but we can enforce here if needed.
        // For now, checks if we need to override the default.
    }

    // Attach Auto-Save Listeners
    const saveTriggers = [
        els.masterVolSlider, els.beatSlider, els.atmosMasterSlider,
        els.visualSpeedSlider, els.lockUIBtn
    ];
    saveTriggers.forEach(el => {
        if (el) el.addEventListener('input', saveUserPreferences); // For sliders
        if (el) el.addEventListener('click', saveUserPreferences); // For buttons
    });

    console.log('[Controls] UI Setup & Persistence Loaded');
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

    // Init Gallery (Moved to Deferred Block)
    // initGallery();

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

    // Haptic Sync Toggle
    if (els.hapticSyncToggle) {
        import('../utils/haptics.js').then(m => {
            els.hapticSyncToggle.checked = m.isHapticsEnabled();
            els.hapticSyncToggle.addEventListener('change', (e) => {
                m.setHapticsEnabled(e.target.checked);
                updateHapticSync();
            });
        });
    }

    // AI Generate Button
    if (els.aiGenerateBtn) {
        els.aiGenerateBtn.addEventListener('click', handleAIGenerate);
    }

    if (els.aiGoalInput) {
        els.aiGoalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleAIGenerate();
        });
    }

    // Ghost Mode: Lock UI Button
    if (els.lockUIBtn) {
        // Load initial state
        // Load initial state - FORCE UNLOCKED on load per user request
        // const savedLock = localStorage.getItem('mindwave_ui_locked');
        state.uiLocked = false;
        localStorage.setItem('mindwave_ui_locked', 'false'); // Sync storage
        updateLockUI();

        els.lockUIBtn.addEventListener('click', () => {
            state.uiLocked = !state.uiLocked;
            localStorage.setItem('mindwave_ui_locked', state.uiLocked);
            updateLockUI();

            // If locking, force show everything immediately
            if (state.uiLocked) {
                showUI();
            } else {
                // If unlocking, start idle timer
                resetIdleTimer();
            }
        });
    }

    // Ghost Mode: Activity Listeners
    setupIdleTimer();

    if (els.recordBtn) {
        els.recordBtn.addEventListener('click', () => {
            console.log('[Record Button] Clicked - isPlaying:', state.isPlaying, 'isRecording:', state.isRecording);
            if (!state.isPlaying) alert("Start audio session first.");
            else if (state.isRecording) {
                console.log('[Record Button] Calling stopRecording');
                stopRecording();
            }
            else {
                console.log('[Record Button] Calling startRecording');
                startRecording();
            }
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
                els.videoToggleBtn.style.color = "#ef4444"; // Red color
                els.videoToggleBtn.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                els.videoToggleBtn.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.5)";
                console.log('[Controls] Video recording enabled');
            } else {
                els.videoToggleBtn.style.color = "var(--text-muted)";
                els.videoToggleBtn.style.backgroundColor = "";
                els.videoToggleBtn.style.boxShadow = "";
                console.log('[Controls] Video recording disabled');
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

    // --- Speed Mapping Helpers (Quadratic) ---
    // Maps 0-1 slider range to 0.1-15.0x speed with more resolution at low end
    const mapSpeed = (p) => {
        // v = 0.1 + p^2 * 14.9
        const speed = 0.1 + (p * p) * 14.9;
        return Math.round(speed * 10) / 10;
    };
    // Reverse mapping for setting slider from speed
    const unmapSpeed = (v) => {
        // p = sqrt((v - 0.1) / 14.9)
        return Math.sqrt(Math.max(0, v - 0.1) / 14.9);
    };

    // Visual Speed & Sync Controls
    if (els.visualSpeedSlider) els.visualSpeedSlider.addEventListener('input', () => {
        // If user drags slider, auto-disengage sync mode
        if (state.visualSpeedAuto) {
            state.visualSpeedAuto = false;
            updateSyncUI();
        }
        const p = parseFloat(els.visualSpeedSlider.value);
        const val = mapSpeed(p);
        const viz = getVisualizer();
        if (viz) viz.setSpeed(val);
        if (els.speedValue) els.speedValue.textContent = val.toFixed(1) + 'x';
        // Sync compact slider
        const compactSlider = document.querySelector('.compact-speed-slider');
        const compactValue = document.querySelector('.compact-speed-value');
        if (compactSlider) compactSlider.value = p;
        if (compactValue) compactValue.textContent = val.toFixed(1) + 'x';
    });

    // Compact Speed Slider (syncs with main slider)
    const compactSpeedSlider = document.querySelector('.compact-speed-slider');
    if (compactSpeedSlider) {
        compactSpeedSlider.addEventListener('input', () => {
            const p = parseFloat(compactSpeedSlider.value);
            const val = mapSpeed(p);
            // Sync to main slider
            if (els.visualSpeedSlider) els.visualSpeedSlider.value = p;
            // Update visualizer
            const viz = getVisualizer();
            if (viz) viz.setSpeed(val);
            // Update both displays
            if (els.speedValue) els.speedValue.textContent = val.toFixed(1) + 'x';
            const compactValue = document.querySelector('.compact-speed-value');
            if (compactValue) compactValue.textContent = val.toFixed(1) + 'x';
        });
    }

    // Auto Sync Toggle
    if (els.visualSyncBtn) {
        els.visualSyncBtn.addEventListener('click', () => {
            state.visualSpeedAuto = !state.visualSpeedAuto;
            updateSyncUI();
            updateFrequencies(); // Recalculate speed immediately
        });
    }

    // Compact Sync Button (mirrors main sync button)
    const compactSyncBtn = document.querySelector('.compact-sync-btn');
    if (compactSyncBtn) {
        compactSyncBtn.addEventListener('click', () => {
            state.visualSpeedAuto = !state.visualSpeedAuto;
            updateSyncUI();
            updateFrequencies();
        });
    }

    function updateSyncUI() {
        console.log('[Controls] updateSyncUI. Auto:', state.visualSpeedAuto);
        if (!els.visualSyncBtn || !els.visualSpeedSlider) {
            console.warn('[Controls] Sync UI elements missing:', !!els.visualSyncBtn, !!els.visualSpeedSlider);
            return;
        }

        const compactSyncBtn = document.querySelector('.compact-sync-btn');
        const compactSpeedSlider = document.querySelector('.compact-speed-slider');

        // Slider is ALWAYS enabled — dragging auto-disengages sync
        els.visualSpeedSlider.disabled = false;
        if (compactSpeedSlider) compactSpeedSlider.disabled = false;

        if (state.visualSpeedAuto) {
            // Auto Mode: Locked (accent/active styling)
            els.visualSyncBtn.classList.add('bg-[var(--accent)]', 'text-[var(--bg-main)]');
            els.visualSyncBtn.classList.remove('bg-white/10', 'text-white/50');
            els.visualSyncBtn.title = 'Speed synced to Hz (Auto) — drag slider to override';
            if (els.speedSliderContainer) {
                els.speedSliderContainer.classList.add('opacity-50');
                els.speedSliderContainer.classList.remove('opacity-100');
            }
            if (compactSyncBtn) {
                compactSyncBtn.classList.add('bg-[var(--accent)]', 'text-[var(--bg-main)]');
                compactSyncBtn.classList.remove('bg-white/10', 'text-white/50');
            }
        } else {
            // Manual Mode: Unlocked (full opacity)
            els.visualSyncBtn.classList.remove('bg-[var(--accent)]', 'text-[var(--bg-main)]');
            els.visualSyncBtn.classList.add('bg-white/10', 'text-white/50');
            els.visualSyncBtn.title = 'Manual speed (click to re-sync)';
            if (els.speedSliderContainer) {
                els.speedSliderContainer.classList.remove('opacity-50');
                els.speedSliderContainer.classList.add('opacity-100');
            }
            if (compactSyncBtn) {
                compactSyncBtn.classList.remove('bg-[var(--accent)]', 'text-[var(--bg-main)]');
                compactSyncBtn.classList.add('bg-white/10', 'text-white/50');
            }

            // When switching to manual, ensure slider reflects current actual speed
            const viz = getVisualizer();
            if (viz && viz.speedMultiplier) {
                const p = unmapSpeed(viz.speedMultiplier);
                els.visualSpeedSlider.value = p;
                if (compactSpeedSlider) compactSpeedSlider.value = p;
                if (els.speedValue) els.speedValue.textContent = viz.speedMultiplier.toFixed(1) + 'x';
            }
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
        window.dispatchEvent(new CustomEvent('mindwave:layout-change'));
    });
    if (els.closeLeftBtn) els.closeLeftBtn.addEventListener('click', () => {
        els.leftPanel.classList.add('-translate-x-full');
        updateVisualizerScale();
        window.dispatchEvent(new CustomEvent('mindwave:layout-change'));
    });

    if (els.rightToggle) els.rightToggle.addEventListener('click', () => {
        els.rightPanel.classList.remove('translate-x-full');
        updateVisualizerScale();
        window.dispatchEvent(new CustomEvent('mindwave:layout-change'));
        // Enforce light theme styles when panel opens
        enforceLightThemeStyles();
        setTimeout(adjustMatrixPanelPosition, 50);
    });
    if (els.closeRightBtn) els.closeRightBtn.addEventListener('click', () => {
        els.rightPanel.classList.add('translate-x-full');
        updateVisualizerScale();
        setTimeout(adjustMatrixPanelPosition, 50);
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
    if (els.cubeBtn) els.cubeBtn.addEventListener('click', () => setVisualMode('box'));
    if (els.dragonBtn) els.dragonBtn.addEventListener('click', () => setVisualMode('dragon'));
    if (els.galaxyBtn) els.galaxyBtn.addEventListener('click', () => setVisualMode('galaxy'));

    if (els.flowBtn) els.flowBtn.addEventListener('click', () => setVisualMode('particles'));
    if (els.lavaBtn) els.lavaBtn.addEventListener('click', () => setVisualMode('lava'));
    if (els.fireplaceBtn) els.fireplaceBtn.addEventListener('click', () => setVisualMode('fireplace'));
    if (els.rainBtn) els.rainBtn.addEventListener('click', () => setVisualMode('rainforest'));
    if (els.zenBtn) els.zenBtn.addEventListener('click', () => setVisualMode('zengarden'));
    if (els.oceanBtn) els.oceanBtn.addEventListener('click', () => setVisualMode('ocean'));
    if (els.matrixBtn) els.matrixBtn.addEventListener('click', (e) => {
        // Prevent triggering if clicking the mini-toggle
        if (e.target.closest('#matrixSettingsToggle')) return;
        setVisualMode('matrix');
    });

    // Glow Mode Buttons (Auto, Dim, Full, Heartbeat)
    const glowAutoBtn = document.getElementById('glowAutoBtn');
    const glowDimBtn = document.getElementById('glowDimBtn');
    const glowFullBtn = document.getElementById('glowFullBtn');
    const glowHeartbeatBtn = document.getElementById('glowHeartbeatBtn');
    if (glowAutoBtn) glowAutoBtn.addEventListener('click', () => setGlowMode('auto'));
    if (glowDimBtn) glowDimBtn.addEventListener('click', () => setGlowMode('faded'));
    if (glowFullBtn) glowFullBtn.addEventListener('click', () => setGlowMode('full'));
    if (glowHeartbeatBtn) glowHeartbeatBtn.addEventListener('click', () => setGlowMode('heartbeat'));

    // Matrix Mini-Toggle Logic
    const matrixSettingsToggle = document.getElementById('matrixSettingsToggle');
    if (matrixSettingsToggle) {
        matrixSettingsToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger matrix toggle
            state.matrixPanelOpen = !state.matrixPanelOpen; // Toggle state

            // Update panel visibility immediately if Matrix is active
            const matrixPanel = document.getElementById('matrixSettingsPanel');
            const viz = getVisualizer();
            if (matrixPanel && viz && viz.activeModes.has('matrix')) {
                if (state.matrixPanelOpen) {
                    matrixPanel.classList.remove('hidden');
                    matrixPanel.classList.add('flex', 'items-center');
                } else {
                    matrixPanel.classList.add('hidden');
                    matrixPanel.classList.remove('flex', 'items-center');
                }
            }
        });
    }


    // Matrix Controls

    console.log('[Controls] Calling setupMatrixControls()...');
    setTimeout(() => setupMatrixControls(), 50);

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
    if (els.themeBtn) {
        els.themeBtn.addEventListener('click', showThemeGallery);
    }


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
            els.prevColorBtn.classList.remove('hidden', 'opacity-30', 'pointer-events-none');
        }
    }

    // Setup Matrix specific controls
    // Legacy matrix setup removed to prevent conflicts with robust implementation below.


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

    if (els.vibrationToggleBtn) {
        els.vibrationToggleBtn.addEventListener('click', () => {
            state.visualVibration = !state.visualVibration;
            const viz = getVisualizer();
            if (viz && viz.setVibrationEnabled) {
                viz.setVibrationEnabled(state.visualVibration);
            }
            updateVibrationUI();
        });
    }

    function updateVibrationUI() {
        if (!els.vibrationToggleBtn) return;
        if (state.visualVibration) {
            els.vibrationToggleBtn.classList.remove('text-[var(--text-muted)]');
            els.vibrationToggleBtn.classList.add('text-[var(--accent)]');
            els.vibrationToggleBtn.title = "Visual Vibration: ON";
        } else {
            els.vibrationToggleBtn.classList.remove('text-[var(--accent)]');
            els.vibrationToggleBtn.classList.add('text-[var(--text-muted)]');
            els.vibrationToggleBtn.title = "Visual Vibration: OFF (Static)";
        }
    }
    // Update initial UI state
    updateVibrationUI();

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

    // Initialization happened after applyVisualDefaults moved up


    // Theme - force default (emerald) if no saved theme or if it's a light theme that shouldn't be default
    const savedTheme = localStorage.getItem('mindwave_theme');
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    if (!savedTheme || (savedTheme === 'cloud' || savedTheme === 'dawn') && !lightThemes.includes(savedTheme)) {
        // Clear and set to default emerald theme
        localStorage.removeItem('mindwave_theme');
        setTheme('default');
    } else {
        setTheme(savedTheme);
    }


    // Check disclaimer acceptance from localStorage
    state.disclaimerAccepted = localStorage.getItem('mindwave_disclaimer_accepted') === 'true';

    // Initialize Timer & Disclaimer UI
    setupTimerUI();
    setupDisclaimerUI();
    setupModeToggle(); // NEW
    setupHyperGammaUI(); // NEW
    setupSweepUI(); // NEW
    setupStatsUI(); // NEW - Session Analytics
    // Initialize Timer & Disclaimer UI
    setupTimerUI();
    setupDisclaimerUI();
    setupModeToggle(); // NEW
    setupHyperGammaUI(); // NEW
    setupSweepUI(); // NEW
    setupStatsUI(); // NEW - Session Analytics

    // Mobile Bottom Navigation Handlers
    // ... (existing code) ...

    // IMMEDIATE DISPLAY: Reveal controls now, don't wait for visualizer
    const footer = document.getElementById('bottomControlBar');
    const header = document.getElementById('topControlBar');
    if (footer) {
        footer.style.opacity = '1';
        footer.classList.remove('no-transition');
    }
    if (header) {
        header.style.opacity = '1';
        header.classList.remove('no-transition');
    }

    // DEFERRED INITIALIZATION: Unblock Main Thread for Loading Screen Removal
    setTimeout(() => {
        console.log('[Controls] deferred setup starting...');
        setupDJPads(); // NEW - DJ Sound Pads
        setupPresenceUI(); // NEW - Social Pulse
        initGallery(); // Moved from line 219
        console.log('[Controls] deferred setup complete');
    }, 100);

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
    // applyPreset and applyComboPreset are exposed at module level
    window.openProfile = openProfile;
    window.startSweepPreset = startSweepPresetUI; // NEW
    window.stopSweep = stopSweepUI; // NEW
    window.handleHyperGammaClick = handleHyperGammaClick; // NEW

    // PAYWALL HELPER: Handles Auth + Purchase
    const checkAccessAndPurchase = async (tier) => {
        // 1. Check if logged in
        if (!auth.currentUser) {
            // Show toast and open auth modal
            // We need to import showToast or use a fallback
            console.log('[Paywall] User not logged in. Opening auth modal.');
            alert("Please sign in or create an account to purchase Lifetime Access.");
            openAuthModal();
            return;
        }

        // 2. Check if already purchased (double check)
        const hasAccess = await hasPurchasedApp();
        if (hasAccess) {
            alert("You already have Lifetime Access! refreshing...");
            window.location.reload();
            return;
        }

        // 3. Proceed to Checkout
        try {
            goToCheckout(tier);
        } catch (e) {
            console.error('[Paywall] Checkout failed:', e);
            alert("Checkout Error: " + e.message);
        }
    };

    window.paywall = { goToCheckout, hasPurchasedApp, checkAccessAndPurchase }; // UPDATED

    // --- Visualizer Initialization & Defaults ---

    // Apply visual defaults once visualizer is actually loaded (lazy loader)
    const applyVisualDefaults = async () => {
        console.log('[Controls] Applying visual defaults starting...');
        const viz = getVisualizer();
        if (!viz) {
            console.warn('[Controls] applyVisualDefaults: Visualizer not found');
            return;
        }

        try {
            // Ensure Flow (particles), Galaxy, Dragon, and Matrix are active on load per user request
            // BUT delay the loading slightly to prevent iOS/Safari WebGL watchdog from crashing the tab

            const reqMode = async (mode) => {
                if (!viz.activeModes.has(mode)) {
                    viz.toggleMode(mode);
                    // Yield to browser to compile shaders and update DOM
                    await new Promise(r => requestAnimationFrame(r));
                }
            };

            await reqMode('particles');
            await reqMode('matrix');
            await reqMode('galaxy');
            await reqMode('dragon');

            // Force Mindwave logic mode (MW) for Matrix
            if (viz.setMatrixMode) viz.setMatrixMode(true);

            // Matrix Rainbow mode is forced to true on load per user request
            const isRainbowEnabled = true;

            if (viz.setMatrixRainbow) viz.setMatrixRainbow(isRainbowEnabled);
            const rainbowToggle = document.getElementById('matrixRainbowToggle');
            if (rainbowToggle) rainbowToggle.checked = isRainbowEnabled;

            // Sync UI labels
            if (setupUI.updateRainbowLabels) setupUI.updateRainbowLabels();

            // Sync UI buttons to match the constructor's active modes (no toggleMode calls needed)
            const buttons = [
                { el: els.sphereBtn, mode: 'sphere' },
                { el: els.cubeBtn, mode: 'box' },
                { el: els.dragonBtn, mode: 'dragon' },
                { el: els.galaxyBtn, mode: 'galaxy' },

                { el: els.flowBtn, mode: 'particles' },
                { el: els.lavaBtn, mode: 'lava' },
                { el: els.fireplaceBtn, mode: 'fireplace' },
                { el: els.rainBtn, mode: 'rainforest' },
                { el: els.zenBtn, mode: 'zengarden' },
                { el: els.oceanBtn, mode: 'ocean' },
                { el: els.matrixBtn, mode: 'matrix' }
            ];
            buttons.forEach(({ el, mode }) => {
                if (!el) return;
                if (viz.activeModes.has(mode)) {
                    el.classList.add('toggle-active', 'active');
                    el.classList.remove('toggle-inactive');
                } else {
                    el.classList.remove('toggle-active', 'active');
                    el.classList.add('toggle-inactive');
                }
            });

            // Show matrix panel if matrix is active
            const matrixPanel = document.getElementById('matrixSettingsPanel');
            if (matrixPanel && viz.activeModes.has('matrix')) {
                if (typeof state.matrixPanelOpen === 'undefined') state.matrixPanelOpen = true;
                if (state.matrixPanelOpen) {
                    matrixPanel.classList.remove('hidden');
                    matrixPanel.classList.add('flex', 'items-center');
                }
            }

            // Reveal canvas and controls — everything is ready
            const canvas = document.getElementById('visualizer');
            if (canvas) {
                canvas.style.opacity = '1';
            }
            const footer = document.getElementById('bottomControlBar');
            const header = document.getElementById('topControlBar');

            if (footer) {
                // Ensure layout is current one last time
                updateBottomBarWidth();
                footer.style.opacity = '1';
                // Remove no-transition class AFTER first paint to enable future transitions
                setTimeout(() => footer.classList.remove('no-transition'), 100);
            }
            if (header) {
                updateTopBarWidth();
                header.style.opacity = '1';
                setTimeout(() => header.classList.remove('no-transition'), 100);
            }

            console.log('[Controls] Visualizer and controls revealed');

            console.log('[Controls] Visual defaults applied (streamlined)');

            // Explicitly force visuals to play on load per user request
            if (typeof resumeVisuals === 'function') {
                resumeVisuals();
            }

        } catch (e) {
            console.error('[Controls] Error in applyVisualDefaults:', e);
            const canvas = document.getElementById('visualizer');
            if (canvas) canvas.style.opacity = '1';
        }
    };

    // Register Listener BEFORE preloading starts to avoid race condition
    const vizNow = getVisualizer();
    if (vizNow) {
        console.log('[Controls] Visualizer already present, applying defaults immediately');
        applyVisualDefaults();
    } else {
        console.log('[Controls] Visualizer not found yet. Registering "visualizerReady" listener...');
        window.addEventListener('visualizerReady', () => {
            console.log('[Controls] Received "visualizerReady" event. Proceeding...');
            applyVisualDefaults();
        }, { once: true });
    }

    // Defer visualizer loading slightly to prioritize UI paint (500ms delay)
    // Removed requestIdleCallback as it was too slow on some devices
    setTimeout(() => {
        console.log('[Controls] Starting visualizer preload...');
        preloadVisualizer();
    }, 500);

    // WATCHDOG: Force reveal visualizer if it hasn't loaded after 10 seconds
    setTimeout(() => {
        const canvas = document.getElementById('visualizer');
        if (canvas && canvas.style.opacity === '0') {
            console.warn('[Watchdog] Visualizer still hidden after 10s. Forcing reveal...');

            // Check if it was even dispatched
            if (window.VIZ_READY_DISPATCHED) {
                console.log('[Watchdog] Event was dispatched but not caught. Applying defaults manually.');
                applyVisualDefaults();
            } else {
                console.log('[Watchdog] Event never dispatched. Forcing opacity 1 regardless.');
                canvas.style.opacity = '1';
            }
        }
    }, 10000);

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
        // Pre-initialize modals for speed
        initThemeModal();
    }

    // Initialize UI State
    updateSyncUI();
}
window.setupUI = setupUI; // EXPOSE GLOBALLY FOR DEBUGGING


// --- PLAY BUTTON HANDLER ---
let lastPlayClickTime = 0;

async function handlePlayClick() {
    // Debounce: Prevent double-triggers (e.g. ghost clicks)
    const now = Date.now();
    if (now - lastPlayClickTime < 300) {
        console.log('[Controls] Play click debounced');
        return;
    }
    lastPlayClickTime = now;
    // Check disclaimer first
    if (!state.disclaimerAccepted) {
        showDisclaimerModal();
        return;
    }

    // RESUME CASE: If we are in the middle of stopping (fading out), cancel it and resume!
    if (state.isStopping) {
        console.log('[Controls] Fast Resume triggered!');
        cancelFadeOut();
        // Crucial Fix: Ramp the master gain back up to 1, or else it stays at 0 forever
        fadeIn(0.5);
        state.isStopping = false;
        // Ensure UI reflects playing immediately
        syncAllButtons();
        return;
    }

    if (isAudioPlaying() || isClassicalPlaying()) {
        // STOPPING
        console.log('[Controls] Play Click -> STOPPING... (isPlaying:', isAudioPlaying(), ')');

        // 1. Mark as stopping so UI knows we are "paused" even if audio is fading
        state.isStopping = true;

        // 2. Pause visuals when stopping audio
        pauseVisuals();
        console.log('[Controls] Visuals paused.');

        // 3. Force UI update immediately to show Play icon (Pause state)
        syncAllButtons();

        // 4. Perform the actual stop logic (with fade)
        stopSession();
        if (isClassicalPlaying()) stopClassical();
        endSessionTracking(false);

        console.log('[Controls] Calling fadeOut(0.05)...');
        fadeOut(0.05, () => {
            console.log('[Controls] fadeOut complete callback -> calling stopAudio()');
            stopAudio();
            state.isStopping = false; // Reset flag when actually stopped
            syncAllButtons(); // Sync after audio fully stopped
            console.log('[Controls] Stop sequence finished.');
        });

        hideTimerUI();
    } else {
        // STARTING
        try {
            // Request Desktop Notification Permission explicitly on their first ever play
            if (window.requestNotificationPermission) {
                window.requestNotificationPermission();
            }

            // 1. Resume visuals FIRST so they're ready when audio starts
            resumeVisuals();

            // 2. Start audio and fade in
            await startAudio();
            fadeIn(1.5);

            // 3. Sync buttons IMMEDIATELY to show pause state
            syncAllButtons();

            // 4. Start analytics tracking
            const beatFreq = parseFloat(els.beatSlider?.value || 10);
            let presetName = 'Custom';
            if (beatFreq < 4) presetName = 'Delta';
            else if (beatFreq < 8) presetName = 'Theta';
            else if (beatFreq < 14) presetName = 'Alpha';
            else if (beatFreq < 30) presetName = 'Beta';
            else if (beatFreq < 50) presetName = 'Gamma';
            else presetName = 'Hyper-Gamma';
            startSessionTracking(presetName);

            // 5. Start session timer (0 = infinite/count-up)
            const duration = parseInt(els.sessionDuration?.value || 0);

            startSession(duration, {
                onTick: updateTimerUI,
                onComplete: handleSessionComplete
            });
            showTimerUI();

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

        // 1. Mark as stopping so UI shows stopped state immediately
        state.isAudioStopping = true;

        // 2. Force UI update immediately to show Play icon
        syncAllButtons();

        // 3. Perform the actual stop logic (with fade)
        stopSession();
        if (isClassicalPlaying()) stopClassical();
        endSessionTracking(false);
        fadeOut(0.05, () => {
            stopAudio();
            state.isAudioStopping = false; // Reset flag when actually stopped
            syncAllButtons(); // Sync after audio fully stops
        });
        hideTimerUI();
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
export function syncAllButtons() {
    // Query actual states - these are the single sources of truth
    const audioPlaying = (isAudioPlaying() || isClassicalPlaying()) && !state.isStopping && !state.isAudioStopping;
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

    console.log(`[Buttons] Synced - audio: ${audioPlaying}, visual: ${visualsPlaying} → main: ${isAnyPlaying ? 'PAUSE' : 'PLAY'} `);
}
// --- AI GOAL GENERATOR ---
async function handleAIGenerate() {
    const goal = els.aiGoalInput?.value.trim();
    if (!goal) return;

    // Loading State
    els.aiBtnText?.classList.add('hidden');
    els.aiBtnSpinner?.classList.remove('hidden');
    els.aiGenerateBtn.disabled = true;

    // Simulate "AI" processing delay
    setTimeout(async () => {
        // 1. Check for Story Match
        const storyMatch = findBestStoryForGoal(goal);
        const aiResult = calculateFrequencyFromGoal(goal);

        if (storyMatch) {
            console.log('[AI] Found Story Match:', storyMatch.title);

            // Override story's recommended frequencies with AI intent if relevant
            if (aiResult) {
                // We'll temporarily modify the story object (or just pass the override)
                // For now, let's just use the story's play logic but apply our frequencies after.
                await playStory(storyMatch.id);

                // Fine-tune after story starts
                setTimeout(async () => {
                    await applyAIPreset(aiResult);
                    if (els.aiInsight) {
                        els.aiInsight.textContent = `Matching Story: "${storyMatch.title}" — ${aiResult.insight}`;
                        els.aiInsight.classList.remove('hidden');
                    }
                }, 500);
            } else {
                await playStory(storyMatch.id);
                // Total Immersion: Stories
                if (window.setVisualMode) window.setVisualMode(['rainforest', 'zengarden']);
            }
        } else {
            // 2. Regular Multi-stage Intent
            const sequence = parseComplexGoal(goal);
            if (sequence.length > 0) {
                state.sessionQueue = sequence;
                await applyNextAIStage();
            }
        }

        // Reset UI
        els.aiBtnText?.classList.remove('hidden');
        els.aiBtnSpinner?.classList.add('hidden');
        els.aiGenerateBtn.disabled = false;
    }, 800);
}

async function applyNextAIStage() {
    if (!state.sessionQueue || state.sessionQueue.length === 0) {
        showToast('All stages of your session are complete. 🧘', 'success');
        return;
    }

    const stage = state.sessionQueue.shift();
    console.log('[AI Stage] Applying:', stage.preset, 'Soundscapes:', stage.soundscapes, 'Duration:', stage.duration);

    // Apply main frequency preset and soundscapes
    await applyAIPreset(stage);

    // Show Insight
    if (els.aiInsight) {
        els.aiInsight.textContent = (state.sessionQueue.length > 0 ? "[Stage 1] " : "") + stage.insight;
        els.aiInsight.classList.remove('hidden');
        els.aiInsight.classList.add('animate-[fade-in_0.5s_ease]');
    }

    // Handle Duration / Timer integration
    if (stage.duration) {
        console.log(`[AI Timer] Setting session for ${stage.duration} minutes`);
        startSession(stage.duration, {
            onTick: updateTimerUI,
            onComplete: () => {
                if (state.sessionQueue.length > 0) {
                    showToast('Next stage starting...', 'info');
                    applyNextAIStage();
                } else {
                    handleSessionComplete();
                }
            }
        });
        showTimerUI();
    }
}

async function applyAIPreset(result) {
    console.log('[AI] Applying Preset:', result.preset, 'Visuals:', result.visuals, 'Intensity:', result.intensity);

    // Lock visuals to prevent accidental overrides during "Force Mode"
    state.aiVisualsLocked = true;
    showToast('AI Focus Mode Active 🔒', 'info');

    // 0. Handle Intensity (Volume Scaling)
    const baseVol = 0.5;
    const scaledVol = Math.min(1.0, baseVol * (result.intensity || 1.0));
    if (els.volSlider) {
        els.volSlider.value = scaledVol;
        if (typeof updateBeatsVolume === 'function') updateBeatsVolume(scaledVol);
    }

    // 1. Reset current soundscapes first
    resetAllSoundscapes();

    // 2. Clear current visuals
    const viz = getVisualizer();
    if (viz && viz.activeModes) {
        const active = Array.from(viz.activeModes);
        active.forEach(m => viz.toggleMode(m));
    }

    // 3. Apply Carrier Override (if present)
    if (result.carrier && els.baseSlider) {
        console.log('[AI] Overriding carrier frequency to:', result.carrier);
        els.baseSlider.value = result.carrier;
        if (els.baseValue) els.baseValue.textContent = result.carrier + ' Hz';
    }

    // 4. Apply main frequency preset
    await applyPreset(result.preset, null, true, true);

    // 5. Enable soundscapes with intensity mapping
    result.soundscapes.forEach(id => {
        const scVol = 0.5 * (result.intensity || 1.0);
        updateSoundscape(id, true, Math.min(1.0, scVol));
    });

    // 6. Enable visuals if suggested (Total Immersion)
    if (result.visuals && Array.isArray(result.visuals)) {
        const visualMap = {
            'flow': 'particles',
            'zen': 'zengarden',
            'matrix': 'matrix',
            'rain': 'rainforest'
        };

        // Apply Speed & Brightness if available
        if (viz && (result.speed !== undefined || result.brightness !== undefined)) {
            console.log('[AI] Visual Parameters:', { speed: result.speed, brightness: result.brightness });

            // Speed
            if (result.speed !== undefined && viz.setGlobalSpeed) {
                viz.setGlobalSpeed(result.speed);
            }

            // Brightness (Intensity)
            if (result.brightness !== undefined && viz.setGlobalBrightness) {
                viz.setGlobalBrightness(result.brightness);
            }
        }

        result.visuals.forEach(v => {
            const vizMode = visualMap[v] || v;
            // Pass 'true' to forceState to bypass lock we just set
            setVisualMode(vizMode, true);
        });
    }

    // 7. Force UI Sync
    initMixer();

    showToast(`Total Immersion: ${result.preset.toUpperCase()}`, 'success');
}

/**
 * Public wrapper to apply AI-derived intent.
 * Used for auto-tuning session from survey.
 */
export async function applyAIIntent(intent) {
    console.log('[AI] Applying Intent:', intent);
    const result = calculateFrequencyFromGoal(intent);
    if (result) {
        await applyAIPreset(result);
        return result.insight;
    }
    return null;
}


// --- SOCIAL PRESENCE (PULSE) ---
function setupPresenceUI() {
    // Start Heartbeat immediately (Anonymous tracks as 'anonymous')
    startPresenceHeartbeat();

    // Subscribe to counts
    subscribeToPresenceCounts((data) => {
        state.lastPresenceData = data;
        if (!els.presenceText) return;

        const count = data.total;
        const preset = state.activePresetType || 'none';
        const presetCount = data.byPreset[preset] || 0;

        if (count > 1 && preset !== 'none') {
            els.presenceText.textContent = `${count} Pulse (${presetCount} in ${preset.toUpperCase()})`;
        } else {
            els.presenceText.textContent = count === 1 ? 'You are the Pulse' : `${count} Pulse Active`;
        }
    });
}

function updatePresenceOnPresetChange() {
    // Force immediate sync when preset changes
    syncPresence();
}


// --- TIMER UI FUNCTIONS ---

function setupTimerUI() {
    // Duration selector change handler
    if (els.sessionDuration) {
        els.sessionDuration.addEventListener('change', () => {
            const duration = parseInt(els.sessionDuration.value);
            // Don't hide for 0 anymore
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

        let offset;
        if (data.isInfinite) {
            // For infinite, maybe just keep it full or pulse? 
            // Let's keep it full (0 offset)
            offset = 0;
        } else {
            // standard countdown
            offset = circumference - (data.progress / 100) * circumference;
        }

        els.timerProgress.style.strokeDashoffset = offset;
    }
}

function handlePhaseChange(newPhase) {
    console.log(`[Pomodoro] Phase transitioned to: ${newPhase}`);

    // Broadcast state to Firebase Live Pulse
    if (typeof setPresencePhase === 'function') {
        setPresencePhase(newPhase);
    }

    // Phase 4: Desktop Push Notifications
    if (window.showNotification) {
        if (newPhase === 'REST') {
            window.showNotification("Focus Complete! 🧠", "Time for a 5-minute break. Stretch your legs!");
        } else if (newPhase === 'LONG_REST') {
            window.showNotification("Deep Work Cycle Finished! 🏆", "You earned a 15-minute extended break.");
        } else if (newPhase === 'FOCUS') {
            window.showNotification("Break's Over! 🚀", "Time to dive back into deep work.");
        }
    }

    // Play gentle transition chime
    if (newPhase !== 'NONE') {
        playCompletionChime(); // Reusing the same soft bell for transitions
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

        // Trigger Reflection Journal (Phase 5)
        // Only trigger for sessions longer than 2 minutes to reduce friction
        const sessionLength = parseInt(localStorage.getItem('mindwave_last_session_duration') || '0');
        if (sessionLength > 120) {
            setTimeout(() => showReflectionPrompt({ duration: sessionLength }), 1000);
        }
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

export function showDisclaimerModal() {
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

    // Apply initial toggle classes so buttons match theme on load
    const currentMode = state.audioMode || 'binaural';
    updateModeUI(currentMode);
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

async function openStatsModal() {
    if (!els.statsModal) return;

    // Get stats data
    const stats = getStats();
    const impact = getImpactStats();
    const weeklyData = getWeeklyData();
    const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

    // Live Community Sync Data (Phase 5)
    let livePresenceTotal = state.livePresenceTotal || 42; // Fallback to mock/last known
    subscribeToPresenceCounts((counts) => {
        // UI expects total string matching the count initially
        const totalUsers = isDemo ? Math.floor(Math.random() * 20) + 30 : counts.total;

        // Advanced Network Readouts
        const focusCount = counts.totalFocus || 0;
        const restCount = counts.totalRest || 0;

        // Find the pulse element within the modal content
        const pulseEl = els.statsModal.querySelector('#liveSyncCount').closest('.flex'); // Assuming the parent flex container is the target

        if (pulseEl) {
            let displayHtml = `<div class="pulse-ring"></div>` +
                `<span class="ml-2 font-medium">${totalUsers} Syncing</span>`;

            // Show deep work ratio if data exists
            if (focusCount > 0 || restCount > 0) {
                displayHtml += `<span class="ml-3 text-xs text-[var(--accent)] opacity-80">(🧠 ${focusCount} | 🧘 ${restCount})</span>`;
            }

            pulseEl.innerHTML = displayHtml;

            // Apply slight glow based on volume
            pulseEl.style.boxShadow = `0 0 ${10 + (totalUsers * 0.5)}px rgba(96, 169, 255, 0.2)`;
        }
    });

    // Phase 1 Optimization: Stripe Tier Fetch
    let userTier = 'free';
    try {
        if (auth?.currentUser) {
            userTier = await getUserTier();
        }
    } catch (e) {
        console.warn("[Controls] Failed to fetch Stripe tier:", e);
    }

    const isPremium = userTier !== 'free';

    // Phase 5: Fetch Leaderboard
    const topUsers = await getLeaderboard(5);

    // Generate Leaderboard HTML
    let leaderboardHtml = `
        <div class="mt-8">
            <h4 class="text-sm font-bold text-[var(--accent)] mb-4 flex items-center gap-2">
                <span>🏆</span> Global Deep Work Leaderboard
            </h4>
            <div class="flex flex-col gap-2">
    `;

    if (topUsers.length === 0) {
        leaderboardHtml += `<div class="text-sm text-white/50 text-center py-4 bg-white/5 rounded-xl border border-white/5">No deep work data found yet. Be the first!</div>`;
    } else {
        topUsers.forEach((user, index) => {
            const isTop3 = index < 3;
            const badgeColors = ['bg-yellow-500', 'bg-slate-300', 'bg-amber-700'];
            const badgeClass = isTop3 ? badgeColors[index] : 'bg-white/10 text-white/50';
            const icon = isTop3 ? '★' : `${index + 1}`;

            leaderboardHtml += `
                <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--accent)]/30 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 rounded-full ${badgeClass} flex items-center justify-center text-[10px] font-bold shadow-md shrink-0">
                            ${icon}
                        </div>
                        <img src="${user.photoURL}" class="w-8 h-8 rounded-full bg-white/10 shrink-0" alt="Avatar">
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-white truncate max-w-[120px]">${user.displayName}</span>
                            <span class="text-[10px] text-[var(--text-muted)]">${user.minutes} mins</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-sm border py-0.5 px-2 rounded font-bold text-[var(--accent)] border-[var(--accent)]/30 shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)] bg-[var(--accent)]/10 truncate">
                            ${user.cycles} Cycles
                        </span>
                    </div>
                </div>
            `;
        });
    }
    leaderboardHtml += `</div></div>`;

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

            <!-- Stripe Billing Banner -->
            <div class="mb-6 w-full p-4 rounded-xl border ${isPremium ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} flex items-center justify-between transition-all">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-white flex items-center gap-2">
                        ${isPremium ? '💎 Premium Member' : '⭐ Free Tier'} 
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isPremium ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'} uppercase tracking-wider">
                            ${userTier}
                        </span>
                    </span>
                    <span class="text-[10px] text-[var(--text-muted)] mt-1">
                        ${isPremium ? 'Thank you for supporting MindWave.' : 'Unlock all presets, ad-free offline playback.'}
                    </span>
                </div>
                <button id="stripeConnectBtn" class="px-4 py-2 rounded-lg font-bold text-xs transition-transform hover:scale-105 ${isPremium ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'}">
                    ${isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
                </button>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                <div class="rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 p-4 text-center">
                    <div class="text-2xl mb-1">🔥</div>
                    <div class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">${stats.currentStreak}</div>
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Day Streak</div>
                </div>
                <div class="rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-cyan-500/10 border border-[var(--accent)]/30 p-4 text-center">
                    <div class="text-2xl mb-1">⏱️</div>
                    <div class="text-3xl font-bold bg-gradient-to-r from-[var(--accent)] to-cyan-400 bg-clip-text text-transparent">${stats.totalHours}</div>
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Hours</div>
                </div>
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
            const maxBarHeight = 100;
            const barHeight = d.minutes > 0 ? Math.max(Math.round((d.minutes / maxMinutes) * maxBarHeight), 8) : 8;
            const isToday = i === 6;
            const barBg = d.minutes > 0 ? (isToday ? 'background: linear-gradient(to top, #00d4ff, #06b6d4);' : 'background: linear-gradient(to top, #a855f7, #ec4899);') : 'background: rgba(255,255,255,0.15);';
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

            <!-- PERSONAL IMPACT REPORT -->
            <div class="rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border border-[var(--accent)]/20 p-4 mb-4">
                <h4 class="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-3">Personal Impact Report</h4>
                
                <!-- State Distribution -->
                <div class="space-y-2 mb-4">
                    ${Object.entries(impact.distribution).map(([state, mins]) => {
            if (mins === 0 && impact.totalMinutes > 0) return '';
            const percent = impact.totalMinutes > 0 ? Math.round((mins / impact.totalMinutes) * 100) : 0;
            if (percent === 0 && impact.totalMinutes > 0) return '';
            const colors = { delta: '#f87171', theta: '#fb923c', alpha: '#4ade80', beta: '#60a5fa', gamma: '#a78bfa' };
            return `
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[9px]">
                                <span class="capitalize text-white/70">${state}</span>
                                <span class="text-white/50">${mins}m (${percent}%)</span>
                            </div>
                            <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-1000" style="width: ${percent}%; background-color: ${colors[state] || '#fff'};"></div>
                            </div>
                        </div>
                    `;
        }).join('')}
                </div>

                <!-- Community Sync -->
                <div class="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-white/5">
                    <div class="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm">✨</div>
                    <div class="flex-1">
                        <div id="liveSyncCount" class="text-[10px] text-white/70">${livePresenceTotal} Users Pulsing Now</div>
                        <div class="text-xs font-bold text-[var(--accent)]">${impact.pulseHours} Pulse Hours Generated</div>
                    </div>
                </div>
            </div>

            <!--Additional Stats-->
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

            <!-- Inject Dynamic Phase 5 Leaderboard Underneath the Stats -->
            ${leaderboardHtml}

            <!--Animation styles-- >
    <style>
        @keyframes barGrow {
            from {height: 0%; }
                }
    </style>
`;

        // Re-attach close button listener
        const closeBtn = modalContent.querySelector('#closeStatsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeStatsModal);
        }

        // Phase 1 Optimization: Stripe Connect Handler
        const stripeConnectBtn = modalContent.querySelector('#stripeConnectBtn');
        if (stripeConnectBtn) {
            stripeConnectBtn.addEventListener('click', (e) => {
                e.preventDefault();

                if (!auth.currentUser) {
                    showToast("Please sign in first.", "warning");
                    if (window.openAuthModal) window.openAuthModal();
                    return;
                }

                if (isPremium) {
                    // Send to Stripe Portal to manage subscripton
                    console.log("[Stripe] Opening Customer Portal");
                    openCustomerPortal();
                } else {
                    // Send to pricing sheet to upgrade
                    console.log("[Stripe] Opening Pricing Modal");
                    closeStatsModal();
                    if (window.showPricingModal) {
                        window.showPricingModal();
                    }
                }
            });
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

    // Apply Theme Styles
    updateJourneyStyles();
}

function updateJourneyStyles() {
    // Check for Light Mode
    const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    const btns = document.querySelectorAll('.sweep-btn');
    btns.forEach(btn => {
        const isActive = btn.classList.contains('journey-active');

        if (isActive) {
            // Active State: Let CSS handle it (usually filled)
            // Or ensure specific override if needed, but existing classes likely suffice.
            // Reset inline styles just in case
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        } else {
            // Inactive State
            if (isLight) {
                // LIGHT MODE: Outline Style
                btn.style.setProperty('background-color', 'transparent', 'important');
                btn.style.setProperty('border-color', 'var(--accent)', 'important');
                btn.style.setProperty('color', 'var(--accent)', 'important');
                // Optional: Reduce opacity of border/text for a more subtle look?
                // The user liked DJ Studio which was solid accent color. Let's stick to that.
                // Or maybe lighter border? DJ Studio used category color for border.
                // Here we use accent.
                btn.style.borderWidth = '1px';
            } else {
                // DARK MODE: Generic Glass (Reset to default look if previously overridden)
                // The HTML classes are `bg - white / 5 border - white / 10`.
                // We can't easily "reset" to class values if we overrode with inline styles,
                // so we must explicitly set them to matching values or remove the inline styles.
                // Removing inline styles reverts to CSS classes.
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }
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
    toast.className = `fixed top - 4 left - 1 / 2 - translate - x - 1 / 2 px - 4 py - 2 rounded - lg text - sm font - medium z - [200] transition - all duration - 300 opacity - 0 transform - translate - y - 2`;

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

// --- GLOW MODE CONTROL (Auto / Dim / Full / Heartbeat) ---
let heartbeatInterval = null;

function setGlowMode(mode) {
    // Cancel any active heartbeat animation
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    state.lotusState = mode;

    switch (mode) {
        case 'auto':
            setVisualBrightness(1.0);
            if (window.setCursorOpacity) window.setCursorOpacity(1.0);
            break;
        case 'faded':
            setVisualBrightness(0.3);
            if (window.setCursorOpacity) window.setCursorOpacity(0.3);
            break;
        case 'full':
            setVisualBrightness(1.0);
            if (window.setCursorOpacity) window.setCursorOpacity(1.0);
            break;
        case 'heartbeat': {
            let currentPhase = 0;
            let lastTick = performance.now();
            const startMs = lastTick;
            const intervalMs = 16; // ~60fps

            heartbeatInterval = setInterval(() => {
                const now = performance.now();
                const deltaMs = now - lastTick;
                lastTick = now;

                const elapsedMins = (now - startMs) / 60000;

                // Dynamic Heartbeat Curve
                let currentBPM = 80; // Start fast
                if (elapsedMins < 2) {
                    // 0 to 2 mins: smoothly drop from 80 to 45 BPM
                    currentBPM = 80 - (35 * (elapsedMins / 2));
                } else if (elapsedMins < 5) {
                    // 2 to 5 mins: smoothly drop from 45 to 22.5 BPM (half of 45)
                    const t = (elapsedMins - 2) / 3;
                    currentBPM = 45 - (22.5 * t);
                } else {
                    // 5+ mins: hold steady at 22.5 BPM
                    currentBPM = 22.5;
                }

                // Accumulate phase properly based on current BPM to avoid jumps
                const beatsPerMs = currentBPM / 60000;
                currentPhase = (currentPhase + deltaMs * beatsPerMs) % 1;

                let pulse;
                if (currentPhase < 0.15) {
                    // First beat (sharp rise)
                    pulse = 0.3 + 0.7 * Math.sin((currentPhase / 0.15) * Math.PI);
                } else if (currentPhase < 0.25) {
                    // Brief dip
                    pulse = 0.3 + 0.2 * Math.sin(((currentPhase - 0.15) / 0.1) * Math.PI);
                } else if (currentPhase < 0.4) {
                    // Second beat (slightly softer)
                    pulse = 0.3 + 0.5 * Math.sin(((currentPhase - 0.25) / 0.15) * Math.PI);
                } else {
                    // Rest period
                    pulse = 0.3;
                }
                setVisualBrightness(pulse);
                if (window.setCursorOpacity) window.setCursorOpacity(pulse);
            }, intervalMs);
            break;
        }
    }

    // Update button highlight states
    const glowBtns = document.querySelectorAll('.glow-btn');
    glowBtns.forEach(btn => {
        const btnMode = btn.dataset.glowMode;
        if (btnMode === mode) {
            btn.classList.add('active');
            btn.classList.remove('bg-white/5', 'border-white/10', 'text-[var(--text-muted)]');
            btn.classList.add('bg-[var(--accent)]/15', 'border-[var(--accent)]/40', 'text-[var(--accent)]');
            btn.style.boxShadow = '0 0 12px var(--accent-glow)';
        } else {
            btn.classList.remove('active');
            btn.classList.add('bg-white/5', 'border-white/10', 'text-[var(--text-muted)]');
            btn.classList.remove('bg-[var(--accent)]/15', 'border-[var(--accent)]/40', 'text-[var(--accent)]');
            btn.style.boxShadow = '';
        }
    });

    console.log(`[Glow] Mode set to: ${mode}`);
}
window.setGlowMode = setGlowMode;

export function setVisualMode(mode, forceState = null) {
    const viz = getVisualizer();
    let activeModes = new Set();

    if (viz) {
        // Special consistency Check: If clicking 'matrix' and it's already active, just ENSURE the panel is open.
        // Special consistency Check: If clicking 'matrix' and it's already active...
        if (mode === 'matrix' && viz.activeModes.has('matrix') && forceState === null) {
            // Intelligent Toggle:
            // 1. If Panel is Closed -> Open Panel (Keep Matrix On)
            // 2. If Panel is Open -> Toggle Matrix Off
            if (!state.matrixPanelOpen) {
                state.matrixPanelOpen = true;
                // Do not toggle mode (keep it on)
            } else {
                // Panel is already open, so the user likely wants to turn it OFF
                viz.toggleMode(mode);
            }

            // Trigger UI update logic below (it checks state.matrixPanelOpen)
        } else if (forceState !== null) {
            // Force specific state (ON/OFF)
            const isActive = viz.activeModes.has(mode);
            if (isActive !== forceState) {
                viz.toggleMode(mode);
            }
        } else {
            // Default toggle behavior
            viz.toggleMode(mode);
        }

        // CRITICAL: Always update local activeModes from the source of truth
        activeModes = viz.activeModes;

        // Render a single frame so the mode is visible even when paused
        if (isVisualsPaused()) {
            viz.renderSingleFrame();
        }
    }

    // Update button states with theme-aware styling
    const buttons = [
        { el: els.sphereBtn, mode: 'sphere' },
        { el: els.cubeBtn, mode: 'box' },
        { el: els.dragonBtn, mode: 'dragon' },
        { el: els.galaxyBtn, mode: 'galaxy' },
        { el: els.mandalaBtn, mode: 'mandala' },
        { el: els.flowBtn, mode: 'particles' },
        { el: els.lavaBtn, mode: 'lava' },
        { el: els.fireplaceBtn, mode: 'fireplace' },
        { el: els.rainBtn, mode: 'rainforest' },
        { el: els.zenBtn, mode: 'zengarden' },
        { el: els.oceanBtn, mode: 'ocean' },
        { el: els.matrixBtn, mode: 'matrix' }
    ];

    buttons.forEach(({ el, mode: btnMode }) => {
        if (!el) return;
        const isActive = activeModes.has(btnMode);

        if (isActive) {
            // Active style - theme-aware
            el.classList.add('toggle-active');
            el.classList.add('active'); // Added for visual-active.css support
            el.classList.remove('toggle-inactive');
        } else {
            // Inactive style - theme-aware
            el.classList.remove('toggle-active');
            el.classList.remove('active'); // Added to clear highlight
            el.classList.add('toggle-inactive');
        }
    });

    // Hide Matrix Settings Panel if Matrix is no longer active
    const matrixPanel = document.getElementById('matrixSettingsPanel');
    if (matrixPanel && !activeModes.has('matrix')) {
        matrixPanel.classList.add('hidden');
        matrixPanel.classList.remove('flex', 'items-center');
    }

    // Toggle Matrix Settings Panel
    if (matrixPanel) {
        // Initialize state if undefined
        if (typeof state.matrixPanelOpen === 'undefined') state.matrixPanelOpen = true;

        if (activeModes.has('matrix') && state.matrixPanelOpen) {
            matrixPanel.classList.remove('hidden');
            matrixPanel.classList.add('flex', 'flex-col');
            // Failsafe: Force display in case of class conflict
            matrixPanel.style.display = 'flex';
            matrixPanel.style.visibility = 'visible';
            // Ensure centering is preserved if overridden
            // Ensure positioning respects CSS classes (bottom-right)
            matrixPanel.style.top = '';
            matrixPanel.style.left = '';
            matrixPanel.style.transform = '';
            console.log('[Controls] Matrix Panel FORCED OPEN');
        } else {
            matrixPanel.classList.add('hidden');
            matrixPanel.classList.remove('flex', 'flex-col');
            matrixPanel.style.display = ''; // Reset inline style
            matrixPanel.style.visibility = '';
        }
    }
}
window.setVisualMode = setVisualMode;

/**
 * Toggle mixer sections collapse/expand
 * @param {string} sectionName 
 */
export function toggleMixerSection(sectionName) {
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) {
        section.classList.toggle('collapsed');
        // Save state to localStorage
        const collapsed = section.classList.contains('collapsed');
        const states = JSON.parse(localStorage.getItem('mixerSectionStates') || '{}');
        states[sectionName] = collapsed;
        localStorage.setItem('mixerSectionStates', JSON.stringify(states));
    }
}
window.toggleMixerSection = toggleMixerSection;


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

    // SYNC VISUALS WITH THEME
    setVisualColor(t.accent);

    // CRITICAL: Set data-theme on body for CSS selectors to work
    document.body.dataset.theme = themeName;

    // NEW: Set theme type (light/dark) for consistent styling
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    const themeType = lightThemes.includes(themeName) ? 'light' : 'dark';
    document.body.dataset.themeType = themeType;

    console.log(`[Theme] Setting theme to: ${themeName} (${themeType}) - CONSOLIDATED VERSION`);

    // Dispatch event for components that need to react (e.g. Cursor)
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: {
            theme: t,
            name: themeName,
            type: themeType
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
    const isLightTheme = themeType === 'light';
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    // Theme-Aware Logo Switching
    const logoImg = document.querySelector('#leftPanel img');
    if (logoImg) {
        // Stop using blurry PNGs - use the authentic crisp SVG for both themes
        const newSrc = './mindwave-logo.png';
        if (logoImg.getAttribute('src') !== newSrc) {
            logoImg.src = newSrc;
        }
    }

    if (isLightTheme) {
        const bgColor = t.panel;
        if (leftPanel) {
            leftPanel.style.backgroundColor = bgColor;
            leftPanel.style.color = t.text;
        }
        if (rightPanel) {
            rightPanel.style.backgroundColor = bgColor;
            rightPanel.style.color = t.text;
        }

        // Also fix all preset buttons text
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.7)';
            btn.querySelectorAll('*').forEach(child => {
                child.style.color = t.text;
            });
        });

        // FIX THEME MODAL TEXT VISIBILITY (Aggressive)
        const themeModal = document.getElementById('themeModal');
        if (themeModal) {
            themeModal.style.color = t.text;
            themeModal.querySelectorAll('h2, h3, .text-lg, .text-xs, .text-sm, div, span, label').forEach(el => {
                if (!el.style.color || el.style.color.includes('rgba(255,255,255')) {
                    el.style.color = t.text;
                }
            });
            const modalCard = document.getElementById('themeModalCard');
            if (modalCard) modalCard.style.backgroundColor = t.panel;
        }

        // FIX AUTH MODAL (Sign In) visibility
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.querySelectorAll('h3, p, label, span, button:not([type="submit"])').forEach(el => {
                if (!el.classList.contains('text-[var(--accent)]') && !el.classList.contains('text-white')) {
                    el.style.color = t.text;
                }
            });
            // Specifically fix the subtitle and forgot password link
            const sub = document.getElementById('authSubtitle');
            if (sub) sub.style.color = t.muted;
            const forgot = document.getElementById('resetPasswordBtn');
            if (forgot) forgot.style.color = t.muted;
        }

        // FIX TOP CONTROL BAR VISIBILITY
        const topBar = document.getElementById('topControlBar');
        if (topBar) {
            topBar.style.backgroundColor = t.panel;
            topBar.style.borderColor = t.border;
            topBar.querySelectorAll('button, span, div').forEach(el => {
                if (!el.classList.contains('toggle-active')) {
                    el.style.color = t.text;
                }
            });
        }

        if (typeof updateJourneyStyles === 'function') updateJourneyStyles();

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

        // Clear theme modal styles
        const themeModal = document.getElementById('themeModal');
        if (themeModal) {
            themeModal.querySelectorAll('h2, h3, .text-lg, .text-xs, .text-sm, div').forEach(el => {
                el.style.color = '';
            });
            const modalCard = document.getElementById('themeModalCard');
            if (modalCard) {
                modalCard.style.backgroundColor = '';
            }
        }

        // Clear top bar styles
        const topBar = document.getElementById('topControlBar');
        if (topBar) {
            topBar.style.backgroundColor = '';
            topBar.style.borderColor = '';
            topBar.querySelectorAll('button, span, div').forEach(el => {
                el.style.color = '';
            });
        }
    }
}

/**
 * Enforce light theme styles on sidebars and buttons
 * Called when: panel opens, page loads, theme changes
 */
function enforceLightThemeStyles() {
    const themeName = localStorage.getItem('mindwave_theme') || 'default';
    const isLightTheme = document.body.dataset.themeType === 'light';

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
        // Init missing soundscapes to 0
        if (!state.soundscapeSettings[s.id]) {
            state.soundscapeSettings[s.id] = { vol: 0, tone: 0.5, speed: 0.5 };
        }
        const settings = state.soundscapeSettings[s.id];
        const item = document.createElement('div');
        item.className = `soundscape-item p-2 rounded border border-[var(--border)] flex flex-col gap-1${settings.vol > 0 ? ' soundscape-active' : ''}`;
        item.innerHTML = `<label class="text-[10px] font-semibold truncate mb-1 block atmos-label" title="${s.label}">${s.label}${s.bpm ? ` <span class="text-[8px] fader-label font-normal">${s.bpm} BPM</span>` : ''}</label>
<div class="flex items-center gap-2"><span class="text-[8px] w-6 fader-label">VOL</span><input type="range" min="0" max="0.5" step="0.01" value="${settings.vol}" class="flex-1 h-1" data-id="${s.id}" data-type="vol"><span class="text-[9px] font-mono w-8 text-right tabular-nums fader-value" data-val="vol">${Math.round(settings.vol * 200)}%</span></div>
<div class="flex items-center gap-2"><span class="text-[8px] w-6 fader-label">TONE</span><input type="range" min="0" max="1" step="0.01" value="${settings.tone}" class="flex-1 tone-slider h-1" data-id="${s.id}" data-type="tone"><span class="text-[9px] font-mono w-8 text-right tabular-nums fader-value" data-val="tone">${Math.round(settings.tone * 100)}%</span></div>
<div class="flex items-center gap-2"><span class="text-[8px] w-6 fader-label">SPD</span><input type="range" min="0" max="1" step="0.01" value="${settings.speed}" class="flex-1 speed-slider h-1" data-id="${s.id}" data-type="speed"><span class="text-[9px] font-mono w-8 text-right tabular-nums fader-value" data-val="speed">${Math.round(settings.speed * 100)}%</span></div>`;

        // Vol slider with value update
        const volInput = item.querySelector('input[data-type="vol"]');
        const volVal = item.querySelector('[data-val="vol"]');
        volInput.addEventListener('input', async (e) => {
            const v = parseFloat(e.target.value);
            volVal.textContent = Math.round(v * 200) + '%';

            // Update state FIRST before calling updateSoundscape
            state.soundscapeSettings[s.id].vol = v;
            updateSoundscape(s.id, 'vol', v);
            saveStateToLocal();

            // Toggle active border on the soundscape item
            if (v > 0) {
                item.classList.add('soundscape-active');
            } else {
                item.classList.remove('soundscape-active');
            }

            // When ambience volume is increased, just ensure visuals are running and sync button states
            if (v > 0) {
                // Resume visuals if paused
                if (isVisualsPaused()) {
                    resumeVisuals();
                }
                // Sync button states to reflect playing state (ambience will play via updateSoundscape)
                syncAllButtons();
            } else {
                // Volume reduced to 0 - use setTimeout to ensure all state is updated
                setTimeout(() => {
                    // Check if ALL soundscapes are now at 0 using state
                    const allSoundscapesOff = Object.values(state.soundscapeSettings).every(s => s.vol === 0);

                    console.log('[Controls] Ambience slider to 0, all soundscapes off?', allSoundscapesOff, state.soundscapeSettings);

                    if (allSoundscapesOff) {
                        console.log('[Controls] All ambience off - pausing visuals');
                        // Pause visuals
                        if (!isVisualsPaused()) {
                            pauseVisuals();
                        }
                        // Stop all audio and sync buttons
                        fadeOut(1.5, () => {
                            stopAudio();
                            syncAllButtons();
                        });
                    }
                }, 50); // Small delay to ensure state is fully updated
            }
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
        els.baseValue.textContent = `${els.baseSlider.value} Hz`;
    }
    // Beat slider
    if (els.beatSlider && els.beatValue) {
        els.beatValue.textContent = `${els.beatSlider.value} Hz`;
    }
    // Volume slider
    if (els.volSlider && els.volValue) {
        els.volValue.textContent = `${Math.round(els.volSlider.value * 100)}% `;
    }
    // Master volume slider
    if (els.masterVolSlider && els.masterVolValue) {
        els.masterVolValue.textContent = `${Math.round(els.masterVolSlider.value * 100)}% `;
    }
    // LR Balance slider
    if (els.masterBalanceSlider && els.masterBalanceValue) {
        const val = parseFloat(els.masterBalanceSlider.value);
        if (val === 0) {
            els.masterBalanceValue.textContent = '0';
        } else if (Math.abs(val) < 0.05) {
            els.masterBalanceValue.textContent = 'C';
        } else if (val < 0) {
            els.masterBalanceValue.textContent = `L ${Math.round(Math.abs(val) * 100)}% `;
        } else {
            els.masterBalanceValue.textContent = `R ${Math.round(val * 100)}% `;
        }
    }
    // Atmos Master slider
    if (els.atmosMasterSlider && els.atmosMasterValue) {
        els.atmosMasterValue.textContent = `${Math.round(els.atmosMasterSlider.value * 100)}% `;
    }
    // Visual Speed slider
    if (els.visualSpeedSlider && els.speedValue) {
        els.speedValue.textContent = `${parseFloat(els.visualSpeedSlider.value).toFixed(1)} x`;
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
                btn.classList.add('toggle-active');
                btn.classList.remove('toggle-inactive');
            } else {
                btn.classList.remove('toggle-active');
                btn.classList.add('toggle-inactive');
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

            // Restore saved volumes (fixed: was forcing to 0)
            const newVol = saved ? (saved.vol || 0) : 0;
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

    // Fetch and display referral count
    getReferralCount(user.uid).then(count => {
        const tierBadge = document.getElementById('profileUserTier');
        if (tierBadge) {
            if (count >= 10) tierBadge.innerHTML = '🌟 Grand Ambassador';
            else if (count >= 5) tierBadge.innerHTML = '💎 Elite Ambassador';
            else if (count >= 3) tierBadge.innerHTML = '🥈 Ambassador';
            else tierBadge.innerHTML = 'Free Plan';
        }

        // Optionally update a stat box for referrals if exists
        const refStat = document.getElementById('statReferrals');
        if (refStat) refStat.textContent = count;
    });
}

// --- Auth Logic (Profile Button) ---
if (els.profileBtn) {
    els.profileBtn.addEventListener('click', () => {
        // Check auth state
        import('../services/firebase.js').then(({ getAuth }) => {
            const auth = getAuth();
            if (auth && auth.currentUser) {
                // User is logged in -> Show pricing modal
                if (window.showPricingModal) {
                    window.showPricingModal();
                } else {
                    console.warn('[Controls] Pricing modal not available');
                }
            } else {
                // User not logged in -> Show auth modal
                openAuthModal();
            }
        }).catch(err => {
            console.warn('[Controls] Auth check failed, opening auth modal:', err);
            openAuthModal();
        });
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
    els.saveNameInput.value = `Mix ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `;
    setTimeout(() => els.saveNameInput.select(), 50);
}

async function confirmSave() {
    const name = els.saveNameInput.value || "Untitled Mix";
    els.saveModal.classList.remove('active');

    // Spinner
    const originalContent = els.saveMixBtn.innerHTML;
    els.saveMixBtn.innerHTML = `< svg xmlns = "http://www.w3.org/2000/svg" width = "16" height = "16" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" stroke - width="2" stroke - linecap="round" stroke - linejoin="round" class="animate-spin" > <path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg > `;
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
            visualColor: els.visualColorPicker?.value || '#60a9ff',
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
        els.saveMixBtn.innerHTML = `< svg xmlns = "http://www.w3.org/2000/svg" width = "16" height = "16" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" stroke - width="2" stroke - linecap="round" stroke - linejoin="round" > <polyline points="20 6 9 17 4 12"></polyline></svg > `;
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

/**
 * Load a public preset from the gallery (Phase 7)
 */
window.loadPublicPreset = (preset) => {
    if (!preset || !preset.settings) return;

    console.log('[Gallery] Loading public preset data:', preset.name);

    // Apply pitch and beat
    if (els.baseSlider) {
        els.baseSlider.value = preset.settings.base || 200;
        els.baseValue.textContent = `${els.baseSlider.value} Hz`;
    }
    if (els.beatSlider) {
        els.beatSlider.value = preset.settings.beat || 10;
        els.beatValue.textContent = `${els.beatSlider.value} Hz`;
    }

    // Apply volumes if present
    if (preset.settings.beatsVol && els.volSlider) {
        els.volSlider.value = preset.settings.beatsVol;
        els.volValue.textContent = `${Math.round(preset.settings.beatsVol * 100)}%`;
    }

    // Apply Mode
    if (preset.settings.audioMode) {
        setAudioMode(preset.settings.audioMode);
    }

    // Apply visuals
    if (preset.settings.visualColor) {
        setVisualColor(preset.settings.visualColor);
    }
    if (preset.settings.visualMode) {
        toggleVisual(preset.settings.visualMode);
    }

    // Apply Soundscapes
    if (preset.settings.soundscapes) {
        Object.keys(preset.settings.soundscapes).forEach(id => {
            updateSoundscape(id, preset.settings.soundscapes[id], false);
        });
    }

    updateFrequencies();

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 glass-card px-6 py-3 rounded-2xl border border-[var(--accent)]/30 text-white text-sm z-[300] animate-bounce';
    toast.innerHTML = `🌟 Multi-user Mix Loaded: <b>${preset.name}</b>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);

    // Start audio if not playing
    if (!state.isPlaying) {
        handlePlayClick();
    }
};

let lastPresetClickTime = 0;

export async function applyPreset(type, btnElement, autoStart = true, skipPaywall = false) {
    const now = Date.now();
    if (now - lastPresetClickTime < 300) {
        console.log('[Controls] Preset click debounced');
        return;
    }
    lastPresetClickTime = now;

    // NEW: Manual Override Check
    // If a user clicks a preset button (btnElement exists), we unlock the AI visual lock
    if (btnElement && state.aiVisualsLocked) {
        state.aiVisualsLocked = false;
        showToast('AI Focus Mode Unlocked 🔓', 'info');
    }
    // Check paywall for presets (skip if called from combo preset)
    // EXEMPT BASIC BRAINWAVES from paywall
    // STRICT LOCKING: Only Delta (Sleep) and Beta (Focus) are free
    const freePresets = ['delta', 'beta'];

    if (!skipPaywall && !freePresets.includes(type)) {
        const presetOrder = ['focus', 'sleep', 'meditation', 'creativity', 'relax'];
        const presetIndex = presetOrder.indexOf(type);

        if (presetIndex >= 0 && window.canAccessFeature) {
            const access = await window.canAccessFeature('preset', presetIndex);
            if (!access.allowed) {
                // Pass a callback to retry this action after signin
                const retryCallback = () => {
                    console.log('[Controls] Retrying applyPreset after signin:', type);
                    applyPreset(type, btnElement, autoStart, skipPaywall);
                };
                window.showUpgradePrompt(access.reason, retryCallback);
                return;
            }
        }
    }

    // BLOCKER: If a story is playing, do NOT apply presets that would override story frequency
    if (storyState && (storyState.isPlaying || storyState.isTransitioning)) {
        console.log('[Controls] Blocked applyPreset because Story is Playing/Transitioning');
        return;
    }

    console.log("[Controls] applyPreset called:", type, "autoStart:", autoStart);

    // 0. Toggle Logic (Stop if clicking same active preset) - UNLESS Journey is active
    if (state.isPlaying && state.activePresetType === type) {
        // Check if a journey session is active
        if (typeof window.isJourneyActive === 'function' && window.isJourneyActive()) {
            console.log('[Controls] Journey active - preventing preset toggle off, restarting instead');
            // Don't toggle off, just restart/refresh the preset
            // This ensures journey lessons stay running
        } else {
            // Normal toggle behavior when no journey
            console.log('[Controls] Toggle: Stopping active preset', type);
            handlePlayClick(); // This toggles play/pause
            state.activePresetType = null;
            updatePresetButtons(null);
            return;
        }
    }

    // NEW FIX: Clear Combo Presets if coming from a mixed state
    if (state.activeComboPreset) {
        console.log('[Controls] Clearing combo preset soundscapes before applying standard preset');
        resetAllSoundscapes();
        const soundscapeContainer = document.getElementById('soundscapeContainer');
        if (soundscapeContainer) {
            const allVolInputs = soundscapeContainer.querySelectorAll('input[data-type="vol"]');
            allVolInputs.forEach(input => {
                input.value = 0;
                const valSpan = input.closest('div')?.querySelector('[data-val="vol"]');
                if (valSpan) valSpan.textContent = '0%';
            });
        }
        Object.keys(state.soundscapeSettings).forEach(id => {
            state.soundscapeSettings[id].vol = 0;
        });
        state.activeComboPreset = null;
    }

    state.activePresetType = type;

    // 1. Total Immersion: Apply Visuals
    const { BRAINWAVE_VISUALS } = await import('../state.js');
    if (BRAINWAVE_VISUALS[type]) {
        console.log('[Controls] Total Immersion: Applying brainwave visuals', BRAINWAVE_VISUALS[type]);
        if (window.setVisualMode) {
            window.setVisualMode(BRAINWAVE_VISUALS[type]);
        }

        // Link visualizer state to AI intent (Delta vs Gamma)
        import('../visuals/visualizer_nuclear_v4.js').then(m => {
            const viz = m.getVisualizer();
            if (viz && viz.setIntent) viz.setIntent(type);
        });
    } else if (type.startsWith('heal-')) {
        // Healing Frequency visual logic
        let healingVisuals = ['particles', 'waves']; // Default for deeper healing (852Hz, 963Hz)
        const freq = parseInt(type.split('-')[1]);
        if (freq <= 396) healingVisuals = ['zengarden', 'particles']; // Grounding, calming
        else if (freq <= 528) healingVisuals = ['rainforest', 'ocean']; // Restorative, soothing
        else if (freq <= 741) healingVisuals = ['particles', 'ocean']; // Flowing energy

        console.log('[Controls] Total Immersion: Applying healing visuals', healingVisuals);
        if (window.setVisualMode) window.setVisualMode(healingVisuals);
    }

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

    // 1. Update UI Buttons & Sync Presence
    updatePresetButtons(type);

        // Find button by type if not specific element passed
        const targetBtn = btnElement || document.querySelector(`.preset-btn[onclick *= "'${type}'"]`);
        if (targetBtn) {
            targetBtn.classList.remove('bg-white/5', 'border-white/10');
            targetBtn.classList.add('bg-white/10', 'border-white/20');
        }
    }, 1500); // Wait for sync/snapshot

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
        case 'heal-285': base = 285; beat = 5.5; color = '#38bdf8'; break; // Sky Blue [NEW]
        case 'heal-396': base = 396; beat = 5.5; color = '#f43f5e'; break; // Rose
        case 'heal-417': base = 417; beat = 5.5; color = '#fb923c'; break; // Orange [NEW]
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

// Expose to global scope for HTML onclick handlers
window.applyPreset = applyPreset;
window.applyComboPreset = applyComboPreset;

// --- COMBO PRESET LOGIC (Ambient Presets) ---
// Combines binaural frequency presets with atmospheric soundscapes
export async function applyComboPreset(comboId, btnElement) {
    const now = Date.now();
    if (now - lastPresetClickTime < 300) {
        console.log('[Controls] Preset click debounced');
        return;
    }
    lastPresetClickTime = now;

    const combo = PRESET_COMBOS.find(c => c.id === comboId);
    if (!combo) {
        console.warn('[Controls] Unknown combo preset:', comboId);
        return;
    }

    console.log('[Controls] Applying combo preset:', comboId, combo);

    // NEW: Toggle Logic - Stop if clicking same active combo preset
    if (state.isPlaying && state.activeComboPreset === comboId) {
        console.log('[Controls] Toggle: Stopping active combo preset', comboId);

        // 1. Reset all soundscape volumes to 0 IMMEDIATELY
        const soundscapeContainer = document.getElementById('soundscapeContainer');
        if (soundscapeContainer) {
            const allVolInputs = soundscapeContainer.querySelectorAll('input[data-type="vol"]');
            allVolInputs.forEach(input => {
                input.value = 0;
                const soundscapeId = input.getAttribute('data-id');
                // Update state first
                if (state.soundscapeSettings[soundscapeId]) {
                    state.soundscapeSettings[soundscapeId].vol = 0;
                }
                updateSoundscape(soundscapeId, 'vol', 0);
                // Update display
                const valSpan = input.closest('div')?.querySelector('[data-val="vol"]');
                if (valSpan) valSpan.textContent = '0%';
            });
        }

        // 2. Stop the main audio session using standard logic
        handlePlayClick();

        // 3. Pause visuals when combo preset is toggled off
        setTimeout(() => {
            if (!isVisualsPaused()) {
                pauseVisuals();
            }
            syncAllButtons();
        }, 100);

        state.activeComboPreset = null;
        updatePresetButtons(null);
        return;
    }


    // Track active combo preset
    state.activeComboPreset = comboId;

    // Turn off audio first if playing (visuals continue independently)
    const wasPlaying = isAudioPlaying(); // Use helper to catch fade states

    if (wasPlaying) {
        console.log('[Controls] Stopping audio before applying combo preset');
        // Do NOT use handlePlayClick() here, as it has "resume if stopping" logic
        state.isStopping = true;
        // Kill currently playing audio immediately to prevent overlap
        // using immediate=true to forcefully clear nodes
        stopAudio(true);
        // Force clear any pending resume/start timers
        cancelStopAudio();
        cancelFadeOut();
        state.isStopping = false;

        // With the new 60ms micro-fade architecture, nodes are cleared almost instantly.
        // A minimal 50ms await ensures the JS event loop processes the disconnects before rebuilding.
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 1. Update frequencies immediately (bypass Firebase dependency)
    const presetFrequencies = {
        'delta': { base: 100, beat: 2.5, color: '#6366f1' },
        'theta': { base: 144, beat: 5.5, color: '#a855f7' },
        'alpha': { base: 120, beat: 10, color: '#60a5fa' },
        'beta': { base: 200, beat: 20, color: '#facc15' },
        'gamma': { base: 200, beat: 40, color: '#f472b6' },
        'mu': { base: 150, beat: 9, color: '#10b981' }
    };

    const freq = presetFrequencies[combo.preset];
    if (freq && els.baseSlider && els.beatSlider) {
        els.baseSlider.value = freq.base;
        els.beatSlider.value = freq.beat;
        if (els.baseValue) els.baseValue.textContent = freq.base + ' Hz';
        if (els.beatValue) els.beatValue.textContent = freq.beat + ' Hz';

        // Update audio frequencies
        try {
            updateFrequencies();
        } catch (e) {
            console.warn('[Controls] updateFrequencies warning:', e);
        }
    }

    // 2. Apply the full base preset WITHOUT auto-starting
    // We'll manually start audio  after everything is set up
    await applyPreset(combo.preset, null, false, true).catch(err => {
        console.warn('[Controls] Preset application failed, continuing with soundscape updates:', err);
    });

    // 3. Reset all soundscape volumes to 0 first
    // 3. Reset all active soundscapes (Nuclear Option)
    resetAllSoundscapes();

    // Also clear UI values to match
    const soundscapeContainer = document.getElementById('soundscapeContainer');
    if (soundscapeContainer) {
        const allVolInputs = soundscapeContainer.querySelectorAll('input[data-type="vol"]');
        allVolInputs.forEach(input => {
            input.value = 0;
            const valSpan = input.closest('div')?.querySelector('[data-val="vol"]');
            if (valSpan) valSpan.textContent = '0%';
        });
    }

    // Reset state values in memory too
    Object.keys(state.soundscapeSettings).forEach(id => {
        state.soundscapeSettings[id].vol = 0;
    });

    // 4. Activate the specified soundscapes with default volume (0.25)
    if (soundscapeContainer && combo.soundscapes) {
        combo.soundscapes.forEach(soundscapeId => {
            const volInput = soundscapeContainer.querySelector(`input[data-id="${soundscapeId}"][data-type="vol"]`);
            if (volInput) {
                const vol = 0.25; // 50% when displayed (0.25 * 200)
                volInput.value = vol;
                if (state.soundscapeSettings[soundscapeId]) {
                    state.soundscapeSettings[soundscapeId].vol = vol;
                }
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

    // 7. Total Immersion: Apply Visuals
    if (combo.visuals && combo.visuals.length > 0) {
        console.log('[Controls] Total Immersion: Applying combo visuals', combo.visuals);
        if (window.setVisualMode) {
            window.setVisualMode(combo.visuals);
        }
    }

    // 8. Save state
    saveStateToLocal();

    console.log('[Controls] Combo preset configured:', comboId);

    // 8. Start both binaural beats AND ambience together
    // Use a small delay to ensure all state is updated
    setTimeout(async () => {
        try {
            // Always start audio - don't check if already playing
            // This ensures combos work even if clicked during fade-out
            await startAudio();
            fadeIn(1.5);
            resumeVisuals();
            syncAllButtons();

            // Show toast
            showToast(`🎧 ${combo.label}: ${combo.description} `, 'success');

            console.log('[Controls] Combo preset fully active - beats + ambience');
        } catch (err) {
            console.error('[Controls] Failed to start combo preset:', err);
        }
    }, 100);

    return true;
}
/** LEGACY FAILSAFE - DO NOT REMOVE **/
window.renderThemeModal = () => {
    console.log('[Failsafe] renderThemeModal redirected to showThemeGallery');
    if (typeof showThemeGallery === 'function') showThemeGallery();
};

window.setCursorShape = (s) => {
    if (typeof window._setCursorShape === 'function') {
        window._setCursorShape(s);
    } else {
        console.warn('[Failsafe] _setCursorShape not ready:', s);
    }
};

export function initThemeModal() {
    console.log('[Theme] initThemeModal CALLED (Optimized)');
    const grid = document.getElementById('themeGrid');
    const container = document.getElementById('themeModalContent');
    if (!grid || !container) {
        console.warn('[Theme] target elements missing for initThemeModal');
        return;
    }

    grid.innerHTML = ''; // Clear existing

    // Non-blocking referral count fetch
    const renderThemes = (refCount) => {
        grid.innerHTML = ''; // Clear for fresh render or update
        Object.keys(THEMES).forEach(key => {
            const theme = THEMES[key];
            const isLocked = theme.threshold && refCount < theme.threshold;

            const card = document.createElement('div');
            const currentTheme = document.body.dataset.theme;
            card.className = `theme-card group ${currentTheme === key ? 'active' : ''} ${isLocked ? 'locked opacity-60' : ''} `;
            card.style.setProperty('--theme-bg', theme.bg);
            card.dataset.themeId = key;

            // Card HTML
            const displayName = key === 'default' ? 'Emerald' : key;
            card.innerHTML = `
                <div class="theme-preview">
                    <div class="absolute inset-0 opacity-50" style="background: radial-gradient(circle at 50% 50%, ${theme.accent}, transparent 70%);"></div>
                    ${isLocked ? `
                        <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white/80">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                    ` : ''}
                </div>
                <div class="p-3 theme-card-content">
                    <div class="flex justify-between items-start mb-1">
                        <div class="theme-card-title text-sm font-bold capitalize">${displayName}</div>
                        ${isLocked ? `<span class="text-[9px] font-bold text-amber-500">REF: ${refCount}/${theme.threshold}</span>` : ''}
                    </div>
                    <div class="theme-card-desc text-[10px] opacity-70">
                        ${isLocked ? `Refer ${theme.threshold} friends to unlock this Ambassador theme.` : getThemeDesc(key)}
                    </div>
                </div>
            `;

            card.onclick = () => {
                if (isLocked) {
                    showToast(`🤝 Refer ${theme.threshold - refCount} more friends to unlock ${displayName}!`, 'warning');
                    return;
                }
                setTheme(key);
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                setTimeout(closeThemeModal, 300);
            };

            grid.appendChild(card);
        });
    };

    // Initial render with 0 (or cached if we add it)
    renderThemes(0);

    // Background update
    if (state.currentUser) {
        getReferralCount(state.currentUser.uid).then(count => {
            console.log('[Theme] Async referral count update:', count);
            renderThemes(count);
        }).catch(err => {
            console.error('[Theme] Failed to update referral count:', err);
        });
    }


    // Close Button
    const closeBtn = document.getElementById('closeThemeBtn');
    if (closeBtn) closeBtn.onclick = closeThemeModal;

    // Click outside to close
    const modal = document.getElementById('themeModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeThemeModal();
        });
    }

    // --- Cursor Settings UI (Inlined for robustness) ---
    const existing = document.getElementById('cursorSettingsDefinitive');
    if (existing) existing.remove();

    const section = document.createElement('div');
    section.id = 'cursorSettingsDefinitive';
    section.className = 'mt-6 pt-6 border-t border-white/10';

    const savedShape = localStorage.getItem('mindwave_cursor_shape') || 'default';
    const savedColor = localStorage.getItem('mindwave_cursor_color') || null;
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#60a9ff';
    const effectiveColor = savedColor || accentColor;

    const CURSOR_SHAPES_DATA = [
        { id: 'sun', name: 'Sun', icon: '☀️' },
        { id: 'moon', name: 'Moon', icon: '🌙' },
        { id: 'heart', name: 'Heart', icon: '❤️' },
        { id: 'mindwave', name: 'MindWave', icon: '<img src="./mindwave-cursor.png" width="56" height="56" style="display:inline-block;object-fit:contain;">' },
        { id: 'sun2', name: 'Sun 2', icon: '🌞' },
        { id: 'default', name: 'Default', icon: '🖱️' }
    ];

    section.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-[var(--accent)]/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6" fill="none"/>
                </svg>
            </div>
            <div>
                <h3 class="text-sm font-bold tracking-tight">CUSTOM CURSOR</h3>
                <div class="text-xs text-[var(--text-muted)]">Choose shape and color</div>
            </div>
        </div>
        <div class="mb-4 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <div class="flex items-center gap-3 mb-3">
                <span class="text-xs font-medium">Color:</span>
                <div id="cursorColorPreview" class="w-8 h-8 rounded-full border-2 border-[var(--accent)]/40 shadow-lg" style="background-color: ${effectiveColor};"></div>
                <button id="resetCursorColor" class="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 transition-all border border-[var(--accent)]/30">Reset</button>
            </div>
            <div class="mb-2">
                <label class="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] block mb-1">Hue</label>
                <input type="range" id="cursorHueSlider" min="0" max="360" value="180"
                    style="width:100%;height:12px;-webkit-appearance:none;appearance:none;border-radius:6px;outline:none;cursor:pointer;
                    background:linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%));">
            </div>
            <div class="mb-2">
                <label class="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] block mb-1">Brightness</label>
                <input type="range" id="cursorBrightnessSlider" min="20" max="100" value="60"
                    style="width:100%;height:12px;-webkit-appearance:none;appearance:none;border-radius:6px;outline:none;cursor:pointer;
                    background:linear-gradient(to right,hsl(180,100%,20%),hsl(180,100%,50%),hsl(180,100%,100%));">
            </div>
            <div class="flex gap-1.5 flex-wrap mt-2" id="cursorSwatches">
                ${['#2dd4bf', '#60a5fa', '#a855f7', '#f472b6', '#facc15', '#f97316', '#ef4444', '#10b981', '#6366f1', '#ffffff'].map(c =>
        `<div class="w-6 h-6 rounded-full cursor-pointer border border-white/20 hover:scale-110 transition-transform" style="background:${c};" data-color="${c}"></div>`
    ).join('')}
            </div>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2" id="cursorShapeGrid">
            ${CURSOR_SHAPES_DATA.map(s => `
                <button class="cursor-option p-3 rounded-xl text-center transition-all border ${s.id === savedShape ? 'active bg-[var(--accent)]/20 border-[var(--accent)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}" data-shape="${s.id}" title="${s.name}">
                    <span class="text-2xl block">${s.icon}</span>
                    <div class="text-[10px] mt-1 font-semibold">${s.name}</div>
                </button>
            `).join('')}
        </div>`;

    container.appendChild(section);

    // Event Listeners for Cursor
    section.querySelectorAll('.cursor-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof window.setCursorShape === 'function') {
                window.setCursorShape(btn.dataset.shape);
                // Update UI active state
                section.querySelectorAll('.cursor-option').forEach(b => b.classList.remove('active', 'bg-[var(--accent)]/20', 'border-[var(--accent)]'));
                btn.classList.add('active', 'bg-[var(--accent)]/20', 'border-[var(--accent)]');
            }
        });
    });

    // --- Real-time color picker via hue/brightness sliders ---
    const hueSlider = section.querySelector('#cursorHueSlider');
    const brightSlider = section.querySelector('#cursorBrightnessSlider');
    const preview = section.querySelector('#cursorColorPreview');
    const swatches = section.querySelector('#cursorSwatches');

    const hslToHex = (h, s, l) => {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    const applyCursorColor = (hex) => {
        if (preview) preview.style.backgroundColor = hex;
        if (typeof window.setCursorColor === 'function') window.setCursorColor(hex);
    };

    const updateFromSliders = () => {
        const h = parseInt(hueSlider.value);
        const l = parseInt(brightSlider.value);
        const hex = hslToHex(h, 100, l);
        applyCursorColor(hex);
        // Update brightness slider gradient to match current hue
        brightSlider.style.background = `linear-gradient(to right,hsl(${h},100%,20%),hsl(${h},100%,50%),hsl(${h},100%,100%))`;
    };

    // Initialize sliders from saved color
    if (savedColor) {
        // Parse saved hex to set slider positions
        const r = parseInt(savedColor.slice(1, 3), 16) / 255, g = parseInt(savedColor.slice(3, 5), 16) / 255, b = parseInt(savedColor.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0; const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
            else if (max === g) h = ((b - r) / d + 2) * 60;
            else h = ((r - g) / d + 4) * 60;
        }
        hueSlider.value = Math.round(h);
        brightSlider.value = Math.round(l * 100);
        brightSlider.style.background = `linear-gradient(to right,hsl(${Math.round(h)},100%,20%),hsl(${Math.round(h)},100%,50%),hsl(${Math.round(h)},100%,100%))`;
    }

    if (hueSlider) hueSlider.addEventListener('input', updateFromSliders);
    if (brightSlider) brightSlider.addEventListener('input', updateFromSliders);

    // Preset swatches
    if (swatches) {
        swatches.querySelectorAll('[data-color]').forEach(swatch => {
            swatch.addEventListener('click', () => {
                applyCursorColor(swatch.dataset.color);
            });
        });
    }

    const rb = section.querySelector('#resetCursorColor');
    if (rb) {
        rb.addEventListener('click', () => {
            if (typeof window.resetCursorColor === 'function') {
                window.resetCursorColor();
            }
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            if (preview) preview.style.backgroundColor = accent;
        });
    }
}

function getThemeDesc(key) {
    switch (key) {
        // Original Dark Themes
        case 'default': return "Clean Slate";
        case 'midnight': return "Deep Blue Focus";
        case 'ember': return "Warm Intensity";
        case 'abyss': return "Total Darkness";
        case 'cyberpunk': return "Neon & High-Contrast";
        case 'nebula': return "Cosmic Depth";
        case 'quantum': return "Matrix Grid";
        case 'sunset': return "Synthwave Glow";

        // Ambassador Themes
        case 'platinum': return "Elite Silver Focus";
        case 'titanium': return "Indigo Power State";
        case 'supernova': return "Peak Energetic Flow";

        // Premium Dark Themes
        case 'aurora': return "Glacial Cyan";
        case 'forest': return "Natural Green";
        case 'royal': return "Purple Elegance";
        case 'ocean': return "Deep Sea Blue";
        case 'rose': return "Pink Blush";
        case 'gold': return "Amber Warmth";
        case 'obsidian': return "Pure Monochrome";
        case 'arctic': return "Ice Blue";
        case 'sentaient': return "Deep Space Blue & Orange";

        // Light Themes
        case 'cloud': return "Light & Airy";
        case 'dawn': return "Soft Rose";
        case 'paper': return "Clean Minimalism";
        case 'ash': return "Subtle Gray";

        default: return "Custom Theme";
    }
}

/**
 * Definitive function to show the theme gallery.
 * Renamed from openThemeModal to bypass potential caching/reference errors.
 */
export function showThemeGallery() {
    console.log('[Theme] showThemeGallery CALLED');
    const modal = document.getElementById('themeModal');
    const card = document.getElementById('themeModalCard');
    if (!modal || !card) return;

    // Simplified: Just update active state and show
    const currentTheme = document.body.dataset.theme;
    document.querySelectorAll('.theme-card').forEach(card => {
        if (card.dataset.themeId === currentTheme) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Show modal
    modal.classList.remove('hidden');
    void modal.offsetWidth; // Force reflow
    modal.classList.add('active');

    // Reset scroll position on open
    const scrollContent = document.getElementById('themeModalContent');
    if (scrollContent) scrollContent.scrollTop = 0;

    // Animation
    card.classList.remove('opacity-0', 'scale-95');
    card.classList.add('opacity-100', 'scale-100');

    // Layout
    if (typeof adjustModalLayout === 'function') {
        adjustModalLayout(modal);
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
        b.classList.remove('active', 'bg-white/10', 'border-white/20');
        b.classList.add('bg-white/5', 'border-white/10');

        // Check if this button matches the active type
        // Note: onclick string matching is fragile, but consistent with existing app structure
        if (activeType && b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${activeType}'`)) {
            b.classList.remove('bg-white/5', 'border-white/10');
            b.classList.add('active', 'bg-white/10', 'border-white/20');
        }
    });
}

// =============================================================================
// DJ PADS CONTROLLER
// =============================================================================

let djCurrentCategory = 'ambient';
let djMode = 'oneshot'; // 'oneshot' or 'loop'
let djShowAllCategories = true; // Default to showing all categories when DJ Studio expands

// Helper functions that need to be accessible to the global reset function
let renderAllDJPads;
let updateShowAllButton;

// Global function for Expand All button to reset DJ Studio to Show All view
// Must be at module level to be available when index.html needs it
window.resetDJStudioToShowAll = function () {
    console.log('[DJ Studio] Reset function called, djShowAllCategories is:', djShowAllCategories);

    // Always force reset to show all
    djShowAllCategories = true;

    // Force re-render with a slight delay to ensure DOM is ready
    setTimeout(() => {
        console.log('[DJ Studio] Resetting to Show All Categories from Expand All button');

        if (renderAllDJPads) renderAllDJPads();
        if (updateShowAllButton) updateShowAllButton();

        // Deactivate all category tabs
        const tabs = document.querySelectorAll('.dj-cat-tab');
        tabs.forEach(tab => {
            tab.className = 'dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-white/5 text-[var(--text-muted)] border border-white/10 whitespace-nowrap hover:bg-white/10';
        });

        console.log('[DJ Studio] Reset complete, processed', tabs.length, 'tabs');
    }, 10);
};

function setupDJPads() {
    const grid = document.getElementById('djPadsGrid');
    const categoryTabs = document.getElementById('djCategoryTabs');
    const masterVolume = document.getElementById('djMasterVolume');
    const masterValue = document.getElementById('djMasterValue');
    const modeOneShot = document.getElementById('djModeOneShot');
    const modeLoop = document.getElementById('djModeLoop');
    const stopAllBtn = document.getElementById('djStopAll');
    const showAllBtn = document.getElementById('djShowAllCategoriesBtn'); // NEW

    if (!grid) {
        console.log('[DJ Pads] UI elements not found, skipping setup');
        return;
    }

    console.log('[DJ Pads] Initializing...');

    // Render all categories by default to show full DJ Studio collection
    renderAllDJPads();
    updateShowAllButton(); // Ensure "All" button shows active state on load

    // Category Tab Clicks
    if (categoryTabs) {
        categoryTabs.querySelectorAll('.dj-cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                if (category && category !== djCurrentCategory) {
                    djCurrentCategory = category;
                    djShowAllCategories = false; // Exit "show all" mode
                    updateShowAllButton(); // Update button state
                    updateCategoryTabs();
                    renderDJPads(category);
                }
            });
        });
    }

    // NEW: Show All Categories Button
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            djShowAllCategories = !djShowAllCategories;

            if (djShowAllCategories) {
                renderAllDJPads();
                // Deactivate category tabs
                const tabs = document.querySelectorAll('.dj-cat-tab');
                tabs.forEach(tab => {
                    tab.className = 'dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-white/5 text-[var(--text-muted)] border border-white/10 whitespace-nowrap hover:bg-white/10';
                });
            } else {
                // Return to current category
                updateCategoryTabs();
                renderDJPads(djCurrentCategory);
            }

            updateShowAllButton();
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
            pitchValue.textContent = val > 0 ? `+ ${val} ` : val;
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

// Helper to get consistent category colors
function getCategoryColor(cat) {
    if (cat === 'pulse') {
        return {
            name: 'red',
            text: 'text-red-400',
            hex: '#ef4444',
            hexBg: 'rgba(239,68,68,0.2)',
            hexBorder: 'rgba(239,68,68,0.4)',
            hexGlow: '0 0 12px rgba(239,68,68,0.3)',
            bg: 'bg-red-500/20',
            border: 'border-red-500/30',
            from: 'from-red-500',
            to: 'to-rose-600',
            glow: 'shadow-red-500/30'
        };
    } else if (cat === 'drops') {
        return {
            name: 'blue',
            text: 'text-blue-400',
            hex: '#3b82f6',
            hexBg: 'rgba(59,130,246,0.2)',
            hexBorder: 'rgba(59,130,246,0.4)',
            hexGlow: '0 0 12px rgba(59,130,246,0.3)',
            bg: 'bg-blue-500/20',
            border: 'border-blue-500/30',
            from: 'from-blue-500',
            to: 'to-indigo-600',
            glow: 'shadow-blue-500/30'
        };
    } else if (cat === 'texture') {
        return {
            name: 'gold',
            text: 'text-amber-500',
            hex: '#f59e0b',
            hexBg: 'rgba(245,158,11,0.2)',
            hexBorder: 'rgba(245,158,11,0.4)',
            hexGlow: '0 0 12px rgba(245,158,11,0.3)',
            bg: 'bg-amber-500/20',
            border: 'border-amber-500/30',
            from: 'from-amber-400',
            to: 'to-amber-600',
            glow: 'shadow-amber-500/30'
        };
    } else if (cat === 'healing') {
        return {
            name: 'emerald',
            text: 'text-emerald-400',
            hex: '#10b981',
            hexBg: 'rgba(16,185,129,0.2)',
            hexBorder: 'rgba(16,185,129,0.4)',
            hexGlow: '0 0 12px rgba(16,185,129,0.3)',
            bg: 'bg-emerald-500/20',
            border: 'border-emerald-500/30',
            from: 'from-emerald-500',
            to: 'to-green-600',
            glow: 'shadow-emerald-500/30'
        };
    } else if (cat === 'ambient') {
        return {
            name: 'purple',
            text: 'text-purple-400',
            hex: '#a855f7',
            hexBg: 'rgba(168,85,247,0.2)',
            hexBorder: 'rgba(168,85,247,0.4)',
            hexGlow: '0 0 12px rgba(168,85,247,0.3)',
            bg: 'bg-purple-500/20',
            border: 'border-purple-500/30',
            from: 'from-purple-500',
            to: 'to-violet-600',
            glow: 'shadow-purple-500/30'
        };
    } else if (cat === 'bass') {
        return {
            name: 'indigo',
            text: 'text-indigo-400',
            hex: '#6366f1',
            hexBg: 'rgba(99,102,241,0.2)',
            hexBorder: 'rgba(99,102,241,0.4)',
            hexGlow: '0 0 12px rgba(99,102,241,0.3)',
            bg: 'bg-indigo-500/20',
            border: 'border-indigo-500/30',
            from: 'from-indigo-500',
            to: 'to-blue-600',
            glow: 'shadow-blue-500/30'
        };
    }
    // Default
    return {
        name: 'gray',
        text: 'text-[var(--text-muted)]',
        hex: '#94a3b8',
        hexBg: 'rgba(255,255,255,0.05)',
        hexBorder: 'rgba(255,255,255,0.15)',
        hexGlow: 'none',
        bg: 'bg-white/5',
        border: 'border-white/10',
        from: 'from-gray-500',
        to: 'to-gray-600',
        glow: 'shadow-gray-500/30'
    };
}

function updateCategoryTabs() {
    const tabs = document.querySelectorAll('.dj-cat-tab');

    // Check for Light Mode
    const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    tabs.forEach(tab => {
        const cat = tab.dataset.category;
        const colors = getCategoryColor(cat);

        if (cat === djCurrentCategory) {
            // Active state
            if (isLight) {
                // Light Mode Active: Accent Tint BG + Category Text/Border
                // Use color-mix for valid opacity with hex variable
                tab.className = `dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide whitespace-nowrap border shadow-sm ${colors.text}`;
                tab.style.borderColor = 'currentColor';
                tab.style.backgroundColor = 'color-mix(in srgb, var(--accent), transparent 80%)';
            } else {
                // Dark Mode Active: Legacy
                tab.className = `dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${colors.bg} ${colors.text} border ${colors.border}`;
                tab.style.borderColor = '';
                tab.style.backgroundColor = '';
            }
        } else {
            // Inactive state
            tab.style.backgroundColor = ''; // Reset
            if (isLight) {
                tab.className = `dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide whitespace-nowrap bg-transparent hover:bg-black/5 text-[var(--text-muted)] border border-transparent hover:border-black/5`;
                tab.style.borderColor = '';
            } else {
                tab.className = `dj-cat-tab px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide whitespace-nowrap hover:bg-white/10 ${colors.text} border border-white/10 hover:border-white/20`;
                tab.style.borderColor = '';
            }
        }
    });

    // Also update Show All/Stop All buttons
    updateShowAllButton();
    updateStopAllButton();
}



function updateModeButtons() {
    const modeOneShot = document.getElementById('djModeOneShot');
    const modeLoop = document.getElementById('djModeLoop');

    // Check for Light Mode
    const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    if (modeOneShot) {
        if (djMode === 'oneshot') {
            if (isLight) {
                // Light Mode Active: Accent Tint BG
                modeOneShot.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)] shadow-sm';
                modeOneShot.style.backgroundColor = 'color-mix(in srgb, var(--accent), transparent 80%)';
            } else {
                // Dark Mode Active: Pink (Legacy)
                modeOneShot.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30';
                modeOneShot.style.backgroundColor = '';
            }
        } else {
            // Inactive
            modeOneShot.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10';
            modeOneShot.style.backgroundColor = '';
        }
    }

    if (modeLoop) {
        if (djMode === 'loop') {
            if (isLight) {
                // Light Mode Active: Accent Tint BG
                modeLoop.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)] shadow-sm';
                modeLoop.style.backgroundColor = 'color-mix(in srgb, var(--accent), transparent 80%)';
            } else {
                // Dark Mode Active: Pink (Legacy)
                modeLoop.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30';
                modeLoop.style.backgroundColor = '';
            }
        } else {
            // Inactive
            modeLoop.className = 'dj-mode-btn px-2 py-1 rounded text-[9px] font-bold bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10';
            modeLoop.style.backgroundColor = '';
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

    // Get gradient colors based on category using helper
    const colors = getCategoryColor(category);
    let gradientFrom = colors.from;
    let gradientTo = colors.to;
    let borderColor = colors.border;
    let textColor = colors.text;
    let glowColor = colors.glow;

    grid.innerHTML = '';

    // Check for Light Mode
    const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    Object.entries(catData.sounds).forEach(([id, sound]) => {
        const isActive = isLoopActive(id);
        const canLoop = sound.canLoop;

        let inactiveClasses = `bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20`;
        let inactiveStyle = '';

        if (!isActive && isLight) {
            // Light Mode Outline Style: Transparent BG, Colored Border, Colored Text
            // We use inline styles for the specific category color on border/text
            inactiveClasses = `bg-transparent hover:bg-[var(--accent)]/5`;
            // Note: Border width is handled by 'border' class in template below
        }

        const pad = document.createElement('button');
        if (isActive) {
            pad.className = `dj-pad group relative flex flex-col items-center justify-center glass-pill border border-[var(--accent)] hover:bg-white/10 transition-all group py-3`;
            pad.style.boxShadow = `0 0 12px var(--accent-glow)`;
        } else {
            pad.className = `dj-pad group relative flex flex-col items-center justify-center glass-pill border border-white/5 hover:bg-white/10 hover:border-[var(--accent)] transition-all group py-3`;
        }

        // Add loop indicator if looping
        const loopIndicator = isActive ? `<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} animate-pulse"></div>` : '';

        // Active class for label
        const activeClass = isActive ? 'dj-pad-active' : '';

        // Inner content
        // If Light Mode Inactive, we already set text color on parent, so no need for explicit color classes on children unless we want to override?
        // But `sound.icon` might not inherit? Icons are text usually.

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
    if (djShowAllCategories) {
        renderAllDJPads();
    } else {
        renderDJPads(djCurrentCategory);
    }
}

// NEW: Render all pads from all categories
renderAllDJPads = function () {
    const grid = document.getElementById('djPadsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid grid-cols-3 gap-2'; // Keep same grid

    // Categories to render in order
    const categories = ['ambient', 'pulse', 'texture', 'healing', 'drops'];

    categories.forEach(category => {
        const catData = DJ_SOUNDS[category];
        if (!catData) return;

        // Category-specific styling using helper
        const colors = getCategoryColor(category);
        const headerColor = colors.text;

        const icon = catData.sounds[Object.keys(catData.sounds)[0]]?.icon || '';
        const header = document.createElement('div');
        header.className = 'text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2';
        header.style.gridColumn = '1 / -1'; // Span all columns (equivalent to col-span-3)
        header.style.marginTop = category === categories[0] ? '0' : '24px'; // 24px spacing between categories
        header.style.marginBottom = '8px';

        header.innerHTML = `<span class="${headerColor}">${icon} ${category.toUpperCase()}</span>`;
        header.innerHTML += '<div class="flex-1 h-px bg-white/10"></div>';
        grid.appendChild(header);

        // Get gradient colors based on category
        let gradientFrom = colors.from;
        let gradientTo = colors.to;
        let borderColor = colors.border;
        let glowColor = colors.glow;

        // Check for Light Mode
        const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
        const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
        const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

        // Add all pads for this category
        Object.entries(catData.sounds).forEach(([id, sound]) => {
            const isActive = isLoopActive(id);
            const canLoop = sound.canLoop;

            let inactiveClasses = `bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20`;

            if (!isActive && isLight) {
                // Light Mode Outline Style: Transparent BG, Colored Border, Colored Text
                inactiveClasses = `bg-transparent hover:bg-[var(--accent)]/5`;
            }

            const pad = document.createElement('button');
            if (isActive) {
                pad.className = `dj-pad group relative flex flex-col items-center justify-center glass-pill border border-[var(--accent)] hover:bg-white/10 transition-all group py-3`;
                pad.style.boxShadow = `0 0 12px var(--accent-glow)`;
            } else {
                pad.className = `dj-pad group relative flex flex-col items-center justify-center glass-pill border border-white/5 hover:bg-white/10 hover:border-[var(--accent)] transition-all group py-3`;
            }

            const loopIndicator = isActive ? `<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} animate-pulse"></div>` : '';
            const activeClass = isActive ? 'dj-pad-active' : '';

            pad.innerHTML = `
                ${loopIndicator}
                <span class="dj-pad-icon text-2xl mb-1">${sound.icon}</span>
                <span class="dj-pad-label text-[10px] font-bold uppercase tracking-wide ${activeClass}">${sound.label}</span>
                ${canLoop ? `<span class="dj-pad-loop text-[8px] mt-0.5">● LOOP</span>` : ''}
            `;

            pad.addEventListener('click', () => handlePadClick(id, canLoop, category));

            pad.addEventListener('touchstart', () => {
                pad.classList.add('scale-95');
            }, { passive: true });
            pad.addEventListener('touchend', () => {
                pad.classList.remove('scale-95');
            }, { passive: true });

            grid.appendChild(pad);
        });
    });

    console.log('[DJ Pads] Rendered all categories');
}

// NEW: Update Show All button state
updateShowAllButton = function () {
    const btn = document.getElementById('djShowAllCategoriesBtn');
    if (!btn) return;

    if (djShowAllCategories) {
        btn.className = 'px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-[var(--accent)]/40 text-[var(--accent)] border border-[var(--accent)]/50 whitespace-nowrap hover:bg-[var(--accent)]/50 transition-all flex items-center gap-1 shrink-0';
        btn.title = 'Show Single Category';
    } else {
        // Inactive: lighter accent border/text
        btn.className = 'px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 whitespace-nowrap hover:bg-[var(--accent)]/30 transition-all flex items-center gap-1 shrink-0';
        btn.title = 'Show All Categories';
    }
}

// NEW: Update Stop All button state (Light Mode Aware)
function updateStopAllButton() {
    const stopAllBtn = document.getElementById('djStopAll');
    if (!stopAllBtn) return;

    // Check loop count
    const hasLoops = getActiveLoopCount() > 0;

    // Check for Light Mode
    const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash', 'light'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    if (hasLoops) {
        stopAllBtn.classList.add('dj-playing'); // For animation/display logic

        if (isLight) {
            // Light Mode Active: Red Tint Style
            stopAllBtn.className = 'px-2 py-1 rounded text-[9px] font-bold bg-red-500/20 text-red-500 border border-red-500/50 shadow-sm dj-playing order-last ml-auto';
        } else {
            // Dark Mode Active: Red Glow
            stopAllBtn.className = 'px-2 py-1 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 dj-playing order-last ml-auto';
        }
    } else {
        stopAllBtn.classList.remove('dj-playing');

        if (isLight) {
            // Light Mode Inactive: Hidden or Neutral
            // Usually Stop All is hidden when no loops?
            // CSS handles .dj-playing visibility? 
            // If JS controls class completely, we need to ensure opacity/visibility.
            // Usually defined in style.css: #djStopAll { opacity: 0; pointer-events: none; } .dj-playing { opacity: 1; }
            // Only reset class name to base state
            stopAllBtn.className = 'px-2 py-1 rounded text-[9px] font-bold bg-transparent text-[var(--text-muted)] border border-transparent order-last ml-auto opacity-0 pointer-events-none transition-opacity duration-300';
        } else {
            stopAllBtn.className = 'px-2 py-1 rounded text-[9px] font-bold bg-white/5 text-[var(--text-muted)] border border-white/10 opacity-0 pointer-events-none transition-opacity duration-300 order-last ml-auto';
        }
    }
}

// --- INFO MODAL SYSTEM (Rich Tooltips) ---
const INFO_CONTENT = {
    brain_waves: {
        title: "🧠 Brain Wave Frequencies",
        emoji: "🌊",
        content: `
            <div class="space-y-4">
                <p class="text-white/80 leading-relaxed font-sans">
                    Entrain your brain to specific states of consciousness using precise frequency differences.
                </p>
                <div class="space-y-2 font-sans">
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div class="flex justify-between font-bold text-[var(--accent)] mb-1">
                            <span>Delta (0.5-4Hz)</span>
                            <span>💤 Deep Sleep</span>
                        </div>
                        <div class="text-xs text-white/60">Restorative sleep, dreamless state, and healing.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div class="flex justify-between font-bold text-[var(--accent)] mb-1">
                            <span>Theta (4-8Hz)</span>
                            <span>🧘 Meditation</span>
                        </div>
                        <div class="text-xs text-white/60">Deep relaxation, vivid imagery, and creativity.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div class="flex justify-between font-bold text-[var(--accent)] mb-1">
                            <span>Alpha (8-14Hz)</span>
                            <span>😌 Relaxation</span>
                        </div>
                        <div class="text-xs text-white/60">Calm focus, stress reduction, and light meditation.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div class="flex justify-between font-bold text-[var(--accent)] mb-1">
                            <span>Mu (9-11Hz)</span>
                            <span>🧠 Body Sync</span>
                        </div>
                        <div class="text-xs text-white/60">Sensorimotor rhythm, physical calm with mental alertness.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div class="flex justify-between font-bold text-[var(--accent)] mb-1">
                            <span>Beta (14-30Hz)</span>
                            <span>🎯 Active Focus</span>
                        </div>
                        <div class="text-xs text-white/60">Problem solving, high-level cognition, and active concentration.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div class="flex justify-between font-bold text-[var(--accent)] mb-1">
                            <span>Gamma (30-100Hz)</span>
                            <span>⚡ Peak Performance</span>
                        </div>
                        <div class="text-xs text-white/60">Universal consciousness, memory recall, and hyper-awareness.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-amber-500/30">
                        <div class="flex justify-between font-bold text-amber-400 mb-1">
                            <span>Hyper-Gamma (40-100Hz)</span>
                            <span>🚀 Advanced</span>
                        </div>
                        <div class="text-xs text-white/60">High-intensity transcendental states. Use with caution.</div>
                    </div>
                </div>
            </div>
        `
    },
    healing: {
        title: "✨ Solfeggio Healing Frequencies",
        emoji: "🕊️",
        content: `
            <div class="space-y-4">
                <p class="text-white/80 leading-relaxed font-sans">
                    Ancient 6-tone scale frequencies believed to balance energy and promote healing.
                </p>
                <div class="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2 font-sans">
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">174Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Pain Relief</span><span class="text-[10px] text-white/50">Natural anaesthetic, reduces pain</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">285Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Tissue Healing</span><span class="text-[10px] text-white/50">Restores tissues and organs</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">396Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Liberation</span><span class="text-[10px] text-white/50">Releases guilt and fear</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">417Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Change</span><span class="text-[10px] text-white/50">Undoing situations, facilitating change</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">432Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Nature</span><span class="text-[10px] text-white/50">Universal harmony, calming</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">528Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Miracles</span><span class="text-[10px] text-white/50">Transformation and DNA repair</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">639Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Connection</span><span class="text-[10px] text-white/50">Harmonizing relationships</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">741Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Intuition</span><span class="text-[10px] text-white/50">Awakening intuition, expression</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">852Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Spirit</span><span class="text-[10px] text-white/50">Returning to spiritual order</span></div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="font-mono font-bold text-[var(--accent)] w-12 text-right">963Hz</span>
                        <div class="flex flex-col"><span class="font-bold text-white/90">Oneness</span><span class="text-[10px] text-white/50">Divine consciousness</span></div>
                    </div>
                </div>
            </div>
        `
    },
    ambience: {
        title: "🌌 Immersive Ambience",
        emoji: "🎧",
        content: `
            <div class="space-y-4">
                <p class="text-white/80 leading-relaxed font-sans">
                    Curated soundscapes to mask noise and deepen immersion.
                </p>
                <div class="grid grid-cols-2 gap-2 text-sm font-sans">
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🌧️ Lofi Rain</div>
                        <div class="text-[10px] text-white/50">Chill beats with gentle rain.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🌙 Night</div>
                        <div class="text-[10px] text-white/50">Crickets and peaceful silence.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">⚔️ Epic</div>
                        <div class="text-[10px] text-white/50">Dramatic cinematic focus.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🌊 Ocean</div>
                        <div class="text-[10px] text-white/50">Rhythmic waves drift.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">⛈️ Storm</div>
                        <div class="text-[10px] text-white/50">Intense thunder for deep work.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🔔 Temple</div>
                        <div class="text-[10px] text-white/50">Spiritual bowls and chants.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🔥 Fireplace</div>
                        <div class="text-[10px] text-white/50">Warm crackling fire.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🌲 Forest</div>
                        <div class="text-[10px] text-white/50">Birds and wind in trees.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">🌌 Cosmic</div>
                        <div class="text-[10px] text-white/50">Deep space drones.</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div class="font-bold text-[var(--accent)]">☀️ Morning</div>
                        <div class="text-[10px] text-white/50">Gentle sunrise vibes.</div>
                    </div>
                </div>
            </div>
        `,
    },
    atmosphere: {
        title: "Atmosphere",
        emoji: "🌫️",
        content: `
            <div class="space-y-4 text-white/80 font-sans">
                <p>
                    Immersive soundscapes designed to ground your practice. Layer these textures—rain, forest, fire, or cosmic drones—underneath binaural beats to mask distractions.
                </p>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                    <h4 class="font-bold text-[var(--accent)] mb-1">How to Use:</h4>
                    <ul class="list-disc list-inside text-sm space-y-1 text-white/70">
                        <li>Use the <strong>Master Slider</strong> to control overall ambience volume.</li>
                        <li>Mix multiple sounds (e.g., Rain + Fire) for a custom environment.</li>
                    </ul>
                </div>
            </div>
        `
    },
    djpads: {
        title: "DJ Studio",
        emoji: "🎧",
        content: `
            <div class="space-y-4 text-white/80 font-sans">
                <p>
                    A live performance interface for creating dynamic soundscapes. Use the pads to trigger one-shot effects, loops, and textures in real-time.
                </p>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="bg-white/5 p-3 rounded-lg">
                        <span class="font-bold text-[var(--accent)] block mb-1">One-Shot Mode</span>
                        Plays the sound once. Good for hits and accents.
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg">
                        <span class="font-bold text-[var(--accent)] block mb-1">Loop Mode</span>
                        Repeats the sound continuously. Good for rhythmic layers.
                    </div>
                </div>
            </div>
        `
    },
    stories: {
        title: "Sleep Stories",
        emoji: "📚",
        content: `
            <div class="space-y-4 text-white/80 font-sans">
                <p>
                    Narrated journeys designed to disengage your active mind and drift you into deep sleep. Each story is mixed with Delta waves for maximum relaxation.
                </p>
                <p class="text-sm border-l-2 border-purple-500 pl-3">
                    Select a story to begin. Use the volume slider to balance the voice against any background layers you've added.
                </p>
            </div>
        `
    },
    journeys: {
        title: "Journeys",
        emoji: "🚀",
        content: `
            <div class="space-y-4 text-white/80 font-sans">
                <p>
                    Frequency sweeps that gradually transition your state of mind.
                </p>
                <div class="space-y-2 font-sans text-sm">
                   <div class="bg-white/5 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="font-bold text-[var(--accent)]">🌅 Wake Up</span>
                            <span class="text-[10px] text-white/50">5 mins</span>
                        </div>
                        <span class="text-xs text-white/60">Theta → Beta (Energize)</span>
                   </div>
                   <div class="bg-white/5 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="font-bold text-[var(--accent)]">🌙 Wind Down</span>
                            <span class="text-[10px] text-white/50">10 mins</span>
                        </div>
                        <span class="text-xs text-white/60">Beta → Alpha (Relax)</span>
                   </div>
                   <div class="bg-white/5 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="font-bold text-[var(--accent)]">💤 Deep Sleep</span>
                            <span class="text-[10px] text-white/50">20 mins</span>
                        </div>
                        <span class="text-xs text-white/60">Alpha → Delta (Sleep)</span>
                   </div>
                   <div class="bg-white/5 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="font-bold text-[var(--accent)]">🎯 Focus Builder</span>
                            <span class="text-[10px] text-white/50">5 mins</span>
                        </div>
                        <span class="text-xs text-white/60">Alpha → Beta (Focus)</span>
                   </div>
                   <div class="bg-white/5 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="font-bold text-[var(--accent)]">🧘 Meditation</span>
                            <span class="text-[10px] text-white/50">10 mins</span>
                        </div>
                        <span class="text-xs text-white/60">Alpha → Theta (Deep Dive)</span>
                   </div>
                </div>
            </div>
        `
    },
    uploads: {
        title: "Upload Audio",
        emoji: "📤",
        content: `
            <div class="space-y-4 text-white/80 font-sans">
                <p>
                    Enhance your session by layering your own audio files. Perfect for guided meditations, audiobooks, or your favorite music playlist.
                </p>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
                    <span class="font-bold text-[var(--accent)]">Supported Formats:</span> MP3, WAV, OGG.<br>
                    Files are processed locally in your browser for privacy.
                </div>
            </div>
        `
    },
    classical: {
        title: "Music Library",
        emoji: "🎻",
        content: `
            <div class="space-y-4 text-white/80 font-sans">
                <p>
                    A curated collection of timeless masterpieces (Bach, Satie, Debussy) tuned to harmonize with our frequency generators.
                </p>
                <p class="text-sm">
                    These pieces are selected for their calming tempo and structure, ideal for study, focus, or relaxation.
                </p>
            </div>
        `
    }
};

// --- GALAXY SUN STYLE TOGGLE ---
let currentGalaxySunStyle = 'sun'; // 'sun' (flat geometric) or 'sun2' (tribal cone)
window.toggleGalaxySun = function () {
    currentGalaxySunStyle = currentGalaxySunStyle === 'sun' ? 'sun2' : 'sun';
    const viz = getVisualizer();
    if (viz && viz.setGalaxySunStyle) {
        viz.setGalaxySunStyle(currentGalaxySunStyle);
    }
    const label = currentGalaxySunStyle === 'sun' ? 'Sun ☀️' : 'Tribal Sun 🌞';
    showToast(`Galaxy Sun: ${label}`, 'info');
};

// --- MATRIX SETTINGS CONTROL (UNIFIED) ---
window.toggleMatrixSettings = function (btn) {
    const panel = document.getElementById('matrixSettingsPanel');
    if (!panel) return;

    // Toggle state
    if (typeof state.matrixPanelOpen === 'undefined') state.matrixPanelOpen = false;
    state.matrixPanelOpen = !state.matrixPanelOpen;

    // Update UI
    if (state.matrixPanelOpen) {
        panel.classList.remove('hidden');
        panel.classList.add('flex', 'items-center');

        // Ensure panel's toggle matches current rainbow state
        const viz = getVisualizer();
        const rainbowToggle = document.getElementById('matrixRainbowToggle');
        if (viz && viz.matrixMaterial && viz.matrixMaterial.uniforms && rainbowToggle) {
            rainbowToggle.checked = (viz.matrixMaterial.uniforms.uRainbow.value > 0.5);
            // Also update labels
            if (window.updateRainbowLabels) window.updateRainbowLabels();
        }
    } else {
        panel.classList.add('hidden');
        panel.classList.remove('flex', 'items-center');
    }
};

window.showInfoModal = function (key) {
    const data = INFO_CONTENT[key];
    if (!data) return;

    // Check if modal already exists
    let modal = document.getElementById('infoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'infoModal';
        modal.className = 'fixed inset-0 z-[9999] flex justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeInfoModal()"></div>
            <!-- UPDATED: balanced padding, max-h-full of safe area, max-w-md -->
            <div class="relative w-[95%] max-w-md my-auto mx-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl transform scale-95 transition-all duration-300 flex flex-col overflow-hidden max-h-[85%] glass-card" id="infoModalContent">
                <!-- Header -->
                <div class="bg-white/5 border-b border-white/5 p-5 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="text-xl" id="infoEmoji">✨</span>
                        <h3 class="text-lg font-bold text-white tracking-tight font-sans" id="infoTitle">Info</h3>
                    </div>
                    <button onclick="closeInfoModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <!-- Content -->
                <div class="p-6 overflow-y-auto custom-scrollbar" id="infoBody">
                    <!-- Dynamic Content -->
                </div>
                <!-- Footer -->
                <div class="p-5 border-t border-white/5 bg-black/20 shrink-0">
                    <button onclick="closeInfoModal()" class="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-main)] font-bold text-base hover:opacity-90 transition-all shadow-lg">
                        Got it
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // ENFORCE UPDATED CLASSES IF MODAL ALREADY EXISTS
        // Use z-[9999] (high z-index) and pb-32 (bottom padding for footer)
        // ENFORCE UPDATED CLASSES IF MODAL ALREADY EXISTS
        // UPDATED: Removed pb-20 for balanced centering
        modal.className = 'fixed inset-0 z-[9999] flex justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300';

        // Ensure content container also has updated sizing
        const content = modal.querySelector('#infoModalContent');
        if (content) {
            // UPDATED: max-w-md and max-h-full (fits within safe area defined by adjustModalLayout)
            content.className = 'relative w-[95%] max-w-md my-auto mx-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl transform scale-95 transition-all duration-300 flex flex-col overflow-hidden max-h-[85%] glass-card';
        }
    }

    // Populate Data
    document.getElementById('infoEmoji').textContent = data.emoji;
    document.getElementById('infoTitle').textContent = data.title;
    document.getElementById('infoBody').innerHTML = data.content;

    // Open Animation
    requestAnimationFrame(() => {
        // First Apply Layout Constraints to set size/pos
        adjustModalLayout(modal);

        // Then animate in
        modal.classList.remove('opacity-0', 'pointer-events-none');
        const content = modal.querySelector('#infoModalContent');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    });
};

window.closeInfoModal = function () {
    const modal = document.getElementById('infoModal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    // Reset layout styles to defaults to avoid glitches on next open if state changes
    setTimeout(() => {
        modal.style.top = '';
        modal.style.bottom = '';
        modal.style.left = '';
        modal.style.right = '';
    }, 300);
}


// --- LAYOUT AWARENESS HELPER ---
function getSafeArea() {
    const isMobile = window.innerWidth < 768;

    // Left Panel
    const leftPanel = document.getElementById('leftPanel');
    const leftActive = leftPanel && !leftPanel.classList.contains('-translate-x-full');
    const leftW = (!isMobile && leftActive) ? leftPanel.getBoundingClientRect().width : 0;

    // Right Panel
    const rightPanel = document.getElementById('rightPanel');
    const rightActive = rightPanel && !rightPanel.classList.contains('translate-x-full');
    const rightW = (!isMobile && rightActive) ? rightPanel.getBoundingClientRect().width : 0;

    // Header/Footer elements
    // Note: Header/Footer are fixed z-100. We want to avoid them.
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const topH = header ? header.offsetHeight : 0;
    const bottomH = footer ? footer.offsetHeight : 0;

    return { top: topH, right: rightW, bottom: bottomH, left: leftW };
}

export function adjustMatrixPanelPosition() {
    const panel = document.getElementById('matrixSettingsPanel');
    if (!panel || panel.classList.contains('hidden')) return;

    // Calculate safe area (mainly right sidebar)
    const safe = getSafeArea();

    // Base position (from CSS): right-8 (32px)
    const baseRight = 32;
    // If sidebar is open, shift by sidebar width
    const targetRight = baseRight + safe.right;

    // Apply
    panel.style.right = `${targetRight}px`;

    // Clear legacy centering styles if present
    panel.style.top = '';
    panel.style.left = '';
    panel.style.transform = '';
}

function adjustModalLayout(modal) {
    if (!modal) return;
    // Profile Modal handles its own layout (bottom sheet)
    if (modal.id === 'profileModal') return;

    const safe = getSafeArea();

    // Apply safe area constraints correctly for vertical centering
    // We use top/bottom for general boundaries, but for large content, 
    // we must ensure the container height allows for flex centering.
    modal.style.top = `${safe.top}px`;

    // For large footers (e.g. 410px), we limit the safe bottom to a reasonable value 
    // for CENTERED modals to avoid pushing them too far up.
    const maxBottomCushion = 100;
    const effectiveBottom = Math.min(safe.bottom, maxBottomCushion);
    modal.style.bottom = `${effectiveBottom}px`;

    modal.style.left = `${safe.left}px`;
    modal.style.right = `${safe.right}px`;

    // Ensure we override tailwind 'inset-0' if necessary (inline styles usually win)
    // We also might want to reduce padding if the area is small, but flex center handles that.

    // Explicitly set position to absolute/fixed behavior relative to the window
    modal.style.position = 'fixed'; // Should already be fixed class, but ensure it.

    // If safe area is very small (e.g. mobile landscape), maybe force some mins?
    // For now, trust the flex centering.
}

// Global listener for window resize to adjust any open modals
window.addEventListener('resize', () => {
    // Info Modal
    const infoModal = document.getElementById('infoModal');
    if (infoModal && !infoModal.classList.contains('opacity-0')) {
        adjustModalLayout(infoModal);
    }

    // Theme/Profile Modals (contain class 'modal' and not hidden)
    // Theme/Profile Modals (contain class 'modal' and not hidden)
    document.querySelectorAll('.modal').forEach(m => {
        if (!m.classList.contains('hidden')) {
            adjustModalLayout(m);
        }
    });

    // Matrix Panel
    adjustMatrixPanelPosition();
});

// Hook into existing modal opens if possible, or exposing the adjuster
window.adjustActiveModal = adjustModalLayout;


// --- MATRIX SETTINGS CONTROL ---
window.toggleMatrixSettings = function (toggleBtn) {
    if (!els.matrixSettingsPanel) {
        els.matrixSettingsPanel = document.getElementById('matrixSettingsPanel');
    }

    // Toggle state
    if (typeof state.matrixPanelOpen === 'undefined') state.matrixPanelOpen = true;
    state.matrixPanelOpen = !state.matrixPanelOpen;

    // Update UI
    if (state.matrixPanelOpen) {
        if (els.matrixSettingsPanel) {
            els.matrixSettingsPanel.classList.remove('hidden');
            els.matrixSettingsPanel.classList.add('flex', 'flex-col');
            els.matrixSettingsPanel.style.display = 'flex';
            els.matrixSettingsPanel.style.visibility = 'visible';
            // Trigger dynamic positioning
            adjustMatrixPanelPosition();
        }
    } else {
        if (els.matrixSettingsPanel) {
            els.matrixSettingsPanel.classList.add('hidden');
            els.matrixSettingsPanel.classList.remove('flex', 'flex-col');
        }
    }
};

function setupMatrixControls() {
    console.log('[Controls] setupMatrixControls (Main) CALLED');
    const closeBtn = document.getElementById('matrixCloseBtn');
    const resetBtn = document.getElementById('matrixResetBtn');

    if (closeBtn) {
        // Clone to replace any existing listeners to be safe, or just add new one
        // A simple addEventListener is fine usually.
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.matrixPanelOpen = false;
            const panel = document.getElementById('matrixSettingsPanel');
            if (panel) {
                panel.classList.add('hidden');
                panel.classList.remove('flex', 'items-center');
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Reset logic
            const viz = getVisualizer();
            if (viz) {
                viz.setMatrixColor('#00FF41');
                viz.setMatrixRainbow(false);
                viz.setMatrixSpeed(1.0);
                viz.setMatrixLength(1.0);
                viz.setMatrixAngle(0);

                // Reset sliders/inputs if they exist
                const colorPicker = document.getElementById('matrixColorPicker');
                if (colorPicker) colorPicker.value = '#00FF41';

                const rainbowToggle = document.getElementById('matrixRainbowToggle');
                if (rainbowToggle) rainbowToggle.checked = false;

                const speedSlider = document.getElementById('matrixSpeedSlider');
                if (speedSlider) { speedSlider.value = 1.0; document.getElementById('matrixSpeedVal').textContent = '1.0x'; }

                const lengthSlider = document.getElementById('matrixLengthSlider');
                if (lengthSlider) { lengthSlider.value = 1.0; document.getElementById('matrixLengthVal').textContent = '1.0x'; }

                const angleSlider = document.getElementById('matrixAngleSlider');
                if (angleSlider) { angleSlider.value = 0; document.getElementById('matrixAngleVal').textContent = '0°'; }
            }
        });
    }

    // --- NEW: Color & Rainbow Listeners ---
    const updateSwatch = (hex) => {
        const swatch = document.getElementById('matrixColorSwatch');
        if (swatch) swatch.style.backgroundColor = hex;
    };

    const colorPicker = document.getElementById('matrixColorPicker');
    if (colorPicker) {
        // Init sync
        const swatch = document.getElementById('matrixColorSwatch');
        if (swatch) swatch.style.backgroundColor = colorPicker.value;

        colorPicker.addEventListener('input', (e) => {
            const val = e.target.value;
            updateSwatch(val);

            const viz = getVisualizer();
            if (viz) {
                if (viz.setMatrixColor) viz.setMatrixColor(val);
                localStorage.setItem('mindwave_matrix_color', val);

                // Switch off rainbow mode automatically if color is changed
                const rainbowToggle = document.getElementById('matrixRainbowToggle');
                if (rainbowToggle && rainbowToggle.checked) {
                    rainbowToggle.checked = false;
                    localStorage.setItem('mindwave_matrix_rainbow', 'false');
                    if (viz.setMatrixRainbow) viz.setMatrixRainbow(false);
                    setupUI.updateRainbowLabels();
                }
            }
        });
    }

    // --- RAINBOW LABELS HELPER ---
    setupUI.updateRainbowLabels = () => {
        const rainbowToggle = document.getElementById('matrixRainbowToggle');
        if (!rainbowToggle) return;
        const labelRGB = document.getElementById('labelRGB');
        const labelRainbow = document.getElementById('labelRainbow');
        if (rainbowToggle.checked) {
            // Rainbow mode active - highlight RAINBOW teal
            if (labelRGB) labelRGB.className = 'text-[9px] font-mono uppercase tracking-widest transition-colors text-[var(--text-muted)]';
            if (labelRainbow) labelRainbow.className = 'text-[9px] font-mono uppercase tracking-widest transition-colors text-[var(--accent)] font-bold';
        } else {
            // RGB mode active - highlight RGB teal
            if (labelRGB) labelRGB.className = 'text-[9px] font-mono uppercase tracking-widest transition-colors text-[var(--accent)] font-bold';
            if (labelRainbow) labelRainbow.className = 'text-[9px] font-mono uppercase tracking-widest transition-colors text-[var(--text-muted)]';
        }
    };

    const rainbowToggle = document.getElementById('matrixRainbowToggle');
    const labelRGB = document.getElementById('labelRGB');
    const labelRainbow = document.getElementById('labelRainbow');

    if (rainbowToggle) {
        // Update on change
        rainbowToggle.addEventListener('change', (e) => {
            const viz = getVisualizer();
            if (viz && viz.setMatrixRainbow) {
                viz.setMatrixRainbow(e.target.checked);
            }
            localStorage.setItem('mindwave_matrix_rainbow', e.target.checked ? 'true' : 'false');
            setupUI.updateRainbowLabels();
        });

        // Make labels interactive toggles
        if (labelRGB) {
            labelRGB.addEventListener('click', () => {
                if (rainbowToggle.checked) {
                    rainbowToggle.checked = false;
                    const viz = getVisualizer();
                    if (viz && viz.setMatrixRainbow) viz.setMatrixRainbow(false);
                    localStorage.setItem('mindwave_matrix_rainbow', 'false');
                    setupUI.updateRainbowLabels();
                }
            });
        }
        if (labelRainbow) {
            labelRainbow.addEventListener('click', () => {
                if (!rainbowToggle.checked) {
                    rainbowToggle.checked = true;
                    const viz = getVisualizer();
                    if (viz && viz.setMatrixRainbow) viz.setMatrixRainbow(true);
                    localStorage.setItem('mindwave_matrix_rainbow', 'true');
                    setupUI.updateRainbowLabels();
                }
            });
        }

        // Set initial state
        setupUI.updateRainbowLabels();
    }

    // --- NEW: Slider Listeners ---
    const speedSlider = document.getElementById('matrixSpeedSlider');
    const speedVal = document.getElementById('matrixSpeedVal');
    if (speedSlider && speedVal) {
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            speedVal.textContent = val.toFixed(1) + 'x';
            const viz = getVisualizer();
            if (viz && viz.setMatrixSpeed) viz.setMatrixSpeed(val);
        });
    }

    const lengthSlider = document.getElementById('matrixLengthSlider');
    const lengthVal = document.getElementById('matrixLengthVal');
    if (lengthSlider && lengthVal) {
        lengthSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lengthVal.textContent = val.toFixed(1) + 'x';
            const viz = getVisualizer();
            if (viz && viz.setMatrixLength) viz.setMatrixLength(val);
        });
    }

    const angleSlider = document.getElementById('matrixAngleSlider');
    const angleVal = document.getElementById('matrixAngleVal');
    if (angleSlider && angleVal) {
        angleSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            angleVal.textContent = val + '°';
            const viz = getVisualizer();
            if (viz && viz.setMatrixAngle) viz.setMatrixAngle(val);
        });
    }

    const colorPicker = document.getElementById('matrixColorPicker');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            const viz = getVisualizer();
            if (viz && viz.setMatrixColor) {
                viz.setMatrixColor(e.target.value);
            }
            // Sync preview dot
            const preview = document.getElementById('matrixColorPreview');
            if (preview) {
                preview.style.backgroundColor = e.target.value;
                preview.style.color = e.target.value;
                preview.style.boxShadow = `0 0 10px ${e.target.value}`;
            }
        });
    }

    // === NEW MATRIX MODE CONTROLS (Radial/Segmented) ===
    const modeContainer = document.getElementById('matrixModeContainer');
    const customTextInput = document.getElementById('matrixCustomTextInput');
    const textInput = document.getElementById('matrixTextInput');

    if (modeContainer) {
        modeContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.matrix-mode-btn');
            if (!btn) return;

            // UI Update
            document.querySelectorAll('.matrix-mode-btn').forEach(b => {
                b.classList.remove('bg-[var(--accent)]', 'text-black', 'shadow-lg');
                b.classList.add('text-white/50', 'hover:bg-white/10');
            });
            btn.classList.remove('text-white/50', 'hover:bg-white/10');
            btn.classList.add('bg-[var(--accent)]', 'text-black', 'shadow-lg');

            const mode = btn.dataset.value;

            // Show/Hide Input based on mode
            if (mode === 'mindwave') {
                if (customTextInput) customTextInput.classList.remove('hidden');
                setTimeout(() => textInput && textInput.focus(), 100);
            } else {
                if (customTextInput) customTextInput.classList.add('hidden');
            }
        });

        // Focus text input when switching to custom
        if (mode === 'custom' && textInput) {
            textInput.focus();
        }

        // Sync legacy checkbox
        if (modeToggle) modeToggle.checked = (mode !== 'random');

        // Save mode
        localStorage.setItem('mindwave_matrix_mode', mode);
    };

    // Wire up mode buttons
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = btn.dataset.matrixMode;
            setActiveMode(mode);

            const viz = getVisualizer();
            if (viz && viz.setMatrixLogicMode) {
                if (mode === 'random') {
                    viz.setMatrixLogicMode('random', '');
                } else if (mode === 'mindwave') {
                    viz.setMatrixLogicMode('mindwave', 'WELCOME');
                } else if (mode === 'custom') {
                    const customText = (textInput && textInput.value) ? textInput.value.toUpperCase() : 'WELCOME';
                    if (customText.length > 0) {
                        viz.setMatrixLogicMode('custom', customText);
                    } else {
                        viz.setMatrixLogicMode('mindwave', 'WELCOME');
                    }
                }
            }
        });
    });

    // Text input: live update custom text
    if (textInput) {
        // Simple Debounce for Autosave
        let saveTimeout;
        const debouncedSave = (text) => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                console.log('[Controls] Saving Matrix Text Preference:', text);
                saveUserPreferences({ defaultMatrixText: text });
            }, 1000);
        };

        textInput.addEventListener('input', (e) => {
            const text = e.target.value.toUpperCase();

            // Auto-switch to custom mode if typing
            if (currentMatrixMode !== 'custom') {
                setActiveMode('custom');
            }

            const viz = getVisualizer();
            if (viz && viz.setMatrixLogicMode) {
                if (text.length > 0) {
                    viz.setMatrixLogicMode('custom', text);
                } else {
                    viz.setMatrixLogicMode('mindwave', 'WELCOME');
                }
            }

            // Check active mode from button state - Default to mindwave if unsure
            const activeBtn = document.querySelector('.matrix-mode-btn.bg-\\[var\\(--accent\\)\\]');
            const mode = activeBtn ? activeBtn.dataset.value : 'mindwave';

            // Update if in MindWave mode
            if (mode === 'mindwave' && viz && viz.setMatrixLogicMode) {
                viz.setMatrixLogicMode('mindwave', text);
            }

            // Trigger Autosave
            debouncedSave(text);
        });
    }

    // === Initialize State on Load ===
    let savedMode = localStorage.getItem('mindwave_matrix_mode') || 'mindwave';
    let savedText = localStorage.getItem('mindwave_matrix_text');
    const savedRainbow = localStorage.getItem('mindwave_matrix_rainbow');
    const savedColor = localStorage.getItem('mindwave_matrix_color');
    const MATRIX_DEFAULT_TEXT = 'WELCOME';

    // Sanitize saved text to prevent "WELCOMEFINAL..." issue
    if (savedText && (savedText.includes('WELCOMEFINAL') || savedText.includes('TEJETSKI'))) {
        console.log('[Matrix] sanitizing problematic text');
        savedText = MATRIX_DEFAULT_TEXT;
        localStorage.setItem('mindwave_matrix_text', MATRIX_DEFAULT_TEXT);
    }

    if (textInput) {
        // Only use saved text if user explicitly set it and it's not the problematic string
        if (savedText && savedText.length > 0) {
            textInput.value = savedText;
        } else {
            textInput.value = MATRIX_DEFAULT_TEXT;
            localStorage.setItem('mindwave_matrix_text', MATRIX_DEFAULT_TEXT);
        }
    }

    if (rainbowToggle) {
        // Always load in rainbow mode per user request
        rainbowToggle.checked = true;
        setupUI.updateRainbowLabels();
        const viz = getVisualizer();
        if (viz && viz.setMatrixRainbow) viz.setMatrixRainbow(true);
    }

    if (colorPicker && savedColor) {
        colorPicker.value = savedColor;
        updateSwatch(savedColor);
        const viz = getVisualizer();
        if (viz && viz.setMatrixColor) viz.setMatrixColor(savedColor);
    }

    // Set initial mode and sync visualizer
    setActiveMode(savedMode);

    // Matrix sub-mode logic is also triggered in applyVisualDefaults, 
    // but we ensure it's set here for immediate UI consistency.
    const syncMatrixWithVisualizer = () => {
        const viz = getVisualizer();
        if (viz && viz.setMatrixLogicMode) {
            if (savedMode === 'random') {
                viz.setMatrixLogicMode('random', '');
            } else if (savedMode === 'mindwave') {
                viz.setMatrixLogicMode('mindwave', 'WELCOME');
            } else if (savedMode === 'custom') {
                const text = (textInput && textInput.value) ? textInput.value.toUpperCase() : 'WELCOME';
                viz.setMatrixLogicMode('custom', text);
            }
            console.log(`[Controls] Initial Matrix mode synced: ${savedMode}`);
        }
    };

    // Try immediately and also via applyVisualDefaults trigger
    syncMatrixWithVisualizer();
    window.addEventListener('visualizerReady', syncMatrixWithVisualizer);
}

// --- GHOST MODE (Idle UI Fade-out) ---

function setupIdleTimer() {
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    activityEvents.forEach(evt => {
        window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // Initial start
    resetIdleTimer();
}

function resetIdleTimer() {
    if (state.idleTimeout) clearTimeout(state.idleTimeout);

    // Always show UI on activity
    showUI();

    // If locked, don't set the fade-out timeout
    if (state.uiLocked) return;

    state.idleTimeout = setTimeout(() => {
        hideUI();
    }, 8000); // 8 seconds
}

function showUI() {
    const targets = document.querySelectorAll('.ui-fade-target');
    targets.forEach(el => {
        el.classList.remove('idle-hidden');
    });
    // Fade OUT logo when UI is visible (Keep faint watermark)
    const logoImg = document.querySelector('#leftPanel img');
    if (logoImg) logoImg.style.opacity = '1'; // Keep solid since it's a brand asset now
    import('../visuals/visualizer_nuclear_v4.js').then(m => {
        if (m.setVisualLogoOpacity) m.setVisualLogoOpacity(0.1);
    });
}

function hideUI() {
    // Check if we should actually hide (extra safety)
    if (state.uiLocked) return;

    // Don't hide if a modal is open
    if (document.querySelector('.modal.active')) return;

    const targets = document.querySelectorAll('.ui-fade-target');
    targets.forEach(el => {
        el.classList.add('idle-hidden');
    });
    // Fade IN logo when UI is hidden (Ghost Mode watermark)
    import('../visuals/visualizer_nuclear_v4.js').then(m => {
        if (m.setVisualLogoOpacity) m.setVisualLogoOpacity(0.5); // 50% opacity
    });
}

function updateLockUI() {
    if (!els.lockIcon || !els.unlockIcon) return;

    if (state.uiLocked) {
        // LOCKED STATE (UI is fixed visible)
        els.lockIcon.classList.remove('hidden');
        els.unlockIcon.classList.add('hidden');
        if (els.lockUIBtn) {
            els.lockUIBtn.title = "Unlock Menus (Enable auto-fade)";
            els.lockUIBtn.style.color = ''; // Let CSS handle colors
            els.lockUIBtn.classList.add('toggle-active');
            els.lockUIBtn.classList.remove('hover:bg-[var(--accent)]/20');
        }
        // Ensure UI is visible
        showUI();
    } else {
        // UNLOCKED STATE (Auto-fade enabled)
        els.lockIcon.classList.add('hidden');
        els.unlockIcon.classList.remove('hidden');
        if (els.lockUIBtn) {
            els.lockUIBtn.title = "Lock Menus (Keep visible)";
            els.lockUIBtn.style.color = ''; // Let CSS handle colors
            els.lockUIBtn.classList.remove('toggle-active');
            els.lockUIBtn.classList.add('hover:bg-[var(--accent)]/20');
        }
        // Start timer if not already running
        resetIdleTimer();
    }
}




