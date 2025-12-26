// Sleep Stories Module
// Plays narrated stories layered with binaural frequencies

import { state, els } from '../state.js';

// Built-in sleep stories with recommended soundscapes
export const SLEEP_STORIES = [
    {
        id: 'story-peaceful-night',
        title: 'Peaceful Night',
        description: 'A gentle journey through a moonlit garden',
        duration: '10 min',
        narrator: 'Demo',
        audioUrl: null, // Can be set via upload
        thumbnail: null,
        recommendedFreq: { base: 200, beat: 2 }, // Delta for deep sleep
        recommendedSoundscape: 'ocean', // Matches story theme
        category: 'nature',
        bpm: 60,
        premium: false
    },
    {
        id: 'story-ocean-dreams',
        title: 'Ocean Dreams',
        description: 'Drift away on gentle waves under starry skies',
        duration: '15 min',
        narrator: 'Demo',
        audioUrl: null,
        thumbnail: null,
        recommendedFreq: { base: 180, beat: 3 }, // Delta
        recommendedSoundscape: 'ocean',
        category: 'nature',
        bpm: 55,
        premium: false
    },
    {
        id: 'story-forest-meditation',
        title: 'Enchanted Forest',
        description: 'Walk through an ancient forest at twilight',
        duration: '12 min',
        narrator: 'Demo',
        audioUrl: null,
        thumbnail: null,
        recommendedFreq: { base: 220, beat: 4 }, // Theta
        recommendedSoundscape: 'rain',
        category: 'fantasy',
        bpm: 65,
        premium: true
    },
    {
        id: 'story-cosmic-journey',
        title: 'Cosmic Journey',
        description: 'Float through galaxies and nebulae',
        duration: '20 min',
        narrator: 'Demo',
        audioUrl: null,
        thumbnail: null,
        recommendedFreq: { base: 200, beat: 6 }, // Theta
        recommendedSoundscape: 'strings',
        category: 'space',
        bpm: 70,
        premium: true
    }
];

// Story player state
export let storyState = {
    currentStory: null,
    audioElement: null,
    isPlaying: false,
    isTransitioning: false, // NEW: Tracks loading state to prevent gaps in protection
    volume: 0.7,
    customAudioTracks: {} // Map of storyId -> audioDataUrl
};

