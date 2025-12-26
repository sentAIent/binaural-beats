import { els, state } from '../state.js';
import {
    initFirebase,
    loginUser,
    registerUser,
    logoutUser,
    resetPassword,
    registerAuthCallback,
    subscribeToLibrary,
    saveMixToCloud,
    deleteMixFromCloud
} from '../services/firebase.js';
import { showToast, applyMixState } from '../utils/helpers.js';

let isLoginMode = true;

export function initAuthUI() {
    // 1. Setup Toggle (Login vs Register)
    const toggleBtn = document.getElementById('toggleAuthModeBtn');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    const resetBtn = document.getElementById('resetPasswordBtn');

    // Add "Name" field for register mode (dynamically)
    const nameFieldDiv = document.createElement('div');
    nameFieldDiv.className = 'flex flex-col gap-1 hidden'; // hidden by default
    nameFieldDiv.id = 'authNameField';
    nameFieldDiv.innerHTML = `
        <label class="text-[10px] font-bold uppercase opacity-70">Display Name</label>
        <input type="text" id="authDisplayName"
            class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--accent)] outline-none"
            placeholder="Your Name">
    `;
    // Insert name field at top of form
    authForm.insertBefore(nameFieldDiv, authForm.children[1]);

    toggleBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = "Sign In";
            authSubmitBtn.textContent = "Sign In";
            toggleBtn.textContent = "Don't have an account? Sign Up";
            resetBtn.classList.remove('hidden');
            nameFieldDiv.classList.add('hidden');
        } else {
            authTitle.textContent = "Create Account";
            authSubmitBtn.textContent = "Sign Up";
            toggleBtn.textContent = "Already have an account? Sign In";
            resetBtn.classList.add('hidden');
            nameFieldDiv.classList.remove('hidden');
        }
        authError.classList.add('hidden');
    };

    // 2. Form Submit
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const name = document.getElementById('authDisplayName').value;

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = "Processing...";
        authError.classList.add('hidden');

        try {
            if (isLoginMode) {
                await loginUser(email, password);
                showToast("Welcome back!", "success");
                closeAuthModal();
            } else {
                await registerUser(email, password, name);
                showToast("Account created!", "success");
                closeAuthModal();
            }
        } catch (err) {
            console.error(err);
            authError.textContent = err.message.replace("Firebase:", "").replace("auth/", "");
            authError.classList.remove('hidden');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isLoginMode ? "Sign In" : "Sign Up";
        }
    };

    // 3. Reset Password
    resetBtn.onclick = async () => {
        const email = document.getElementById('authEmail').value;
        if (!email) {
            authError.textContent = "Please enter your email first.";
            authError.classList.remove('hidden');
            return;
        }
        try {
            await resetPassword(email);
            showToast("Password reset email sent!", "info");
        } catch (err) {
            authError.textContent = err.message;
            authError.classList.remove('hidden');
        }
    };

    // 4. Close Button
    document.getElementById('closeAuthBtn').onclick = closeAuthModal;

    // 5. Auth State Observer Actions
    registerAuthCallback((user) => {
        updateProfileUI(user);
        if (user) {
            // Logged in: Subscribe to library
            subscribeToLibrary(renderLibraryList);
            // Hide auth modal if open
            closeAuthModal();
        } else {
            // Logged out: Clear library
            const list = document.getElementById('libraryList');
            if (list) list.innerHTML = '<div class="text-center text-xs opacity-50 mt-10">Sign in to view your mixes.</div>';
        }
    });

    // Setup profile modal handlers
    setupProfileHandlers();

    // Expose auth trigger globally for inline onclick handlers
    window.openAuthTrigger = openAuthModal;
}

