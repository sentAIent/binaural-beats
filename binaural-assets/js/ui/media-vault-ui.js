import { getMediaList, getMediaURL, getMediaThumbnail, deleteMedia, formatBytes } from '../services/storage-manager.js';

export function initVaultUI() {
    console.log('[MediaVaultUI] Initializing...');

    // Create the modal HTML if it doesn't exist
    if (!document.getElementById('vaultModal')) {
        injectVaultHTML();
    }

    // Attach to the vault button if it exists
    const vaultBtn = document.getElementById('vaultBtn');
    if (vaultBtn) {
        vaultBtn.addEventListener('click', () => openVault());
    }

    const closeVaultBtn = document.getElementById('closeVaultBtn');
    if (closeVaultBtn) {
        closeVaultBtn.addEventListener('click', () => closeVault());
    }

    // Category filter logic
    const categoryTabs = document.querySelectorAll('.vault-cat-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            renderVault(tab.dataset.category === 'all' ? null : tab.dataset.category);
        });
    });

    // Listen for new saves or deletes to auto-refresh
    window.addEventListener('mediavault:saved', () => {
        if (document.getElementById('vaultModal').style.opacity === '1') {
            const activeTab = document.querySelector('.vault-cat-tab.tab-active');
            renderVault(activeTab.dataset.category === 'all' ? null : activeTab.dataset.category);
        }
    });

    window.addEventListener('mediavault:deleted', () => {
        if (document.getElementById('vaultModal').style.opacity === '1') {
            const activeTab = document.querySelector('.vault-cat-tab.tab-active');
            renderVault(activeTab.dataset.category === 'all' ? null : activeTab.dataset.category);
        }
    });
}

function injectVaultHTML() {
    const modal = document.createElement('div');
    modal.id = 'vaultModal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    modal.innerHTML = `
        <div class="glass-card w-full max-w-4xl bg-[#0f172a] border border-[var(--accent)]/20 rounded-3xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
            <!-- Header -->
            <div class="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <line x1="9" y1="14" x2="15" y2="14"></line>
                        </svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white tracking-tight">Media Vault</h2>
                        <p class="text-xs text-[var(--accent)]/70">Your saved captures and exports</p>
                    </div>
                </div>
                <button id="closeVaultBtn" class="p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Categories -->
            <div class="px-6 py-3 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                <button data-category="all" class="vault-cat-tab tab-active px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors">All</button>
                <button data-category="video" class="vault-cat-tab px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors">Videos</button>
                <button data-category="audio-export" class="vault-cat-tab px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors">Audio</button>
            </div>

            <!-- Content Area -->
            <div id="vaultGrid" class="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                <div class="flex items-center justify-center h-40">
                    <div class="loading-spinner"></div>
                </div>
            </div>

        </div>
    `;
    document.body.appendChild(modal);
}

export async function openVault() {
    const modal = document.getElementById('vaultModal');
    if (!modal) return;

    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    renderVault();
}

export function closeVault() {
    const modal = document.getElementById('vaultModal');
    if (!modal) return;

    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
}

async function renderVault(category = null) {
    const grid = document.getElementById('vaultGrid');
    if (!grid) return;

    grid.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
        ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="h-40 rounded-2xl bg-white/5 border border-white/5"></div>
        `).join('')}
    </div>`;

    try {
        const assets = await getMediaList(category, 100);

        if (!assets || assets.length === 0) {
            grid.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 opacity-60">
                    <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <h3 class="text-white font-bold mb-1">Your Vault is Empty</h3>
                    <p class="text-sm text-[var(--text-muted)]">Record videos or export audio to see them here.</p>
                </div>
            `;
            return;
        }

        // Render assets
        grid.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${assets.map(item => {
            const date = new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const isVideo = item.type === 'video';
            const icon = isVideo ? '🎞️' : '🎵';

            return `
                    <div class="vault-item group relative rounded-2xl bg-black/40 border border-white/10 overflow-hidden hover:border-[var(--accent)]/50 transition-all flex flex-col">
                        
                        <div class="h-32 bg-[#0f172a] relative flex items-center justify-center border-b border-white/5">
                            ${item.hasThumbnail ? `<img id="thumb-${item.id}" src="" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />` : `<span class="text-4xl">${icon}</span>`}
                            
                            ${item.syncStatus === 'synced' ? `<div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[8px] uppercase tracking-wider text-green-400 border border-green-500/30 flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Synced
                            </div>` : ''}
                            
                            ${item.syncStatus === 'syncing' ? `<div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[8px] uppercase tracking-wider text-yellow-400 border border-yellow-500/30">Syncing...</div>` : ''}
                            
                            <!-- Action overlay -->
                            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                <button onclick="window.downloadVaultItem('${item.id}')" class="p-2 rounded-xl bg-[var(--accent)] text-black hover:scale-110 transition-transform shadow-lg" title="Download">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </button>
                                <button onclick="window.deleteVaultItem('${item.id}')" class="p-2 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white hover:scale-110 transition-all shadow-lg" title="Delete">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="p-3 flex-1 flex flex-col">
                            <h3 class="font-bold text-white text-xs truncate mb-1">${item.metadata?.name || 'Untitled Export'}</h3>
                            <div class="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-2">
                                <span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">${item.metadata?.preset || 'Custom'}</span>
                                <span>${formatBytes(item.size)}</span>
                            </div>
                            <div class="mt-auto flex justify-between items-center text-[9px] text-[var(--text-muted)] opacity-70">
                                <span>${date}</span>
                            </div>
                        </div>
                    </div>
                `;
        }).join('')}
            </div>
        `;

        // Load thumbnails asynchronously
        assets.forEach(async (item) => {
            if (item.hasThumbnail) {
                const img = document.getElementById(`thumb-${item.id}`);
                if (img) {
                    const thumbUrl = await getMediaThumbnail(item.id);
                    if (thumbUrl) {
                        img.src = thumbUrl;
                        // Clean up object URL when image loads
                        img.onload = () => URL.revokeObjectURL(thumbUrl);
                    }
                }
            }
        });

        // Attach global functions for the inline onclick handlers
        window.downloadVaultItem = async (id) => {
            console.log('[MediaVaultUI] Downloading:', id);
            try {
                const url = await getMediaURL(id);
                if (!url) {
                    alert('Could not generate download link.');
                    return;
                }

                const asset = assets.find(a => a.id === id);
                const ext = asset?.type === 'video' ? 'webm' : 'wav';
                const filename = asset?.metadata?.name ? `${asset.metadata.name}.${ext}` : `export_${Date.now()}.${ext}`;

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                if (asset?.syncStatus === 'synced' && asset?.metadata?.isCloudStub) {
                    // It's a remote URL
                    a.target = '_blank';
                }
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    // Only revoke if it's a blob URL
                    if (url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                    }
                }, 100);
            } catch (e) {
                console.error('[MediaVaultUI] Download failed:', e);
                alert('Download failed.');
            }
        };

        window.deleteVaultItem = async (id) => {
            if (confirm('Are you sure you want to delete this? It will be removed from your device and the cloud.')) {
                try {
                    await deleteMedia(id);
                    // The 'mediavault:deleted' event will auto-refresh the gallery
                } catch (e) {
                    console.error('[MediaVaultUI] Delete failed:', e);
                    alert('Failed to delete item.');
                }
            }
        };

    } catch (err) {
        grid.innerHTML = `<p class="text-red-400 text-xs">Failed to load vault: ${err.message}</p>`;
    }
}
