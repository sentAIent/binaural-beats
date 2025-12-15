export function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

// Linear Interpolation
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Toast Notification
export function showToast(msg, type = 'info') {
    const d = document.createElement('div');
    const color = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#3b82f6');
    d.style.cssText = `position:fixed; top:20px; left:50%; transform:translateX(-50%); background:${color}; color:white; padding:10px 20px; border-radius:8px; z-index:9999; font-size:13px; font-weight:bold; box-shadow:0 4px 12px rgba(0,0,0,0.3); pointer-events:none; transition: opacity 0.3s;`;
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 300); }, 3000);
}

// Restore Mix State (Stub - will be filled by controller logic)
export function applyMixState(mixData) {
    // Dispatch a custom event for the main controller to handle
    // Or import state? Importing state here might cause circular dep if state imports helpers.
    // 'state.js' -> 'helpers.js' (helpers is leaf). Safe.
    // But 'controls.js' imports 'state.js' and 'helpers.js'.
    // Let's dispatch an event to decouple.
    const event = new CustomEvent('load-mix', { detail: mixData });
    window.dispatchEvent(event);
}
