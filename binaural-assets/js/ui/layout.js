import { els } from '../state.js';
import { updateTopBarWidth } from './resize-panels.js';

// Swipe gesture detection for mobile sidebar navigation
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels
const EDGE_ZONE = 30; // Edge zone for triggering swipes (from screen edge)

export function setupSwipeGestures() {
    const overlay = document.getElementById('appOverlay');
    if (!overlay) return;

    overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
    overlay.addEventListener('touchend', handleTouchEnd, { passive: true });

    console.log('[Mobile] Swipe gestures initialized');
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;

    handleSwipe();
}

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const screenWidth = window.innerWidth;

    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

    // Check if swipe is significant enough
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    const leftPanel = els.leftPanel || document.getElementById('leftPanel');
    const rightPanel = els.rightPanel || document.getElementById('rightPanel');

    // Swipe RIGHT (open left panel or close right panel)
    if (deltaX > 0) {
        // If started from left edge, open left panel
        if (touchStartX < EDGE_ZONE) {
            if (leftPanel) {
                leftPanel.classList.remove('-translate-x-full');
                updateTopBarWidth();
                console.log('[Swipe] Opening presets panel');
            }
        }
        // If right panel is open, close it
        else if (rightPanel && !rightPanel.classList.contains('translate-x-full')) {
            rightPanel.classList.add('translate-x-full');
            document.body.classList.remove('right-panel-open');
            updateTopBarWidth();
            console.log('[Swipe] Closing mixer panel');
        }
    }

    // Swipe LEFT (open right panel or close left panel)
    else if (deltaX < 0) {
        // If started from right edge, open right panel
        if (touchStartX > screenWidth - EDGE_ZONE) {
            if (rightPanel) {
                rightPanel.classList.remove('translate-x-full');
                document.body.classList.add('right-panel-open');
                updateTopBarWidth();
                console.log('[Swipe] Opening mixer panel');
            }
        }
        // If left panel is open, close it
        else if (leftPanel && !leftPanel.classList.contains('-translate-x-full')) {
            leftPanel.classList.add('-translate-x-full');
            updateTopBarWidth();
            console.log('[Swipe] Closing presets panel');
        }
    }
}

export function adjustMixerLayout() {
    // Disabled - Handled by CSS Flexbox
    return;
}
