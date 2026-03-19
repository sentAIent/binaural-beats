/**
 * Resizable Panels Module
 * Allows left and right sidebars to be resized by dragging
 */

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 500;
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

    // Mindwave UI specific layout change event (custom)
    window.addEventListener('mindwave:layout-change', () => {
        // Small delay to allow CSS transition to start
        setTimeout(() => {
            updateTopBarWidth();
            updateBottomBarWidth();
        }, 50);
        // Final sync after transition finishes (max sidebar transition is 500ms)
        setTimeout(() => {
            updateTopBarWidth();
            updateBottomBarWidth();
        }, 550);
    });

    window.addEventListener('resize', () => {
        updateTopBarWidth();
        updateBottomBarWidth();
        updateAtmosphereColumns();
    });

    // Restore saved widths - this will now trigger the layout-change listener
    restorePanelWidths();

    // Force a reflow to ensure getBoundingClientRect is accurate for the first paint
    void leftPanel.offsetWidth;
    void rightPanel.offsetWidth;

    // FIX: Update layout IMMEDIATELY to prevent "jump" from default CSS
    updateTopBarWidth();
    updateBottomBarWidth();
    updateAtmosphereColumns();

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    // Initial calls to set correct top bar width and atmosphere columns
    setTimeout(() => {
        // Re-run updates just in case after all scripts initialized
        updateTopBarWidth();
        updateBottomBarWidth();
        updateAtmosphereColumns();
    }, 100);

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
    updateBottomBarWidth();
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

    // Check if panels are open using their actual position on screen
    const leftRect = leftPanel ? leftPanel.getBoundingClientRect() : null;
    const rightRect = rightPanel ? rightPanel.getBoundingClientRect() : null;

    // Left panel is open if its right edge is > 0 (visible)
    const leftOpen = leftRect && leftRect.right > 0;
    // Right panel is open if its left edge is < window width (visible)  
    const rightOpen = rightRect && rightRect.left < window.innerWidth;

    // Get the right edge of left panel (or 0 if closed)
    const leftWidth = leftOpen ? Math.max(0, leftRect.right) : 0;
    // Get the left edge of right panel (or window width if closed)
    const rightWidth = rightOpen ? Math.max(0, window.innerWidth - rightRect.left) : 0;

    // Update the header container's left/right bounds to match the gap
    const topHeader = document.getElementById('topHeader');
    const tapZone = document.getElementById('tapZone');

    if (topHeader) {
        topHeader.style.left = `${leftWidth}px`;
        topHeader.style.right = `${rightWidth}px`;
    }

    // Also update the main content area (tapZone) for a balanced layout
    if (tapZone) {
        tapZone.style.marginLeft = `${leftWidth}px`;
        tapZone.style.marginRight = `${rightWidth}px`;
        tapZone.style.width = `calc(100% - ${leftWidth + rightWidth}px)`;
    }

    // Available width for the control bar itself
    const gap = window.innerWidth - leftWidth - rightWidth;
    const margin = 32;
    const availableWidth = gap - margin;

    // Set max-width (minimum 260px)
    const maxWidth = Math.max(260, availableWidth);
    topBar.style.maxWidth = `${maxWidth}px`;

    // DEBUG: console.log(`[TopBar] Gap: ${gap}px, Left: ${leftWidth}px, Right: ${rightWidth}px, MaxWidth: ${maxWidth}px`);

    // Add responsive class toggling based on available width
    // This allows CSS to progressively hide less critical elements
    if (availableWidth < 500) {
        // Very narrow - most compact mode
        topBar.classList.add('control-bar-compact');
        topBar.classList.remove('control-bar-narrow', 'control-bar-medium');
    } else if (availableWidth < 700) {
        // Narrow - hide labels on sliders
        topBar.classList.add('control-bar-narrow');
        topBar.classList.remove('control-bar-compact', 'control-bar-medium');
    } else if (availableWidth < 900) {
        // Medium - hide some dividers
        topBar.classList.add('control-bar-medium');
        topBar.classList.remove('control-bar-compact', 'control-bar-narrow');
    } else {
        // Full width - show everything
        topBar.classList.remove('control-bar-compact', 'control-bar-narrow', 'control-bar-medium');
    }
}

/**
 * Update bottom control bar width/position based on open panels
 */
