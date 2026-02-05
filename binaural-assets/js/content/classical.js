import { els } from '../state.js';

// Built-in classical pieces (can be hidden but not deleted from server)
export const BUILTIN_CLASSICAL_PIECES = [
    {
        id: 'satie_gymnopedie',
        title: 'Gymnopédie No. 1',
        composer: 'Erik Satie',
        url: 'audio/classical/satie_gymnopedie.ogg',
        duration: '3:30',
        bpm: 70,
        isBuiltIn: true
    },
    {
        id: 'debussy_clair',
        title: 'Clair de Lune',
        composer: 'Claude Debussy',
        url: 'audio/classical/debussy_clair.ogg',
        duration: '5:05',
        bpm: 66,
        isBuiltIn: true
    },
    {
        id: 'beethoven_moonlight',
        title: 'Moonlight Sonata (Mvt 1)',
        composer: 'Ludwig van Beethoven',
        url: 'audio/classical/beethoven_moonlight.ogg',
        duration: '5:24',
        bpm: 56,
        isBuiltIn: true
    },
    {
        id: 'bach_cello',
        title: 'Cello Suite No. 1 (Prelude)',
        composer: 'J.S. Bach',
        url: 'audio/classical/bach_cello.ogg',
        duration: '2:56',
        bpm: 72,
        isBuiltIn: true
    },
    {
        id: 'vivaldi_spring',
        title: 'The Four Seasons: Spring',
        composer: 'Antonio Vivaldi',
        url: 'audio/classical/vivaldi_spring.ogg',
        duration: '3:30',
        bpm: 110,
        isBuiltIn: true
    },
    {
        id: 'mozart_eine',
        title: 'Eine kleine Nachtmusik',
        composer: 'W.A. Mozart',
        url: 'audio/classical/mozart_eine.ogg',
        duration: '5:50',
        bpm: 128,
        isBuiltIn: true
    },
    {
        id: 'chopin_nocturne',
        title: 'Nocturne Op. 9 No. 2',
        composer: 'Frédéric Chopin',
        url: 'audio/classical/chopin_nocturne.ogg',
        duration: '4:30',
        bpm: 48,
        isBuiltIn: true
    },
    {
        id: 'tchaikovsky_nutcracker',
        title: 'Nutcracker Suite (Overture)',
        composer: 'P.I. Tchaikovsky',
        url: 'audio/classical/tchaikovsky_nutcracker.ogg',
        duration: '3:20',
        bpm: 150,
        isBuiltIn: true
    },
    {
        id: 'bach_air',
        title: 'Air on the G String',
        composer: 'J.S. Bach',
        url: 'audio/classical/bach_air.ogg',
        duration: '5:21',
        bpm: 60,
        isBuiltIn: true
    }
];

// For backward compatibility
export const CLASSICAL_PIECES = BUILTIN_CLASSICAL_PIECES;

// IndexedDB for user-added classical tracks
const DB_NAME = 'ClassicalLibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

let classicalState = {
    audio: null,
    currentId: null,
    isPlaying: false,
    isPaused: false,
    volume: 0.7,
    db: null,
    userTracks: [],
    hiddenBuiltInIds: [] // Built-in tracks the user has "deleted" (hidden)
};

// Format seconds to m:ss
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update time display elements
function updateTimeDisplay() {
    if (!classicalState.audio) return;

    const currentTime = classicalState.audio.currentTime;
    const duration = classicalState.audio.duration;

    const currentTimeEl = document.getElementById('classicalCurrentTime');
    const totalTimeEl = document.getElementById('classicalTotalTime');
    const progressFill = document.getElementById('classicalProgressFill');

    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
    if (totalTimeEl && duration) totalTimeEl.textContent = formatTime(duration);
    if (progressFill && duration) {
        const percent = (currentTime / duration) * 100;
        progressFill.style.width = `${percent}%`;
    }
}

