// Simplified recorder using only MediaRecorder (no worklet complexity)
import { state, els } from '../state.js';
import { saveMedia } from '../services/storage-manager.js';

export function startRecording() {
    console.log('[Recording] Starting (simplified MediaRecorder mode)');

    // Update UI
    state.isRecording = true;
    els.recordBtn.classList.add('recording-active');
    els.recordBtn.innerHTML = `<div class="w-6 h-6 rounded-sm bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>`;

    // Check audio is playing
    if (!state.destStreamNode || !state.isPlaying) {
        console.error('[Recording] Audio not ready');
        alert("Start audio first!");
        state.isRecording = false;
        els.recordBtn.classList.remove('recording-active');
        els.recordBtn.innerHTML = `<div class="w-6 h-6 rounded-full bg-red-500 transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>`;
        return;
    }

    try {
        // Determine if recording video based on state.videoEnabled
        const includeVideo = state.videoEnabled && els.canvas;

        // Start with audio stream
        let tracks = [...state.destStreamNode.stream.getAudioTracks()];
        let mimeType = "audio/webm;codecs=opus";

        // Add video track if enabled
        if (includeVideo) {
            console.log('[Recording] 🎥 Video mode enabled - capturing canvas at 30fps');
            const videoStream = els.canvas.captureStream(30); // 30 FPS
            const videoTracks = videoStream.getVideoTracks();

            if (videoTracks.length > 0) {
                tracks.push(...videoTracks);
                mimeType = "video/webm";
                console.log('[Recording] ✅ Video track added:', {
                    width: els.canvas.width,
                    height: els.canvas.height,
                    fps: 30
                });
            } else {
                console.warn('[Recording] ⚠️  No video tracks available - falling back to audio only');
            }
        }

        // Create combined stream
        const combinedStream = new MediaStream(tracks);
        state.mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
        state.recordedChunks = [];

        state.mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) {
                state.recordedChunks.push(e.data);
                console.log('[Recording] Chunk received:', e.data.size, 'bytes');
            }
        };

        state.mediaRecorder.onstop = () => {
            try {
                console.log('[Recording] ⏹️  MediaRecorder stopped, chunks:', state.recordedChunks.length);

                if (state.recordedChunks.length === 0) {
                    console.error('[Recording] ❌ ERROR: No chunks recorded!');
                    alert("Recording failed - no audio captured");
                    return;
                }

                const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });
                console.log('[Recording] ✅ Created blob:', blob.size, 'bytes');

                state.currentModalBlob = blob;

                // Detect if recording contains video
                const isVideo = blob.type.startsWith('video/');
                state.currentModalIsVideo = isVideo;
                state.currentModalName = `MindWave_${new Date().toISOString().slice(0, 10)}`;
                console.log('[Recording] ✅ State updated:', {
                    blobSize: blob.size,
                    isVideo: isVideo,
                    mimeType: blob.type,
                    name: state.currentModalName
                });

                // Check overlay element
                console.log('[Recording] 🔍 Checking overlay...', {
                    exists: !!els.loopProcessing,
                    currentDisplay: els.loopProcessing?.style.display
                });

                if (els.loopProcessing) {
                    els.loopProcessing.style.display = 'none';
                    console.log('[Recording] ✅ Overlay hidden - display set to none');
                } else {
                    console.warn('[Recording] ⚠️  WARNING: loopProcessing element not found');
                }

                // Check modal elements
                console.log('[Recording] 🔍 Checking modal elements...', {
                    videoModal: !!els.videoModal,
                    playbackVideo: !!els.playbackVideo,
                    audioOnlyPlayer: !!els.audioOnlyPlayer,
                    playbackAudio: !!els.playbackAudio
                });

                if (!els.videoModal) {
                    console.error('[Recording] ❌ CRITICAL: videoModal element missing!');
                    alert('Export modal not found. Please refresh the page.');
                    return;
                }

                // Show modal
                console.log('[Recording] 📱 Activating modal...');
                els.videoModal.classList.add('active');
                console.log('[Recording] ✅ Modal activated. Classes:', els.videoModal.classList.toString());

                els.playbackVideo.classList.add('hidden');
                els.audioOnlyPlayer.classList.remove('hidden');
                console.log('[Recording] ✅ Player visibility set: video hidden, audio visible');

                const blobUrl = URL.createObjectURL(blob);
                els.playbackAudio.src = blobUrl;
                console.log('[Recording] ✅ Audio source set:', blobUrl);

                console.log('══════════════════════════════════════════════════');
                console.log('🎵 RECORDING COMPLETE! Export modal is now showing.');
                console.log('📥 Click "Export High-Res" or "Quick Save" to download');
                console.log('🔊 Use audio controls to preview before downloading');
                console.log('══════════════════════════════════════════════════');

                // Persist to IndexedDB vault (non-blocking)
                const recordingType = isVideo ? 'video' : 'audio-export';
                saveMedia(recordingType, blob, {
                    mimeType: blob.type,
                    isVideo,
                    name: state.currentModalName,
                    source: 'session-recorder'
                }).then(record => {
                    console.log(`[Recording] ✅ Persisted to vault: ${record.id}`);
                }).catch(e => {
                    console.warn('[Recording] Vault save failed:', e);
                });

                // Final verification
                setTimeout(() => {
                    console.log('[Recording] 🔍 FINAL VERIFICATION:', {
                        modalHasActiveClass: els.videoModal.classList.contains('active'),
                        overlayIsHidden: els.loopProcessing?.style.display === 'none',
                        audioPlayerNotHidden: !els.audioOnlyPlayer.classList.contains('hidden'),
                        videoPlayerIsHidden: els.playbackVideo.classList.contains('hidden'),
                        audioSrcSet: !!els.playbackAudio.src
                    });
                }, 100);

            } catch (error) {
                console.error('[Recording] ❌❌❌ CRITICAL ERROR in onstop:', error);
                console.error('[Recording] Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                alert('Recording error: ' + error.message + '\n\nCheck console for details.');
            }
        };

        state.mediaRecorder.start(100); // Collect data every 100ms
        console.log('[Recording] MediaRecorder started');

    } catch (err) {
        console.error('[Recording] Failed to start:', err);
        alert('Recording failed: ' + err.message);
        state.isRecording = false;
        els.recordBtn.classList.remove('recording-active');
        els.recordBtn.innerHTML = `<div class="w-6 h-6 rounded-full bg-red-500 transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>`;
    }
}