// Initialize story player
export function initStoryPlayer() {
    // Load any saved custom audio mappings from localStorage
    try {
        const saved = localStorage.getItem('mindwave_story_audio');
        if (saved) {
            storyState.customAudioTracks = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('[Stories] Failed to load custom audio mappings:', e);
    }
    console.log('[Stories] Story player initialized');
}

// Play a story layered with frequencies and soundscapes
export async function playStory(storyId) {
    const story = SLEEP_STORIES.find(s => s.id === storyId);
    if (!story) {
        console.error('[Stories] Story not found:', storyId);
        return false;
    }

    // Check premium status
    if (story.premium && !isPremiumUser()) {
        showPremiumPrompt('story');
        return false;
    }

    // Set transitioning flag to blockade controls.js immediately
    storyState.isTransitioning = true;

    // Stop any currently playing story
    // stopStory() may restore saved frequency state (e.g. from localStorage via side effects), 
    // so we must set sliders AFTER this to ensure our new values persist.
    if (storyState.isPlaying) {
        stopStory();
    }

    // Set sliders immediately after stopStory to ensure correct Hz is displayed
    if (story.recommendedFreq) {
        setStoryFrequencySliders(story.recommendedFreq);
    }

    // GUARD LOOP: Start a requestAnimationFrame loop to enforce frequencies during any async transition
    // This fights any async state restoration that might happen (e.g. from stopStory side-effects resolving later)
    let guardActive = true;
    const enforceFreq = () => {
        if (!guardActive || !story.recommendedFreq) return;
        const corrected = setStoryFrequencySliders(story.recommendedFreq);
        if (corrected) {
            // Force reflow and log if we had to correct it (catching the 5.5Hz enemy)
            // document.body.offsetHeight; 
            console.log('[Stories] Guard corrected frequency drift!');
        }
        requestAnimationFrame(enforceFreq);
    };
    enforceFreq();

    // MULTI-LAYER PROTECTION: Bomb state at critical microtask points
    setTimeout(enforceFreq, 0);
    setTimeout(enforceFreq, 10);
    setTimeout(enforceFreq, 50);

    storyState.currentStory = story;
    storyState.isPlaying = true;

    // Import engine module for direct function calls
    const engine = await import('../audio/engine.js');
    console.log('[Stories] Starting:', story.title);

    // Stop any active frequency sweeps (Journeys) so they don't fight our sliders
    // Note: stopSweep(false) ensures we DO NOT restore old frequency, preventing 5.5Hz flash
    if (engine.stopSweep) {
        engine.stopSweep(false);
    }

    // Start audio if needed
    if (!state.isPlaying) {
        try {
            await engine.startAudio();
            console.log('[Stories] Started binaural player');
        } catch (e) {
            console.error('[Stories] Failed to start audio:', e);
        }
    }

    // Stop the guard loop
    guardActive = false;
    // Clear transitioning flag as we are now fully playing
    storyState.isTransitioning = false;

    // Final force update ensuring engine state matches UI
    if (story.recommendedFreq) {
        setStoryFrequencySliders(story.recommendedFreq);
        engine.updateFrequencies();
        console.log('[Stories] Applied story frequency:', story.recommendedFreq.beat, 'Hz');
    }

    // 4. Activate recommended soundscape
    if (story.recommendedSoundscape) {
        activateSoundscape(story.recommendedSoundscape);
    }

    // 4. Check for custom audio (uploaded by user)
    const customAudioUrl = storyState.customAudioTracks[storyId];
    const audioUrl = customAudioUrl || story.audioUrl;

    if (audioUrl) {
        // Play the actual narration audio
        storyState.audioElement = new Audio(audioUrl);
        storyState.audioElement.volume = storyState.volume;
        storyState.audioElement.loop = false;

        storyState.audioElement.addEventListener('ended', () => {
            console.log('[Stories] Audio playback ended');
            // Keep frequencies playing, just mark audio as not playing
            if (storyState.audioElement) {
                storyState.audioElement = null;
            }
        });

        storyState.audioElement.play()
            .then(() => {
                console.log('[Stories] Playing audio:', story.title);
            })
            .catch(err => {
                console.error('[Stories] Playback error:', err);
                showToast('Failed to play audio. Try uploading a new file.', 'error');
            });
    }

    // 5. Update UI and show feedback
    updateStoryUI(true);
    showStopButton(true);

    const soundscapeName = story.recommendedSoundscape
        ? story.recommendedSoundscape.charAt(0).toUpperCase() + story.recommendedSoundscape.slice(1)
        : 'ambient';
    showToast(`🌙 "${story.title}" — ${story.recommendedFreq.beat}Hz + ${soundscapeName}`);

    console.log('[Stories] Playing:', story.title);
    return true;
}

// Stop currently playing story
export function stopStory() {
    // Stop any narration audio
    if (storyState.audioElement) {
        storyState.audioElement.pause();
        storyState.audioElement.currentTime = 0;
        storyState.audioElement = null;
    }

    // Deactivate story's soundscape
    if (storyState.currentStory?.recommendedSoundscape) {
        deactivateSoundscape(storyState.currentStory.recommendedSoundscape);
    }

    storyState.isPlaying = false;
    storyState.currentStory = null;

    updateStoryUI(false);
    showStopButton(false);
    console.log('[Stories] Stopped');
}

// Set story volume (0-1)
export function setStoryVolume(volume) {
    storyState.volume = Math.max(0, Math.min(1, volume));
    if (storyState.audioElement) {
        storyState.audioElement.volume = storyState.volume;
    }
}

// Get story volume
export function getStoryVolume() {
    return storyState.volume;
}

// Check if story is playing
export function isStoryPlaying() {
    return storyState.isPlaying;
}

// Get current story
export function getCurrentStory() {
    return storyState.currentStory;
}

// Upload custom audio for a story
export async function uploadStoryAudio(storyId, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const audioDataUrl = reader.result;
            storyState.customAudioTracks[storyId] = audioDataUrl;

            // Save to localStorage
            try {
                localStorage.setItem('mindwave_story_audio', JSON.stringify(storyState.customAudioTracks));
            } catch (e) {
                console.warn('[Stories] Failed to save to localStorage:', e);
            }

            console.log('[Stories] Uploaded audio for:', storyId);
            showToast(`✓ Audio added to "${SLEEP_STORIES.find(s => s.id === storyId)?.title}"`);

            // Re-render cards to show upload indicator
            const container = document.getElementById('storyContainer');
            if (container) renderStoryCards(container);

            resolve(audioDataUrl);
        };

        reader.onerror = () => {
            console.error('[Stories] File read error:', reader.error);
            reject(reader.error);
        };

        reader.readAsDataURL(file);
    });
}

