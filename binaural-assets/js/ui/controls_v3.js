import { state, els, THEMES, SOUNDSCAPES, PRESET_COMBOS } from '../state.js';
import { startAudio, stopAudio, updateFrequencies, updateBeatsVolume, updateMasterVolume, updateMasterBalance, updateAtmosMaster, updateSoundscape, registerUICallback, fadeIn, fadeOut, cancelFadeOut, cancelStopAudio, resetAllSoundscapes, isVolumeHigh, playCompletionChime, setAudioMode, getAudioMode, startSweep, stopSweep, startSweepPreset, isSweepActive, isAudioPlaying, SWEEP_PRESETS } from '../audio/engine.js';
import { initVisualizer, toggleVisual, setVisualSpeed, setVisualColor, pauseVisuals, resumeVisuals, getVisualizer, isVisualsPaused } from '../visuals/visualizer_nuclear_v3.js?v=FIX_CUSTOM_FINAL';
import { startRecording, stopRecording, startExport, cancelExport, updateExportPreview } from '../export/recorder.js';
import { openAuthModal, renderLibraryList } from './auth-controller.js';
import { saveMixToCloud } from '../services/firebase.js';
import { auth, db, registerAuthCallback } from '../services/firebase.js';
import { startSession, stopSession, pauseSession, resumeSession, isSessionPaused, formatTimeRemaining, getProgress, isSessionActive, DURATION_PRESETS } from '../audio/session-timer.js';
import { startSessionTracking, endSessionTracking, getStats, getWeeklyData } from '../services/analytics.js';
import { setStoryVolume, storyState } from '../content/stories.js';
import { setCustomAudioVolume } from '../content/audio-library.js';
import { initClassical, isClassicalPlaying, stopClassical, onClassicalStateChange } from '../content/classical.js';
import { initDJAudio, setDJVolume, setDJPitch, setDJTone, setDJSpeed, triggerOneShot, startLoop, stopLoop, isLoopActive, stopAllLoops, getActiveLoopCount, DJ_SOUNDS } from '../audio/dj-synth.js';
import { goToCheckout, hasPurchasedApp } from '../services/stripe-simple.js';

// ... (existing code)