export function stopRecording() {
    console.log('[Recording] Stopping');
    state.isRecording = false;
    els.recordBtn.classList.remove('recording-active');
    els.recordBtn.innerHTML = `<div class="w-6 h-6 rounded-full bg-red-500 transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>`;

    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }
}

// Simple export - just downloads the blob instantly
export function startExport() {
    console.log('══════════════════════════════════════════════════');
    console.log('📥 EXPORT BUTTON WAS CLICKED!');

    if (!state.currentModalBlob) {
        console.error('[Export] ERROR: No blob found - cannot export!');
        alert("No recording to export!");
        return;
    }

    const loopCount = parseInt(els.loopCountInput?.value) || 1;
    console.log('[Export] Loop count:', loopCount);

    // FAST PATH: Single recording - instant download
    if (loopCount === 1) {
        console.log('📥 FAST PATH: Instant download for single recording');
        downloadInstantly();
        return;
    }

    // WORKER PATH: Multiple loops - use worker for processing
    console.log('🔄 WORKER PATH: Processing', loopCount, 'loops with worker');
    processWithWorker(loopCount);
}

// Fast path: instant download (current behavior)
function downloadInstantly() {
    console.log('📥 Starting instant download...');

    const filename = `${state.currentModalName || 'mindwave_recording'}.webm`;
    const url = URL.createObjectURL(state.currentModalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    console.log('[Export] Triggering download for:', filename);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[Export] ✅ Download complete! File should be saved to Downloads folder');
    }, 100);
}

