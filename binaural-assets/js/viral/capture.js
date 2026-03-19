/**
 * App Capture Module — Screenshots + Screen Recording of Live Apps
 * 
 * Architecture:
 *   - Uses a SINGLE persistent getDisplayMedia stream for all capture operations
 *   - The permission prompt is shown only ONCE when the user first captures
 *   - That stream is reused for both screenshots (grabFrame) and recording (MediaRecorder)
 *   - The iframe preview is loaded separately — it's just a visual reference
 *   - All captures are auto-persisted to IndexedDB via the MediaVault storage layer
 */

import { saveMedia, getMediaList, deleteMedia, initStorage } from '../services/storage-manager.js';
import { trackGlobalEvent } from '../services/analytics-service.js';

// =========================================================================
// STATE
// =========================================================================
let captureFrame = null;
let persistentStream = null; // Single shared stream — avoids repeated permission prompts
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let capturedScreenshots = [];  // In-session cache (also persisted to vault)
let capturedVideos = [];       // In-session cache (also persisted to vault)
let onCaptureLog = null;

// Initialize storage on module load (non-blocking)
initStorage().catch(e => console.warn('[Capture] Storage init deferred:', e));

// =========================================================================
// PUBLIC API
// =========================================================================

/** Register log callback */
export function onLog(cb) { onCaptureLog = cb; }

/** Get the iframe element for the app preview */
export function getFrame() { return captureFrame; }

/**
 * Open an app URL in the capture iframe (visual reference only)
 */
export function loadApp(url, container) {
    if (!url.startsWith('http')) url = 'https://' + url;
    log(`Loading app: ${url}`);

    // Remove existing frame
    if (captureFrame) captureFrame.remove();

    captureFrame = document.createElement('iframe');
    captureFrame.src = url;
    captureFrame.className = 'capture-frame';
    captureFrame.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;background:#0a0f1e;';
    captureFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    captureFrame.setAttribute('loading', 'eager');

    container.innerHTML = '';
    container.appendChild(captureFrame);

    captureFrame.addEventListener('load', () => {
        log('App loaded in preview frame.');
    });

    captureFrame.addEventListener('error', () => {
        log('Frame load error — app may block embedding.');
    });



    return captureFrame;
}

// =========================================================================
// PERSISTENT STREAM MANAGEMENT
// =========================================================================

/**
 * Get or create the persistent capture stream.
 * The OS permission prompt is shown ONLY on the first call.
 * Subsequent calls reuse the existing stream.
 */
async function getPersistentStream() {
    // If we already have a live stream, reuse it
    if (persistentStream) {
        const tracks = persistentStream.getVideoTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
            return persistentStream;
        }
        // Stream died — clean up
        persistentStream = null;
    }

    log('Requesting screen capture permission (select "This Tab")...');

    persistentStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            displaySurface: 'browser',
            frameRate: { ideal: 30 }
        },
        audio: true,
        preferCurrentTab: true
    });



    // Auto-cleanup when user revokes sharing
    persistentStream.getVideoTracks()[0].addEventListener('ended', () => {
        log('Screen sharing ended by user.');
        persistentStream = null;
        if (isRecording) {
            stopRecording();
        }
    });

    log('Screen capture stream acquired.');
    return persistentStream;
}

/** Release the persistent stream (call when leaving capture tab) */
export function releaseStream() {
    if (persistentStream) {
        persistentStream.getTracks().forEach(t => t.stop());
        persistentStream = null;
        log('Capture stream released.');
    }
}

// =========================================================================
// SCREENSHOTS
// =========================================================================

/**
 * Capture a screenshot from the active screen share stream.
 * Uses the persistent stream — no repeat permission prompts.
 */
