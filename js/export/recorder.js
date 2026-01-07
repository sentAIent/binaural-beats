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

            // Show modal
            els.videoModal.classList.add('active');
            els.playbackVideo.classList.add('hidden');
            els.audioOnlyPlayer.classList.remove('hidden');
            els.playbackAudio.src = URL.createObjectURL(blob);
            els.playbackAudio.play().catch(e => console.warn("Auto-play blocked", e));

            console.log('[Recording] Modal displayed');
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
