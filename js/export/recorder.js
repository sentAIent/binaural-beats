import { state, els } from '../state.js';
import { formatDuration } from '../utils/helpers.js';

let exportWorker = null;
let exportCancelled = false;
let exportStartTime = 0;

// --- EXPORT QUEUE ---
const exportQueue = [];
let isProcessingQueue = false;
let currentQueueIndex = 0;

export function initExportWorker() {
    if (!exportWorker) {
        try {
            console.log('[Export] Initializing worker...');
            // Use relative path for subdirectory deployment compatibility
            const workerUrl = new URL('./js/export/export-worker.js', window.location.href).href;
            console.log('[Export] Worker URL:', workerUrl);
            exportWorker = new Worker(workerUrl);
            console.log('[Export] Worker created successfully');

            exportWorker.onmessage = function (e) {
                console.log('[Export] Worker message received:', e.data?.type);
                const { type, step, detail, percent, buffer, mimeType, ext, duration, processingTime, message } = e.data;

                if (exportCancelled) return;

                if (type === 'progress') {
                    updateExportProgress(step, detail, percent);
                } else if (type === 'complete') {
                    console.log('[Export] Worker complete:', {
                        bufferType: buffer?.constructor?.name,
                        bufferSize: buffer?.byteLength,
                        mimeType, ext, duration, processingTime
                    });

                    if (!buffer || buffer.byteLength === 0) {
                        console.error('[Export] ERROR: Buffer is empty or undefined!');
                        alert('Export error: Audio buffer is empty');
                        hideExportProgress();
                        return;
                    }

                    const blob = new Blob([buffer], { type: mimeType || 'audio/wav' });
                    console.log('[Export] Created blob:', { size: blob.size, type: blob.type });
                    finishExport(blob, ext, duration, processingTime);
                } else if (type === 'error') {
                    console.error('[Export] Worker error:', message);
                    alert('Export error: ' + message);
                    hideExportProgress();
                }
            };

            exportWorker.onerror = function (e) {
                console.error('[Export] Worker error event:', e);
                alert('Export failed: ' + (e.message || 'Unknown worker error'));
                hideExportProgress();
            };
        } catch (err) {
            console.error('[Export] Failed to create worker:', err);
            alert('Export not available: ' + err.message);
        }
    }
}

