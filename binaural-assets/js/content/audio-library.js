// Audio Library Module
// Handles custom audio uploads, storage (IndexedDB), and Cloud Sync
import { state, els } from '../state.js';

import {
    uploadAudioToCloud,
    deleteAudioFromCloud,
    subscribeToAudioLibrary,
    isLoggedIn,
    registerAuthCallback,
    db,
    doc,
    setDoc
} from '../services/firebase.js';
import { openAuthModal } from '../ui/auth-controller.js';

// IndexedDB database name and store
const DB_NAME = 'MindWaveAudioLibrary';
const DB_VERSION = 1;
const STORE_NAME = 'audioFiles';

// Audio library state
let audioLibraryState = {
    db: null,
    currentTrack: null,
    audioElement: null,
    isPlaying: false,
    volume: 0.7,
    tracks: [],
    unsubscribeCloud: null // Function to stop listening to cloud updates
};

// Initialize IndexedDB and Listen for Auth Changes
export async function initAudioLibrary() {
    // 1. Setup IndexedDB (Always available as fallback/cache)
    const dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            audioLibraryState.db = request.result;
            console.log('[AudioLibrary] Database initialized');
            resolve();
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('dateAdded', 'dateAdded', { unique: false });
            }
        };
    });

    try {
        await dbPromise;
    } catch (e) {
        console.error('[AudioLibrary] DB Init failed:', e);
    }

    // 2. Register Auth Callback to switch modes (Cloud vs Local)
    registerAuthCallback(onAuthStateChange);

    // 3. Initial Load (Default to local, auth callback will override if logged in)
    if (!isLoggedIn()) {
        await loadLocalLibrary();
    }
}

// Handle Auth State Changes
function onAuthStateChange(user) {
    if (user) {
        // Logged In: Switch to Cloud Source
        console.log('[AudioLibrary] User logged in. Syncing Cloud Library...');
        // Subscribe to Cloud Updates
        if (audioLibraryState.unsubscribeCloud) audioLibraryState.unsubscribeCloud();

        subscribeToAudioLibrary((cloudTracks) => {
            // Merge or Replace? For now, we use Cloud as source of truth when logged in.
            // (Potential improvement: Merge local tracks that aren't in cloud yet?)
            audioLibraryState.tracks = cloudTracks;
            renderLibraryUI();
            console.log('[AudioLibrary] Cloud Sync:', cloudTracks.length, 'tracks');
        });

    } else {
        // Logged Out: Revert to Local IndexedDB
        console.log('[AudioLibrary] User logged out. Reverting to Local Library...');
        if (audioLibraryState.unsubscribeCloud) {
            audioLibraryState.unsubscribeCloud(); // Stop listening
            audioLibraryState.unsubscribeCloud = null;
        }
        loadLocalLibrary();
    }
}

// Load local tracks from IndexedDB
async function loadLocalLibrary() {
    if (!audioLibraryState.db) return;

    const transaction = audioLibraryState.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
        request.onsuccess = () => {
            // Only update if we are NOT using cloud (double check)
            if (!isLoggedIn()) {
                audioLibraryState.tracks = request.result || [];
                renderLibraryUI();
            }
            resolve(audioLibraryState.tracks);
        };
    });
}

// Add a track (Cloud if logged in, Local if guest)
export async function addTrack(file) {
    // CLOUD MODE
    if (isLoggedIn()) {
        try {
            showToast(`Uploading "${file.name}" to cloud...`, 'info');
            // Metadata
            const metadata = {
                name: file.name.replace(/\.[^/.]+$/, ''),
                size: file.size,
                type: file.type
            };
            // Upload
            await uploadAudioToCloud(file, metadata);
            showToast("✓ Upload complete", "success");
            // List updates automatically via subscription
            return;
        } catch (e) {
            console.error("Cloud upload failed:", e);
            showToast("Upload failed: " + e.message, "error");
            throw e;
        }
    }

    // GUEST MODE: IndexedDB
    // Prompt login for better experience?
    // For now, let them save locally, but maybe show a tip?
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const track = {
                id: 'local-' + Date.now(), // Different ID scheme
                name: file.name.replace(/\.[^/.]+$/, ''),
                fileName: file.name,
                type: file.type,
                size: file.size,
                dateAdded: new Date().toISOString(),
                audioData: reader.result, // Base64
                isLocal: true // Flag
            };

            const transaction = audioLibraryState.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(track);

            request.onsuccess = () => {
                audioLibraryState.tracks.push(track);
                renderLibraryUI();
                showToast(`✓ Saved locally (Sign in to sync)`, 'success');
                resolve(track);
            };
            request.onerror = () => reject(request.error);
        };
        reader.readAsDataURL(file);
    });
}

