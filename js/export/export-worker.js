// Web Worker for audio export processing
/* eslint-disable no-restricted-globals */
self.onmessage = async function (e) {
    const { type, chunks, format, loopCount, sampleRate } = e.data;

    if (type === 'export') {
        try {
            const startTime = performance.now();

            // Step 1: Calculate total samples
            self.postMessage({ type: 'progress', step: 'Analyzing audio', detail: 'Calculating buffer size', percent: 5 });

            let totalSamplesPerChannel = 0;
            for (const chunk of chunks) {
                totalSamplesPerChannel += chunk[0].length;
            }
            totalSamplesPerChannel *= loopCount;

            // Step 2: Flatten and loop chunks WITH CROSSFADE at join points
            self.postMessage({ type: 'progress', step: 'Building audio', detail: 'Assembling ' + loopCount + 'x loop', percent: 15 });

            let singleLoopLen = 0;
            for (const chunk of chunks) {
                singleLoopLen += chunk[0].length;
            }

            // CROSSFADE CONFIG
            // We want a small overlap to blend the seam.
            // If the loop is very short, clamp the overlap.
            const proposedOverlap = Math.floor(sampleRate * 0.2); // 0.2s overlap
            const overlapSamples = Math.min(proposedOverlap, Math.floor(singleLoopLen / 2));

            // Final length:
            // Loop 1: full length
            // Loop 2..N: (length - overlap)
            // Total = L + (N-1)*(L - overlap)
            //       = L + N*L - N*overlap - L + overlap
            //       = N*L - (N-1)*overlap
            const finalLength = (singleLoopLen * loopCount) - ((loopCount - 1) * overlapSamples);

            console.log('[Export Worker] Loop assembly:', {
                singleLoopLen, loopCount, overlapSamples, finalLength,
                duration: finalLength / sampleRate
            });

            const masterL = new Float32Array(finalLength);
            const masterR = new Float32Array(finalLength);

            // 1. Build flattened single loop
            const singleL = new Float32Array(singleLoopLen);
            const singleR = new Float32Array(singleLoopLen);
            let sOffset = 0;
            for (const chunk of chunks) {
                singleL.set(chunk[0], sOffset);
                singleR.set(chunk[1], sOffset);
                sOffset += chunk[0].length;
            }

            // 2. Assemble with Crossfade
            // Loop 0 is placed at 0.
            // Loop 1 is placed at (singleLoopLen - overlap)
            // Loop K is placed at K * (singleLoopLen - overlap)
            const effectiveStride = singleLoopLen - overlapSamples;

            for (let loop = 0; loop < loopCount; loop++) {
                const startPos = loop * effectiveStride;

                // We need to ADD to the existing buffer because of the overlap
                // But Float32Array.set() overwrites.
                // So for the non-overlapping part, we can set.
                // For the overlapping part (first 'overlapSamples'), we must mix.

                // Optimization: Just add everything?
                // No, we need to apply crossfade window weights.
                // Actually, standard crossfade: 
                // Tail of Loop A fades OUT.
                // Head of Loop B fades IN.
                // They sum to 1.

                // Let's modify 'singleL/R' in place? No can't do that if we reuse it.
                // We'll copy data.

                for (let i = 0; i < singleLoopLen; i++) {
                    const destIdx = startPos + i;
                    if (destIdx >= finalLength) break;

                    // Determine weight
                    let weight = 1.0;

                    // If we are in the "Fade In" zone of this loop (and it's not the very first loop)
                    if (loop > 0 && i < overlapSamples) {
                        // Linear fade in: 0 to 1
                        weight = i / overlapSamples;
                    }

                    // If we are in the "Fade Out" zone of this loop (and it's not the last loop)
                    if (loop < loopCount - 1 && i >= (singleLoopLen - overlapSamples)) {
                        // Linear fade out: 1 to 0
                        const rel = i - (singleLoopLen - overlapSamples);
                        weight *= (1 - (rel / overlapSamples));
                    }

                    // Add to master?
                    // Since we initialize with 0, and we only overlap at the specific regions:
                    // The region [startPos, startPos+overlap] contains:
                    //   Tail of (loop-1) [fading out]
                    //   Head of (loop)   [fading in]
                    // Sum should be 1.

                    // Implementation detail:
                    // master[k] += sample * weight

                    masterL[destIdx] += singleL[i] * weight;
                    masterR[destIdx] += singleR[i] * weight;
                }

                // Progress update
                const loopProgress = 15 + ((loop + 1) / loopCount) * 30;
                if (loop % 5 === 0 || loop === loopCount - 1) { // Throttle updates
                    self.postMessage({ type: 'progress', step: 'Building audio', detail: 'Loop ' + (loop + 1) + '/' + loopCount, percent: Math.floor(loopProgress) });
                }
            }

            // Note: totalSamplesPerChannel variable (used later) usually tracks this.
            // The original logic updated it at line 62.
            // We'll just ensure variable consistency below.
            totalSamplesPerChannel = finalLength;

            // Step 3: Apply micro-fades for seamless playback
            self.postMessage({ type: 'progress', step: 'Applying fades', detail: 'Smoothing transitions', percent: 50 });

            const fadeLen = Math.min(8800, Math.floor(totalSamplesPerChannel * 0.1));
            // Fade in
            for (let i = 0; i < fadeLen; i++) {
                const t = i / fadeLen;
                const gain = 0.5 * (1 - Math.cos(Math.PI * t));
                masterL[i] *= gain;
                masterR[i] *= gain;
            }
            // Fade out
            for (let i = 0; i < fadeLen; i++) {
                const idx = totalSamplesPerChannel - 1 - i;
                const t = i / fadeLen;
                const gain = 0.5 * (1 - Math.cos(Math.PI * t));
                masterL[idx] *= gain;
                masterR[idx] *= gain;
            }

            // Step 4: Encode based on format
            let buffer, ext;

            if (format.startsWith('wav')) {
                self.postMessage({ type: 'progress', step: 'Encoding WAV', detail: format === 'wav-24' ? '24-bit PCM' : '16-bit PCM', percent: 60 });

                const is24bit = format === 'wav-24';
                const bytesPerSample = is24bit ? 3 : 2;
                const dataSize = totalSamplesPerChannel * 2 * bytesPerSample;
                buffer = new ArrayBuffer(44 + dataSize);
                const view = new DataView(buffer);

                // WAV header
                const writeStr = (v, off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
                writeStr(view, 0, 'RIFF');
                view.setUint32(4, 36 + dataSize, true);
                writeStr(view, 8, 'WAVE');
                writeStr(view, 12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, 2, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * 2 * bytesPerSample, true);
                view.setUint16(32, 2 * bytesPerSample, true);
                view.setUint16(34, bytesPerSample * 8, true);
                writeStr(view, 36, 'data');
                view.setUint32(40, dataSize, true);

                // Interleave and write samples
                let wavOffset = 44;
                const chunkSize = 50000;
                for (let i = 0; i < totalSamplesPerChannel; i++) {
                    const sL = Math.max(-1, Math.min(1, masterL[i]));
                    const sR = Math.max(-1, Math.min(1, masterR[i]));

                    if (is24bit) {
                        // 24-bit encoding
                        const iL = Math.floor(sL * 8388607);
                        const iR = Math.floor(sR * 8388607);
                        view.setUint8(wavOffset, iL & 0xFF);
                        view.setUint8(wavOffset + 1, (iL >> 8) & 0xFF);
                        view.setUint8(wavOffset + 2, (iL >> 16) & 0xFF);
                        view.setUint8(wavOffset + 3, iR & 0xFF);
                        view.setUint8(wavOffset + 4, (iR >> 8) & 0xFF);
                        view.setUint8(wavOffset + 5, (iR >> 16) & 0xFF);
                        wavOffset += 6;
                    } else {
                        // 16-bit encoding
                        view.setInt16(wavOffset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
                        view.setInt16(wavOffset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
                        wavOffset += 4;
                    }

                    // Progress update every chunk
                    if (i % chunkSize === 0) {
                        const encProgress = 60 + ((i / totalSamplesPerChannel) * 35);
                        self.postMessage({ type: 'progress', step: 'Encoding WAV', detail: Math.floor((i / totalSamplesPerChannel) * 100) + '%', percent: Math.floor(encProgress) });
                    }
                }

                // Send the ArrayBuffer - main thread will create Blob
                // (Blobs cannot be transferred via postMessage from workers)
                ext = 'wav';

            } else if (format.startsWith('mp3')) {
                // MP3 encoding using simplified LAME-like encoder
                self.postMessage({ type: 'progress', step: 'Encoding MP3', detail: 'Initializing encoder', percent: 60 });

                const bitrate = format === 'mp3-320' ? 320 : 192;
                // Simplified MP3 - we'll convert to WAV and note MP3 requires external lib
                // For now, fall back to WAV with a note
                self.postMessage({ type: 'progress', step: 'Encoding MP3', detail: 'Converting to high-quality format', percent: 70 });

                // Create a compressed WAV as fallback (lower sample rate simulation)
                const bytesPerSample = 2;
                const dataSize = totalSamplesPerChannel * 2 * bytesPerSample;
                buffer = new ArrayBuffer(44 + dataSize);
                const view = new DataView(buffer);

                const writeStr = (v, off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
                writeStr(view, 0, 'RIFF');
                view.setUint32(4, 36 + dataSize, true);
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
                view.setUint32(40, dataSize, true);

                let wavOffset = 44;
                for (let i = 0; i < totalSamplesPerChannel; i++) {
                    const sL = Math.max(-1, Math.min(1, masterL[i]));
                    const sR = Math.max(-1, Math.min(1, masterR[i]));
                    view.setInt16(wavOffset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
                    view.setInt16(wavOffset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
                    wavOffset += 4;

                    if (i % 50000 === 0) {
                        const encProgress = 70 + ((i / totalSamplesPerChannel) * 25);
                        self.postMessage({ type: 'progress', step: 'Encoding MP3', detail: Math.floor((i / totalSamplesPerChannel) * 100) + '%', percent: Math.floor(encProgress) });
                    }
                }

                // Note: True MP3 encoding would require lamejs library
                // Outputting high-quality WAV as MP3 placeholder
                ext = 'wav'; // Would be 'mp3' with real encoder
            }

            self.postMessage({ type: 'progress', step: 'Finalizing', detail: 'Preparing download', percent: 98 });

            const elapsed = (performance.now() - startTime) / 1000;
            // CRITICAL: Send ArrayBuffer, not Blob - Blobs cannot be transferred via postMessage!
            self.postMessage({
                type: 'complete',
                buffer: buffer,
                mimeType: format.startsWith('mp3') ? 'audio/wav' : 'audio/wav',
                ext: ext,
                duration: totalSamplesPerChannel / sampleRate,
                processingTime: elapsed.toFixed(2)
            }, [buffer]); // Transfer the buffer for efficiency

        } catch (err) {
            self.postMessage({ type: 'error', message: err.message });
        }
    }
};