// Remove custom audio from a story
export function removeStoryAudio(storyId) {
    delete storyState.customAudioTracks[storyId];
    try {
        localStorage.setItem('mindwave_story_audio', JSON.stringify(storyState.customAudioTracks));
    } catch (e) {
        console.warn('[Stories] Failed to save to localStorage:', e);
    }

    const container = document.getElementById('storyContainer');
    if (container) renderStoryCards(container);

    showToast('Audio removed');
}

// Check if story has custom audio
export function hasCustomAudio(storyId) {
    return !!storyState.customAudioTracks[storyId];
}

// Set slider values only (no audio update) - for use BEFORE startAudio
// Uses direct DOM access to ensure values are set correctly
function setStoryFrequencySliders(freq) {
    // Use direct DOM access instead of shared els object
    const baseSlider = document.getElementById('baseSlider');
    const beatSlider = document.getElementById('beatSlider');
    const baseValue = document.getElementById('baseValue');
    const beatValue = document.getElementById('beatValue');
    let changed = false;

    // Only update if value changed to avoid DOM thrashing
    if (baseSlider && parseFloat(baseSlider.value) !== freq.base) {
        baseSlider.value = freq.base;
        if (baseValue) baseValue.textContent = freq.base + ' Hz';
        changed = true;
    }
    if (beatSlider && parseFloat(beatSlider.value) !== freq.beat) {
        beatSlider.value = freq.beat;
        if (beatValue) beatValue.textContent = freq.beat + ' Hz';
        changed = true;
    }
    return changed;
}

// Apply story's recommended frequencies (with audio update)
function applyStoryFrequencies(freq) {
    setStoryFrequencySliders(freq);
    // Trigger frequency update if audio is playing
    if (window.updateFrequencies) {
        window.updateFrequencies();
    }
}

// Activate a soundscape for the story experience
function activateSoundscape(soundscapeId) {
    // Set the soundscape volume via state
    if (!state.soundscapeSettings) state.soundscapeSettings = {};
    if (!state.soundscapeSettings[soundscapeId]) {
        state.soundscapeSettings[soundscapeId] = { vol: 0, tone: 1, speed: 1 };
    }

    // Set to moderate volume for story ambience
    state.soundscapeSettings[soundscapeId].vol = 0.4;

    // Update the UI slider if it exists
    const volSlider = document.querySelector(`[data-soundscape-id="${soundscapeId}"] input[type="range"]`);
    if (volSlider) {
        volSlider.value = 0.4;
        // Trigger input event to sync everything
        volSlider.dispatchEvent(new Event('input'));
    }

    // If audio is playing, start the soundscape
    if (state.isPlaying && window.updateSoundscape) {
        window.updateSoundscape(soundscapeId, 'vol', 0.4);
    }

    console.log('[Stories] Activated soundscape:', soundscapeId);
}

// Deactivate a soundscape
function deactivateSoundscape(soundscapeId) {
    if (state.soundscapeSettings && state.soundscapeSettings[soundscapeId]) {
        state.soundscapeSettings[soundscapeId].vol = 0;
    }

    const volSlider = document.querySelector(`[data-soundscape-id="${soundscapeId}"] input[type="range"]`);
    if (volSlider) {
        volSlider.value = 0;
        volSlider.dispatchEvent(new Event('input'));
    }

    if (state.isPlaying && window.updateSoundscape) {
        window.updateSoundscape(soundscapeId, 'vol', 0);
    }

    console.log('[Stories] Deactivated soundscape:', soundscapeId);
}