export function startRecording() {
    console.log("startRecording called");
    if (!state.destStreamNode) {
        console.error("Recording blocked: destStreamNode missing. Has audio started?");
        alert("Audio not ready. Please play first.");
        return;
    }

    let tracks = [...state.destStreamNode.stream.getAudioTracks()];
    const includeVideo = state.videoEnabled;
    let mimeType = "video/webm";
    if (includeVideo) {
        if (MediaRecorder.isTypeSupported("video/mp4")) mimeType = "video/mp4";
        else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) mimeType = "video/webm;codecs=vp9";

        tracks = [...tracks, ...els.canvas.captureStream(30).getVideoTracks()];
        try {
            const options = { mimeType, videoBitsPerSecond: 8000000 };
            state.mediaRecorder = new MediaRecorder(new MediaStream(tracks), options);
        } catch (e) {
            console.warn("MediaRecorder fallback", e);
            state.mediaRecorder = new MediaRecorder(new MediaStream(tracks));
        }

        state.recordedChunks = [];
        state.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) state.recordedChunks.push(e.data); };
        state.mediaRecorder.onstop = () => {
            state.currentModalBlob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });
            state.currentModalIsVideo = true;
            state.currentModalName = `MindWave_Video_${new Date().toISOString().slice(0, 10)}`;

            els.playbackVideo.src = URL.createObjectURL(state.currentModalBlob);
            els.playbackVideo.classList.remove('hidden');
            els.audioOnlyPlayer.classList.add('hidden');
            els.videoModal.classList.add('active');
            els.playbackVideo.play().catch(e => console.warn("Video auto-play blocked", e));
        };

        const now = state.audioCtx.currentTime;
        if (state.videoCaptureGain) {
            state.videoCaptureGain.gain.setValueAtTime(1, now);
        }

        state.mediaRecorder.start();
    } else {
        // RAW AUDIO CAPTURE
        state.recordedBuffers = [];

        if (!state.workletNode) {
            console.warn("AudioWorklet not initialized, falling back to MediaRecorder");
            const audioMimeType = "audio/webm;codecs=opus";
            try {
                state.mediaRecorder = new MediaRecorder(state.destStreamNode.stream, { mimeType: audioMimeType });
            } catch (e) {
                state.mediaRecorder = new MediaRecorder(state.destStreamNode.stream);
            }

            state.recordedChunks = [];
            state.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) state.recordedChunks.push(e.data); };
            state.mediaRecorder.onstop = () => {
                state.currentModalBlob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });
                state.currentModalIsVideo = false;
                state.currentModalName = `MindWave_Audio_${new Date().toISOString().slice(0, 10)}`;

                els.playbackAudio.src = URL.createObjectURL(state.currentModalBlob);
                els.playbackVideo.classList.add('hidden');
                els.audioOnlyPlayer.classList.remove('hidden');
                els.videoModal.classList.add('active');
                els.playbackAudio.play().catch(e => console.warn("Audio auto-play blocked", e));
                updateExportPreview();
            };

            const now = state.audioCtx.currentTime;
            if (state.videoCaptureGain) {
                state.videoCaptureGain.gain.setValueAtTime(1, now);
            }

            state.mediaRecorder.start();
        } else {
            console.log("Worklet node exists, connecting...");
            state.workletNode.port.onmessage = (e) => {
                if (!state.isRecording) return;
                state.recordedBuffers.push(e.data);
            };

            try {
                state.masterCompressor.connect(state.workletNode);
                state.workletNode.connect(state.audioCtx.destination);
                console.log("Worklet connected");
            } catch (e) {
                console.error("Worklet connection failed:", e);
                alert("Recording setup failed. Please refresh the page.");
                return;
            }
        }

        state.currentModalIsVideo = false;
        state.currentModalName = `MindWave_Audio_${new Date().toISOString().slice(0, 10)}`;
    }

    state.isRecording = true;
    els.recordBtn.classList.add('recording-active');
    // Switch to STOP Square
    els.recordBtn.innerHTML = `<div class="w-6 h-6 rounded-sm bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>`;
}

export function stopRecording() {
    state.isRecording = false;
    els.recordBtn.classList.remove('recording-active');
    // Switch back to RECORD Circle
    els.recordBtn.innerHTML = `<div class="w-6 h-6 rounded-full bg-red-500 transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>`;

    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        const now = state.audioCtx.currentTime;
        if (state.videoCaptureGain) {
            state.videoCaptureGain.gain.cancelScheduledValues(now);
            state.videoCaptureGain.gain.setValueAtTime(1, now);
            state.videoCaptureGain.gain.linearRampToValueAtTime(0, now + 0.2);
        }

        setTimeout(() => {
            if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') state.mediaRecorder.stop();
        }, 300);
        return;
    }

    // Handle Worklet-based audio recording
    if (state.workletNode) {
        try {
            state.masterCompressor.disconnect(state.workletNode);
            state.workletNode.disconnect();
        } catch (e) { }
    }

    // Process Raw Buffers
    state.cleanRecordedBuffers = [];
    if (state.recordedBuffers.length > 0) {
        // Discard first 2 and last 2 chunks to avoid clicks
        if (state.recordedBuffers.length > 4) {
            state.cleanRecordedBuffers = state.recordedBuffers.slice(2, state.recordedBuffers.length - 2);
        } else {
            state.cleanRecordedBuffers = [...state.recordedBuffers];
        }

        // Calculate duration
        const totalSamples = state.cleanRecordedBuffers.reduce((acc, c) => acc + c[0].length, 0);
        state.currentRecordingDuration = totalSamples / state.audioCtx.sampleRate;
        console.log(`[Recording] Clean buffers: ${state.cleanRecordedBuffers.length}, Duration: ${state.currentRecordingDuration.toFixed(2)}s`);

        // Create a separate copy for the preview that WE DO FADE
        // This ensures the export sees the RAW UNTOUCHED audio for seamless looping
        const previewChunks = state.cleanRecordedBuffers.map(c => [new Float32Array(c[0]), new Float32Array(c[1])]);
        applyMicroFade(previewChunks);

        // Create Blob from raw data for immediate playback (Preview)
        // We'll just flatten it to a simple WAV for the preview player
        const tempBlob = createWavFromRaw(previewChunks, state.audioCtx.sampleRate);
        state.currentModalBlob = tempBlob;

        els.playbackAudio.src = URL.createObjectURL(state.currentModalBlob);
        els.playbackVideo.classList.add('hidden');
        els.audioOnlyPlayer.classList.remove('hidden');
        els.videoModal.classList.add('active');
        els.playbackAudio.play().catch(e => console.warn("Audio auto-play blocked", e));

        updateExportPreview();
    }
}

