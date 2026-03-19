import { THEMES, state } from '../state.js';

// Available cursor shapes - more choices including user-requested shapes
const CURSOR_SHAPES = {
    sun: {
        name: 'Sun',
        icon: '☀️',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32">
            <g>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(0,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(45,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(90,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(135,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(180,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(225,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(270,50,50)"/>
                <polygon points="46,35 54,35 50,8"  fill="${color}" transform="rotate(315,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(22.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(67.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(112.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(157.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(202.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(247.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(292.5,50,50)"/>
                <polygon points="48,35 52,35 50,18" fill="${color}" transform="rotate(337.5,50,50)"/>
                <circle cx="50" cy="50" r="15" fill="none" stroke="${color}" stroke-width="5"/>
            </g>
        </svg>`
    },
    moon: {
        name: 'Moon',
        icon: '🌙',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <path d="M 26 4 A 14 14 0 1 1 4 26 A 16 16 0 0 0 26 4 Z" fill="${color}"/>
        </svg>`
    },
    heart: {
        name: 'Heart',
        icon: '❤️',
        create: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 24l-1.5-1.3C7.4 18.1 4 15.1 4 11.5 4 8.4 6.4 6 9.5 6c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.6-3.4 6.6-8.5 11.2L14 24z" fill="${color}"/>
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
    mindwave: {
        name: 'MindWave',
        icon: 'mw',
        create: (color, secondary) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 128 128">
            <!-- Branded M/W MindWave Logo -->
            <g stroke-linecap="round" stroke-linejoin="round" fill="none">
                <!-- Outer Petal Outline (Curated Secondary) -->
                <path d="M64 20 C80 20 108 50 108 80 C108 105 88 115 64 115 C40 115 20 105 20 80 C20 50 48 20 64 20 Z" stroke="${secondary || color}" stroke-width="6" opacity="0.4"/>
                <!-- Branded M shape (Primary Accent) -->
                <path d="M40 85 L52 55 L64 75 L76 55 L88 85" stroke="${color}" stroke-width="8"/>
                <!-- Underline Wave (Primary Accent) -->
                <path d="M30 95 C45 85 83 85 98 95" stroke="${color}" stroke-width="4" opacity="0.6"/>
            </g>
        </svg>`
    },
    sun2: {
        name: 'Sun 2',
        icon: '🌞',
        create: () => null // uses image file instead
    },
    default: {
        name: 'Default',
        icon: '↖',
        create: () => null
    }
};

let currentShape = 'lotus';
let customColor = null;
let customOpacity = 1.0;

export function initCursor() {
    state.currentTheme = localStorage.getItem('mindwave_theme') || 'default';
    const savedShape = localStorage.getItem('mindwave_cursor_shape');
    if (savedShape && CURSOR_SHAPES[savedShape]) {
        currentShape = savedShape;
    } else {
        currentShape = 'default';
        localStorage.setItem('mindwave_cursor_shape', 'default');
    }
    const savedColor = localStorage.getItem('mindwave_cursor_color');
    if (savedColor) customColor = savedColor;
    updateCursorStyle();
    window.addEventListener('themeChanged', (e) => {
        state.currentTheme = e.detail.name;
        updateCursorStyle();
    });
}

function getEffectiveCursorColor() {
    if (customColor) return customColor;
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#60a9ff';
}

function getSecondaryCursorColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#fb7185';
}

function updateCursorStyle() {
    let styleTag = document.getElementById('dynamic-cursor-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-cursor-styles';
        document.head.appendChild(styleTag);
    }
    if (currentShape === 'default') {
        styleTag.textContent = '';
        return;
    }
    const color = getEffectiveCursorColor();
    const secondary = getSecondaryCursorColor();

    if (currentShape === 'sun2') {
        styleTag.textContent = `body, a, button, [role="button"], input, select, textarea, .cursor-pointer { cursor: url('./tribal-sun-cursor.png') 16 16, auto !important; }`;
        return;
    }

    if (currentShape === 'mindwave') {
        styleTag.textContent = `body, a, button, [role="button"], input, select, textarea, .cursor-pointer { cursor: url('./mindwave-cursor.png') 31 31, auto !important; }`;
        return;
    }

    const svg = CURSOR_SHAPES[currentShape].create(color, secondary);
    if (!svg) {
        styleTag.textContent = '';
        return;
    }

    // Inject custom opacity directly into the SVG tag
    let finalSvg = svg;
    if (customOpacity !== 1.0) {
        finalSvg = finalSvg.replace('<svg ', `<svg opacity="${customOpacity}" `);
    }

    const dataUri = `url("data:image/svg+xml,${encodeURIComponent(finalSvg)}") 16 16, auto`;
    styleTag.textContent = `body, a, button, [role="button"], input, select, textarea, .cursor-pointer { cursor: ${dataUri} !important; }`;
}

export function setCursorShape(shape) {
    if (!CURSOR_SHAPES[shape]) return;
    currentShape = shape;
    localStorage.setItem('mindwave_cursor_shape', shape);
    updateCursorStyle();
    document.querySelectorAll('.cursor-option').forEach(btn => {
        const isActive = btn.dataset.shape === shape;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.classList.add('bg-[var(--accent)]/20', 'border-[var(--accent)]');
            btn.classList.remove('bg-white/5', 'border-white/10');
        } else {
            btn.classList.remove('bg-[var(--accent)]/20', 'border-[var(--accent)]');
            btn.classList.add('bg-white/5', 'border-white/10');
        }
    });
}

export function setCursorOpacity(opacity) {
    customOpacity = opacity;
    updateCursorStyle();
}

export function setCursorColor(color) {
    customColor = color;
    color ? localStorage.setItem('mindwave_cursor_color', color) : localStorage.removeItem('mindwave_cursor_color');
    updateCursorStyle();
    const picker = document.getElementById('cursorColorPicker');
    if (picker && color) picker.value = color;
    const preview = document.getElementById('cursorColorPreview');
    if (preview) preview.style.backgroundColor = getEffectiveCursorColor();
}

export function resetCursorColor() {
    setCursorColor(null);
}

export function createCursorUIInThemeModal() {
    console.log('[Cursor] Rendering UI');
    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid) return;
    const existing = document.getElementById('cursorSection');
    if (existing) existing.remove();
    const section = document.createElement('div');
    section.id = 'cursorSection';
    section.className = 'mt-6 pt-6 border-t border-white/10';
    section.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-[var(--accent)]/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6" fill="none"/>
                </svg>
            </div>
            <div>
                <h3 class="text-sm font-bold tracking-tight" style="color: var(--text-main);">CUSTOM CURSOR</h3>
                <div class="text-xs" style="color: var(--text-main); opacity: 0.7;">Choose shape and color</div>
            </div>
        </div>
        <div class="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <span class="text-xs font-medium" style="color: var(--text-main);">Color:</span>
            <div class="relative group">
                <div id="cursorColorPreview" class="w-8 h-8 rounded-full border-2 border-[var(--accent)]/40 cursor-pointer shadow-lg transition-transform hover:scale-110" style="background-color: ${getEffectiveCursorColor()};"></div>
                <input type="color" id="cursorColorPicker" value="${customColor || '#60a9ff'}" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            </div>
            <button id="resetCursorColor" class="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 transition-all border border-[var(--accent)]/30" style="color: var(--text-main);">Reset</button>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2" id="cursorShapeGrid">
            ${Object.entries(CURSOR_SHAPES).map(([key, shape]) => {
        const icon = { sun: '☀️', moon: '🌙', heart: '❤️', mindwave: '<img src="./mindwave-cursor.png" width="24" height="24" style="display:inline-block;">', sun2: '🌞', default: '🖱️' }[key] || '🖱️';
        return `<button class="cursor-option p-3 rounded-xl text-center transition-all border ${key === currentShape ? 'active bg-[var(--accent)]/20 border-[var(--accent)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}" data-shape="${key}" title="${shape.name}"><span class="text-2xl block">${icon}</span><div class="text-[10px] mt-1 font-semibold" style="color: var(--text-main);">${shape.name}</div></button>`;
    }).join('')}
        </div>`;
    themeGrid.parentElement.appendChild(section);
    section.querySelectorAll('.cursor-option').forEach(btn => btn.addEventListener('click', () => setCursorShape(btn.dataset.shape)));
    const colorPicker = section.querySelector('#cursorColorPicker');
    if (colorPicker) colorPicker.addEventListener('input', (e) => setCursorColor(e.target.value));
    const resetBtn = section.querySelector('#resetCursorColor');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        resetCursorColor();
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        if (section.querySelector('#cursorColorPreview')) section.querySelector('#cursorColorPreview').style.backgroundColor = accent;
        if (colorPicker) colorPicker.value = accent;
    });
}

window.setCursorShape = setCursorShape;
window.setCursorColor = setCursorColor;
window.setCursorOpacity = setCursorOpacity;
window.resetCursorColor = resetCursorColor;
window.createCursorUIInThemeModal = createCursorUIInThemeModal;