// Worker path: process with loops and format conversion
async function processWithWorker(loopCount) {
    console.log('[Export Worker] Initializing for', loopCount, 'loops...');

    try {
        // Show progress UI
        if (els.loopProcessing) {
            els.loopProcessing.style.display = 'flex';
            updateProgress('Preparing', 'Converting audio...', 0);
        }

        // Convert blob to audio buffer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await state.currentModalBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log('[Export Worker] Audio decoded:', {
            channels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration
        });

        // Extract channels as Float32Arrays
        let leftChannel = audioBuffer.getChannelData(0);
        let rightChannel = audioBuffer.numberOfChannels > 1
            ? audioBuffer.getChannelData(1)
            : leftChannel;

        // TRIM SILENCE from start and end to ensure seamless loops
        const silenceThreshold = 0.01; // Amplitude threshold for silence
        let start = 0;
        let end = leftChannel.length - 1;

        // Find first non-silent sample
        for (let i = 0; i < leftChannel.length; i++) {
            if (Math.abs(leftChannel[i]) > silenceThreshold || Math.abs(rightChannel[i]) > silenceThreshold) {
                start = i;
                break;
            }
        }

        // Find last non-silent sample
        for (let i = leftChannel.length - 1; i >= 0; i--) {
            if (Math.abs(leftChannel[i]) > silenceThreshold || Math.abs(rightChannel[i]) > silenceThreshold) {
                end = i;
                break;
            }
        }

        // Trim to non-silent region
        if (start > 0 || end < leftChannel.length - 1) {
            leftChannel = leftChannel.subarray(start, end + 1);
            rightChannel = rightChannel.subarray(start, end + 1);
            console.log('[Export Worker] ✂️  Trimmed silence:', {
                originalLength: audioBuffer.length,
                trimmedLength: leftChannel.length,
                removedFromStart: start,
                removedFromEnd: audioBuffer.length - end - 1
            });
        } else {
            console.log('[Export Worker] No silence detected - audio is clean');
        }

        // Split into chunks for worker (send smaller chunks)
        const chunkSize = 44100; // 1 second chunks
        const chunks = [];
        for (let i = 0; i < leftChannel.length; i += chunkSize) {
            const end = Math.min(i + chunkSize, leftChannel.length);
            chunks.push([
                Array.from(leftChannel.subarray(i, end)),
                Array.from(rightChannel.subarray(i, end))
            ]);
        }

        console.log('[Export Worker] Created', chunks.length, 'chunks');
        updateProgress('Processing', 'Initializing worker...', 5);

        // Initialize worker
        const worker = new Worker('js/export/export-worker.js');
        let workerTimeout;

        worker.onmessage = function (e) {
            const { type, step, detail, percent, buffer, mimeType, ext } = e.data;

            if (type === 'progress') {
                updateProgress(step, detail, percent);
            } else if (type === 'complete') {
                clearTimeout(workerTimeout);
                console.log('[Export Worker] ✅ Complete! Size:', buffer.byteLength, 'bytes');

                const blob = new Blob([buffer], { type: mimeType || 'audio/wav' });
                const filename = `${state.currentModalName || 'mindwave'}_x${loopCount}.${ext || 'wav'}`;

                // Download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    if (els.loopProcessing) els.loopProcessing.style.display = 'none';
                    console.log('[Export Worker] ✅ Download complete!');
                    worker.terminate();
                }, 100);
            } else if (type === 'error') {
                clearTimeout(workerTimeout);
                console.error('[Export Worker] ❌ Error:', e.data.message);
                alert('Export failed: ' + e.data.message);
                if (els.loopProcessing) els.loopProcessing.style.display = 'none';
                worker.terminate();
            }
        };

        worker.onerror = function (error) {
            clearTimeout(workerTimeout);
            console.error('[Export Worker] ❌ Worker error:', error);
            alert('Export worker crashed. Please try again.');
            if (els.loopProcessing) els.loopProcessing.style.display = 'none';
            worker.terminate();
        };

        // Set 60s timeout
        workerTimeout = setTimeout(() => {
            console.error('[Export Worker] ❌ Timeout after 60s');
            alert('Export timed out. Try reducing loop count.');
            if (els.loopProcessing) els.loopProcessing.style.display = 'none';
            worker.terminate();
        }, 60000);

        // Send to worker
        const format = els.formatSelect?.value || 'wav-16';
        worker.postMessage({
            type: 'export',
            chunks: chunks,
            format: format,
            loopCount: loopCount,
            sampleRate: audioBuffer.sampleRate
        });

        console.log('[Export Worker] ✅ Job sent to worker');

    } catch (error) {
        console.error('[Export Worker] ❌ Setup error:', error);
        alert('Failed to process audio: ' + error.message);
        if (els.loopProcessing) els.loopProcessing.style.display = 'none';
    }
}

// Helper to update progress UI
function updateProgress(step, detail, percent) {
    if (els.progressStep) els.progressStep.textContent = step;
    if (els.progressDetail) els.progressDetail.textContent = detail;
    if (els.progressFill) els.progressFill.style.width = percent + '%';
    if (els.progressPercent) els.progressPercent.textContent = percent + '% ';
    console.log(`[Export Worker] Progress: ${percent}% - ${step}: ${detail}`);
}

export function cancelExport() {
    // No-op for simplified version
    console.log('[Export] Cancel (no-op)');
}

export function updateExportPreview() {
    // No-op for simplified version
    console.log('[Export] Update preview (no-op)');
}