function updateProfileUI(user) {
    // Get DOM elements
    const avatarEl = document.getElementById('profileAvatarBig');
    const nameEl = document.getElementById('profileUserName');
    const emailEl = document.getElementById('profileUserEmail');
    const tierEl = document.getElementById('profileUserTier');
    const nameInput = document.getElementById('profileNameInput');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
        // Signed in user
        const initial = (user.displayName || user.email || '?')[0].toUpperCase();
        if (avatarEl) avatarEl.textContent = initial;
        if (nameEl) nameEl.textContent = user.displayName || 'User';
        if (emailEl) emailEl.textContent = user.email || '';
        if (nameInput) nameInput.value = user.displayName || '';

        // Check tier
        const isPremium = localStorage.getItem('mindwave_premium') === 'true';
        if (tierEl) {
            if (isPremium) {
                tierEl.textContent = 'PRO';
                tierEl.className = 'inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400';
            } else {
                tierEl.textContent = 'Free';
                tierEl.className = 'inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400';
            }
        }

        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        // Guest
        if (avatarEl) avatarEl.textContent = '?';
        if (nameEl) nameEl.textContent = 'Guest User';
        if (emailEl) emailEl.textContent = 'Not signed in';
        if (tierEl) {
            tierEl.textContent = 'Free';
            tierEl.className = 'inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400';
        }
        if (nameInput) nameInput.value = '';
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }

    // Populate stats from analytics
    populateProfileStats();
}

function populateProfileStats() {
    // Import analytics dynamically to avoid circular deps
    import('../services/analytics.js').then(({ getStats, getWeeklyData }) => {
        const stats = getStats();
        const weeklyData = getWeeklyData();

        // Update stats grid
        const sessionsEl = document.getElementById('statTotalSessions');
        const hoursEl = document.getElementById('statTotalHours');
        const streakEl = document.getElementById('statStreak');
        const avgEl = document.getElementById('statAvgSession');
        const topPresetEl = document.getElementById('statTopPreset');

        if (sessionsEl) sessionsEl.textContent = stats.totalSessions;
        if (hoursEl) hoursEl.textContent = stats.totalHours;
        if (streakEl) streakEl.textContent = '🔥 ' + stats.currentStreak;
        if (avgEl) avgEl.textContent = stats.avgMinutes;
        if (topPresetEl) topPresetEl.textContent = stats.topPreset || 'None';

        // Render weekly chart
        const chartEl = document.getElementById('weeklyChart');
        if (chartEl && weeklyData) {
            const maxMins = Math.max(...weeklyData.map(d => d.minutes), 1);
            chartEl.innerHTML = weeklyData.map(day => {
                const heightPercent = Math.max((day.minutes / maxMins) * 100, 4);
                const hasActivity = day.minutes > 0;
                return `
                    <div class="flex-1 flex flex-col items-center">
                        <div class="w-full rounded-t transition-all ${hasActivity ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-white/10'}" 
                            style="height: ${heightPercent}%" title="${day.minutes} min"></div>
                    </div>
                `;
            }).join('');
        }
    }).catch(err => {
        console.warn('[Profile] Failed to load analytics:', err);
    });
}

// Setup logout button
export function setupProfileHandlers() {
    const logoutBtn = document.getElementById('logoutBtn');
    const closeBtn = document.getElementById('closeProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const profileModal = document.getElementById('profileModal');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await logoutUser();
                profileModal?.classList.add('hidden');
                showToast('Signed out successfully', 'info');
            } catch (err) {
                console.error('[Profile] Logout error:', err);
                showToast('Failed to sign out', 'error');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            profileModal?.classList.add('hidden');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('profileNameInput');
            const newName = nameInput?.value?.trim();
            if (!newName) {
                showToast('Please enter a name', 'warning');
                return;
            }
            try {
                // Import firebase to update profile
                const { auth } = await import('../services/firebase.js');
                const { updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: newName });
                    updateProfileUI(auth.currentUser);
                    showToast('Profile updated!', 'success');
                }
            } catch (err) {
                console.error('[Profile] Update error:', err);
                showToast('Failed to update profile', 'error');
            }
        });
    }
}

