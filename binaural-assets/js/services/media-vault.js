/**
 * Media Vault — IndexedDB Storage Layer
 * 
 * Provides durable local persistence for binary media assets
 * (screenshots, video recordings, audio exports) using IndexedDB.
 * 
 * Database: MindwaveVault
 * Object Store: assets
 * 
 * Schema per record:
 *   id          — unique string (e.g. "screenshot_1709584200000")
 *   type        — 'screenshot' | 'video' | 'audio-export' | 'session-recording'
 *   blob        — the raw Blob/File data
 *   thumbnail   — small JPEG preview blob (auto-generated)
 *   metadata    — flexible JSON (preset, dimensions, duration, mimeType, etc.)
 *   createdAt   — timestamp (ms)
 *   size        — blob size in bytes
 *   cloudUrl    — Firebase Storage download URL (null if local-only)
 *   syncStatus  — 'local' | 'syncing' | 'synced' | 'failed'
 */

const DB_NAME = 'MindwaveVault';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

let dbInstance = null;

// =========================================================================
// DATABASE LIFECYCLE
// =========================================================================

/**
 * Open (or create) the IndexedDB database.
 * Returns the db instance, cached for subsequent calls.
 */
export async function initVault() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('syncStatus', 'syncStatus', { unique: false });
                console.log('[MediaVault] Created object store with indexes');
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;

            // Handle unexpected close (e.g. browser clearing storage)
            dbInstance.onclose = () => {
                console.warn('[MediaVault] Database connection closed unexpectedly');
                dbInstance = null;
            };

            console.log('[MediaVault] Database opened successfully');
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('[MediaVault] Failed to open database:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Get a transaction and object store reference.
 * @param {'readonly'|'readwrite'} mode
 * @returns {{ store: IDBObjectStore, tx: IDBTransaction }}
 */
async function getStore(mode = 'readonly') {
    const db = await initVault();
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    return { store, tx };
}

// =========================================================================
// CRUD OPERATIONS
// =========================================================================

/**
 * Save a media asset to the vault.
 * Auto-generates a thumbnail for image/video types.
 * 
 * @param {'screenshot'|'video'|'audio-export'|'session-recording'} type
 * @param {Blob} blob - The raw media blob
 * @param {Object} metadata - Flexible metadata (preset, dimensions, duration, etc.)
 * @returns {Promise<Object>} The saved asset record (without blob, for efficiency)
 */
export async function saveAsset(type, blob, metadata = {}) {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    // Generate thumbnail for visual types
    let thumbnail = null;
    try {
        if (type === 'screenshot') {
            thumbnail = await generateImageThumbnail(blob);
        } else if (type === 'video') {
            thumbnail = await generateVideoThumbnail(blob);
        }
    } catch (e) {
        console.warn('[MediaVault] Thumbnail generation failed:', e);
    }

    const record = {
        id,
        type,
        blob,
        thumbnail,
        metadata: {
            ...metadata,
            mimeType: blob.type,
            originalName: metadata.name || `${type}_${new Date(now).toISOString().slice(0, 19).replace(/[:.]/g, '-')}`
        },
        createdAt: now,
        size: blob.size,
        cloudUrl: null,
        syncStatus: 'local'
    };

    return new Promise(async (resolve, reject) => {
        try {
            const { store, tx } = await getStore('readwrite');
            const request = store.put(record);

            request.onsuccess = () => {
                console.log(`[MediaVault] Saved ${type}: ${id} (${formatBytes(blob.size)})`);
                // Return metadata-only version (no blob) for UI efficiency
                resolve({
                    ...record,
                    blob: undefined,
                    thumbnail: thumbnail ? URL.createObjectURL(thumbnail) : null
                });
            };

            request.onerror = (e) => {
                console.error('[MediaVault] Save failed:', e.target.error);
                reject(e.target.error);
            };

            tx.onerror = (e) => {
                console.error('[MediaVault] Transaction failed:', e.target.error);
                reject(e.target.error);
            };
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Save a lightweight cloud stub down to local IndexedDB (without the binary Blob).
 * This allows syncing cross-device without downloading huge videos unless needed.
 * @param {string} id - The Vault asset ID matching the cloud path
 * @param {string} type - 'screenshot'|'video'
 * @param {number} size - Blob size in bytes
 * @param {number} createdAt - Unix timestamp MS
 * @param {string} cloudUrl - Firebase Storage Download URL
 * @param {Object} metadata - Custom metadata dict
 */
export async function saveCloudStub(id, type, size, createdAt, cloudUrl, metadata = {}) {
    const record = {
        id,
        type,
        blob: null,       // Intentionally null
        thumbnail: null,  // Thumbnail can be fetched via cloudUrl fallback later
        metadata: {
            ...metadata,
            isCloudStub: true
        },
        createdAt,
        size,
        cloudUrl,
        syncStatus: 'synced' // Automatically marked as synced
    };

    return new Promise(async (resolve, reject) => {
        try {
            const { store, tx } = await getStore('readwrite');
            const request = store.put(record);

            request.onsuccess = () => {
                console.log(`[MediaVault] Saved Cloud Stub ${type}: ${id}`);
                resolve(record);
            };
            request.onerror = (e) => {
                console.error('[MediaVault] Save Stub failed:', e.target.error);
                reject(e.target.error);
            };
            tx.onerror = (e) => {
                console.error('[MediaVault] Transaction failed:', e.target.error);
                reject(e.target.error);
            };
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Get a single asset by ID (full record including blob).
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getAsset(id) {
    const { store } = await getStore('readonly');

    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * List assets with optional type filter.
 * Returns metadata-only records (no blobs) for performance.
 * 
 * @param {string} [type] - Filter by type, or null for all
 * @param {number} [limit=50] - Max records to return
 * @param {number} [offset=0] - Skip n records
 * @returns {Promise<Array>} Array of metadata-only asset records
 */
export async function listAssets(type = null, limit = 50, offset = 0) {
    const { store } = await getStore('readonly');

    return new Promise((resolve, reject) => {
        const assets = [];
        let skipped = 0;

        // Use type index if filtering, otherwise iterate all by createdAt descending
        const index = type
            ? store.index('type')
            : store.index('createdAt');

        const range = type ? IDBKeyRange.only(type) : null;
        const direction = type ? 'next' : 'prev'; // Newest first when no type filter

        const request = index.openCursor(range, direction);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor || assets.length >= limit) {
                // Sort by newest first if type-filtered (since type index doesn't sort by date)
                if (type) {
                    assets.sort((a, b) => b.createdAt - a.createdAt);
                }
                resolve(assets);
                return;
            }

            if (skipped < offset) {
                skipped++;
                cursor.continue();
                return;
            }

            // Strip blob and thumbnail blob from listing (return objectURL for thumbnail, or cascade to cloudUrl)
            const record = cursor.value;
            assets.push({
                id: record.id,
                type: record.type,
                metadata: record.metadata,
                createdAt: record.createdAt,
                size: record.size,
                cloudUrl: record.cloudUrl,
                syncStatus: record.syncStatus,
                hasThumbnail: !!record.thumbnail || (record.type === 'screenshot' && !!record.cloudUrl) // Can use full cloudUrl as thumbnail for screenshots
            });

            cursor.continue();
        };

        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Get the thumbnail blob for an asset (for rendering in gallery).
 * @param {string} id
 * @returns {Promise<Blob|null>}
 */
export async function getThumbnail(id) {
    const asset = await getAsset(id);
    if (!asset) return null;

    // 1. Primary: Local encoded Thumbnail Blob
    if (asset.thumbnail) return asset.thumbnail;

    return null;
}

/**
 * Delete an asset from the vault.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAsset(id) {
    const { store, tx } = await getStore('readwrite');

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => {
            console.log(`[MediaVault] Deleted asset: ${id}`);
            resolve();
        };
        request.onerror = (e) => reject(e.target.error);
        tx.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Update only the cloud sync fields of an asset (no blob re-write).
 * @param {string} id
 * @param {{ cloudUrl?: string, syncStatus?: string }} updates
 */
export async function updateAssetSync(id, updates) {
    const { store, tx } = await getStore('readwrite');

    return new Promise((resolve, reject) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const record = getReq.result;
            if (!record) { reject(new Error('Asset not found')); return; }

            if (updates.cloudUrl !== undefined) record.cloudUrl = updates.cloudUrl;
            if (updates.syncStatus !== undefined) record.syncStatus = updates.syncStatus;

            const putReq = store.put(record);
            putReq.onsuccess = () => resolve(record);
            putReq.onerror = (e) => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
        tx.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Count total assets, optionally filtered by type.
 * @param {string} [type]
 * @returns {Promise<number>}
 */
export async function countAssets(type = null) {
    const { store } = await getStore('readonly');

    return new Promise((resolve, reject) => {
        let request;
        if (type) {
            const index = store.index('type');
            request = index.count(IDBKeyRange.only(type));
        } else {
            request = store.count();
        }
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// =========================================================================
// STORAGE MANAGEMENT
// =========================================================================

/**
 * Get total storage usage across all vault assets.
 * @returns {Promise<{ totalBytes: number, count: number, byType: Object }>}
 */
export async function getStorageUsage() {
    const { store } = await getStore('readonly');

    return new Promise((resolve, reject) => {
        let totalBytes = 0;
        let count = 0;
        const byType = {};

        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
                resolve({ totalBytes, count, byType });
                return;
            }

            const record = cursor.value;
            totalBytes += record.size || 0;
            count++;
            byType[record.type] = (byType[record.type] || 0) + (record.size || 0);

            cursor.continue();
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Prune oldest local-only assets to free space.
 * Assets already synced to cloud are prioritized for removal.
 * 
 * @param {number} maxBytes - Target maximum total bytes
 * @returns {Promise<number>} Number of assets deleted
 */
export async function pruneOldAssets(maxBytes = 500 * 1024 * 1024) {
    const usage = await getStorageUsage();
    if (usage.totalBytes <= maxBytes) return 0;

    // Get all assets sorted by createdAt ascending (oldest first)
    const allAssets = await listAssets(null, 1000, 0);
    allAssets.sort((a, b) => a.createdAt - b.createdAt);

    // Prefer deleting synced assets first (they're in the cloud)
    const synced = allAssets.filter(a => a.syncStatus === 'synced');
    const localOnly = allAssets.filter(a => a.syncStatus !== 'synced');
    const orderedForDeletion = [...synced, ...localOnly];

    let freed = 0;
    let deleted = 0;
    const targetFree = usage.totalBytes - maxBytes;

    for (const asset of orderedForDeletion) {
        if (freed >= targetFree) break;
        await deleteAsset(asset.id);
        freed += asset.size;
        deleted++;
    }

    console.log(`[MediaVault] Pruned ${deleted} assets, freed ${formatBytes(freed)}`);
    return deleted;
}

/**
 * Get browser storage quota estimate.
 * @returns {Promise<{ usage: number, quota: number, percent: number }>}
 */
export async function getQuotaEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        return {
            usage: est.usage || 0,
            quota: est.quota || 0,
            percent: est.quota ? Math.round((est.usage / est.quota) * 100) : 0
        };
    }
    return { usage: 0, quota: 0, percent: 0 };
}

// =========================================================================
// THUMBNAIL GENERATION
// =========================================================================

/**
 * Generate a small JPEG thumbnail from an image blob.
 * @param {Blob} imageBlob
 * @param {number} maxDim - Max width or height in pixels
 * @returns {Promise<Blob>}
 */
function generateImageThumbnail(imageBlob, maxDim = 200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(imageBlob);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error('Thumbnail canvas toBlob failed')),
                'image/jpeg',
                0.7
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for thumbnail'));
        };

        img.src = url;
    });
}

/**
 * Generate a thumbnail from a video blob by capturing the first frame.
 * @param {Blob} videoBlob
 * @param {number} maxDim
 * @returns {Promise<Blob>}
 */
function generateVideoThumbnail(videoBlob, maxDim = 200) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(videoBlob);

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = () => {
            // Seek to 1 second or 10% of duration, whichever is less
            video.currentTime = Math.min(1, video.duration * 0.1);
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);

            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error('Video thumbnail toBlob failed')),
                'image/jpeg',
                0.7
            );
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video for thumbnail'));
        };

        // Timeout fallback — don't block forever
        setTimeout(() => {
            URL.revokeObjectURL(url);
            reject(new Error('Video thumbnail generation timed out'));
        }, 10000);

        video.src = url;
    });
}

// =========================================================================
// UTILITIES
// =========================================================================

/**
 * Format bytes into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

/**
 * Create a temporary object URL for a vault asset's blob.
 * Caller is responsible for revoking via URL.revokeObjectURL().
 * @param {string} id
 * @returns {Promise<string|null>} Object URL or null
 */
export async function createAssetURL(id) {
    const asset = await getAsset(id);
    if (!asset) return null;

    // 1. Ideal Path: Return temporary object URL from local blob in IndexedDB
    if (asset.blob) {
        return URL.createObjectURL(asset.blob);
    }

    // 2. Cloud Fallback: If this is a cloud stub without local data, just pipe out the CDN link representing the asset
    if (asset.cloudUrl) {
        return asset.cloudUrl;
    }

    return null;
}
