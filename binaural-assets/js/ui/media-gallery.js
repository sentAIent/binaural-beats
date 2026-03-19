/**
 * Media Gallery — Persistent Media Library UI
 * 
 * Renders a gallery of saved screenshots, videos, and audio exports
 * from the IndexedDB vault. Survives page reloads.
 * 
 * Usage:
 *   import { renderMediaGallery } from './media-gallery.js';
 *   renderMediaGallery(document.getElementById('galleryContainer'));
 */

import { getMediaList, getMediaURL, getMediaThumbnail, deleteMedia, getStorageStats, formatBytes } from '../services/storage-manager.js';
import { trackGlobalEvent } from '../services/analytics-service.js';

// =========================================================================
// GALLERY RENDERER
// =========================================================================

let galleryContainer = null;
let currentFilter = null; // null = all
let isLoading = false;

/**
 * Initialize and render the media gallery into a container element.
 * @param {HTMLElement} container
 */
export async function renderMediaGallery(container) {
    if (!container) return;
    galleryContainer = container;

    // Build the gallery shell
    container.innerHTML = buildGalleryShell();

    // Wire up filter buttons
    container.querySelectorAll('[data-gallery-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.galleryFilter || null;
            container.querySelectorAll('[data-gallery-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            refreshGallery();
        });
    });

    // Wire up refresh button
    const refreshBtn = container.querySelector('#galleryRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshGallery);

    // Listen for vault events
    window.addEventListener('mediavault:saved', refreshGallery);
    window.addEventListener('mediavault:deleted', refreshGallery);
    window.addEventListener('mediavault:synced', refreshGallery);

    // Initial load
    await refreshGallery();
    await updateStorageBar();
}

/**
 * Refresh the gallery grid with current vault contents.
 */
async function refreshGallery() {
    if (!galleryContainer || isLoading) return;
    isLoading = true;

    const grid = galleryContainer.querySelector('#galleryGrid');
    const emptyState = galleryContainer.querySelector('#galleryEmpty');
    if (!grid) { isLoading = false; return; }

    try {
        const assets = await getMediaList(currentFilter, 50);
        console.log('[DEBUG] Raw assets from DB:', JSON.stringify(assets.map(a => ({ id: a.id, type: a.type, size: a.size })), null, 2));

        if (assets.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            grid.innerHTML = assets.map(asset => buildAssetCard(asset)).join('');

            // Load thumbnails asynchronously
            for (const asset of assets) {
                if (asset.hasThumbnail) {
                    loadThumbnail(asset.id, grid);
                }
            }

            // Wire up card actions
            wireCardActions(grid);
        }

        // Update count badge
        const countBadge = galleryContainer.querySelector('#galleryCount');
        if (countBadge) countBadge.textContent = assets.length;

        await updateStorageBar();
    } catch (e) {
        console.error('[Gallery] Refresh failed:', e);
        grid.innerHTML = `<div class="gallery-error">Failed to load media library</div>`;
    }

    isLoading = false;
}

// =========================================================================
// HTML BUILDERS
// =========================================================================

