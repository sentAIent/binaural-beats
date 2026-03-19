/**
 * Offline Audio Manager
 * Handles caching and retrieving binary audio files (like Classical music)
 * into IndexedDB for true offline Web Playback.
 */

const DB_NAME = 'MindWave_OfflineAudio';
const DB_VERSION = 1;
const STORE_NAME = 'audio_cache';

let dbInstance = null;

export async function initOfflineStorage() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (e) => {
            console.error('[Offline Audio] IndexedDB Init Error:', e);
            reject(request.error);
        };

        request.onsuccess = (e) => {
            dbInstance = e.target.result;
            console.log('[Offline Audio] Storage Ready');
            resolve(dbInstance);
        };

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'url' });
            }
        };
    });
}

/**
 * Download and cache an audio file into IndexedDB
 * @param {string} url - The URL of the audio file to cache
 * @param {function} onProgress - Callback for progress (0-100)
 * @returns {Promise<boolean>} Success status
 */
export async function cacheAudioOffline(url, onProgress = null) {
    try {
        const db = await initOfflineStorage();

        console.log(`[Offline Audio] Fetching ${url}...`);

        // 1. Fetch the binary data
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);

        // 2. Track download progress if callback provided
        const contentLength = response.headers.get('content-length');
        let blob;

        if (!contentLength || !onProgress) {
            blob = await response.blob();
        } else {
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                if (onProgress) onProgress(Math.round((loaded / total) * 100));
            }
            blob = new Blob(chunks, { type: response.headers.get('content-type') || 'audio/ogg' });
        }

        // 3. Store in IndexedDB
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const record = {
                url: url,
                blob: blob,
                size: blob.size,
                cachedAt: Date.now()
            };

            const request = store.put(record);

            request.onsuccess = () => {
                console.log(`[Offline Audio] Cached ${url} successfully`);
                resolve(true);
            };

            request.onerror = (e) => {
                console.error(`[Offline Audio] Save failed for ${url}:`, e);
                reject(e);
            };
        });

    } catch (e) {
        console.error(`[Offline Audio] Cache operation failed for ${url}:`, e);
        return false;
    }
}

/**
 * Retrieve a cached audio file as an Object URL
 * @param {string} url - The original URL of the file
 * @returns {Promise<string|null>} Blob URL or null if not cached
 */
export async function getCachedAudioUrl(url) {
    try {
        const db = await initOfflineStorage();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(url);

            request.onsuccess = (e) => {
                const record = e.target.result;
                if (record && record.blob) {
                    const blobUrl = URL.createObjectURL(record.blob);
                    resolve(blobUrl);
                } else {
                    resolve(null); // Not cached
                }
            };

            request.onerror = () => reject(null);
        });
    } catch (e) {
        return null; // DB failed or not ready
    }
}

/**
 * Check if a specific URL is cached offline
 */
export async function isAudioCached(url) {
    try {
        const db = await initOfflineStorage();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.count(url);
            request.onsuccess = () => resolve(request.result > 0);
            request.onerror = () => resolve(false);
        });
    } catch (e) {
        return false;
    }
}
