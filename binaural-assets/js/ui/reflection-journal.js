/**
 * Reflection Journal UI
 * Post-session check-in to capture insights and feelings.
 */

import { FEELINGS, saveReflection } from '../services/journal-service.js';

export function showReflectionPrompt(sessionData = {}) {
    const modal = document.createElement('div');
    modal.id = 'reflectionModal';
    modal.className = 'fixed inset-0 z-[2000000] flex items-center justify-center animate-[fade-in_0.3s_ease] bg-black/40 backdrop-blur-sm';

    let selectedFeeling = null;

    modal.innerHTML = `
        <style>
            .feeling-btn.active { border-color: var(--accent) !important; background: rgba(var(--accent-rgb), 0.2) !important; }
            .reflection-popup {
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(40px) saturate(160%);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7);
                width: 90%;
                max-width: 500px;
                padding: 2.5rem;
                border-radius: 2rem;
                text-align: center;
                animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>
        
        <div class="reflection-popup">
            <h2 class="text-2xl font-black text-white mb-2 tracking-tight">Session Complete</h2>
            <p class="text-slate-400 text-sm mb-8">How do you feel after this journey?</p>
            
            <!-- Feelings Grid -->
            <div class="grid grid-cols-5 gap-3 mb-8">
                ${FEELINGS.map(f => `
                    <button class="feeling-btn group flex flex-col items-center p-3 rounded-2xl border border-white/5 bg-white/5 transition-all hover:bg-white/10" data-feeling="${f.id}">
                        <span class="text-2xl mb-1 group-hover:scale-110 transition-transform">${f.icon}</span>
                        <span class="text-[8px] uppercase font-bold text-white/40 tracking-widest">${f.label}</span>
                    </button>
                `).join('')}
            </div>
            
            <!-- Insight Textarea -->
            <div class="mb-8">
                <label class="block text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 text-left">Any insights?</label>
                <textarea id="reflectionNote" 
                    placeholder="Capture your thoughts..." 
                    class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-all resize-none h-24"
                ></textarea>
            </div>
            
            <div class="flex flex-col gap-3">
                <button id="saveReflectionBtn" class="w-full py-4 rounded-xl bg-[var(--accent)] text-black font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--accent)]/20">
                    Save Reflection
                </button>
                <button id="skipReflectionBtn" class="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-all uppercase tracking-[0.3em]">
                    Maybe later
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Interaction Logic
    const feelingBtns = modal.querySelectorAll('.feeling-btn');
    feelingBtns.forEach(btn => {
        btn.onclick = () => {
            feelingBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFeeling = btn.dataset.feeling;
        };
    });

    document.getElementById('saveReflectionBtn').onclick = async () => {
        const note = document.getElementById('reflectionNote').value.trim();
        await saveReflection({
            feeling: selectedFeeling,
            note: note,
            sessionDuration: sessionData.duration || 0
        });
        close();
    };

    document.getElementById('skipReflectionBtn').onclick = () => close();

    function close() {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}