function applyMicroFade(chunks) {
    if (chunks.length === 0) return;
    const fadeLen = 8800; // ~200ms

    // Fade In
    let samplesFaded = 0;
    for (let c = 0; c < chunks.length; c++) {
        const chunkL = chunks[c][0];
        const chunkR = chunks[c][1];
        for (let i = 0; i < chunkL.length; i++) {
            if (samplesFaded >= fadeLen) break;
            const t = samplesFaded / fadeLen;
            const gain = 0.5 * (1 - Math.cos(Math.PI * t));
            chunkL[i] *= gain; chunkR[i] *= gain;
            samplesFaded++;
        }
        if (samplesFaded >= fadeLen) break;
    }

    // Fade Out
    samplesFaded = 0;
    for (let c = chunks.length - 1; c >= 0; c--) {
        const chunkL = chunks[c][0];
        const chunkR = chunks[c][1];
        for (let i = chunkL.length - 1; i >= 0; i--) {
            if (samplesFaded >= fadeLen) break;
            const t = samplesFaded / fadeLen;
            const gain = 0.5 * (1 - Math.cos(Math.PI * t));
            chunkL[i] *= gain; chunkR[i] *= gain;
            samplesFaded++;
        }
        if (samplesFaded >= fadeLen) break;
    }
}