// Update UI to reflect story state
function updateStoryUI(playing) {
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach(card => {
        card.classList.remove('playing');
    });

    if (playing && storyState.currentStory) {
        const activeCard = document.querySelector(`[data-story-id="${storyState.currentStory.id}"]`);
        if (activeCard) {
            activeCard.classList.add('playing');
        }
    }
}

// Show/hide stop story button
function showStopButton(show) {
    const stopBtn = document.getElementById('stopStoryBtn');
    if (stopBtn) {
        stopBtn.classList.toggle('hidden', !show);
    }
}

// Check premium status (placeholder - implement with actual auth)
function isPremiumUser() {
    return localStorage.getItem('mindwave_premium') === 'true';
}

// Show premium upgrade prompt
function showPremiumPrompt(feature) {
    showToast('⭐ This is a premium feature. Upgrade to unlock!', 'warning');
}

// Toast helper
function showToast(message, type = 'info') {
    const colors = {
        info: 'bg-[var(--accent)]/90 text-black',
        success: 'bg-green-500/90 text-black',
        warning: 'bg-amber-500/90 text-black',
        error: 'bg-red-500/90 text-white'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium z-50 transition-all ${colors[type] || colors.info}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Render story cards in UI
export function renderStoryCards(container) {
    if (!container) return;

    container.innerHTML = SLEEP_STORIES.map(story => {
        const hasAudio = hasCustomAudio(story.id);
        const isPlaying = storyState.currentStory?.id === story.id && storyState.isPlaying;

        return `
        <div class="story-card group relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all ${story.premium ? 'premium-content' : ''} ${isPlaying ? 'playing border-purple-500 bg-purple-500/10' : ''}"
            data-story-id="${story.id}">
            
            <!-- Premium badge -->
            <div class="absolute top-1 right-1 flex gap-1">
                ${hasAudio ? '<span class="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">🎵</span>' : ''}
                ${story.premium ? '<span class="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">PRO</span>' : ''}
            </div>
            
            <!-- Icon with play indicator -->
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center mb-2 ${isPlaying ? 'animate-pulse' : ''}">
                ${isPlaying
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-purple-300"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-purple-300"><polygon points="5,3 19,12 5,21"/></svg>'
            }
            </div>
            
            <!-- Title and duration -->
            <span class="text-xs font-bold text-purple-300 text-center">${story.title}</span>
            <span class="text-[8px] text-[var(--text-muted)] mt-0.5">${story.duration}${story.bpm ? ` • ${story.bpm} BPM` : ''}</span>
            
            <!-- Action buttons (shown on hover) -->
            <div class="absolute bottom-1 left-1 right-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="story-play-btn px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[8px] font-bold hover:bg-purple-500/40 transition-all"
                    onclick="event.stopPropagation(); window.playStoryById('${story.id}')">
                    ${isPlaying ? 'Stop' : 'Play'}
                </button>
                <label class="story-upload-btn px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-muted)] text-[8px] font-bold hover:bg-white/20 transition-all cursor-pointer"
                    onclick="event.stopPropagation()">
                    ${hasAudio ? '🔄' : '📤'}
                    <input type="file" accept="audio/*" class="hidden" onchange="window.uploadStoryAudioHandler(event, '${story.id}')">
                </label>
            </div>
        </div>
    `;
    }).join('');

    // Add click handler for card itself
    container.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => {
            const storyId = card.dataset.storyId;
            if (storyState.currentStory?.id === storyId && storyState.isPlaying) {
                stopStory();
            } else {
                playStory(storyId);
            }
        });
    });
}

// Global function for onclick handlers
window.playStoryById = (storyId) => {
    if (storyState.currentStory?.id === storyId && storyState.isPlaying) {
        stopStory();
    } else {
        playStory(storyId);
    }
};

// Global handler for file uploads
window.uploadStoryAudioHandler = async (event, storyId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
        showToast('File too large (max 100MB)', 'error');
        return;
    }

    await uploadStoryAudio(storyId, file);
};

// Export stopStory for main.js wiring
export { stopStory as stopCurrentStory };