export function updateBottomBarWidth() {
    const bottomBar = document.getElementById('bottomControlBar');
    if (!bottomBar) return;

    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    const leftRect = leftPanel ? leftPanel.getBoundingClientRect() : null;
    const rightRect = rightPanel ? rightPanel.getBoundingClientRect() : null;

    const leftOpen = leftRect && leftRect.right > 10;
    const rightOpen = rightRect && rightRect.left < (window.innerWidth - 10);

    const windowWidth = window.innerWidth;
    const leftWidth = leftOpen ? Math.max(0, leftRect.right) : 0;
    const rightWidth = rightOpen ? Math.max(0, windowWidth - rightRect.left) : 0;
    const availableWidth = windowWidth - leftWidth - rightWidth;

    // Keep footer at full viewport width — content is centered via CSS flex
    // Pointer events pass through to allow sidebar interaction
    bottomBar.style.left = '0';
    bottomBar.style.right = '0';
    bottomBar.style.width = '100%';
    bottomBar.style.marginLeft = '0';
    bottomBar.style.marginRight = '0';
    bottomBar.style.pointerEvents = 'none';

    // Re-enable pointer events on direct children only
    Array.from(bottomBar.children).forEach(child => {
        child.style.pointerEvents = 'auto';
    });

    // Set CSS variables for children to reference
    bottomBar.style.setProperty('--footer-width', `${availableWidth}px`);
    bottomBar.style.setProperty('--left-sidebar-width', `${leftWidth}px`);
    bottomBar.style.setProperty('--right-sidebar-width', `${rightWidth}px`);

    // Manage responsive classes and CSS variables for footer content
    // We use availableWidth logic to determine precise vertical padding thinning
    if (availableWidth <= 450) {
        bottomBar.classList.add('footer-ultra');
        bottomBar.classList.remove('footer-slim', 'footer-normal');
        bottomBar.style.setProperty('--footer-gap', '4px');
        bottomBar.style.setProperty('--footer-py', '0.5rem');
        bottomBar.style.setProperty('--dock-py', '0.25rem');
    } else if (availableWidth <= 800) {
        bottomBar.classList.add('footer-slim');
        bottomBar.classList.remove('footer-ultra', 'footer-normal');
        bottomBar.style.setProperty('--footer-gap', '12px');
        bottomBar.style.setProperty('--footer-py', '1rem');
        bottomBar.style.setProperty('--dock-py', '0.5rem');
    } else if (availableWidth <= 1200) {
        bottomBar.classList.add('footer-normal');
        bottomBar.classList.remove('footer-ultra', 'footer-slim');
        bottomBar.style.setProperty('--footer-gap', '24px');
        bottomBar.style.setProperty('--footer-py', '1.5rem');
        bottomBar.style.setProperty('--dock-py', '1rem');
    } else {
        // Breathe state
        bottomBar.classList.remove('footer-ultra', 'footer-slim', 'footer-normal');
        bottomBar.style.setProperty('--footer-gap', '32px');
        bottomBar.style.setProperty('--footer-py', '2rem');
        bottomBar.style.setProperty('--dock-py', '1.5rem');
    }
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

    // Update atmosphere grid columns if this is the right panel
    if (panel.id === 'rightPanel') {
        updateAtmosphereColumns();
    }

    // Emit layout change event for real-time visualizer adjustment
    window.dispatchEvent(new CustomEvent('mindwave:layout-change'));
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
 * Update atmosphere grid columns based on right panel width
 * Switch to 2 columns when panel is >50% of viewport width
 */
export function updateAtmosphereColumns() {
    const rightPanel = document.getElementById('rightPanel');
    const soundscapeContainer = document.getElementById('soundscapeContainer');

    if (!rightPanel || !soundscapeContainer) return;

    const panelWidth = rightPanel.offsetWidth;
    const viewportWidth = window.innerWidth;
    const widthPercentage = (panelWidth / viewportWidth) * 100;

    // Switch to 2 columns when panel > 50% viewport width
    if (widthPercentage > 50) {
        soundscapeContainer.classList.remove('grid-cols-1');
        soundscapeContainer.classList.add('grid-cols-2');
    } else {
        soundscapeContainer.classList.remove('grid-cols-2');
        soundscapeContainer.classList.add('grid-cols-1');
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