// Delete a track
export async function deleteTrack(trackId) {
    const track = audioLibraryState.tracks.find(t => t.id === trackId);
    if (!track) return;

    // CLOUD TRACK
    if (!track.isLocal && isLoggedIn()) {
        try {
            showToast("Deleting from cloud...", "info");
            await deleteAudioFromCloud(trackId, track.storagePath); // storagePath needed
            showToast("Deleted from cloud", "info");
            // Stop playback if playing
            if (audioLibraryState.currentTrack?.id === trackId) stopCustomAudio();
            // List updates via subscription
            return;
        } catch (e) {
            console.error("Cloud delete failed:", e);
            showToast("Delete failed", "error");
        }
    }
    // LOCAL TRACK
    else if (track.isLocal || !isLoggedIn()) {
        return new Promise((resolve, reject) => {
            const transaction = audioLibraryState.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(trackId);

            request.onsuccess = () => {
                audioLibraryState.tracks = audioLibraryState.tracks.filter(t => t.id !== trackId);
                if (audioLibraryState.currentTrack?.id === trackId) stopCustomAudio();
                renderLibraryUI();
                showToast('Deleted (Local)', 'info');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Play a track (Handles both Blob URL from Cloud and Base64 from Local)
export function playCustomAudio(trackId) {
    const track = audioLibraryState.tracks.find(t => t.id === trackId);
    if (!track) {
        console.error('[AudioLibrary] Track not found:', trackId);
        return false;
    }

    // Stop currently playing
    if (audioLibraryState.audioElement) {
        stopCustomAudio();
    }
    // Also stop Classical Music if playing
    if (window.stopClassical) window.stopClassical();

    audioLibraryState.currentTrack = track;

    // Usage: Cloud uses downloadUrl, Local uses audioData
    const src = track.downloadUrl || track.audioData;

    audioLibraryState.audioElement = new Audio(src);
    audioLibraryState.audioElement.volume = audioLibraryState.volume;
    audioLibraryState.audioElement.loop = true;
    // Essential for Cloud CORS if needed (usually fine with public download URLs, but good practice)
    audioLibraryState.audioElement.crossOrigin = "anonymous";

    audioLibraryState.audioElement.addEventListener('ended', () => {
        // Loop is true, so this rarely fires unless loop=false
    });

    // Time update for progress bar
    audioLibraryState.audioElement.addEventListener('timeupdate', () => {
        updateCustomAudioProgress();
    });

    // Metadata loaded - update total time
    audioLibraryState.audioElement.addEventListener('loadedmetadata', () => {
        updateCustomAudioProgress();
    });

    // Error handling
    audioLibraryState.audioElement.addEventListener('error', (e) => {
        console.error("Audio playback error:", e);
        showToast("Playback failed", "error");
        audioLibraryState.isPlaying = false;
        updateLibraryUI();
    });

    audioLibraryState.audioElement.play()
        .then(() => {
            audioLibraryState.isPlaying = true;
            updateLibraryUI();
            console.log('[AudioLibrary] Playing:', track.name);
        })
        .catch(err => {
            console.error('[AudioLibrary] Play request failed:', err);
            showToast('Playback failed', 'error');
        });

    return true;
}

// Stop currently playing audio
export function stopCustomAudio() {
    if (audioLibraryState.audioElement) {
        audioLibraryState.audioElement.pause();
        audioLibraryState.audioElement.currentTime = 0;
        audioLibraryState.audioElement = null;
    }
    audioLibraryState.isPlaying = false;
    audioLibraryState.currentTrack = null;
    updateLibraryUI();
    console.log('[AudioLibrary] Stopped');
}

// Set volume (0-1)
export function setCustomAudioVolume(volume) {
    audioLibraryState.volume = Math.max(0, Math.min(1, volume));
    if (audioLibraryState.audioElement) {
        audioLibraryState.audioElement.volume = audioLibraryState.volume;
    }
}

// Get current state
export function getAudioLibraryState() {
    return {
        isPlaying: audioLibraryState.isPlaying,
        currentTrack: audioLibraryState.currentTrack,
        trackCount: audioLibraryState.tracks.length
    };
}

// Format file size
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Format seconds to m:ss
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update custom audio progress bar
function updateCustomAudioProgress() {
    if (!audioLibraryState.audioElement || !audioLibraryState.currentTrack) return;

    const trackId = audioLibraryState.currentTrack.id;
    const currentTime = audioLibraryState.audioElement.currentTime;
    const duration = audioLibraryState.audioElement.duration;

    // Update current time display
    const currentTimeEl = document.querySelector(`.custom-audio-current-time[data-track="${trackId}"]`);
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);

    // Update total time display
    const totalTimeEl = document.querySelector(`.custom-audio-total-time[data-track="${trackId}"]`);
    if (totalTimeEl && duration) totalTimeEl.textContent = formatTime(duration);

    // Update progress bar fill
    const progressFill = document.querySelector(`.custom-audio-progress-bar[data-track="${trackId}"] .custom-audio-progress-fill`);
    if (progressFill && duration) {
        const percent = (currentTime / duration) * 100;
        progressFill.style.width = `${percent}%`;
    }
}

// Rename a track
export async function renameTrack(trackId, newName) {
    const track = audioLibraryState.tracks.find(t => t.id === trackId);
    if (!track) return;

    if (!newName || newName.trim() === '') return;
    newName = newName.trim();

    // CLOUD TRACK
    if (!track.isLocal && isLoggedIn()) {
        try {
            showToast("Renaming in cloud...", "info");
            const uid = state.currentUser.uid;
            const docRef = doc(db, 'users', uid, 'audioLibrary', trackId);
            await setDoc(docRef, { name: newName }, { merge: true });
            showToast("Renamed successfully", "success");
            // List updates via subscription
        } catch (e) {
            console.error("Cloud rename failed:", e);
            showToast("Rename failed", "error");
        }
    }
    // LOCAL TRACK
    else if (track.isLocal || !isLoggedIn()) {
        return new Promise((resolve, reject) => {
            const transaction = audioLibraryState.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(trackId);

            request.onsuccess = () => {
                const data = request.result;
                data.name = newName;
                store.put(data).onsuccess = () => {
                    // Update local state
                    track.name = newName;
                    renderLibraryUI();
                    showToast('Renamed (Local)', 'success');
                    resolve();
                };
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Render library UI
function renderLibraryUI() {
    const container = document.getElementById('myAudioContainer');
    if (!container) return;

    // Login Prompt if guest and empty?
    // Actually, Guest can use local.

    const isGuest = !isLoggedIn();

    if (audioLibraryState.tracks.length === 0) {
        container.innerHTML = `
            <div class="text-xs text-center py-6 text-[var(--text-muted)] opacity-60 flex flex-col items-center gap-3">
                <p>Upload audio files to layer with your session</p>
                ${isGuest ? `<button onclick="window.openAuthTrigger()" class="text-[var(--accent)] hover:underline">Sign in to sync across devices</button>` : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = audioLibraryState.tracks.map(track => {
        const isCloud = !track.isLocal;
        const icon = isCloud ? '☁️' : '💾';
        const isCurrentTrack = audioLibraryState.currentTrack?.id === track.id;
        return `
        <div class="audio-track-card flex flex-col gap-2 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all ${isCurrentTrack ? 'playing border-[var(--accent)]' : ''}"
            data-track-id="${track.id}">
            <div class="flex items-center gap-3">
                <button class="play-track-btn w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all shrink-0"
                    onclick="window.toggleCustomAudio('${track.id}')">
                    ${isCurrentTrack && audioLibraryState.isPlaying
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'
            }
                </button>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-[var(--text-main)] truncate flex items-center gap-2">
                        ${track.name}
                        <span class="text-[9px] opacity-50" title="${isCloud ? 'Cloud Synced' : 'Local Only'}">${icon}</span>
                    </div>
                    <div class="text-[9px] text-[var(--text-muted)]">${formatSize(track.size)}</div>
                </div>
                
                <!-- Actions -->
                <div class="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                     <button class="rename-track-btn p-1.5 rounded-full hover:bg-white/10 hover:text-[var(--accent)] transition-all"
                        onclick="window.renameCustomTrack('${track.id}', '${track.name.replace(/'/g, "\\'")}')" title="Rename">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-track-btn p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all"
                        onclick="window.deleteCustomTrack('${track.id}')" title="Delete">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            ${isCurrentTrack ? `
            <!-- Progress Bar (shown when playing) -->
            <div class="flex items-center gap-2">
                <span class="custom-audio-current-time text-[9px] font-mono text-[var(--text-muted)] w-8" data-track="${track.id}">0:00</span>
                <div class="custom-audio-progress-bar flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative" data-track="${track.id}">
                    <div class="custom-audio-progress-fill h-full bg-[var(--accent)] rounded-full transition-all" style="width: 0%"></div>
                </div>
                <span class="custom-audio-total-time text-[9px] font-mono text-[var(--text-muted)] w-8 text-right" data-track="${track.id}">0:00</span>
            </div>
            ` : ''}
        </div>
    `}).join('');

    // Setup progress bar seek handlers
    setupCustomAudioProgressBars();
}

// Setup drag-to-seek for custom audio progress bars
function setupCustomAudioProgressBars() {
    const progressBars = document.querySelectorAll('.custom-audio-progress-bar');

    progressBars.forEach(bar => {
        let isDragging = false;

        const seekToPosition = (e) => {
            if (!audioLibraryState.audioElement || !audioLibraryState.audioElement.duration) return;
            const rect = bar.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percent = clickX / rect.width;
            audioLibraryState.audioElement.currentTime = percent * audioLibraryState.audioElement.duration;
        };

        // Mouse events
        bar.addEventListener('mousedown', (e) => {
            isDragging = true;
            seekToPosition(e);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) seekToPosition(e);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events
        bar.addEventListener('touchstart', (e) => {
            isDragging = true;
            seekToPosition(e);
        }, { passive: true });

        bar.addEventListener('touchmove', (e) => {
            if (isDragging) seekToPosition(e);
        }, { passive: true });

        bar.addEventListener('touchend', () => {
            isDragging = false;
        });
    });
}

// Update library UI without full re-render
function updateLibraryUI() {
    const cards = document.querySelectorAll('.audio-track-card');
    cards.forEach(card => {
        const trackId = card.dataset.trackId;
        const isCurrentTrack = audioLibraryState.currentTrack?.id === trackId;
        const isPlaying = isCurrentTrack && audioLibraryState.isPlaying;

        card.classList.toggle('playing', isCurrentTrack);
        card.classList.toggle('border-[var(--accent)]', isCurrentTrack);

        const playBtn = card.querySelector('.play-track-btn');
        if (playBtn) {
            playBtn.innerHTML = isPlaying
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
        }
    });
}

// Toast helper
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-500/90 text-black',
        error: 'bg-red-500/90 text-white',
        info: 'bg-[var(--accent)]/90 text-black'
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

// Global functions for onclick handlers
window.toggleCustomAudio = (trackId) => {
    if (audioLibraryState.currentTrack?.id === trackId && audioLibraryState.isPlaying) {
        stopCustomAudio();
    } else {
        playCustomAudio(trackId);
    }
};

window.deleteCustomTrack = async (trackId) => {
    if (confirm('Delete this track from your library?')) {
        await deleteTrack(trackId);
    }
};

window.renameCustomTrack = async (trackId, currentName) => {
    const newName = prompt("Rename track:", currentName);
    if (newName && newName !== currentName) {
        await renameTrack(trackId, newName);
    }
};

window.stopCustomAudio = stopCustomAudio;

window.openAuthTrigger = () => {
    // Helper to open auth modal
    if (openAuthModal) openAuthModal();
    else console.warn("Auth modal not linked");
};

// Handle file uploads
export function setupUploadHandler() {
    const uploadInput = document.getElementById('audioUploadInput');
    if (!uploadInput) return;

    uploadInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                showToast(`"${file.name}" is too large (max 50MB)`, 'error');
                continue;
            }

            try {
                await addTrack(file);
            } catch (err) {
                console.error("Upload handler error:", err);
            }
        }

        // Reset input
        uploadInput.value = '';
    });

    // Volume slider handler
    const volumeSlider = document.getElementById('customAudioVolume');
    const volumeValue = document.getElementById('customAudioVolumeValue');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            setCustomAudioVolume(vol);
            if (volumeValue) volumeValue.textContent = Math.round(vol * 100) + '%';
        });
    }

    console.log('[AudioLibrary] Upload handler ready');
}
