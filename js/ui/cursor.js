import { THEMES, state } from '../state.js';

// Available cursor shapes - more choices including user-requested shapes
const CURSOR_SHAPES = {
    sun: {
        name: 'Sun',
        icon: '☀️',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="6" fill="${color}"/>
            <g stroke="${color}" stroke-width="2" stroke-linecap="round">
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="16" y1="26" x2="16" y2="30"/>
                <line x1="2" y1="16" x2="6" y2="16"/>
                <line x1="26" y1="16" x2="30" y2="16"/>
                <line x1="6" y1="6" x2="9" y2="9"/>
                <line x1="23" y1="23" x2="26" y2="26"/>
                <line x1="6" y1="26" x2="9" y2="23"/>
                <line x1="23" y1="9" x2="26" y2="6"/>
            </g>
        </svg>`
    },
    moon: {
        name: 'Moon',
        icon: '🌙',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 4C9.5 4 6 7.5 6 12c0 4.5 3.5 8 8 8 1.5 0 2.9-.4 4.1-1.1-1.5-1.5-2.4-3.6-2.4-5.9 0-2.3.9-4.4 2.4-5.9C16.9 4.4 15.5 4 14 4z" fill="${color}"/>
        </svg>`
    },
    plus: {
        name: 'Plus',
        icon: '➕',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <line x1="12" y1="4" x2="12" y2="20" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
            <line x1="4" y1="12" x2="20" y2="12" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    lotus: {
        name: 'Lotus',
        icon: '🪷',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <ellipse cx="16" cy="16" rx="4" ry="8" fill="${color}" opacity="0.8"/>
            <ellipse cx="16" cy="16" rx="4" ry="8" fill="${color}" opacity="0.6" transform="rotate(45 16 16)"/>
            <ellipse cx="16" cy="16" rx="4" ry="8" fill="${color}" opacity="0.6" transform="rotate(-45 16 16)"/>
            <ellipse cx="16" cy="16" rx="4" ry="8" fill="${color}" opacity="0.6" transform="rotate(90 16 16)"/>
            <circle cx="16" cy="16" r="3" fill="${color}"/>
        </svg>`
    },
    heart: {
        name: 'Heart',
        icon: '❤️',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 24l-1.5-1.3C7.4 18.1 4 15.1 4 11.5 4 8.4 6.4 6 9.5 6c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.6-3.4 6.6-8.5 11.2L14 24z" fill="${color}"/>
        </svg>`
    },
    dot: {
        name: 'Dot',
        icon: '●',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" fill="${color}"/>
        </svg>`
    },
    ring: {
        name: 'Ring',
        icon: '◯',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="10" fill="none" stroke="${color}" stroke-width="2"/>
            <circle cx="14" cy="14" r="2" fill="${color}"/>
        </svg>`
    },
    target: {
        name: 'Target',
        icon: '◎',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="10" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
            <circle cx="14" cy="14" r="5" fill="none" stroke="${color}" stroke-width="1.5"/>
            <circle cx="14" cy="14" r="2" fill="${color}"/>
        </svg>`
    },
    default: {
        name: 'Default',
        icon: '↖',
        create: () => null // Use browser default
    }
};

let currentShape = 'sun';
let customColor = null; // null = use theme accent

/**
 * Initialize Custom Cursor
 */
export function initCursor() {
    // Load saved shape
    const savedShape = localStorage.getItem('mindwave_cursor_shape');
    if (savedShape && CURSOR_SHAPES[savedShape]) {
        currentShape = savedShape;
    }

    // Load saved custom color
    const savedColor = localStorage.getItem('mindwave_cursor_color');
    if (savedColor) {
        customColor = savedColor;
    }

    // Initial setup
    updateCursorStyle();

    // Listen for theme changes (only update if no custom color)
    window.addEventListener('themeChanged', (e) => {
        console.log('[Cursor] Theme changed, updating cursor');
        if (!customColor) {
            updateCursorStyle(e.detail.theme.accent);
        }
    });

    console.log('[Cursor] Initialized with shape:', currentShape, 'color:', customColor || 'theme accent');
}

/**
 * Returns the effective cursor color
 */
function getEffectiveCursorColor() {
    if (customColor) return customColor;
    const computedStyle = getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue('--accent').trim() || '#60a9ff';
}

/**
 * Updates the cursor CSS
 */
function updateCursorStyle(colorOverride = null) {
    const color = colorOverride || getEffectiveCursorColor();

    let styleTag = document.getElementById('dynamic-cursor-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-cursor-styles';
        document.head.appendChild(styleTag);
    }

    if (currentShape === 'default') {
        styleTag.textContent = ''; // Use browser default
        return;
    }

    const svg = CURSOR_SHAPES[currentShape].create(color);
    const dataUri = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, auto`;

    styleTag.textContent = `
        body, a, button, [role="button"], input, select, textarea, .cursor-pointer {
            cursor: ${dataUri} !important;
        }
    `;
}

/**
 * Set cursor shape
 */
export function setCursorShape(shape) {
    if (!CURSOR_SHAPES[shape]) return;

    currentShape = shape;
    localStorage.setItem('mindwave_cursor_shape', shape);
    updateCursorStyle();

    // Update UI
    document.querySelectorAll('.cursor-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === shape);
        if (btn.dataset.shape === shape) {
            btn.classList.add('bg-[var(--accent)]/20', 'border-[var(--accent)]');
            btn.classList.remove('bg-white/5', 'border-white/10');
        } else {
            btn.classList.remove('bg-[var(--accent)]/20', 'border-[var(--accent)]');
            btn.classList.add('bg-white/5', 'border-white/10');
        }
    });
}

/**
 * Set cursor color
 */
export function setCursorColor(color) {
    customColor = color;
    if (color) {
        localStorage.setItem('mindwave_cursor_color', color);
    } else {
        localStorage.removeItem('mindwave_cursor_color');
    }
    updateCursorStyle();

    // Update color picker UI
    const picker = document.getElementById('cursorColorPicker');
    if (picker && color) {
        picker.value = color;
    }
    const preview = document.getElementById('cursorColorPreview');
    if (preview) {
        preview.style.backgroundColor = getEffectiveCursorColor();
    }
}

/**
 * Reset cursor color to theme accent
 */
export function resetCursorColor() {
    setCursorColor(null);
}

/**
 * Creates the cursor selection UI inside the theme modal
 */
export function createCursorUIInThemeModal() {
    const themeModalContent = document.querySelector('#themeModal .overflow-y-auto');
    if (!themeModalContent) {
        console.warn('[Cursor] Theme modal content not found');
        return;
    }

    // Check if already exists
    if (document.getElementById('cursorSection')) return;

    const section = document.createElement('div');
    section.id = 'cursorSection';
    section.className = 'mt-6 pt-6 border-t border-white/10';
    section.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-[var(--accent)]/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    <path d="M13 13l6 6" fill="none"/>
                </svg>
            </div>
            <div>
                <h3 class="text-sm font-bold tracking-tight" style="color: var(--text-main);">CUSTOM CURSOR</h3>
                <div class="text-xs" style="color: var(--text-main); opacity: 0.7;">Choose shape and color</div>
            </div>
        </div>
        
        <!-- Cursor Color Picker -->
        <div class="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <span class="text-xs font-medium" style="color: var(--text-main);">Color:</span>
            <div class="relative group">
                <div id="cursorColorPreview" 
                    class="w-8 h-8 rounded-full border-2 border-[var(--accent)]/40 cursor-pointer shadow-lg transition-transform hover:scale-110"
                    style="background-color: ${getEffectiveCursorColor()};"></div>
                <input type="color" id="cursorColorPicker" value="${customColor || '#60a9ff'}"
                    class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            </div>
            <button id="resetCursorColor" 
                class="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 transition-all border border-[var(--accent)]/30"
                style="color: var(--text-main);"
                title="Reset to theme accent">
                Reset
            </button>
        </div>
        
        <!-- Cursor Shape Grid -->
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2" id="cursorShapeGrid">
            ${Object.entries(CURSOR_SHAPES).map(([key, shape]) => {
        // Use colored/visible versions of the icons
        const coloredIcons = {
            sun: '☀️',
            moon: '🌙',
            plus: '<span style="color:#22c55e;">✚</span>',
            lotus: '🪷',
            heart: '❤️',
            dot: '🔵',
            ring: '⭕',
            target: '🎯',
            default: '🖱️'
        };
        const icon = coloredIcons[key] || shape.icon;
        return `
                <button 
                    class="cursor-option p-3 rounded-xl text-center transition-all border ${key === currentShape ? 'active bg-[var(--accent)]/20 border-[var(--accent)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}"
                    data-shape="${key}"
                    title="${shape.name}"
                >
                    <span class="text-2xl block">${icon}</span>
                    <div class="text-[10px] mt-1 font-semibold" style="color: var(--text-main);">${shape.name}</div>
                </button>
            `}).join('')}
        </div>
    `;

    themeModalContent.appendChild(section);

    // Add event listeners
    section.querySelectorAll('.cursor-option').forEach(btn => {
        btn.addEventListener('click', () => {
            setCursorShape(btn.dataset.shape);
        });
    });

    const colorPicker = section.querySelector('#cursorColorPicker');
    const colorPreview = section.querySelector('#cursorColorPreview');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            setCursorColor(e.target.value);
        });
    }

    const resetBtn = section.querySelector('#resetCursorColor');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetCursorColor();
            // Update preview to theme accent
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            if (colorPreview) colorPreview.style.backgroundColor = accent;
            if (colorPicker) colorPicker.value = accent;
        });
    }
}

// Export for global access
window.setCursorShape = setCursorShape;
window.setCursorColor = setCursorColor;
window.resetCursorColor = resetCursorColor;