// Use MultiReplace for multiple chunks? No, I'll use multi_replace tool.
// This block is just for thought process.

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
    els.fireplaceBtn = document.getElementById('fireplaceBtn');
    els.rainBtn = document.getElementById('rainBtn');
    els.zenBtn = document.getElementById('zenBtn');
    els.oceanBtn = document.getElementById('oceanBtn');
    els.matrixBtn = document.getElementById('matrixBtn');

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
    });
    if (els.closeRightBtn) els.closeRightBtn.addEventListener('click', () => {
        els.rightPanel.classList.add('translate-x-full');
        updateVisualizerScale();
        window.dispatchEvent(new CustomEvent('mindwave:layout-change'));
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
    if (els.fireplaceBtn) els.fireplaceBtn.addEventListener('click', () => setVisualMode('fireplace'));
    if (els.rainBtn) els.rainBtn.addEventListener('click', () => setVisualMode('rainforest'));
    if (els.zenBtn) els.zenBtn.addEventListener('click', () => setVisualMode('zengarden'));
    if (els.oceanBtn) els.oceanBtn.addEventListener('click', () => setVisualMode('ocean'));
    if (els.matrixBtn) els.matrixBtn.addEventListener('click', (e) => {
        // Prevent triggering if clicking the mini-toggle
        if (e.target.closest('#matrixSettingsToggle')) return;
        setVisualMode('matrix');
    });

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

    if (els.visualSpeedSlider) {

        els.visualSpeedSlider.addEventListener('input', (e) => {
            console.log("Slider Input:", e.target.value);
            const viz = getVisualizer();
            if (viz) viz.setSpeed(parseFloat(e.target.value));
        });
    }

    // Matrix Controls
    setupMatrixControls();

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

    // Setup Matrix specific controls
    function setupMatrixControls() {
        // We need to inject the toggle if it doesn't exist, or just bind it if it does.
        // Since the HTML is likely dynamic or we can append to the specialized panel.

        const panel = document.getElementById('matrixSettingsPanel');
        if (!panel) return;

        // Check if toggle already exists to avoid dupes
        if (!document.getElementById('mindWaveModeToggle')) {
            const toggleHtml = `
                <div class="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                    <label for="mindWaveModeToggle" class="text-[8px] text-[var(--text-muted)] uppercase">Mindwave Mode</label>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="mindWaveModeToggle" class="sr-only peer" checked>
                        <div class="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                    </label>
                </div>
            `;
            panel.insertAdjacentHTML('beforeend', toggleHtml);
        }

        const toggle = document.getElementById('mindWaveModeToggle');
        if (toggle) {
            console.log('[Controls] Matrix Toggle Found - CONTROLS_V3_REAL');
            toggle.addEventListener('change', (e) => {
                const viz = getVisualizer();
                if (viz && viz.setMatrixMode) {
                    viz.setMatrixMode(e.target.checked);
                }
            });
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


    // Theme - force default (emerald) if no saved theme or if it's a light theme that shouldn't be default
    const savedTheme = localStorage.getItem('mindwave_theme');
    if (!savedTheme || savedTheme === 'cloud' || savedTheme === 'dawn') {
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
    // Ensure visual mode UI is synced on load (Force ON defaults)
    setVisualMode('particles', true); // Flow ON
    // Delay Matrix init slightly to ensure state sync
    setTimeout(() => setVisualMode('matrix', true), 100);

    // Set Matrix Rainbow Mode ON by default
    const viz = getVisualizer();
    if (viz) {
        viz.setMatrixRainbow(true);
        viz.setMatrixMode(true); // Ensure MindWave text is on
    }

    setVisualMode('ocean', false); // Explicitly ensure OFF

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

        console.log('[Controls] Calling fadeOut(1.5)...');
        fadeOut(1.5, () => {
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

            // 5. Start session timer if duration is set
            const duration = parseInt(els.sessionDuration?.value || 0);
            if (duration > 0) {
                startSession(duration, {
                    onTick: updateTimerUI,
                    onComplete: handleSessionComplete
                });
                showTimerUI();
            }
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
        fadeOut(1.5, () => {
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
    < !--Header -->
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

            <!--Stats Grid - Revamped with proper icon placement-- >
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

            <!--Weekly Chart-- >
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

            <!--Additional Stats-- >
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
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash', 'light'];
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

export function setVisualMode(mode, forceState = null) {
    // state.visualMode = mode; // Single mode legacy. We'll rely on viz state.
    const viz = getVisualizer();
    let activeModes = new Set();

    if (viz) {
        if (forceState !== null) {
            // Force specific state (ON/OFF)
            const isActive = viz.activeModes.has(mode);
            if (isActive !== forceState) {
                viz.toggleMode(mode);
            }
        } else {
            // Default toggle behavior
            viz.toggleMode(mode);
        }
        // Render a single frame so the mode is visible even when paused
        if (isVisualsPaused()) {
            viz.renderSingleFrame();
        }
        activeModes = viz.activeModes;
    }

    // Update button states with theme-aware styling
    const buttons = [
        { el: els.sphereBtn, mode: 'sphere' },
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

    // Toggle Matrix Settings Panel
    const matrixPanel = document.getElementById('matrixSettingsPanel');
    if (matrixPanel) {
        // Initialize state if undefined
        if (typeof state.matrixPanelOpen === 'undefined') state.matrixPanelOpen = true;

        if (activeModes.has('matrix') && state.matrixPanelOpen) {
            matrixPanel.classList.remove('hidden');
            matrixPanel.classList.add('flex', 'items-center');
        } else {
            matrixPanel.classList.add('hidden');
            matrixPanel.classList.remove('flex', 'items-center');
        }
    }
}
window.setVisualMode = setVisualMode;


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

    // NEW: Set theme type (light/dark) for consistent styling
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash'];
    const themeType = lightThemes.includes(themeName) ? 'light' : 'dark';
    document.body.dataset.themeType = themeType;

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
        // Use the new light logo for bright themes, standard logo for dark themes
        const newSrc = isLightTheme ? '/mindwave-logo-light.png' : '/mindwave-logo.png';
        if (logoImg.getAttribute('src') !== newSrc) {
            logoImg.src = newSrc;
        }
    }

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

        // FIX THEME MODAL TEXT VISIBILITY
        const themeModal = document.getElementById('themeModal');
        if (themeModal) {
            // Modal header and all text elements
            themeModal.querySelectorAll('h2, h3, .text-lg, .text-xs, .text-sm, div').forEach(el => {
                // Skip if element has specific color styling that should be preserved
                if (!el.style.color || el.style.color.includes('var(--accent)')) {
                    el.style.color = t.text;
                }
            });
            // Modal background
            const modalCard = document.getElementById('themeModalCard');
            if (modalCard) {
                modalCard.style.backgroundColor = t.panel;
            }
        }

        // FIX TOP CONTROL BAR VISIBILITY
        const topBar = document.getElementById('topControlBar');
        if (topBar) {
            topBar.style.backgroundColor = t.panel;
            topBar.style.borderColor = t.border;
            // Fix all text in top bar
            topBar.querySelectorAll('button, span, div').forEach(el => {
                if (!el.classList.contains('toggle-active') && !el.style.color) {
                    el.style.color = t.text;
                }
            });
        }

        // Force update of Journeys UI
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
        // Force Bells to 0 volume per user request, or init missing
        if (!state.soundscapeSettings[s.id] || s.id === 'bells') {
            state.soundscapeSettings[s.id] = { vol: 0, tone: 0.5, speed: 0.5 };
        }
        const settings = state.soundscapeSettings[s.id];
        const item = document.createElement('div');
        item.className = "soundscape-item p-2 rounded border border-[var(--border)] flex flex-col gap-1";
        item.innerHTML = `<label class="text-[10px] font-semibold truncate mb-1 block atmos-label" title="${s.label}">${s.label}${s.bpm ? ` <span class="text-[8px] atmos-sublabel font-normal">${s.bpm} BPM</span>` : ''}</label>
<div class="flex items-center gap-2"><span class="text-[8px] w-6 atmos-sublabel">VOL</span><input type="range" min="0" max="0.5" step="0.01" value="${settings.vol}" class="flex-1 h-1" data-id="${s.id}" data-type="vol"><span class="text-[9px] font-mono w-8 text-right tabular-nums atmos-val" data-val="vol">${Math.round(settings.vol * 200)}%</span></div>
<div class="flex items-center gap-2"><span class="text-[8px] w-6 atmos-sublabel">TONE</span><input type="range" min="0" max="1" step="0.01" value="${settings.tone}" class="flex-1 tone-slider h-1" data-id="${s.id}" data-type="tone"><span class="text-[9px] font-mono w-8 text-right tabular-nums atmos-val" data-val="tone">${Math.round(settings.tone * 100)}%</span></div>
<div class="flex items-center gap-2"><span class="text-[8px] w-6 atmos-sublabel">SPD</span><input type="range" min="0" max="1" step="0.01" value="${settings.speed}" class="flex-1 speed-slider h-1" data-id="${s.id}" data-type="speed"><span class="text-[9px] font-mono w-8 text-right tabular-nums atmos-val" data-val="speed">${Math.round(settings.speed * 100)}%</span></div>`;

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

export async function applyPreset(type, btnElement, autoStart = true, skipPaywall = false) {
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

// --- COMBO PRESET LOGIC (Ambient Presets) ---
// Combines binaural frequency presets with atmospheric soundscapes
export async function applyComboPreset(comboId, btnElement) {
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

        // Wait a moment for audio to fade out
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

    // 7. Save state
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

// Expose to global scope for HTML onclick handlers
window.applyComboPreset = applyComboPreset;

// --- THEME MODAL LOGIC ---

export function initThemeModal() {
    const grid = document.getElementById('themeGrid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    Object.keys(THEMES).forEach(key => {
        const theme = THEMES[key];
        const card = document.createElement('div');
        card.className = `theme-card group ${els.themeBtn && document.body.dataset.theme === key ? 'active' : ''} `;
        card.style.setProperty('--theme-bg', theme.bg);

        // Card HTML - use CSS classes for theme-aware text colors
        const displayName = key === 'default' ? 'Emerald' : key;

        card.innerHTML = `
    <div class="theme-preview">
        <div class="absolute inset-0 opacity-50" style="background: radial-gradient(circle at 50% 50%, ${theme.accent}, transparent 70%);"></div>
    </div>
    <div class="p-3 theme-card-content">
        <div class="theme-card-title text-sm font-bold capitalize mb-1" style="color: var(--text-main);">${displayName}</div>
        <div class="theme-card-desc text-[10px]" style="color: var(--text-muted);">
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
        // Original Dark Themes
        case 'default': return "Clean Slate";
        case 'midnight': return "Deep Blue Focus";
        case 'ember': return "Warm Intensity";
        case 'abyss': return "Total Darkness";
        case 'cyberpunk': return "Neon & High-Contrast";
        case 'nebula': return "Cosmic Depth";
        case 'quantum': return "Matrix Grid";
        case 'sunset': return "Synthwave Glow";

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

export function openThemeModal() {
    const modal = document.getElementById('themeModal');
    const card = document.getElementById('themeModalCard');
    if (modal && card) {
        // Re-render to update 'active' state
        initThemeModal();

        // Add cursor settings UI to the modal
        if (card.classList.contains('scale-95')) {
            card.classList.remove('scale-95');
            card.classList.add('scale-100');
        } else {
            renderThemeModal(getTheme()); // Initial render
            requestAnimationFrame(() => {
                card.classList.remove('scale-95');
                card.classList.add('scale-100');
            });
        }

        // Apply Layout Constraints
        adjustModalLayout(modal);

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
            bg: 'bg-indigo-500/20',
            border: 'border-indigo-500/30',
            from: 'from-indigo-500',
            to: 'to-blue-600',
            glow: 'shadow-indigo-500/30'
        };
    }
    // Default
    return {
        name: 'gray',
        text: 'text-[var(--text-muted)]',
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
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash', 'light'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    tabs.forEach(tab => {
        const cat = tab.dataset.category;
        const colors = getCategoryColor(cat);

        if (cat === djCurrentCategory) {
            // Active state
            if (isLight) {
                // Light Mode Active: Accent Tint BG + Category Text/Border
                // Use color-mix for valid opacity with hex variable
                tab.className = `dj - cat - tab px - 2.5 py - 1 rounded - lg text - [9px] font - bold uppercase tracking - wide whitespace - nowrap border shadow - sm ${colors.text} `;
                tab.style.borderColor = 'currentColor';
                tab.style.backgroundColor = 'color-mix(in srgb, var(--accent), transparent 80%)';
            } else {
                // Dark Mode Active: Legacy
                tab.className = `dj - cat - tab px - 2.5 py - 1 rounded - lg text - [9px] font - bold uppercase tracking - wide whitespace - nowrap ${colors.bg} ${colors.text} border ${colors.border} `;
                tab.style.borderColor = '';
                tab.style.backgroundColor = '';
            }
        } else {
            // Inactive state
            tab.style.backgroundColor = ''; // Reset
            if (isLight) {
                tab.className = `dj - cat - tab px - 2.5 py - 1 rounded - lg text - [9px] font - bold uppercase tracking - wide whitespace - nowrap bg - transparent hover: bg - black / 5 text - [var(--text - muted)] border border - transparent hover: border - black / 5`;
                tab.style.borderColor = '';
            } else {
                tab.className = `dj - cat - tab px - 2.5 py - 1 rounded - lg text - [9px] font - bold uppercase tracking - wide whitespace - nowrap hover: bg - white / 10 ${colors.text} border border - white / 10 hover: border - white / 20`;
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
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash', 'light'];
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
    const lightThemes = ['cloud', 'dawn', 'paper', 'ash', 'light'];
    const isLight = lightThemes.includes(themeAttr) || document.body.getAttribute('data-theme-type') === 'light';

    Object.entries(catData.sounds).forEach(([id, sound]) => {
        const isActive = isLoopActive(id);
        const canLoop = sound.canLoop;

        let inactiveClasses = `bg - white / 5 border - white / 10 hover: bg - white / 10 hover: border - white / 20`;
        let inactiveStyle = '';

        if (!isActive && isLight) {
            // Light Mode Outline Style: Transparent BG, Colored Border, Colored Text
            // We use inline styles for the specific category color on border/text
            inactiveClasses = `bg - transparent hover: bg - [var(--accent)]/5`;
            // Note: Border width is handled by 'border' class in template below
        }

        const pad = document.createElement('button');
        pad.className = `dj-pad group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 active:scale-95
            ${isActive
                ? `bg-gradient-to-br ${gradientFrom}/30 ${gradientTo}/20 ${borderColor} shadow-lg ${glowColor}`
                : inactiveClasses}`;

        pad.dataset.soundId = id;
        pad.dataset.canLoop = canLoop;

        // Force inline colors for Light Mode Inactive
        if (!isActive && isLight) {
            pad.style.borderColor = textColor.replace('text-', 'var(--color-').replace('-400', '-500'); // Approximate or use standard var if possible? 
            // Better: use the hex colors from getCategoryColor logic/map if we had access, 
            // OR just use the computed color of the text class.
            // Simpler: Use the text class for the element, and set border-color: currentColor
            pad.style.borderColor = 'currentColor';
            pad.style.color = 'currentColor';
            // Wait, we need to SET the color first. 
            // The class `textColor` (e.g. text-blue-400) is NOT applied to the pad container, it's inside on the icon/label?
            // Actually, usually `text-blue-400` is applied to inner, but we want the Whole Pad to have this text color so border matches.
            pad.classList.add(textColor);
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
        const lightThemes = ['cloud', 'dawn', 'paper', 'ash', 'light'];
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
            pad.className = `dj-pad group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 active:scale-95
                ${isActive
                    ? `bg-gradient-to-br ${gradientFrom}/30 ${gradientTo}/20 ${borderColor} shadow-lg ${glowColor}`
                    : inactiveClasses}`;

            pad.dataset.soundId = id;
            pad.dataset.canLoop = canLoop;

            // Force inline colors for Light Mode Inactive
            if (!isActive && isLight) {
                // Approximate valid text color class usage or fallback
                // We use currentColor approach which is safest
                pad.style.borderColor = 'currentColor';
                pad.style.color = 'currentColor';
                pad.classList.add(headerColor); // headerColor is e.g. 'text-blue-400'
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

function adjustModalLayout(modal) {
    if (!modal) return;
    const safe = getSafeArea();

    // Apply safe area constraints to the modal container
    // This confines the backdrop AND content to the "center stage"
    modal.style.top = `${safe.top}px`;
    modal.style.bottom = `${safe.bottom}px`;
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
    document.querySelectorAll('.modal').forEach(m => {
        if (!m.classList.contains('hidden')) {
            adjustModalLayout(m);
        }
    });
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
            els.matrixSettingsPanel.classList.add('flex', 'items-center');
        }
    } else {
        if (els.matrixSettingsPanel) {
            els.matrixSettingsPanel.classList.add('hidden');
            els.matrixSettingsPanel.classList.remove('flex', 'items-center');
        }
    }
};

function setupMatrixControls() {
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

    // === NEW MATRIX MODE CONTROLS ===
    const modeSelect = document.getElementById('matrixModeSelect');
    const customTextInput = document.getElementById('matrixCustomTextInput');
    const textInput = document.getElementById('matrixTextInput');

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            // Show/Hide Input based on mode
            if (mode === 'custom') {
                customTextInput.classList.remove('hidden');
                setTimeout(() => textInput.focus(), 100);
            } else {
                customTextInput.classList.add('hidden');
            }

            const viz = getVisualizer();
            if (viz && viz.setMatrixLogicMode) {
                const text = textInput ? textInput.value : '';
                viz.setMatrixLogicMode(mode, text);
            }
        });
    }

    if (textInput) {
        textInput.addEventListener('input', (e) => {
            const text = e.target.value.toUpperCase();
            e.target.value = text;
            const viz = getVisualizer();

            // Always treat text input as 'custom' mode override
            if (viz && viz.setMatrixLogicMode) {
                viz.setMatrixLogicMode('custom', text);
            }
        });
    }
}

// Initialize Matrix controls immediately if DOM is ready, or wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMatrixControls);
} else {
    setupMatrixControls();
}