function buildGalleryShell() {
    return `
        <div class="media-gallery">
            <div class="gallery-header">
                <div class="gallery-title-row">
                    <h3 class="gallery-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        Media Library
                    </h3>
                    <span id="galleryCount" class="gallery-count">0</span>
                    <button id="galleryRefreshBtn" class="gallery-icon-btn" title="Refresh">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </button>
                </div>

                <div class="gallery-filters">
                    <button data-gallery-filter="" class="gallery-filter active">All</button>
                    <button data-gallery-filter="screenshot" class="gallery-filter">Screenshots</button>
                    <button data-gallery-filter="video" class="gallery-filter">Videos</button>
                    <button data-gallery-filter="audio-export" class="gallery-filter">Audio</button>
                </div>
            </div>

            <div id="galleryGrid" class="gallery-grid"></div>

            <div id="galleryEmpty" class="gallery-empty hidden">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                </svg>
                <p>No saved media yet</p>
                <p class="gallery-empty-hint">Screenshots, recordings, and exports will appear here automatically</p>
            </div>

            <div class="gallery-storage-bar">
                <div class="storage-info">
                    <span id="storageUsed">--</span> used
                    <span class="storage-dot">·</span>
                    <span id="storageCount">0</span> items
                </div>
                <div class="storage-track">
                    <div id="storageFill" class="storage-fill" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <style>
            .media-gallery {
                background: rgba(10, 15, 30, 0.6);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                padding: 16px;
                margin-top: 12px;
                font-family: system-ui, -apple-system, sans-serif;
            }

            .gallery-header { margin-bottom: 12px; }

            .gallery-title-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
            }

            .gallery-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--accent, #2dd4bf);
                margin: 0;
            }

            .gallery-count {
                background: var(--accent, #2dd4bf);
                color: #0f172a;
                font-size: 10px;
                font-weight: 800;
                padding: 1px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
            }

            .gallery-icon-btn {
                margin-left: auto;
                background: none;
                border: none;
                color: rgba(255,255,255,0.4);
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                transition: all 0.2s;
            }
            .gallery-icon-btn:hover { color: var(--accent, #2dd4bf); background: rgba(255,255,255,0.05); }

            .gallery-filters {
                display: flex;
                gap: 4px;
                background: rgba(255,255,255,0.03);
                padding: 3px;
                border-radius: 8px;
            }

            .gallery-filter {
                padding: 4px 10px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: rgba(255,255,255,0.4);
                background: none;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .gallery-filter:hover { color: rgba(255,255,255,0.7); }
            .gallery-filter.active {
                background: rgba(255,255,255,0.08);
                color: var(--accent, #2dd4bf);
            }

            .gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 8px;
                max-height: 300px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
            }

            .gallery-card {
                position: relative;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 10px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                aspect-ratio: 16/10;
            }
            .gallery-card:hover {
                border-color: var(--accent, #2dd4bf);
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px var(--accent, #2dd4bf);
            }

            .gallery-thumb {
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: 0.85;
                transition: opacity 0.25s;
            }
            .gallery-card:hover .gallery-thumb { opacity: 1; }

            .gallery-thumb-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                opacity: 0.3;
                background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05));
            }

            .gallery-card-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 6px 8px;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }

            .gallery-card-meta {
                display: flex;
                flex-direction: column;
                gap: 1px;
            }

            .gallery-card-type {
                font-size: 8px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--accent, #2dd4bf);
            }

            .gallery-card-info {
                font-size: 9px;
                color: rgba(255,255,255,0.5);
            }

            .gallery-card-actions {
                display: flex;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .gallery-card:hover .gallery-card-actions { opacity: 1; }

            .gallery-action-btn {
                background: rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                padding: 0;
            }
            .gallery-action-btn:hover { background: var(--accent, #2dd4bf); color: #0f172a; }
            .gallery-action-btn.delete:hover { background: #ef4444; color: white; }

            .gallery-sync-badge {
                position: absolute;
                top: 6px;
                right: 6px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: 1.5px solid rgba(0,0,0,0.5);
            }
            .gallery-sync-badge.local { background: rgba(255,255,255,0.3); }
            .gallery-sync-badge.syncing { background: #fbbf24; animation: pulse 1s infinite; }
            .gallery-sync-badge.synced { background: #22c55e; }
            .gallery-sync-badge.failed { background: #ef4444; }

            .gallery-empty {
                text-align: center;
                padding: 32px 16px;
                color: rgba(255,255,255,0.3);
            }
            .gallery-empty p { margin: 8px 0 0; font-size: 12px; }
            .gallery-empty-hint { font-size: 10px !important; opacity: 0.6; }

            .gallery-storage-bar {
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px solid rgba(255,255,255,0.05);
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .storage-info {
                font-size: 9px;
                color: rgba(255,255,255,0.35);
                white-space: nowrap;
            }
            .storage-dot { opacity: 0.3; margin: 0 2px; }

            .storage-track {
                flex: 1;
                height: 3px;
                background: rgba(255,255,255,0.05);
                border-radius: 2px;
                overflow: hidden;
            }

            .storage-fill {
                height: 100%;
                background: var(--accent, #2dd4bf);
                border-radius: 2px;
                transition: width 0.5s ease;
            }

            .gallery-error {
                text-align: center;
                padding: 20px;
                color: #ef4444;
                font-size: 11px;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
        </style>
    `;
}