export function openAuthModal() {
    const m = document.getElementById('authModal');
    m.classList.remove('hidden');
    m.classList.add('active');
    isLoginMode = true; // Reset to login
    document.getElementById('authTitle').textContent = "Sign In";
    document.getElementById('authSubmitBtn').textContent = "Sign In";
    document.getElementById('toggleAuthModeBtn').textContent = "Don't have an account? Sign Up";
    document.getElementById('authNameField').classList.add('hidden');
    document.getElementById('authError').classList.add('hidden');
}

function closeAuthModal() {
    const m = document.getElementById('authModal');
    m.classList.add('hidden');
    m.classList.remove('active');
}

// --- LIBRARY LOGIC ---

export function renderLibraryList(mixes) {
    const list = document.getElementById('libraryList');
    if (!list) return;

    if (mixes.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-center px-4">
                <div class="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#emptyGrad)" stroke-width="1.5">
                        <defs>
                            <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#a855f7"/>
                                <stop offset="100%" stop-color="#ec4899"/>
                            </linearGradient>
                        </defs>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h3 class="text-sm font-bold text-white mb-1">No Saved Mixes Yet</h3>
                <p class="text-xs text-[var(--text-muted)] mb-4 max-w-[200px]">Create your perfect frequency blend and save it for easy access</p>
                <div class="text-[10px] text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/30">
                    Tip: Use the button below to save
                </div>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    mixes.forEach(mix => {
        const div = document.createElement('div');
        div.className = 'group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-pointer';

        // Parse data
        const dateStr = mix.updatedAt ? new Date(mix.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now';
        const baseHz = mix.settings?.base || mix.baseValue || '?';
        const beatHz = mix.settings?.beat || '?';
        const category = mix.category || detectCategoryFromHz(parseFloat(beatHz)) || 'Custom';
        const categoryIcon = getCategoryIcon(category);

        div.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(category)} flex items-center justify-center text-lg shrink-0 shadow-md">
                    ${categoryIcon}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                        <h3 class="text-sm font-bold text-white truncate">${mix.name}</h3>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button class="lib-del-btn p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                            <button class="lib-load-btn p-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition-colors shadow-sm" title="Load">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)]">
                        <span class="px-1.5 py-0.5 rounded bg-white/5">${baseHz}Hz</span>
                        <span>•</span>
                        <span>${beatHz}Hz beat</span>
                        <span class="ml-auto">${dateStr}</span>
                    </div>
                </div>
            </div>
        `;

        // Load Action (click on card)
        div.onclick = (e) => {
            if (e.target.closest('button')) return;
            loadMix(mix);
        };
        div.querySelector('.lib-load-btn').onclick = (e) => {
            e.stopPropagation();
            loadMix(mix);
        };

        // Delete Action
        div.querySelector('.lib-del-btn').onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${mix.name}"?`)) {
                await deleteMixFromCloud(mix.id);
            }
        };

        list.appendChild(div);
    });
}

// Helper functions for category styling
function detectCategoryFromHz(beatHz) {
    if (beatHz <= 4) return 'Delta';
    if (beatHz <= 8) return 'Theta';
    if (beatHz <= 12) return 'Alpha';
    if (beatHz <= 30) return 'Beta';
    return 'Gamma';
}

function getCategoryIcon(category) {
    const icons = {
        'Delta': '🌙',
        'Theta': '🧘',
        'Alpha': '🍃',
        'Beta': '⚡',
        'Gamma': '✨',
        'Custom': '🎵'
    };
    return icons[category] || '🎵';
}

function getCategoryGradient(category) {
    const gradients = {
        'Delta': 'from-indigo-500/30 to-blue-500/30',
        'Theta': 'from-purple-500/30 to-violet-500/30',
        'Alpha': 'from-teal-500/30 to-green-500/30',
        'Beta': 'from-yellow-500/30 to-orange-500/30',
        'Gamma': 'from-pink-500/30 to-red-500/30',
        'Custom': 'from-purple-500/30 to-pink-500/30'
    };
    return gradients[category] || gradients['Custom'];
}

function loadMix(mix) {
    applyMixState(mix);
    showToast(`Loaded "${mix.name}"`, "success");
    // Optionally close library
    // document.getElementById('libraryPanel').classList.add('translate-x-full'); 
}
