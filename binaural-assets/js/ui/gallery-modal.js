/**
 * Gallery Modal Component (Phase 7)
 * Handles browsing community-shared presets.
 */

import { els, state } from '../state.js';
import { getPublicGallery } from '../services/presets-service.js';

export function initGallery() {
    console.log('[Gallery] Initializing community gallery...');

    // Create the modal HTML if it doesn't exist
    if (!document.getElementById('galleryModal')) {
        injectGalleryHTML();
    }

    const galleryBtn = document.getElementById('galleryBtn');
    if (galleryBtn) {
        galleryBtn.addEventListener('click', () => openGallery());
    }

    const closeGalleryBtn = document.getElementById('closeGalleryBtn');
    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener('click', () => closeGallery());
    }

    // Category filter logic
    const categoryTabs = document.querySelectorAll('.gallery-cat-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            renderGallery(tab.dataset.category === 'all' ? null : tab.dataset.category);
        });
    });
}

function injectGalleryHTML() {
    const modal = document.createElement('div');
    modal.id = 'galleryModal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    modal.innerHTML = `
        <div class="glass-card w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
            <!-- Header -->
            <div class="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-white tracking-tight">Public Gallery</h2>
                    <p class="text-xs text-[var(--text-muted)]">Discover frequency mixes by the community</p>
                </div>
                <button id="closeGalleryBtn" class="p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Categories -->
            <div class="px-6 py-3 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                <button data-category="all" class="gallery-cat-tab tab-active px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10">All</button>
                <button data-category="focus" class="gallery-cat-tab px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10">Focus</button>
                <button data-category="sleep" class="gallery-cat-tab px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10">Sleep</button>
                <button data-category="meditation" class="gallery-cat-tab px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10">Zen</button>
                <button data-category="peak-performance" class="gallery-cat-tab px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10">Peak</button>
            </div>

            <!-- Content Area -->
            <div id="galleryGrid" class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                <div class="flex items-center justify-center h-40">
                    <div class="loading-spinner"></div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-white/5 bg-black/20 text-center">
                <p class="text-[10px] text-[var(--text-muted)] italic">Share your own creation by clicking "Publish" in your Library.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export async function openGallery() {
    const modal = document.getElementById('galleryModal');
    if (!modal) return;

    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    renderGallery();
}

export function closeGallery() {
    const modal = document.getElementById('galleryModal');
    if (!modal) return;

    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
}

async function renderGallery(category = null) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    // Show skeleton/loading
    grid.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        ${[1, 2, 4, 6].map(() => `
            <div class="h-32 rounded-2xl bg-white/5 border border-white/5"></div>
        `).join('')}
    </div>`;

    try {
        const presets = await getPublicGallery(category);

        if (!presets || presets.length === 0) {
            grid.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 opacity-60">
                    <span class="text-4xl mb-4">🏜️</span>
                    <p class="text-sm">No community presets found in this category.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${presets.map(item => `
                    <div class="gallery-item group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[var(--accent)]/50 transition-all cursor-pointer"
                         onclick="window.applyGalleryPreset('${item.id}')">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-white text-sm">${item.name}</h3>
                            <span class="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] uppercase font-black">${item.category || 'Focus'}</span>
                        </div>
                        <div class="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mb-3">
                            <span>Author:</span>
                            <span class="text-white/80">${item.authorName || 'Anonymous'}</span>
                        </div>
                        <div class="flex items-center justify-between mt-auto">
                            <div class="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                                <span>❤️ ${item.likes || 0}</span>
                                <span>⏱️ ${item.targetDuration || '15m'}</span>
                            </div>
                            <button class="px-3 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold uppercase group-hover:bg-[var(--accent)] transition-all group-hover:text-black">
                                Play
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Expose global window function for dynamic loading
        window.applyGalleryPreset = (id) => {
            const preset = presets.find(p => p.id === id);
            if (preset) {
                console.log('[Gallery] Applying community preset:', preset.name);
                // Implementation note: applyPreset expects a type key or full data
                // We'll need to extend applyPreset to handle full objects
                window.loadPublicPreset(preset);
                closeGallery();
            }
        };

    } catch (err) {
        grid.innerHTML = `<p class="text-red-400 text-xs">Failed to load gallery: ${err.message}</p>`;
    }
}