// Initialize IndexedDB for user tracks
function initClassicalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[Classical] IndexedDB error:', request.error);
            resolve(); // Don't block initialization
        };

        request.onsuccess = () => {
            classicalState.db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Load user tracks from IndexedDB
function loadUserTracks() {
    return new Promise((resolve) => {
        if (!classicalState.db) {
            resolve();
            return;
        }

        try {
            const transaction = classicalState.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                classicalState.userTracks = request.result || [];
                resolve();
            };

            request.onerror = () => {
                console.error('[Classical] Failed to load user tracks');
                resolve();
            };
        } catch (e) {
            console.error('[Classical] Transaction error:', e);
            resolve();
        }
    });
}

// Render combined track list (built-in + user tracks)
function renderClassicalList() {
    const container = document.getElementById('classicalContainer');
    if (!container) return;

    // Filter out hidden built-in tracks
    const visibleBuiltIn = BUILTIN_CLASSICAL_PIECES.filter(
        p => !classicalState.hiddenBuiltInIds.includes(p.id)
    );

    // Combine: user tracks first, then built-in
    const allTracks = [...classicalState.userTracks, ...visibleBuiltIn];

    if (allTracks.length === 0) {
        container.innerHTML = `
            <div class="text-xs text-center py-4 text-[var(--text-muted)] opacity-60">
                No tracks. Click "Add" to upload music.
            </div>
        `;
        return;
    }

    container.innerHTML = allTracks.map(piece => {
        const isUserTrack = !piece.isBuiltIn;
        return `
        <div class="classical-item flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
             data-id="${piece.id}">
            <div class="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] play-icon cursor-pointer shrink-0"
                 onclick="window.playClassicalPiece('${piece.id}')">
                ▶
            </div>
            <div class="flex-1 min-w-0 cursor-pointer" onclick="window.playClassicalPiece('${piece.id}')">
                <div class="text-xs font-medium text-[var(--text-main)] truncate">${piece.title}</div>
                <div class="text-[9px] text-[var(--text-muted)] truncate">${piece.composer || 'Unknown'} ${piece.duration ? `• ${piece.duration}` : ''}${piece.bpm ? ` • ${piece.bpm} BPM` : ''}${isUserTrack ? ' • Custom' : ''}</div>
            </div>
            <button onclick="window.deleteClassicalTrack('${piece.id}', ${piece.isBuiltIn || false})"
                class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                title="${piece.isBuiltIn ? 'Hide track' : 'Delete track'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
            </button>
        </div>
    `}).join('');
}

// Handle file upload for classical tracks
async function handleClassicalUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
        if (!file.type.startsWith('audio/')) continue;

        // Read file as base64
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });

        // Create track object
        const track = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            composer: 'My Library',
            url: base64, // Store as data URL
            duration: '',
            isBuiltIn: false,
            addedAt: Date.now()
        };

        // Save to IndexedDB
        if (classicalState.db) {
            try {
                const transaction = classicalState.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.put(track);

                // Add to local state
                classicalState.userTracks.push(track);
            } catch (e) {
                console.error('[Classical] Failed to save track:', e);
            }
        }
    }

    // Clear input and re-render
    event.target.value = '';
    renderClassicalList();
}

// Delete a track (hide built-in or remove user track)
function deleteClassicalTrack(trackId, isBuiltIn) {
    if (isBuiltIn) {
        // Just hide built-in tracks
        if (!classicalState.hiddenBuiltInIds.includes(trackId)) {
            classicalState.hiddenBuiltInIds.push(trackId);
            localStorage.setItem('classicalHiddenIds', JSON.stringify(classicalState.hiddenBuiltInIds));
        }
    } else {
        // Actually delete user tracks from IndexedDB
        if (classicalState.db) {
            try {
                const transaction = classicalState.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.delete(trackId);

                // Remove from local state
                classicalState.userTracks = classicalState.userTracks.filter(t => t.id !== trackId);
            } catch (e) {
                console.error('[Classical] Failed to delete track:', e);
            }
        }
    }

    // Stop if currently playing this track
    if (classicalState.currentId === trackId) {
        stopClassical();
    }

    renderClassicalList();
}

