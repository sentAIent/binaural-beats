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
}

function updateProfileUI(user) {
    const profileBtn = els.themeBtn.parentNode.nextElementSibling; // Right Toggle is actually not the profile button... 
    // Wait, the new "Profile" button is supposed to be in the header? 
    // The "Premium Settings Redesign" conversation implies there is a profile header.
    // Checking index.html... 
    // Ah, line 502: <div id="profileBtn" class="hidden"></div>
    // It seems the profile trigger is actually "My Library" or "Save Mix" or the dedicated Profile Modal.
    // Let's create a Profile Avatar in the header if it doesn't exist, or repurpose the 'themeBtn' area?
    // Actually, let's just make the "MY LIBRARY" button show the avatar state or similar.
    // Or, check if there is an avatar container.

    // In index.html line 434 (Theme Modal Header) has an icon.
    // Line 483 has 'profileAvatarBig'.

    // Let's hook up the "Profile" modal triggers.
    // Existing "Save Mix" flow checks login.
}

export function openAuthModal() {
    const m = document.getElementById('authModal');
    m.classList.remove('hidden');
    isLoginMode = true; // Reset to login
    document.getElementById('authTitle').textContent = "Sign In";
    document.getElementById('authSubmitBtn').textContent = "Sign In";
    document.getElementById('toggleAuthModeBtn').textContent = "Don't have an account? Sign Up";
    document.getElementById('authNameField').classList.add('hidden');
    document.getElementById('authError').classList.add('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

// --- LIBRARY LOGIC ---

export function renderLibraryList(mixes) {
    const list = document.getElementById('libraryList');
    if (!list) return;

    if (mixes.length === 0) {
        list.innerHTML = '<div class="text-center text-xs opacity-50 mt-10">No saved mixes found. Create one!</div>';
        return;
    }

    list.innerHTML = '';
    mixes.forEach(mix => {
        const div = document.createElement('div');
        div.className = 'group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex justify-between items-center cursor-pointer';

        // Metadata
        const dateStr = mix.updatedAt ? new Date(mix.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now';

        div.innerHTML = `
            <div class="flex-1">
                <div class="text-xs font-bold text-[var(--accent)] truncate">${mix.name}</div>
                <div class="text-[9px] text-[var(--text-muted)] mt-0.5 flex gap-2">
                    <span>${dateStr}</span>
                    <span>• ${mix.baseValue || '?'}Hz</span>
                </div>
            </div>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="lib-del-btn p-1.5 rounded-full hover:bg-white/10 text-red-400" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
                <button class="lib-load-btn p-1.5 rounded-full bg-[var(--accent)] text-[var(--bg-main)]" title="Load">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
            </div>
        `;

        // Load Action
        div.onclick = (e) => {
            // Ignore if button clicked
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

function loadMix(mix) {
    applyMixState(mix);
    showToast(`Loaded "${mix.name}"`, "success");
    // Optionally close library
    // document.getElementById('libraryPanel').classList.add('translate-x-full'); 
}