export async function captureScreenshot() {
    log('Capturing screenshot...');

    try {
        const stream = await getPersistentStream();
        const track = stream.getVideoTracks()[0];

        // Draw to canvas using a temporary video element (more reliable than ImageCapture)
        const video = document.createElement('video');
        video.muted = true;
        video.srcObject = new MediaStream([track]);
        await video.play();

        const canvas = document.createElement('canvas');

        if (captureFrame) {
            // Manual aspect crop based on iframe rect
            const rect = captureFrame.getBoundingClientRect();
            // In case of high-DPI or non-1:1 stream size vs window size
            const scaleX = video.videoWidth / window.innerWidth;
            const scaleY = video.videoHeight / window.innerHeight;

            const cropX = rect.left * scaleX;
            const cropY = rect.top * scaleY;
            const cropW = rect.width * scaleX;
            const cropH = rect.height * scaleY;

            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        } else {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Clean up video element
        video.pause();
        video.srcObject = null;

        const blob = await canvasToBlob(canvas);
        const screenshot = {
            id: crypto.randomUUID(),
            blob,
            url: URL.createObjectURL(blob),
            timestamp: new Date().toISOString(),
            width: canvas.width,
            height: canvas.height,
            type: 'screenshot'
        };
        capturedScreenshots.push(screenshot);
        log(`Screenshot captured (${canvas.width}×${canvas.height})`);

        trackGlobalEvent('media_captured', { type: 'screenshot' });

        // Persist to IndexedDB vault (non-blocking)
        saveMedia('screenshot', blob, {
            width: canvas.width,
            height: canvas.height,
            source: 'capture-tab'
        }).then(record => {
            screenshot.vaultId = record.id;
            log(`Screenshot persisted to vault: ${record.id}`);
        }).catch(e => log('Vault save failed: ' + e.message));

        return screenshot;
    } catch (e) {
        log('Screenshot failed: ' + e.message);
        throw e;
    }
}

// =========================================================================
// SCREEN RECORDING
// =========================================================================

/**
 * Start screen recording using the persistent stream.
 */
export async function startRecording(options = {}) {
    if (isRecording) {
        log('Already recording.');
        return;
    }

    log('Starting screen recording...');
    recordedChunks = [];

    try {
        const stream = await getPersistentStream();

        // Optionally add microphone audio
        if (options.includeAudio !== false) {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch (e) {
                log('Microphone not available, recording without mic audio.');
            }
        }

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: getSupportedMimeType(),
            videoBitsPerSecond: options.quality === 'high' ? 5000000 : 2500000
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            const recording = {
                id: crypto.randomUUID(),
                blob,
                url: URL.createObjectURL(blob),
                timestamp: new Date().toISOString(),
                duration: recordedChunks.length,
                mimeType: mediaRecorder.mimeType,
                type: 'recording'
            };
            capturedVideos.push(recording);
            log(`Recording saved (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
            isRecording = false;

            trackGlobalEvent('media_captured', { type: 'video', size: blob.size, duration: recording.duration });
            // DON'T stop the stream here — keep it alive for future captures

            // Persist to IndexedDB vault (non-blocking)
            saveMedia('video', blob, {
                mimeType: mediaRecorder.mimeType,
                chunks: recordedChunks.length,
                source: 'capture-tab'
            }).then(record => {
                recording.vaultId = record.id;
                log(`Recording persisted to vault: ${record.id}`);
            }).catch(e => log('Vault save failed: ' + e.message));
        };

        mediaRecorder.start(1000);
        isRecording = true;
        log('Recording started. Click "Stop" when done.');
        return true;
    } catch (e) {
        log('Recording failed: ' + e.message);
        isRecording = false;
        throw e;
    }
}

/**
 * Stop screen recording (stream stays alive for future use)
 */
export function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        log('Not currently recording.');
        return null;
    }

    log('Stopping recording...');
    mediaRecorder.stop();
    return new Promise((resolve) => {
        mediaRecorder.addEventListener('stop', () => {
            const latest = capturedVideos[capturedVideos.length - 1];
            resolve(latest);
        }, { once: true });
    });
}

/** Check if currently recording */
export function getRecordingState() { return isRecording; }

/** Get all captured screenshots (in-session) */
export function getScreenshots() { return capturedScreenshots; }

/** Get all captured videos (in-session) */
export function getVideos() { return capturedVideos; }

/** Get all captured assets (in-session, sorted newest first) */
export function getAllCaptures() {
    return [...capturedScreenshots, ...capturedVideos].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );
}

/**
 * Get ALL persisted captures from the vault (survives page reloads).
 * Returns metadata-only records (no blobs) for efficient listing.
 * @param {string} [type] - 'screenshot' or 'video', or null for all
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
export async function getPersistedCaptures(type = null, limit = 50) {
    try {
        return await getMediaList(type, limit);
    } catch (e) {
        log('Failed to load persisted captures: ' + e.message);
        return [];
    }
}

/** Download a captured asset */
export function downloadCapture(capture, filename) {
    const a = document.createElement('a');
    a.href = capture.url;
    a.download = filename || `viral-capture-${capture.type}-${Date.now()}.${capture.type === 'screenshot' ? 'png' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    log(`Downloaded: ${a.download}`);

    trackGlobalEvent('media_downloaded', { type: capture.type, source: 'session_cache' });
}

/** Delete a captured asset (removes from both session cache and vault) */
export function deleteCapture(id) {
    // Remove from in-session arrays
    const screenshotMatch = capturedScreenshots.find(s => s.id === id);
    const videoMatch = capturedVideos.find(v => v.id === id);
    capturedScreenshots = capturedScreenshots.filter(s => s.id !== id);
    capturedVideos = capturedVideos.filter(v => v.id !== id);

    // Also delete from vault if it was persisted
    const vaultId = screenshotMatch?.vaultId || videoMatch?.vaultId;
    if (vaultId) {
        deleteMedia(vaultId).catch(e => log('Vault delete failed: ' + e.message));
    }

    log(`Deleted capture: ${id}`);
}

/**
 * Delete a persisted capture by its vault ID.
 * @param {string} vaultId - The vault asset ID
 */
export async function deletePersistedCapture(vaultId) {
    try {
        await deleteMedia(vaultId);
        log(`Deleted persisted capture: ${vaultId}`);
    } catch (e) {
        log('Vault delete failed: ' + e.message);
    }
}

/**
 * Auto-capture series — takes multiple screenshots using the SAME stream.
 * Permission is requested only once at the start.
 */
export async function autoCaptureSeries(url, container, intervalMs = 3000, maxShots = 6) {
    log(`Starting auto-capture series: ${maxShots} shots every ${intervalMs / 1000}s`);

    loadApp(url, container);

    // Acquire the stream ONCE before the loop
    await getPersistentStream();

    // Wait for initial load
    await new Promise(r => setTimeout(r, 2000));

    const shots = [];
    for (let i = 0; i < maxShots; i++) {
        try {
            const shot = await captureScreenshot();
            shots.push(shot);
            log(`Auto-capture ${i + 1}/${maxShots} complete.`);
        } catch (e) {
            log(`Auto-capture ${i + 1} failed: ${e.message}`);
            break; // Stop the series if capture fails
        }

        if (i < maxShots - 1) {
            await new Promise(r => setTimeout(r, intervalMs));
        }
    }

    log(`Auto-capture series complete: ${shots.length} screenshots.`);
    return shots;
}

// =========================================================================
// HELPERS
// =========================================================================

function canvasToBlob(canvas) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
    });
}

function getSupportedMimeType() {
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
    ];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

function log(msg) {
    console.log('[Capture]', msg);
    if (onCaptureLog) onCaptureLog(msg);
}
