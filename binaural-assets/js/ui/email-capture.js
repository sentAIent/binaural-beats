/**
 * Email Capture Modal
 * Shows a newsletter signup for non-logged-in users
 */

const EMAIL_CAPTURE_KEY = 'mindwave_email_captured';
const DELAY_MS = 120000; // 2 minutes

let emailModalShown = false;

export function initEmailCapture() {
    // Don't show if already captured email
    if (localStorage.getItem(EMAIL_CAPTURE_KEY)) return;

    // Wait before showing (also gives Firebase time to initialize)
    setTimeout(async () => {
        try {
            // Dynamically import Firebase auth to avoid race condition
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();

            // Don't show if user is logged in
            if (auth.currentUser) return;
            if (emailModalShown) return;

            showEmailCaptureModal();
        } catch (err) {
            console.warn('[Email Capture] Firebase not ready:', err.message);
        }
    }, DELAY_MS);
}


function showEmailCaptureModal() {
    if (document.getElementById('emailCaptureModal')) return;
    emailModalShown = true;

    const modal = document.createElement('div');
    modal.id = 'emailCaptureModal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.style.cssText = `
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
        <div style="
            max-width: 420px;
            width: 100%;
            background: linear-gradient(180deg, rgba(25, 25, 40, 0.98), rgba(15, 15, 25, 0.98));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px 32px;
            text-align: center;
            animation: slideUp 0.4s ease;
            position: relative;
        ">
            <!-- Close Button -->
            <button id="emailCaptureClose" style="
                position: absolute;
                top: 16px;
                right: 16px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
            ">×</button>
            
            <!-- Icon -->
            <div style="
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: linear-gradient(135deg, #8b5cf6, #6366f1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
            ">🧘</div>
            
            <!-- Title -->
            <h2 style="
                font-size: 24px;
                font-weight: 700;
                color: white;
                margin-bottom: 12px;
            ">Get 7 Days Free</h2>
            
            <!-- Subtitle -->
            <p style="
                font-size: 15px;
                color: #94a3b8;
                margin-bottom: 24px;
                line-height: 1.5;
            ">Join 10,000+ meditators. We'll send you tips, new features, and exclusive offers.</p>
            
            <!-- Form -->
            <form id="emailCaptureForm">
                <input 
                    type="email" 
                    id="emailCaptureInput"
                    placeholder="Enter your email"
                    required
                    style="
                        width: 100%;
                        padding: 14px 16px;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 15px;
                        margin-bottom: 12px;
                        outline: none;
                        transition: border-color 0.2s;
                    "
                    onfocus="this.style.borderColor='#8b5cf6'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.2)'"
                >
                <button 
                    type="submit"
                    id="emailCaptureSubmit"
                    style="
                        width: 100%;
                        padding: 14px;
                        background: linear-gradient(135deg, #8b5cf6, #6366f1);
                        border: none;
                        border-radius: 12px;
                        color: white;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, opacity 0.2s;
                    "
                >Get Free Access</button>
            </form>
            
            <!-- Privacy Note -->
            <p style="
                font-size: 11px;
                color: #64748b;
                margin-top: 16px;
            ">We respect your privacy. Unsubscribe anytime.</p>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#emailCaptureClose').addEventListener('click', hideEmailCapture);
    modal.querySelector('#emailCaptureForm').addEventListener('submit', handleEmailSubmit);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideEmailCapture();
    });

    // Close on Escape
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            hideEmailCapture();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

async function handleEmailSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('emailCaptureInput');
    const button = document.getElementById('emailCaptureSubmit');
    const email = input.value.trim();

    if (!email) return;

    // Show loading state
    button.textContent = 'Saving...';
    button.disabled = true;

    try {
        // Dynamically import Firestore
        const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

        // Save to Firestore
        const db = getFirestore();
        await setDoc(doc(db, 'email_subscribers', email.toLowerCase().replace(/[^a-z0-9]/g, '_')), {
            email: email.toLowerCase(),
            source: 'email_capture_modal',
            createdAt: serverTimestamp(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        console.log('[Email Capture] Email saved:', email);

        // Mark as captured
        localStorage.setItem(EMAIL_CAPTURE_KEY, email);

        // Show success
        button.textContent = '✓ You\'re in!';
        button.style.background = '#10b981';

        setTimeout(() => {
            hideEmailCapture();

            // Show toast
            if (window.showToast) {
                window.showToast('Welcome! Check your email for your free trial.', 'success');
            }
        }, 1500);

    } catch (err) {
        console.error('[Email Capture] Error:', err);

        // Still mark as captured to avoid annoying user
        localStorage.setItem(EMAIL_CAPTURE_KEY, 'failed_' + email);

        button.textContent = 'Error - Try Again';
        button.style.background = '#ef4444';
        button.disabled = false;

        setTimeout(() => {
            button.textContent = 'Get Free Access';
            button.style.background = 'linear-gradient(135deg, #8b5cf6, #6366f1)';
        }, 2000);
    }
}

function hideEmailCapture() {
    const modal = document.getElementById('emailCaptureModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}
