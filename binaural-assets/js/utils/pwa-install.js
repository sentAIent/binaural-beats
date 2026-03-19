/**
 * PWA Install Prompt
 * Shows a custom install banner when the app is installable
 */

let deferredPrompt = null;
let installBannerShown = false;
const INSTALL_DECLINED_KEY = 'mindwave_install_declined';
const INSTALL_COMPLETED_KEY = 'mindwave_installed';

export function initPWAInstall() {
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
        background: #10b981;
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        z-index: 9999;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