// Restore hidden built-in tracks (utility function)
function restoreAllBuiltInTracks() {
    classicalState.hiddenBuiltInIds = [];
    localStorage.removeItem('classicalHiddenIds');
    renderClassicalList();
}

// Expose delete function globally
window.deleteClassicalTrack = deleteClassicalTrack;
window.restoreAllBuiltInTracks = restoreAllBuiltInTracks;

export async function initClassical() {
    const container = document.getElementById('classicalContainer');
    const volSlider = document.getElementById('classicalVolumeSlider');
    const volValue = document.getElementById('classicalVolumeValue');
    const stopBtn = document.getElementById('stopClassicalBtn');
    const playPauseBtn = document.getElementById('classicalPlayPauseBtn');
    const rewindBtn = document.getElementById('classicalRewindBtn');
    const forwardBtn = document.getElementById('classicalForwardBtn');
    const progressBar = document.getElementById('classicalProgressBar');
    const uploadInput = document.getElementById('classicalUploadInput');

    if (!container) return;

    // Mark as initialized by main.js to prevent rescue script from running
    container.dataset.initialized = 'true';

    // Load hidden built-in tracks from localStorage
    try {
        classicalState.hiddenBuiltInIds = JSON.parse(localStorage.getItem('classicalHiddenIds') || '[]');
    } catch (e) {
        classicalState.hiddenBuiltInIds = [];
    }

    // Initialize IndexedDB
    await initClassicalDB();

    // Load user tracks from IndexedDB
    await loadUserTracks();

    // Render combined list
    renderClassicalList();

    // Setup upload handler
    if (uploadInput) {
        uploadInput.addEventListener('change', handleClassicalUpload);
    }

    // Volume Control
    if (volSlider) {
        volSlider.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            classicalState.volume = v;
            if (classicalState.audio) classicalState.audio.volume = v;
            if (volValue) volValue.textContent = Math.round(v * 100) + '%';
        });
    }

    // Stop Button
    if (stopBtn) {
        stopBtn.onclick = stopClassical;
    }

    // Play/Pause Button
    if (playPauseBtn) {
        playPauseBtn.onclick = togglePlayPause;
    }

    // Rewind Button
    if (rewindBtn) {
        rewindBtn.onclick = () => seekClassical(-10);
    }

    // Forward Button
    if (forwardBtn) {
        forwardBtn.onclick = () => seekClassical(10);
    }

    // Progress Bar Drag to Seek
    if (progressBar) {
        let isDragging = false;

        const seekToPosition = (e) => {
            if (!classicalState.audio || !classicalState.audio.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percent = clickX / rect.width;
            classicalState.audio.currentTime = percent * classicalState.audio.duration;
            updateTimeDisplay();
        };

        // Mouse events
        progressBar.addEventListener('mousedown', (e) => {
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

        // Touch events for mobile
        progressBar.addEventListener('touchstart', (e) => {
            isDragging = true;
            seekToPosition(e);
        }, { passive: true });

        progressBar.addEventListener('touchmove', (e) => {
            if (isDragging) seekToPosition(e);
        }, { passive: true });

        progressBar.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    // Expose globals
    window.playClassicalPiece = playClassical;
    window.stopClassical = stopClassical;
    window.seekClassical = seekClassical;
    window.toggleClassicalPlayPause = togglePlayPause;

    console.log('[Main] Classical initialized successfully');
}

export function playClassical(id) {
    // Search in both built-in and user tracks
    let piece = BUILTIN_CLASSICAL_PIECES.find(p => p.id === id);
    if (!piece) {
        piece = classicalState.userTracks.find(p => p.id === id);
    }
    if (!piece || !piece.url) return;

    // If clicking on currently playing track, toggle pause
    if (classicalState.currentId === id && classicalState.audio) {
        togglePlayPause();
        return;
    }

    // Stop conflicts
    stopClassical(); // Stop self
    if (window.stopCustomAudio) window.stopCustomAudio(); // Stop other custom audio

    classicalState.audio = new Audio(piece.url);
    classicalState.audio.volume = classicalState.volume;
    classicalState.audio.loop = true;

    // Time update listener
    classicalState.audio.addEventListener('timeupdate', updateTimeDisplay);

    // Metadata loaded - update total time
    classicalState.audio.addEventListener('loadedmetadata', () => {
        updateTimeDisplay();
        // Update now playing
        const nowPlayingEl = document.getElementById('classicalNowPlaying');
        if (nowPlayingEl) nowPlayingEl.textContent = `${piece.title} — ${piece.composer}`;
    });

    classicalState.audio.play()
        .then(() => {
            classicalState.isPlaying = true;
            classicalState.isPaused = false;
            classicalState.currentId = id;
            updateUI();
        })
        .catch(e => {
            console.error("Classical Play Error:", e);
            alert("Could not play track. It might not be available.");
        });
}

// Toggle play/pause
export function togglePlayPause() {
    if (!classicalState.audio) return;

    if (classicalState.isPaused) {
        // Resume
        classicalState.audio.play();
        classicalState.isPlaying = true;
        classicalState.isPaused = false;
    } else if (classicalState.isPlaying) {
        // Pause
        classicalState.audio.pause();
        classicalState.isPlaying = false;
        classicalState.isPaused = true;
    }
    updateUI();
}

// NEW: Seek Logic
export function seekClassical(amount) {
    if (!classicalState.audio) return;

    // Calculate new time
    let newTime = classicalState.audio.currentTime + amount;

    // Clamp
    if (newTime < 0) newTime = 0;
    if (newTime > classicalState.audio.duration) newTime = classicalState.audio.duration;

    classicalState.audio.currentTime = newTime;
    updateTimeDisplay();
}

export function stopClassical() {
    if (classicalState.audio) {
        classicalState.audio.pause();
        classicalState.audio.removeEventListener('timeupdate', updateTimeDisplay);
        classicalState.audio = null;
    }
    classicalState.isPlaying = false;
    classicalState.isPaused = false;
    classicalState.currentId = null;

    // Reset time display
    const currentTimeEl = document.getElementById('classicalCurrentTime');
    const totalTimeEl = document.getElementById('classicalTotalTime');
    const progressFill = document.getElementById('classicalProgressFill');
    const nowPlayingEl = document.getElementById('classicalNowPlaying');

    if (currentTimeEl) currentTimeEl.textContent = '0:00';
    if (totalTimeEl) totalTimeEl.textContent = '0:00';
    if (progressFill) progressFill.style.width = '0%';
    if (nowPlayingEl) nowPlayingEl.textContent = '—';

    updateUI();
}

function updateUI() {
    // Update Cards
    const cards = document.querySelectorAll('.classical-item');
    cards.forEach(card => {
        const id = card.dataset.id;
        const icon = card.querySelector('.play-icon');
        const isCurrent = id === classicalState.currentId;

        if (isCurrent && (classicalState.isPlaying || classicalState.isPaused)) {
            card.classList.add('border-[var(--accent)]');
            if (icon) icon.textContent = classicalState.isPlaying ? '⏸' : '▶';
        } else {
            card.classList.remove('border-[var(--accent)]');
            if (icon && !card.classList.contains('cursor-not-allowed')) icon.textContent = '▶';
        }
    });

    // Update Controls Container visibility
    const controls = document.getElementById('classicalControls');
    if (controls) {
        if (classicalState.isPlaying || classicalState.isPaused) {
            controls.classList.remove('hidden');
        } else {
            controls.classList.add('hidden');
        }
    }

    // Update Play/Pause button icons
    const playIcon = document.getElementById('classicalPlayIcon');
    const pauseIcon = document.getElementById('classicalPauseIcon');
    if (playIcon && pauseIcon) {
        if (classicalState.isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }

    // NEW: Notify external listeners (Controls.js)
    if (window.classicalStateChanged) {
        window.classicalStateChanged(classicalState.isPlaying);
    }
}

// External Observability
export function isClassicalPlaying() {
    return classicalState.isPlaying;
}

export function onClassicalStateChange(callback) {
    window.classicalStateChanged = callback;
}
