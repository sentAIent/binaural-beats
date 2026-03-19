/**
 * Social Proof Controller
 * Displays premium notifications of "recent activity"
 */

class SocialProofController {
    constructor() {
        this.container = null;
        this.recentEvents = [
            { name: "Julian", location: "Berlin", action: "joined the Founders Club", time: "2 min ago" },
            { name: "Sarah", location: "NYC", action: "unlocked Lifetime Access", time: "5 min ago" },
            { name: "Hiroshi", location: "Tokyo", action: "started a Deep Work session", time: "12 min ago" },
            { name: "Elena", location: "Madrid", action: "upgraded to Professional", time: "8 min ago" },
            { name: "Alex", location: "San Francisco", action: "joined the Founders Club", time: "1 min ago" }
        ];
        this.init();
    }

    init() {
        // Create container if not exists
        if (!document.getElementById('socialProofContainer')) {
            this.container = document.createElement('div');
            this.container.id = 'socialProofContainer';
            this.container.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 9999;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('socialProofContainer');
        }

        // Start cycle
        this.scheduleNext();
    }

    scheduleNext() {
        const delay = 15000 + Math.random() * 45000; // 15-60 seconds
        setTimeout(() => {
            this.showRandom();
            this.scheduleNext();
        }, delay);
    }

    showRandom() {
        const event = this.recentEvents[Math.floor(Math.random() * this.recentEvents.length)];
        this.createToast(event);
    }

    createToast(event) {
        const toast = document.createElement('div');
        toast.className = 'social-proof-toast';
        toast.style.cssText = `
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(-120%);
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: auto;
            max-width: 300px;
        `;

        toast.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #2dd4bf, #3b82f6); display: flex; items-center; justify-center; text-white; font-bold; font-size: 16px; flex-shrink: 0;">
                ${event.name[0]}
            </div>
            <div>
                <div style="font-size: 13px; font-weight: 700; color: white;">${event.name} from ${event.location}</div>
                <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">${event.action}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${event.time}</div>
            </div>
        `;

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(-120%)';
            setTimeout(() => toast.remove(), 600);
        }, 6000);
    }
}

export const socialProof = new SocialProofController();
