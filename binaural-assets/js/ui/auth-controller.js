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

// Expose globally for Paywall and other utils (Critical: prevent init race conditions)
if (typeof window !== 'undefined') {
    // We'll assign this temporarily here, but since OpenAuthModal is defined below,
    // we should rely on function hoisting or move assignment to end.
    // Actually, export functions are not hoisted like declarations in basic script.
    // Use a safer approach: assign at the end of file?
    // OR: just define it on window inside the function definition later?
}

// Better: exposed at top level but need to ensure function is defined. 
// Since it's a module, function declarations are hoisted to top of scope? 
// Yes, inside the module scope.
window.openAuthModal = openAuthModal;
window.openAuthTrigger = openAuthModal;

export function initAuthUI() {
    // Get elements
    const toggleBtn = document.getElementById('toggleAuthModeBtn');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    const resetBtn = document.getElementById('resetPasswordBtn');
    const nameFieldDiv = document.getElementById('authNameField'); // Already in HTML



    if (toggleBtn) {
        toggleBtn.onclick = () => {
            isLoginMode = !isLoginMode;
            const firstNameInput = document.getElementById('authFirstName');
            const lastNameInput = document.getElementById('authLastName');

            if (isLoginMode) {
                if (authTitle) authTitle.textContent = "Welcome Back";
                if (authSubtitle) authSubtitle.textContent = "Sign in to continue your journey";
                if (authSubmitBtn) authSubmitBtn.textContent = "Sign In";
                toggleBtn.innerHTML = 'Don\'t have an account? <span style="color: rgb(96, 169, 255); font-weight: 600;">Sign Up</span>';
                if (resetBtn) resetBtn.style.display = '';
                if (nameFieldDiv) nameFieldDiv.style.display = 'none';
                if (firstNameInput) firstNameInput.removeAttribute('required');
                if (lastNameInput) lastNameInput.removeAttribute('required');
            } else {
                if (authTitle) authTitle.textContent = "Create Account";
                if (authSubtitle) authSubtitle.textContent = "Start your meditation journey today";
                if (authSubmitBtn) authSubmitBtn.textContent = "Sign Up";
                toggleBtn.innerHTML = 'Already have an account? <span style="color: rgb(96, 169, 255); font-weight: 600;">Sign In</span>';
                if (resetBtn) resetBtn.style.display = 'none';
                if (nameFieldDiv) nameFieldDiv.style.display = 'flex';
                if (firstNameInput) firstNameInput.setAttribute('required', '');
                if (lastNameInput) lastNameInput.setAttribute('required', '');
            }
            if (authError) authError.classList.add('hidden');
        };
    }


    // 5. Initialize Profile/Logout/Referral Handlers
    setupProfileHandlers();

    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const firstName = document.getElementById('authFirstName')?.value || '';
            const lastName = document.getElementById('authLastName')?.value || '';
            const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName;

            if (authSubmitBtn) {
                authSubmitBtn.disabled = true;
                authSubmitBtn.textContent = "Processing...";
            }
            if (authError) authError.classList.add('hidden');

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
                if (authError) {
                    authError.textContent = err.message.replace("Firebase:", "").replace("auth/", "");
                    authError.classList.remove('hidden');
                }
            } finally {
                if (authSubmitBtn) {
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.textContent = isLoginMode ? "Sign In" : "Sign Up";
                }
            }
        };
    }

    // 3. Reset Password
    if (resetBtn) {
        resetBtn.onclick = async () => {
            const email = document.getElementById('authEmail')?.value;
            if (!email) {
                if (authError) {
                    authError.textContent = "Please enter your email first.";
                    authError.classList.remove('hidden');
                }
                return;
            }
            try {
                await resetPassword(email);
                showToast("Password reset email sent!", "info");
            } catch (err) {
                if (authError) {
                    authError.textContent = err.message;
                    authError.classList.remove('hidden');
                }
            }
        };
    }

    // 4. Close Button
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    if (closeAuthBtn) {
        closeAuthBtn.onclick = (e) => {
            e.stopPropagation();
            closeAuthModal();
        };
    }

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

    // Global listeners exposed at top now
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

        // ✅ REVENUE FEATURE: Show upgrade/manage buttons based on tier
        let upgradeBtn = document.getElementById('profileUpgradeBtn');
        if (!upgradeBtn) {
            // Create upgrade button if it doesn't exist
            upgradeBtn = document.createElement('button');
            upgradeBtn.id = 'profileUpgradeBtn';
            upgradeBtn.className = 'w-full py-3 px-4 rounded-xl font-bold text-sm transition-all';

            // Insert into container or after tier badge
            const container = document.getElementById('profileUpgradeContainer');
            if (container) {
                container.innerHTML = ''; // Clear previous
                container.appendChild(upgradeBtn);
            } else {
                const profileHeader = tierEl?.parentElement;
                if (profileHeader) {
                    profileHeader.appendChild(upgradeBtn);
                }
            }
        }

        if (isPremium) {
            // Premium user - show "Manage Subscription" button
            upgradeBtn.textContent = '⚙️ Manage Subscription';
            // Premium Glassmorphic Style
            upgradeBtn.className = 'w-full mt-4 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wide bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/50 transition-all shadow-lg shadow-cyan-900/20';
            upgradeBtn.style.color = '';
            upgradeBtn.style.backgroundColor = '';
            upgradeBtn.onclick = () => {
                if (window.showPricingModal) window.showPricingModal();
            };
        } else {
            // Free user - show prominent "Upgrade to Pro" button
            upgradeBtn.textContent = '⚡ Upgrade to Pro';
            // High-Conversion Gradient Style
            upgradeBtn.className = 'w-full mt-4 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wide text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 transition-all';
            upgradeBtn.style.backgroundColor = ''; // Remove inline override to let gradient work
            upgradeBtn.style.color = '';
            upgradeBtn.onclick = () => {
                const profileModal = document.getElementById('profileModal');
                if (profileModal) {
                    profileModal.classList.add('hidden');
                    profileModal.classList.remove('active');
                }
                if (window.showPricingModal) window.showPricingModal();
            };
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

        // Hide upgrade button for guests
        const upgradeBtn = document.getElementById('profileUpgradeBtn');
        if (upgradeBtn) upgradeBtn.style.display = 'none';
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

        // Add daily usage display for free users
        updateDailyUsageDisplay();
    }).catch(err => {
        console.warn('[Profile] Failed to load analytics:', err);
    });
}

