// GLOBAL ERROR HANDLER
window.onerror = function (msg, url, line, col, error) {
    if (msg && msg.includes && msg.includes('ResizeObserver')) return false;
    // alert(`Error: ${msg}\nLine: ${line}`);
    console.error("Global Error:", msg, error);
    return false;
};

// Fallback Config
if (typeof __firebase_config === 'undefined') {
    window.__firebase_config = JSON.stringify({
        apiKey: "dummy-api-key",
        authDomain: "dummy",
        projectId: "dummy",
        storageBucket: "dummy",
        messagingSenderId: "0000",
        appId: "1:0000:web:0000"
    });
}

if (typeof __app_id === 'undefined') window.__app_id = 'local-dev-id';

console.log("[Init] Global handlers and config initialized.");
