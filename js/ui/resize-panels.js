/**
 * Resizable Panels Module
 * Allows left and right sidebars to be resized by dragging
 */

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 480;  // 150% of default right panel (320px * 1.5)
const DEFAULT_LEFT_WIDTH = 256;  // w-64 = 16rem = 256px
const DEFAULT_RIGHT_WIDTH = 320; // w-80 = 20rem = 320px

let isResizing = false;
let currentPanel = null;
let startX = 0;
let startWidth = 0;

/**
 * Initialize resizable panel handles
 */
export function initResizablePanels() {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    if (!leftPanel || !rightPanel) {
        console.warn('[ResizePanels] Panels not found');
        return;
    }

    // Create resize handles
    createResizeHandle(leftPanel, 'right');
    createResizeHandle(rightPanel, 'left');

    // Restore saved widths
    restorePanelWidths();

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    // Update top bar width on window resize
    window.addEventListener('resize', updateTopBarWidth);

    // Initial call to set correct top bar width
    setTimeout(updateTopBarWidth, 100);

    console.log('[ResizePanels] Initialized');
}

/**
 * Create a resize handle for a panel
 */
function createResizeHandle(panel, side) {
    const handle = document.createElement('div');
    handle.className = `panel-resize-handle panel-resize-${side}`;
    handle.setAttribute('data-side', side);
    handle.setAttribute('data-panel', panel.id);

    // Styling
    handle.style.cssText = `
        position: absolute;
        top: 0;
        ${side}: 0;
        width: 6px;
        height: 100%;
        cursor: ew-resize;
        background: transparent;
        z-index: 100;
        transition: background 0.2s;
    `;

    // Visual indicator on hover
    handle.addEventListener('mouseenter', () => {
        handle.style.background = 'var(--accent)';
        handle.style.opacity = '0.5';
    });
    handle.addEventListener('mouseleave', () => {
        if (!isResizing) {
            handle.style.background = 'transparent';
            handle.style.opacity = '1';
        }
    });

    // Start resize on mouse/touch down
    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: false });

    panel.appendChild(handle);
}

/**
 * Start resizing
 */
function startResize(e) {
    e.preventDefault();
    isResizing = true;

    const handle = e.currentTarget;
    currentPanel = document.getElementById(handle.dataset.panel);

    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startWidth = currentPanel.offsetWidth;

    handle.style.background = 'var(--accent)';
    handle.style.opacity = '0.7';
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing'); // Ensure custom cursor yields to resize cursor
}

/**
 * Handle mouse move during resize
 */
function handleMouseMove(e) {
    if (!isResizing || !currentPanel) return;

    const clientX = e.clientX;
    const isLeft = currentPanel.id === 'leftPanel';

    let delta = isLeft ? (clientX - startX) : (startX - clientX);
    let newWidth = startWidth + delta;

    // Clamp to min/max
    newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));

    // Apply width
    setPanelWidth(currentPanel, newWidth);

    // Update top bar width to adapt to panel resize
    updateTopBarWidth();
}

/**
 * Handle touch move during resize
 */
function handleTouchMove(e) {
    if (!isResizing) return;
    e.preventDefault();

    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX });
}

/**
 * End resizing
 */
function handleMouseUp() {
    if (!isResizing) return;

    isResizing = false;

    // Save width
    if (currentPanel) {
        savePanelWidth(currentPanel.id, currentPanel.offsetWidth);
    }

    // Reset styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing'); // Remove resize cursor override

    // Reset handle appearance
    document.querySelectorAll('.panel-resize-handle').forEach(h => {
        h.style.background = 'transparent';
        h.style.opacity = '1';
    });

    currentPanel = null;
}

/**
 * Update top control bar width based on open panels
 * Called when panels are opened/closed or resized
 */
