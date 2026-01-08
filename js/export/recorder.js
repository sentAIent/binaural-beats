// Simplified recorder using only MediaRecorder (no worklet complexity)
import { state, els } from '../state.js';

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
        // Use MediaRecorder with audio stream
        const mimeType = "audio/webm;codecs=opus";
        state.mediaRecorder = new MediaRecorder(state.destStreamNode.stream, { mimeType });
        state.recordedChunks = [];

        state.mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) {
                state.recordedChunks.push(e.data);
                console.log('[Recording] Chunk received:', e.data.size, 'bytes');
            }
        };

        state.mediaRecorder.onstop = () => {
            console.log('[Recording] MediaRecorder stopped, chunks:', state.recordedChunks.length);

            if (state.recordedChunks.length === 0) {
                console.error('[Recording] No chunks recorded!');
                alert("Recording failed - no audio captured");
                return;
            }

            const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });
            console.log('[Recording] Created blob:', blob.size, 'bytes');

            state.currentModalBlob = blob;
            state.currentModalIsVideo = false;
            state.currentModalName = `MindWave_${new Date().toISOString().slice(0, 10)}`;

            // Hide progress overlay that might be covering the modal
            if (els.loopProcessing) {
                els.loopProcessing.classList.add('hidden');
                console.log('[Recording] Hiding progress overlay');
            }

            // Show modal
            els.videoModal.classList.add('active');
            els.playbackVideo.classList.add('hidden');
            els.audioOnlyPlayer.classList.remove('hidden');
            els.playbackAudio.src = URL.createObjectURL(blob);

            // Don't autoplay - let user manually play/pause
            console.log('══════════════════════════════════════════════════');
            console.log('🎵 RECORDING COMPLETE! Export modal is now showing.');
            console.log('📥 Click "Export High-Res" or "Quick Save" to download');
            console.log('🔊 Use audio controls to preview before downloading');
            console.log('══════════════════════════════════════════════════');

            console.log('[Recording] Modal displayed - ready for export');
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
    console.log('📥 EXPORT STARTED - Downloading file instantly...');
    console.log('══════════════════════════════════════════════════');

    if (!state.currentModalBlob) {
        console.error('[Export] ERROR: No blob found - cannot export!');
        alert("No recording to export!");
        return;
    }

    // Hide any progress UI that might be showing
    if (els.loopProcessing) {
        els.loopProcessing.classList.add('hidden');
        console.log('[Export] Hiding progress UI');
    }

    console.log('[Export] Blob size:', state.currentModalBlob.size, 'bytes');

    // Trigger instant download
    const filename = `${state.currentModalName || 'mindwave_recording'}.webm`;
    const url = URL.createObjectURL(state.currentModalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    console.log('[Export] Triggering download for:', filename);
    a.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[Export] ✅ Download complete! File should be saved to Downloads folder');
    }, 100);
}

export function cancelExport() {
    // No-op for simplified version
    console.log('[Export] Cancel (no-op)');
}

export function updateExportPreview() {
    // No-op for simplified version
    console.log('[Export] Update preview (no-op)');
}
