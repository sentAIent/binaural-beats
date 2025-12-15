import { setupUI } from './ui/controls.js';
import { initFirebase } from './services/firebase.js';
import { initAuthUI } from './ui/auth-controller.js';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Main] DOMLoaded - Initializing UI...");
    try {
        initFirebase();
        initAuthUI();
    } catch (e) {
        console.warn("[Main] Firebase/Auth Init Failed:", e);
    }
    setupUI();
    console.log("[Main] App Initialization Complete.");
});