function buildAssetCard(asset) {
    const typeIcon = {
        'screenshot': '📸',
        'video': '🎥',
        'audio-export': '🎵',
        'session-recording': '🎙️'
    }[asset.type] || '📄';

    const typeLabel = {
        'screenshot': 'Screenshot',
        'video': 'Video',
        'audio-export': 'Audio',
        'session-recording': 'Recording'
    }[asset.type] || asset.type;

    const age = getRelativeTime(asset.createdAt);
    const size = formatBytes(asset.size);

    return `
        <div class="gallery-card" data-asset-id="${asset.id}" data-asset-type="${asset.type}">
            <div class="gallery-thumb-placeholder" id="thumb-${asset.id}">
                ${typeIcon}
            </div>
            <div class="gallery-sync-badge ${asset.syncStatus}"></div>
            <div class="gallery-card-overlay">
                <div class="gallery-card-meta">
                    <span class="gallery-card-type">${typeLabel}</span>
                    <span class="gallery-card-info">${size} · ${age}</span>
                </div>
                <div class="gallery-card-actions">
                    <button class="gallery-action-btn download-btn" data-id="${asset.id}" title="Download">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button class="gallery-action-btn delete delete-btn" data-id="${asset.id}" title="Delete">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =========================================================================
// INTERACTIONS
// =========================================================================

function wireCardActions(grid) {
    grid.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const card = btn.closest('.gallery-card');
            const type = card?.dataset.assetType || 'file';
            const ext = type === 'screenshot' ? 'png' : type === 'video' ? 'webm' : 'webm';

            try {
                const url = await getMediaURL(id);
                if (!url) return;

                const a = document.createElement('a');
                a.href = url;
                a.download = `mindwave_${type}_${Date.now()}.${ext}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 100);

                trackGlobalEvent('media_downloaded', { type, source: 'gallery' });
            } catch (e) {
                console.error('[Gallery] Download failed:', e);
            }
        });
    });

    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;

            try {
                await deleteMedia(id);
                // Card will be removed via the mediavault:deleted event → refreshGallery
            } catch (e) {
                console.error('[Gallery] Delete failed:', e);
            }
        });
    });
}

async function loadThumbnail(id, grid) {
    try {
        const thumbUrl = await getMediaThumbnail(id);
        if (!thumbUrl) return;

        const placeholder = grid.querySelector(`#thumb-${id}`);
        if (!placeholder) return;

        const img = document.createElement('img');
        img.className = 'gallery-thumb';
        img.src = thumbUrl;
        img.alt = 'thumbnail';
        img.onload = () => {
            placeholder.replaceWith(img);
        };
        img.onerror = () => URL.revokeObjectURL(thumbUrl);
    } catch (e) {
        // Thumbnail loading is non-critical
    }
}

async function updateStorageBar() {
    if (!galleryContainer) return;

    try {
        const stats = await getStorageStats();
        const usedEl = galleryContainer.querySelector('#storageUsed');
        const countEl = galleryContainer.querySelector('#storageCount');
        const fillEl = galleryContainer.querySelector('#storageFill');

        if (usedEl) usedEl.textContent = stats.vault.totalFormatted;
        if (countEl) countEl.textContent = stats.vault.count;
        if (fillEl) {
            // Show vault usage relative to 500MB cap
            const maxBytes = 500 * 1024 * 1024;
            const percent = Math.min((stats.vault.totalBytes / maxBytes) * 100, 100);
            fillEl.style.width = percent + '%';

            if (percent > 80) fillEl.style.background = '#ef4444';
            else if (percent > 50) fillEl.style.background = '#fbbf24';
        }
    } catch (e) {
        // Non-critical
    }
}

// =========================================================================
// UTILITIES
// =========================================================================

function getRelativeTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

/**
 * Destroy the gallery and clean up event listeners.
 */
export function destroyMediaGallery() {
    window.removeEventListener('mediavault:saved', refreshGallery);
    window.removeEventListener('mediavault:deleted', refreshGallery);
    window.removeEventListener('mediavault:synced', refreshGallery);
    if (galleryContainer) galleryContainer.innerHTML = '';
    galleryContainer = null;
}
