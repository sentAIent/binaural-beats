/**
 * Social Proof System
 * Shows "Recent Purchase" toasts to increase conversion
 */

const NAMES = [
    "Sarah J.", "David K.", "Michelle R.", "Jessica M.", "Alex T.",
    "Emily W.", "Chris B.", "Amanda L.", "Daniel H.", "Rachel P.",
    "Julian S.", "Hiroshi M.", "Elena G.", "Marcus V.", "Sasha L.",
    "Kevin D.", "Sofia Z.", "Liam O.", "Maya C.", "Noah W."
];

const LOCATIONS = [
    "New York", "London", "San Francisco", "Austin", "Berlin",
    "Tokyo", "Sydney", "Toronto", "Paris", "Singapore"
];

const ACTIONS = [
    { text: "joined Zen", premium: true, icon: "⚡" },
    { text: "unlocked Eternity Access", premium: true, icon: "🔥" },
    { text: "is in Deep Focus mode", premium: false, icon: "🧠" },
    { text: "is meditating with Theta waves", premium: false, icon: "🧘" },
    { text: "is manifestating in Alpha state", premium: false, icon: "🍃" },
    { text: "unlocked Nirvana", premium: true, icon: "💎" },
    { text: "started a 30-Day Journey", premium: false, icon: "🚀" }
];

export function initSocialProof() {
    // Start loop after a delay
    setTimeout(scheduleNextToast, 5000);
}

function scheduleNextToast() {
    const delay = Math.random() * (45000 - 15000) + 15000; // 15-45 seconds
    setTimeout(() => {
        showToast();
        scheduleNextToast();
    }, delay);
}

function showToast() {
    // Don't show if user is busy (e.g. modal open)
    // Don't show if any major modal is open
    const activeModals = [
        document.getElementById('pricingModal'),
        document.getElementById('authModal'),
        document.getElementById('profileModal'),
        document.getElementById('journeyModal'),
        document.getElementById('upgradePromptModal'),
        document.querySelector('.modal:not(.hidden)') // Fallback
    ].filter(m => m && !m.classList.contains('hidden'));

    if (activeModals.length > 0) return;

    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const time = Math.floor(Math.random() * 10) + 1; // 1-10

    const toast = document.createElement('div');
    toast.className = 'social-proof-toast';

    // Premium styling for purchases
    const border = action.premium ? 'rgba(250, 204, 21, 0.4)' : 'rgba(255, 255, 255, 0.1)';
    const glow = action.premium ? '0 10px 30px -5px rgba(250, 204, 21, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)';

    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid ${border};
        padding: 12px 16px;
        border-radius: 16px;
        color: white;
        font-family: 'Inter', system-ui, sans-serif;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: ${glow};
        transform: translateX(-120%);
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
        min-width: 260px;
    `;

    toast.innerHTML = `
        <div style="width: 40px; height: 40px; background: ${action.premium ? 'linear-gradient(135deg, #facc15, #eab308)' : 'linear-gradient(135deg, #2dd4bf, #3b82f6)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
            ${action.icon}
        </div>
        <div>
            <div style="font-size: 13px; font-weight: 700; color: #f8fafc;">${name} from ${location}</div>
            <div style="font-size: 11px; color: ${action.premium ? '#fde047' : '#94a3b8'}; line-height: 1.4;">${action.text}</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${time} min ago</div>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Animate Out
    setTimeout(() => {
        toast.style.transform = 'translateX(-120%)';
        setTimeout(() => toast.remove(), 800);
    }, 6000);
}