async function updateDailyUsageDisplay() {
    try {
        const { DailyLimitService } = await import('../services/daily-limit.js');
        const usageSeconds = DailyLimitService.getUsage();
        const usageMinutes = Math.floor(usageSeconds / 60);
        const limitMinutes = 15;
        const percentUsed = Math.min((usageMinutes / limitMinutes) * 100, 100);
        const remaining = Math.max(0, limitMinutes - usageMinutes);

        // Check if premium
        const isPremium = localStorage.getItem('mindwave_premium') === 'true';

        // Find or create daily usage element
        let usageEl = document.getElementById('dailyUsageDisplay');
        if (!usageEl) {
            // Create the element in profile modal
            const profileModal = document.getElementById('profileModal');
            const statsGrid = profileModal?.querySelector('.grid');
            if (statsGrid) {
                usageEl = document.createElement('div');
                usageEl.id = 'dailyUsageDisplay';
                usageEl.className = 'col-span-2 p-3 rounded-xl border text-center';
                statsGrid.parentElement.insertBefore(usageEl, statsGrid.nextSibling);
            }
        }

        if (usageEl) {
            if (isPremium) {
                usageEl.innerHTML = `
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Daily Usage</div>
                    <div class="text-lg font-bold text-amber-400">
                        ∞ Unlimited
                    </div>
                    <div class="text-[10px] text-[var(--text-muted)]">Pro member • ${usageMinutes}min today</div>
                `;
                usageEl.className = 'col-span-2 p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-center';
            } else {
                const isNearLimit = percentUsed >= 80;
                const isAtLimit = percentUsed >= 100;
                usageEl.innerHTML = `
                    <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Daily Usage (Free Plan)</div>
                    <div class="w-full h-2 bg-[var(--text-main)]/10 rounded-full overflow-hidden mb-2">
                        <div class="h-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-[var(--accent)]'}" 
                             style="width: ${percentUsed}%"></div>
                    </div>
                    <div class="text-sm font-bold ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-[var(--text-main)]'}">
                        ${usageMinutes} / ${limitMinutes} min
                    </div>
                    <div class="text-[10px] ${isAtLimit ? 'text-red-300' : 'text-[var(--text-muted)]'}">
                        ${isAtLimit ? 'Daily limit reached! Upgrade for unlimited.' : `${remaining} min remaining today`}
                    </div>
                `;
                usageEl.className = `col-span-2 p-3 rounded-xl ${isAtLimit ? 'bg-red-500/10 border-red-500/30' : isNearLimit ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[var(--text-main)]/5 border-[var(--text-main)]/10'} border text-center`;
            }
        }
    } catch (err) {
        console.warn('[Profile] Failed to load daily limit:', err);
    }
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
                if (window.toggleFooterMode) window.toggleFooterMode(false); // Restore footer
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
            if (window.toggleFooterMode) window.toggleFooterMode(false); // Restore footer
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
                    // ✅ FIX Issue #8: Reload user to get fresh data
                    await auth.currentUser.reload();
                    updateProfileUI(auth.currentUser);
                    showToast('Profile updated!', 'success');
                }
            } catch (err) {
                console.error('[Profile] Update error:', err);
                showToast('Failed to update profile', 'error');
            }
        });
    }

    const referralBtn = document.getElementById('profileReferralBtn');
    if (referralBtn) {
        referralBtn.addEventListener('click', () => {
            // Get UID from state or auth
            const uid = state.currentUser?.uid || 'guest';
            const link = `${window.location.origin}?ref=${uid}`;

            navigator.clipboard.writeText(link).then(() => {
                showToast('Referral link copied!', 'success');
                // Visual feedback
                const originalText = referralBtn.textContent;
                referralBtn.textContent = 'Copied!';
                referralBtn.classList.add('bg-cyan-500/30');
                setTimeout(() => {
                    referralBtn.textContent = originalText;
                    referralBtn.classList.remove('bg-cyan-500/30');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code', err);
                showToast('Failed to copy link', 'error');
            });
        });
    }
}

export function openAuthModal() {
    // ✅ PROFESSIONAL FIX: If user is already logged in, show account management instead
    if (state.currentUser) {
        console.log('[Auth] User already logged in, showing account management');

        // Show profile/account modal instead
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('hidden');
            profileModal.classList.add('active');

            // Reset scroll position on open
            const scrollContainer = profileModal.querySelector('.glass-card');
            if (scrollContainer) scrollContainer.scrollTop = 0;

            // Update profile UI with current user data
            updateProfileUI(state.currentUser);

            // Populate stats
            populateProfileStats();

            // Apply Layout Constraints
            if (window.adjustActiveModal) window.adjustActiveModal(profileModal);

            // Auto-collapse footer for better visibility
            if (window.toggleFooterMode) window.toggleFooterMode(true);
        } else {
            // Fallback if profile modal doesn't exist
            showToast("Account menu coming soon. Use the profile button to sign out.", "info");
        }
        return;
    }

    const m = document.getElementById('authModal');
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('active');

        // Reset scroll position on open
        const scrollContainer = m.querySelector('.custom-scrollbar');
        if (scrollContainer) scrollContainer.scrollTop = 0;

        // Apply Layout Constraints
        if (window.adjustActiveModal) window.adjustActiveModal(m);
    }

    isLoginMode = true; // Reset to login
    document.getElementById('authTitle').textContent = "Sign In";
    document.getElementById('authSubmitBtn').textContent = "Sign In";
    document.getElementById('toggleAuthModeBtn').textContent = "Don't have an account? Sign Up";
    document.getElementById('authNameField').classList.add('hidden');
    document.getElementById('authError').classList.add('hidden');

    // Remove required from name fields when opening in Sign In mode
    const firstNameInput = document.getElementById('authFirstName');
    const lastNameInput = document.getElementById('authLastName');
    if (firstNameInput) firstNameInput.removeAttribute('required');
    if (lastNameInput) lastNameInput.removeAttribute('required');
}

function closeAuthModal() {
    try {
        const m = document.getElementById('authModal');
        if (!m) {
            console.error('[Auth] Auth modal element not found');
            return;
        }

        m.classList.add('hidden');
        m.classList.remove('active');
    } catch (error) {
        console.error('[Auth] Error closing auth modal:', error);
    }
}

// --- LIBRARY LOGIC ---

export function renderLibraryList(mixes) {
    const list = document.getElementById('libraryList');
    // ✅ FIX Issue #6: Add null check for timing issues
    if (!list) {
        console.warn('[Library] libraryList element not found, deferring render');
        return;
    }

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
