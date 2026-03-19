import { state } from '../state.js';
import { hasPurchasedApp } from '../services/stripe-simple.js';

/**
 * PWA Install Prompt
 * Shows a custom install banner when the app is installable
 */

let deferredPrompt = null;
let installBannerShown = false;
const INSTALL_DECLINED_KEY = 'mindwave_install_declined';
const INSTALL_COMPLETED_KEY = 'mindwave_installed';

export async function initPWAInstall() {
    // Wait for auth to settle to check access
    const { registerAuthCallback } = await import('../services/firebase.js');

    registerAuthCallback(async (user) => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        let hasAccess = false;

        try {
            if (user) {
                hasAccess = await hasPurchasedApp();
            }
        } catch (e) {
            console.warn('[PWA] Error checking app purchase access:', e);
        }

        // --- 1. RUNTIME STANDALONE LOCK ---
        if (isStandalone) {
            if (!hasAccess) {
                console.warn('[PWA] Unauthorized Standalone Access. Blocking UI.');
                showPWALockScreen();
                return; // Stop execution
            } else {
                // If they logged in and have access, remove lock
                const lockScreen = document.getElementById('pwaLockScreen');
                if (lockScreen) lockScreen.remove();
            }
        }

        // --- 2. MANIFEST INJECTION ---
        // Ensure manifest is only injected for Lifetime members to prevent browser bypass
        if (hasAccess && !isStandalone) {
            if (!document.querySelector('link[rel="manifest"]')) {
                console.log('[PWA] Verified Eternity Access: Injecting manifest.json');
                const manifestLink = document.createElement('link');
                manifestLink.rel = 'manifest';
                manifestLink.href = 'manifest.json';
                document.head.appendChild(manifestLink);
            }
        } else if (!hasAccess && !isStandalone) {
            console.log('[PWA] Standard User: Skipping manifest injection to enforce app download paywall.');
        }
    });

    // Skip if already installed or declined
    if (localStorage.getItem(INSTALL_COMPLETED_KEY)) return;

    // Check if declined recently (within 7 days)
    const declinedAt = localStorage.getItem(INSTALL_DECLINED_KEY);
    if (declinedAt) {
        const daysSinceDismiss = (Date.now() - parseInt(declinedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) return;
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show banner after user has been on page for 30 seconds
        setTimeout(showInstallBanner, 30000);
    });

    // Track successful install
    window.addEventListener('appinstalled', () => {
        localStorage.setItem(INSTALL_COMPLETED_KEY, 'true');
        hideInstallBanner();
        showToast('✅ MindWave installed! Find it on your home screen.', 'success');
    });
}

function showInstallBanner() {
    // LOCK: Only show install banner to lifetime members
    if (!state.isLifetime) {
        console.log('[PWA] skipping install banner - not a lifetime member');
        return;
    }

    if (!deferredPrompt || installBannerShown) return;
    installBannerShown = true;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border: 1px solid #10b981;
        border-radius: 16px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        max-width: 400px;
        width: calc(100% - 32px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideUp 0.3s ease;
    `;

    banner.innerHTML = `
        <style>
            @keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        </style>
        <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            flex-shrink: 0;
        ">🧘</div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: white; font-size: 14px;">Install MindWave</div>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">Quick access from your home screen</div>
        </div>
        <button id="pwaInstallBtn" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            flex-shrink: 0;
        ">Install</button>
        <button id="pwaCloseBtn" style="
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
        ">×</button>
    `;

    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
        // STRICT PAYWALL CHECK: Source Code / App Download ($350)
        // We also check here just in case, but the prompt shouldn't even exist otherwise
        try {
            const hasAccess = await hasPurchasedApp();
            if (!hasAccess) {
                if (confirm("The Downloadable App is exclusive to Eternity Members ($488.88 Zen Gear). \n\nClick OK to upgrade and unlock.")) {
                    if (window.showPricingModal) window.showPricingModal();
                }
                return;
            }
        } catch (e) {
            console.warn('[PWA] Error checking purchase on install button:', e);
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted install');
        } else {
            console.log('[PWA] User dismissed install');
        }

        deferredPrompt = null;
        hideInstallBanner();
    });

    document.getElementById('pwaCloseBtn').addEventListener('click', () => {
        localStorage.setItem(INSTALL_DECLINED_KEY, Date.now().toString());
        hideInstallBanner();
    });
}

function hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 300);
    }
}

function showToast(message, type) {
    // Use existing toast if available
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }

    // Fallback toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : '#334155'};
        color: white;
        padding: 12px 24px;
        border-radius: 100px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showPWALockScreen() {
    if (document.getElementById('pwaLockScreen')) return;

    const blockScreen = document.createElement('div');
    blockScreen.id = 'pwaLockScreen';
    blockScreen.style.cssText = `
        position: fixed; inset: 0; z-index: 999999; 
        background: #0f172a; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; padding: 24px; text-align: center;
    `;
    blockScreen.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 24px;">🔒</div>
        <h2 style="color: white; font-size: 28px; margin-bottom: 16px; font-weight: 700;">App Lock Enabled</h2>
        <p style="color: #94a3b8; font-size: 16px; margin-bottom: 32px; max-width: 400px; line-height: 1.6;">
            The MindWave Downloadable App is exclusive to <b>Lifetime Members</b>.<br><br>
            Your current subscription does not include app access. Please return to the web version or upgrade to unlock.
        </p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
            <button onclick="window.location.href='https://mindwave.com'" style="background: rgba(255,255,255,0.1); color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; cursor: pointer;">Open Web Version</button>
            <button onclick="
                const lock = document.getElementById('pwaLockScreen');
                if (lock) lock.style.display = 'none'; // Temporarily hide to show modal
                if(window.showPricingModal) window.showPricingModal();
            " style="background: #10b981; color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Upgrade to Unlock</button>
        </div>
        <div style="margin-top: 24px;">
            <button onclick="
                const lock = document.getElementById('pwaLockScreen');
                if (lock) lock.style.display = 'none'; // Temporarily hide lock
                if (window.openAuthModal) {
                    window.openAuthModal();
                } else {
                    alert('Login module initializing...');
                    if (lock) lock.style.display = 'flex';
                }
            " style="background: none; border: none; color: #38bdf8; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: underline;">Already upgraded? Log In</button>
        </div>
    `;
    document.body.appendChild(blockScreen);
}