function createWavFromRaw(chunks, sampleRate) {
    let totalLen = 0;
    for (let c of chunks) totalLen += c[0].length;

    // Create mono/stereo buffers
    const masterL = new Float32Array(totalLen);
    const masterR = new Float32Array(totalLen);

    let offset = 0;
    for (let c of chunks) {
        masterL.set(c[0], offset);
        masterR.set(c[1], offset);
        offset += c[0].length;
    }

    const buffer = new ArrayBuffer(44 + totalLen * 4);
    const view = new DataView(buffer);

    const writeStr = (v, off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalLen * 4, true);
    writeStr(view, 8, 'WAVE');
    writeStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeStr(view, 36, 'data');
    view.setUint32(40, totalLen * 4, true);

    let wavOffset = 44;
    for (let i = 0; i < totalLen; i++) {
        const sL = Math.max(-1, Math.min(1, masterL[i]));
        const sR = Math.max(-1, Math.min(1, masterR[i]));
        view.setInt16(wavOffset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
        view.setInt16(wavOffset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
        wavOffset += 4;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

export function downloadFile(blob, name, ext) {
    console.log('[Download] Starting download:', { name, ext, blobSize: blob?.size });
    if (!blob || blob.size === 0) {
        console.error('[Download] ERROR: Blob is empty or undefined!');
        alert('Error: Audio file is empty. Please try recording again.');
        return;
    }
    const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    const url = URL.createObjectURL(blob);
    console.log('[Download] Created URL:', url, 'Filename:', filename);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none;';
    document.body.appendChild(a);

    // Trigger click immediately without requestAnimationFrame
    console.log('[Download] Triggering click...');
    a.click();
    console.log('[Download] Click triggered, file should be downloading');

    // Cleanup after reasonable time
    setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[Download] Cleaned up');
    }, 10000);
}

export function startExport() {
    // Monetization Check Removed - All users have access
    // const tier = state.userTier || 'free';

    const count = parseInt(els.loopCountInput.value) || 1;
    const format = els.formatSelect ? els.formatSelect.value : 'wav-16';
    const baseName = state.currentModalName || "mindwave_recording";

    showExportProgress();

    if (state.currentModalIsVideo) {
        if (!state.currentModalBlob) {
            alert("Video data missing.");
            hideExportProgress();
            return;
        }
        // Disabled alert per user request: if (count > 1) alert("Note: Seamless looping is currently available for Audio Only mode. Downloading original video file.");
        updateExportProgress('Downloading', 'Saving Video...', 100);
        downloadFile(state.currentModalBlob, baseName, 'webm');
        hideExportProgress();
        return;
    }

    initExportWorker();

    let chunksSource = state.cleanRecordedBuffers;
    if (!chunksSource || chunksSource.length === 0) {
        // Fallback: If we have a blob (from MediaRecorder fallback), download it directly
        if (state.currentModalBlob) {
            console.warn("High quality buffer missing, downloading compressed fallback.");
            updateExportProgress('Downloading', 'Saving Audio...', 100);
            downloadFile(state.currentModalBlob, baseName, 'webm'); // Likely webm/opus
            hideExportProgress();
            return;
        }

        alert("No high quality audio data available.");
        hideExportProgress();
        return;
    }

    // Convert Float32Arrays to regular arrays for reliable worker transfer
    console.log('[Export] Preparing chunks for worker:', {
        chunksCount: chunksSource.length,
        firstChunkLength: chunksSource[0]?.[0]?.length,
        sampleRate: state.audioCtx.sampleRate
    });

    // Serialize chunks as plain arrays for worker transfer
    const serializedChunks = chunksSource.map(chunk => [
        Array.from(chunk[0]),
        Array.from(chunk[1])
    ]);

    console.log('[Export] Sending to worker with', serializedChunks.length, 'chunks');

    // Trigger Worker
    exportWorker.postMessage({
        type: 'export',
        chunks: serializedChunks,
        format: format,
        loopCount: count,
        sampleRate: state.audioCtx.sampleRate
    });
}

export function cancelExport() {
    exportCancelled = true;
    if (exportWorker) {
        exportWorker.terminate();
        exportWorker = null; // Reset to force re-init
    }
    hideExportProgress();
}

function showExportProgress() {
    els.loopProcessing.classList.remove('hidden');
    exportCancelled = false;
    exportStartTime = Date.now();
    updateExportProgress('Preparing export', 'Initializing...', 0);
}

function hideExportProgress() {
    els.loopProcessing.classList.add('hidden');
    if (els.progressFill) els.progressFill.style.width = '0%';
}

function updateExportProgress(step, detail, percent) {
    if (els.progressStep) els.progressStep.textContent = step;
    if (els.progressDetail) els.progressDetail.textContent = detail;
    if (els.progressFill) els.progressFill.style.width = percent + '%';
    if (els.progressPercent) els.progressPercent.textContent = percent + '%';

    if (exportStartTime && percent > 5) {
        const elapsed = (Date.now() - exportStartTime) / 1000;
        const remaining = (elapsed / percent) * (100 - percent);
        if (els.progressEta) {
            els.progressEta.textContent = remaining < 60 ? Math.ceil(remaining) + 's' : Math.ceil(remaining / 60) + 'm remaining';
        }
    }
}

function finishExport(blob, ext, duration, processingTime) {
    const baseName = state.currentModalName || "mindwave_recording";
    const count = parseInt(els.loopCountInput.value) || 1;
    const format = els.formatSelect ? els.formatSelect.value : 'wav-16';

    let fileName = baseName;
    if (count > 1) fileName += `_x${count}`;
    fileName += `_${format.replace('-', '')}`;

    downloadFile(blob, fileName, ext);
    hideExportProgress();
}

// Helper for UI Updates
export function updateExportPreview() {
    if (!state.currentModalBlob || state.currentModalIsVideo) return;
    const count = parseInt(els.loopCountInput.value) || 1;
    const format = els.formatSelect ? els.formatSelect.value : 'wav-16';
    let duration = state.currentRecordingDuration;

    if (!duration || duration <= 0) {
        const audio = els.playbackAudio;
        if (audio && !isNaN(audio.duration) && audio.duration > 0) duration = audio.duration;
    }

    if (!duration || duration <= 0) {
        if (els.durationText) els.durationText.textContent = '--:--';
        if (els.sizeText) els.sizeText.textContent = '~? MB';
        return;
    }

    const totalDuration = duration * count;
    if (els.durationText) els.durationText.textContent = formatDuration(totalDuration);

    // Estimate size logic moved here or simplified?
    // I already have estimateFileSize in HTML. I should copy it here or use a simplified one.
    // I'll implement a simple one.
    if (els.sizeText) {
        let bytesPerSec = 44100 * 2 * 2; // 16-bit
        if (format === 'wav-24') bytesPerSec = 44100 * 2 * 3;
        else if (format.includes('mp3')) bytesPerSec = 320000 / 8; // approx
        const bytes = totalDuration * bytesPerSec;
        els.sizeText.textContent = '~' + (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

export function getBlobDuration(blob) {
    return new Promise(resolve => {
        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(blob);
        audio.onloadedmetadata = () => { resolve(audio.duration); };
        audio.onerror = () => resolve(0);
    });
}

// --- EXPORT QUEUE FUNCTIONS ---

// Add an export job to the queue
export function addToExportQueue(config) {
    const job = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: config.name || 'Export',
        format: config.format || 'wav-16',
        loopCount: config.loopCount || 1,
        chunks: config.chunks,
        sampleRate: config.sampleRate || 44100,
        status: 'pending'
    };
    exportQueue.push(job);
    console.log(`[ExportQueue] Added job ${job.id}:`, job.name);
    return job.id;
}

// Get current queue status
export function getExportQueueStatus() {
    return {
        total: exportQueue.length,
        completed: exportQueue.filter(j => j.status === 'completed').length,
        pending: exportQueue.filter(j => j.status === 'pending').length,
        processing: isProcessingQueue,
        currentIndex: currentQueueIndex
    };
}

// Process all jobs in queue
export function processExportQueue(onProgress, onComplete) {
    if (isProcessingQueue) {
        console.warn('[ExportQueue] Already processing');
        return;
    }
    if (exportQueue.length === 0) {
        console.log('[ExportQueue] Queue is empty');
        if (onComplete) onComplete();
        return;
    }

    isProcessingQueue = true;
    currentQueueIndex = 0;

    initExportWorker();

    function processNext() {
        if (currentQueueIndex >= exportQueue.length) {
            isProcessingQueue = false;
            console.log('[ExportQueue] All jobs completed');
            if (onComplete) onComplete();
            exportQueue.length = 0; // Clear queue
            return;
        }

        const job = exportQueue[currentQueueIndex];
        job.status = 'processing';

        if (onProgress) {
            onProgress({
                current: currentQueueIndex + 1,
                total: exportQueue.length,
                name: job.name
            });
        }

        // Create a one-time message handler for this job
        const originalHandler = exportWorker.onmessage;
        exportWorker.onmessage = function (e) {
            const { type, buffer, mimeType, ext, duration, processingTime, step, detail, percent } = e.data;

            if (type === 'progress') {
                // Update progress
                updateExportProgress(step, detail, percent);
            } else if (type === 'complete') {
                job.status = 'completed';
                const blob = new Blob([buffer], { type: mimeType || 'audio/wav' });

                // Download this job
                const filename = `${job.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${job.format}`;
                downloadFile(blob, filename, ext);

                // Process next job
                currentQueueIndex++;
                setTimeout(processNext, 500); // Small delay between downloads
            } else if (type === 'error') {
                job.status = 'error';
                console.error('[ExportQueue] Job failed:', job.name, e.data.message);
                currentQueueIndex++;
                setTimeout(processNext, 100);
            }
        };

        // Start export
        exportWorker.postMessage({
            type: 'export',
            chunks: job.chunks,
            format: job.format,
            loopCount: job.loopCount,
            sampleRate: job.sampleRate
        });
    }

    processNext();
}

// Clear the queue
export function clearExportQueue() {
    exportQueue.length = 0;
    isProcessingQueue = false;
    currentQueueIndex = 0;
}