export function updateTopBarWidth() {
    const topBar = document.getElementById('topControlBar');
    if (!topBar) return;

    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    // Check if panels are open
    const leftOpen = leftPanel && !leftPanel.classList.contains('-translate-x-full');
    const rightOpen = rightPanel && !rightPanel.classList.contains('translate-x-full');

    // Get the right edge of left panel (or 0 if closed)
    const leftEdge = leftOpen ? leftPanel.getBoundingClientRect().right : 0;
    // Get the left edge of right panel (or window width if closed)
    const rightEdge = rightOpen ? rightPanel.getBoundingClientRect().left : window.innerWidth;

    // The available gap between panels
    const gap = rightEdge - leftEdge;

    // Add some margin on each side (16px each = 32px total)
    const margin = 32;
    const availableWidth = gap - margin;

    // Set max-width (minimum 260px to keep it usable)
    const maxWidth = Math.max(260, availableWidth);
    topBar.style.maxWidth = `${maxWidth}px`;
}

/**
 * Set panel width and scale content
 */
function setPanelWidth(panel, width) {
    panel.style.width = `${width}px`;

    // Calculate scale factor (1.0 at default, smaller when narrower, larger when wider)
    const defaultWidth = panel.id === 'leftPanel' ? DEFAULT_LEFT_WIDTH : DEFAULT_RIGHT_WIDTH;
    const scale = Math.max(0.7, Math.min(2.0, width / defaultWidth));

    // Apply CSS variable for responsive scaling
    panel.style.setProperty('--panel-scale', scale);

    // Scale text and icons
    scaleContent(panel, scale);
}

/**
 * Scale panel content based on width
 */
function scaleContent(panel, scale) {
    // Scale text sizes
    const baseSize = 10; // base font size in px
    const headingSize = scale < 0.85 ? 9 : 10;
    const labelSize = scale < 0.85 ? 8 : 9;

    // Apply scaled styles via CSS custom properties
    panel.style.setProperty('--heading-size', `${headingSize}px`);
    panel.style.setProperty('--label-size', `${labelSize}px`);
    panel.style.setProperty('--icon-scale', scale < 0.85 ? '0.85' : '1');

    // For significantly smaller panels, reduce padding
    if (scale < 0.8) {
        panel.classList.add('panel-compact');
    } else {
        panel.classList.remove('panel-compact');
    }

    // Column layout based on width increase
    // Default: 2 columns, 20%+ wider: 3 columns, 50%+ wider: 4 columns
    panel.classList.remove('panel-cols-3', 'panel-cols-4');

    if (scale >= 1.5) {
        // 50% or more wider than default -> 4 columns
        panel.classList.add('panel-cols-4');
    } else if (scale >= 1.2) {
        // 20% or more wider than default -> 3 columns
        panel.classList.add('panel-cols-3');
    }
    // Default (scale < 1.2) stays at 2 columns (no class needed)
}

/**
 * Save panel width to localStorage
 */
function savePanelWidth(panelId, width) {
    const key = `mindwave_panel_${panelId}_width`;
    localStorage.setItem(key, width.toString());
}

/**
 * Restore panel widths from localStorage
 */
function restorePanelWidths() {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    const leftWidth = localStorage.getItem('mindwave_panel_leftPanel_width');
    const rightWidth = localStorage.getItem('mindwave_panel_rightPanel_width');

    if (leftWidth && leftPanel) {
        setPanelWidth(leftPanel, parseInt(leftWidth, 10));
    }

    if (rightWidth && rightPanel) {
        setPanelWidth(rightPanel, parseInt(rightWidth, 10));
    }
}

/**
 * Reset panels to default widths
 */
export function resetPanelWidths() {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    if (leftPanel) {
        setPanelWidth(leftPanel, DEFAULT_LEFT_WIDTH);
        localStorage.removeItem('mindwave_panel_leftPanel_width');
    }

    if (rightPanel) {
        setPanelWidth(rightPanel, DEFAULT_RIGHT_WIDTH);
        localStorage.removeItem('mindwave_panel_rightPanel_width');
    }
}
