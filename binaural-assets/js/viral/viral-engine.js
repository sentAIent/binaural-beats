/**
 * Viral Engine — Core AI Orchestrator
 * Manages API config, product context, and routes generation requests
 */

import { scrapeUrl, buildManualContext } from './scraper.js';
import { PROMPT_TEMPLATES } from './templates/prompt-templates.js';
import { APPS_CONFIG } from './apps-config.js';

// =========================================================================
// API CONFIGURATION
// =========================================================================

const API_CONFIG = {
    gemini: {
        key: localStorage.getItem('viral_gemini_key') || '',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        imagenEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict',
        model: 'gemini-2.0-flash'
    },
    heygen: {
        key: localStorage.getItem('viral_heygen_key') || '',
        endpoint: 'https://api.heygen.com/v2'
    },
    higgsfield: {
        key: localStorage.getItem('viral_higgsfield_key') || '',
        endpoint: 'https://api.higgsfield.ai/v1'
    }
};

// =========================================================================
// AUTO-LOAD KEYS FROM LOCAL FILE (gitignored)
// =========================================================================
try {
    const { API_KEYS } = await import('./api-keys.local.js');
    if (API_KEYS) {
        for (const [service, key] of Object.entries(API_KEYS)) {
            if (key && API_CONFIG[service] && !API_CONFIG[service].key) {
                API_CONFIG[service].key = key;
                localStorage.setItem(`viral_${service}_key`, key);
                console.log(`[Viral Engine] Auto-loaded ${service} key from api-keys.local.js`);
            }
        }
    }
} catch (e) {
    // api-keys.local.js doesn't exist or is empty — that's fine, user can use Settings modal
}

// =========================================================================
// STATE
// =========================================================================

const HISTORY_KEY = 'viral_generation_history';
const HISTORY_MAX = 50;

let currentProduct = null;
let generationHistory = loadHistory();
let onLogCallback = null;
let onBatchProgressCallback = null;

// Load history from localStorage
function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('[Viral Engine] Failed to load history:', e);
        return [];
    }
}

// Save history to localStorage (LRU-capped)
function saveHistory() {
    try {
        // Keep only the most recent entries
        while (generationHistory.length > HISTORY_MAX) {
            generationHistory.shift();
        }
        localStorage.setItem(HISTORY_KEY, JSON.stringify(generationHistory));
    } catch (e) {
        console.warn('[Viral Engine] Failed to save history:', e);
    }
}

// =========================================================================
// PUBLIC API
// =========================================================================

/**
 * Set API keys (persists to localStorage)
 */
export function setApiKey(service, key) {
    API_CONFIG[service].key = key;
    localStorage.setItem(`viral_${service}_key`, key);
    log(`${service} API key configured.`);
}

/**
 * Get current API config status
 */
export function getApiStatus() {
    return {
        gemini: !!API_CONFIG.gemini.key,
        heygen: !!API_CONFIG.heygen.key,
        higgsfield: !!API_CONFIG.higgsfield.key
    };
}

/**
 * Register a callback for log messages
 */
export function onLog(callback) {
    onLogCallback = callback;
}

/**
 * Analyze a URL and build product context
 */
export async function analyzeProduct(urlOrName) {
    log(`Analyzing: ${urlOrName}...`);

    // Check if it's a known app
    const knownApp = findKnownApp(urlOrName);
    if (knownApp) {
        log(`Recognized: ${knownApp.name} (known app)`);
        currentProduct = {
            ...knownApp,
            isKnown: true,
            analyzedAt: new Date().toISOString()
        };

        // Still try to enrich with AI if Gemini key is set
        if (API_CONFIG.gemini.key) {
            log('Enriching known app data with AI analysis...');
            try {
                const enriched = await callGemini(PROMPT_TEMPLATES.analyzeProduct({
                    name: knownApp.name,
                    url: knownApp.url,
                    description: knownApp.tagline
                }));
                currentProduct = { ...currentProduct, ...enriched, name: knownApp.name }; // Keep original name
                log('AI enrichment complete.');
            } catch (e) {
                log('AI enrichment skipped (using known data).');
            }
        }

        return currentProduct;
    }

    // Is it a URL?
    const isUrl = urlOrName.includes('.') || urlOrName.startsWith('http');

    if (isUrl) {
        log('Scraping website...');
        const scraped = await scrapeUrl(urlOrName);

        if (!scraped.success) {
            log(`Scrape failed: ${scraped.error}`);
            // Build minimal context from just the URL
            currentProduct = buildManualContext({
                url: urlOrName,
                name: urlOrName.replace(/https?:\/\/(www\.)?/, '').split('/')[0]
            });
        } else {
            log(`Extracted: "${scraped.name}" — ${scraped.description?.slice(0, 60)}...`);
            currentProduct = scraped;
        }
    } else {
        // It's just a name — build minimal context
        log(`Using app name: "${urlOrName}"`);
        currentProduct = buildManualContext({ name: urlOrName });
    }

    // Enrich with Gemini AI analysis
    if (API_CONFIG.gemini.key) {
        log('Running AI product analysis...');
        try {
            const analysis = await callGemini(PROMPT_TEMPLATES.analyzeProduct({
                name: currentProduct.name,
                url: currentProduct.url,
                description: currentProduct.description,
                pageContent: currentProduct.pageContent
            }));
            currentProduct = { ...currentProduct, ...analysis };
            log(`AI analysis complete: ${currentProduct.targetAudience?.length || 0} audiences, ${currentProduct.keyFeatures?.length || 0} features identified.`);
        } catch (e) {
            log('AI analysis failed: ' + e.message);
        }
    } else {
        log('No Gemini API key — using scraped data only. Add key in Settings for AI-powered analysis.');
    }

    return currentProduct;
}

/**
 * Get current product context
 */
export function getProduct() {
    return currentProduct;
}

/**
 * Set product context manually
 */
export function setProduct(product) {
    currentProduct = product;
}

/**
 * Generate content of a specific type
 */
export async function generateContent(type, options = {}) {
    if (!currentProduct) throw new Error('No product analyzed yet');

    log(`Generating ${type}...`);
    const startTime = Date.now();

    let result;
    switch (type) {
        case 'scripts':
            result = await generateScripts(options);
            break;
        case 'images':
            result = await generateImages(options);
            break;
        case 'avatars':
            result = await generateAvatarVideo(options);
            break;
        case 'videos':
            result = await generateFacelessVideo(options);
            break;
        case 'text':
            result = await generateText(options);
            break;
        case 'demos':
            result = await generateDemoScript(options);
            break;
        default:
            throw new Error(`Unknown content type: ${type}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`${type} generation complete (${elapsed}s)`);

    // Save to persistent history
    const entry = {
        id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        options,
        result,
        product: currentProduct.name,
        timestamp: new Date().toISOString()
    };
    generationHistory.push(entry);
    saveHistory();

    return result;
}

/**
 * Get generation history (newest first)
 */
export function getHistory() {
    return [...generationHistory].reverse();
}

/**
 * Clear all generation history
 */
export function clearHistory() {
    generationHistory = [];
    localStorage.removeItem(HISTORY_KEY);
    log('Generation history cleared.');
}

/**
 * Register a callback for batch progress updates
 */
export function onBatchProgress(callback) {
    onBatchProgressCallback = callback;
}

/**
 * Generate multiple content types in sequence (batch mode)
 * @param {string[]} types - Array of content types to generate
 * @param {Object} optionsMap - Map of type → options
 * @returns {Object} Map of type → result
 */
export async function generateBatch(types, optionsMap = {}) {
    if (!currentProduct) throw new Error('No product analyzed yet');

    const results = {};
    const total = types.length;

    log(`Starting batch generation: ${total} content types...`);

    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const options = optionsMap[type] || {};

        if (onBatchProgressCallback) {
            onBatchProgressCallback({ completed: i, total, current: type });
        }

        try {
            results[type] = await generateContent(type, options);
        } catch (e) {
            log(`Batch: ${type} failed — ${e.message}`);
            results[type] = { error: e.message };
        }
    }

    if (onBatchProgressCallback) {
        onBatchProgressCallback({ completed: total, total, current: null });
    }

    log(`Batch complete: ${Object.keys(results).length}/${total} succeeded.`);
    return results;
}

/**
 * Export a single generation result as a JSON download
 */
export function exportResultJSON(historyEntry) {
    const blob = new Blob([JSON.stringify(historyEntry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viral_${historyEntry.type}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export all generation history as a JSON download
 */
export function exportAllJSON() {
    const bundle = {
        exported: new Date().toISOString(),
        product: currentProduct?.name || 'Unknown',
        entries: generationHistory
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viral_hub_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export a text-based result as Markdown
 */
export function exportResultMarkdown(historyEntry) {
    let md = `# ${historyEntry.type.toUpperCase()} — ${historyEntry.product}\n`;
    md += `> Generated: ${historyEntry.timestamp}\n\n`;

    const data = historyEntry.result;
    if (Array.isArray(data)) {
        data.forEach((item, i) => {
            md += `## ${item.platform || item.subject || `Item ${i + 1}`}\n\n`;
            if (item.hook) md += `**Hook:** ${item.hook}\n\n`;
            if (item.body) md += `${item.body}\n\n`;
            if (item.caption) md += `${item.caption}\n\n`;
            if (item.cta) md += `**CTA:** ${item.cta}\n\n`;
            if (item.hashtags) md += `${item.hashtags.join(' ')}\n\n`;
            md += '---\n\n';
        });
    } else if (typeof data === 'object') {
        if (data.script) md += `## Script\n\n${typeof data.script === 'string' ? data.script : JSON.stringify(data.script, null, 2)}\n\n`;
        if (data.voiceover) md += `## Voiceover\n\n${data.voiceover}\n\n`;
        if (data.intro) md += `## Intro\n\n${data.intro}\n\n`;
        if (data.steps) {
            md += `## Steps\n\n`;
            data.steps.forEach(s => {
                md += `${s.step || '•'}. **${s.highlight || s.action}** (${s.duration})\n   ${s.narration || s.visual || ''}\n\n`;
            });
        }
        if (data.outro) md += `## Outro\n\n${data.outro}\n\n`;
    } else {
        md += String(data);
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viral_${historyEntry.type}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =========================================================================
// GENERATORS
// =========================================================================

async function generateScripts(options) {
    // Parse combined style value (e.g. 'ugc-tiktok' → style='UGC-style', platform='TikTok')
    let style = options.style || 'ugc';
    let platform = options.platform || 'TikTok/Instagram Reels';

    const STYLE_MAP = {
        'ugc-tiktok': { style: 'UGC-style', platform: 'TikTok' },
        'ugc-reels': { style: 'UGC-style', platform: 'Instagram Reels' },
        'ugc-shorts': { style: 'UGC-style', platform: 'YouTube Shorts' },
        'direct': { style: 'Direct Response', platform: 'Facebook/Instagram Ads' },
        'storytelling': { style: 'Storytelling', platform: 'TikTok/Instagram Reels' }
    };

    if (STYLE_MAP[style]) {
        platform = STYLE_MAP[style].platform;
        style = STYLE_MAP[style].style;
    }

    const prompt = PROMPT_TEMPLATES.generateAdScript(currentProduct, platform, style);

    if (!API_CONFIG.gemini.key) {
        log('Using mock scripts (no API key)');
        return getMockScripts();
    }

    return await callGemini(prompt);
}

async function generateImages(options) {
    const STYLE_MAP = {
        'modern': 'modern, minimal, clean lines',
        'cinematic': 'cinematic, dramatic lighting, dark luxury',
        'vibrant': 'vibrant, bold colors, high contrast'
    };
    const styleDesc = STYLE_MAP[options.style] || options.style || 'modern, cinematic, dark luxury';

    const prompt = PROMPT_TEMPLATES.generateImagePrompts(currentProduct, styleDesc);

    if (!API_CONFIG.gemini.key) {
        log('Using mock image prompts (no API key)');
        return getMockImagePrompts();
    }

    // Step 1: Generate image concept prompts via Gemini text
    const concepts = await callGemini(prompt);
    if (!Array.isArray(concepts)) return concepts;

    // Step 2: Generate actual images via Imagen 3 for each concept
    log(`Generating ${concepts.length} images via Imagen 3...`);
    for (let i = 0; i < concepts.length; i++) {
        try {
            log(`Rendering image ${i + 1}/${concepts.length}: ${concepts[i].title}...`);
            const imageData = await callGeminiImagen(concepts[i].prompt);
            concepts[i].imageDataUrl = imageData;
        } catch (e) {
            log(`Image ${i + 1} generation failed: ${e.message}`);
            concepts[i].imageDataUrl = null;
        }
    }

    return concepts;
}

async function generateAvatarVideo(options) {
    const prompt = PROMPT_TEMPLATES.generateAvatarScript(
        currentProduct,
        options.persona || 'Professional tech reviewer'
    );

    if (!API_CONFIG.gemini.key) {
        log('Using mock avatar script (no API key)');
        return getMockAvatarScript();
    }

    const script = await callGemini(prompt);

    // If HeyGen key is set, create the actual video
    if (API_CONFIG.heygen.key && options.createVideo) {
        log('Sending to HeyGen for avatar video creation...');
        try {
            const video = await createHeyGenVideo(script, options);
            return { script, video };
        } catch (e) {
            log('HeyGen video creation failed: ' + e.message);
            return { script, video: null, error: e.message };
        }
    }

    return { script, video: null };
}

async function generateFacelessVideo(options) {
    const prompt = PROMPT_TEMPLATES.generateFacelessVideo(
        currentProduct,
        options.format || 'motivational'
    );

    if (!API_CONFIG.gemini.key) {
        log('Using mock video script (no API key)');
        return getMockVideoScript();
    }

    const script = await callGemini(prompt);

    // If Higgsfield key is set, attempt video generation
    if (API_CONFIG.higgsfield.key && options.createVideo) {
        log('Sending to Higgsfield for video generation...');
        try {
            const video = await createHiggsVideo(script, options);
            return { script, video };
        } catch (e) {
            log('Higgsfield video creation failed: ' + e.message);
            return { script, video: null, error: e.message };
        }
    }

    return { script, video: null };
}

async function generateText(options) {
    const textType = options.textType || 'captions';

    if (!API_CONFIG.gemini.key) {
        log('Using mock text (no API key)');
        return getMockText(textType);
    }

    let prompt;
    switch (textType) {
        case 'captions':
            prompt = PROMPT_TEMPLATES.generateSocialCaptions(currentProduct, options.platforms);
            break;
        case 'email':
            prompt = PROMPT_TEMPLATES.generateEmailSequence(currentProduct);
            break;
        default:
            prompt = PROMPT_TEMPLATES.generateSocialCaptions(currentProduct);
    }

    return await callGemini(prompt);
}

async function generateDemoScript(options) {
    const format = options.format || 'quick';
    const prompt = PROMPT_TEMPLATES.generateDemoScript(currentProduct, format);

    if (!API_CONFIG.gemini.key) {
        log('Using mock demo script (no API key)');
        return getMockDemoScript();
    }

    return await callGemini(prompt);
}

// =========================================================================
// API CALLS
// =========================================================================

async function callGemini(prompt) {
    const key = API_CONFIG.gemini.key;
    if (!key) throw new Error('Gemini API key not configured');

    const url = `${API_CONFIG.gemini.endpoint}?key=${key}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    try {
        const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        log('Warning: Could not parse AI response as JSON, returning raw text');
    }

    return text;
}

async function callGeminiImagen(prompt) {
    const key = API_CONFIG.gemini.key;
    if (!key) throw new Error('Gemini API key not configured');

    const url = `${API_CONFIG.gemini.imagenEndpoint}?key=${key}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio: '1:1',
                personGeneration: 'dont_allow'
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Imagen API error (${res.status}): ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('No image data in response');

    return `data:image/png;base64,${b64}`;
}

async function createHeyGenVideo(script, options) {
    const key = API_CONFIG.heygen.key;
    const endpoint = `${API_CONFIG.heygen.endpoint}/video/generate`;

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': key
        },
        body: JSON.stringify({
            video_inputs: [{
                character: {
                    type: 'avatar',
                    avatar_id: options.avatarId || 'default',
                    avatar_style: 'normal'
                },
                voice: {
                    type: 'text',
                    input_text: typeof script === 'object' ? script.script : script,
                    voice_id: options.voiceId || 'default'
                }
            }],
            dimension: { width: 1080, height: 1920 }
        })
    });

    if (!res.ok) throw new Error(`HeyGen error: ${res.status}`);
    return await res.json();
}

async function createHiggsVideo(script, options) {
    const key = API_CONFIG.higgsfield.key;
    const endpoint = `${API_CONFIG.higgsfield.endpoint}/videos/generate`;

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            prompt: typeof script === 'object' ? script.voiceover : script,
            style: options.style || 'cinematic',
            duration: options.duration || 30,
            aspect_ratio: '9:16'
        })
    });

    if (!res.ok) throw new Error(`Higgsfield error: ${res.status}`);
    return await res.json();
}

// =========================================================================
// HELPERS
// =========================================================================

function findKnownApp(input) {
    const lower = input.toLowerCase().replace(/https?:\/\/(www\.)?/, '');
    for (const [key, app] of Object.entries(APPS_CONFIG)) {
        if (key === lower || app.name.toLowerCase() === lower || app.url?.includes(lower)) {
            return app;
        }
    }
    return null;
}

function log(msg) {
    console.log('[Viral Engine]', msg);
    if (onLogCallback) onLogCallback(msg);
}

// =========================================================================
// MOCK DATA (used when no API keys are configured)
// =========================================================================

function getMockScripts() {
    const name = currentProduct?.name || 'This App';
    return [
        {
            platform: 'TikTok',
            style: 'UGC',
            hook: `I stopped scrolling when I found ${name}.`,
            body: `Okay but seriously, this thing changed my entire routine. I used to waste hours doing things the hard way. Now I just open ${name} and let it work its magic. My productivity literally doubled.`,
            cta: `Link in bio. Thank me later.`,
            hashtags: ['#productivity', '#lifehack', '#gamechanger', `#${name.toLowerCase().replace(/\s/g, '')}`],
            estimatedLength: '30s',
            visualNotes: 'Face-to-camera, then screen recording of app, back to face for CTA'
        },
        {
            platform: 'Instagram Reels',
            style: 'Educational',
            hook: `Most people don't know about ${name}. Here's why you should.`,
            body: `${name} solves a problem most people don't realize they have. Once you try it, you won't go back. The interface is clean, it's fast, and it actually delivers results.`,
            cta: `Save this and try it today.`,
            hashtags: ['#tech', '#appreview', '#musttry', '#innovation'],
            estimatedLength: '45s',
            visualNotes: 'Split screen: problem on left, solution on right. End with product logo.'
        },
        {
            platform: 'YouTube Shorts',
            style: 'Reaction',
            hook: `Wait... this is actually free?! 🤯`,
            body: `I just discovered ${name} and I'm genuinely shocked this exists. The features alone are worth paying for but they're giving it away. This is the kind of tool that makes you feel like you're cheating.`,
            cta: `Check the description for the link.`,
            hashtags: ['#shorts', '#review', '#free'],
            estimatedLength: '30s',
            visualNotes: 'Reaction-style with product screenshots overlaid'
        }
    ];
}

function getMockImagePrompts() {
    const name = currentProduct?.name || 'Product';
    const color = currentProduct?.primaryColor || '#2dd4bf';
    return [
        {
            title: 'Hero Product Shot',
            prompt: `Ultra-modern dark luxury product showcase for "${name}". Floating holographic UI in deep space, glowing ${color} accent lights, glass morphism panels, cinematic depth of field, 8K, photorealistic.`,
            aspectRatio: '1:1',
            platform: 'Instagram Post',
            overlayText: name
        },
        {
            title: 'Lifestyle Integration',
            prompt: `Minimalist workspace scene with laptop showing "${name}" interface. Soft ambient lighting, modern desk setup, plant and coffee cup, a person's hands typing, cozy productive atmosphere, editorial photography style.`,
            aspectRatio: '9:16',
            platform: 'Instagram Story',
            overlayText: `Try ${name} Today`
        },
        {
            title: 'Feature Callout',
            prompt: `Infographic-style dark poster highlighting 3 key features of "${name}". Icons floating in space, connected by glowing ${color} lines, modern typography, clean layout, tech startup aesthetic.`,
            aspectRatio: '1:1',
            platform: 'LinkedIn',
            overlayText: 'Key Features'
        },
        {
            title: 'Social Proof Banner',
            prompt: `Dramatic testimonial design for "${name}". Large quotation marks in ${color}, user avatar, 5-star rating, dark gradient background, premium feel, large readable text, ad-ready layout.`,
            aspectRatio: '16:9',
            platform: 'Facebook Ad',
            overlayText: '★★★★★'
        }
    ];
}

function getMockAvatarScript() {
    const name = currentProduct?.name || 'this product';
    return {
        title: `${name} — Real User Review`,
        duration: '45s',
        script: `Hey everyone [pause] so I've been using ${name} for about two weeks now and I have to be honest [pause] it completely changed my workflow. Before, I was spending hours doing things manually. Now? It literally takes me minutes. [pause] The best part is how intuitive it is — I didn't need any tutorial, I just started using it and it clicked. [pause] If you've been looking for something that actually works, click the link below. Trust me on this one.`,
        scenes: [
            { timestamp: '0-5s', action: 'Looking into camera, casual setting', bRoll: null },
            { timestamp: '5-15s', action: 'Talking about the problem', bRoll: 'Show frustrated person at desk' },
            { timestamp: '15-30s', action: 'Showing excitement about solution', bRoll: 'Screen recording of product' },
            { timestamp: '30-40s', action: 'Describing ease of use', bRoll: 'Quick feature highlights' },
            { timestamp: '40-45s', action: 'Direct CTA to camera', bRoll: null }
        ],
        thumbnail: 'Avatar looking surprised with product logo and "Game Changer?" text overlay'
    };
}

function getMockVideoScript() {
    const name = currentProduct?.name || 'this tool';
    return {
        title: `Why ${name} is Going Viral`,
        duration: '30s',
        voiceover: `Everyone is talking about ${name} right now. And here's why. It does in seconds what used to take hours. The interface is so clean it almost feels unfair. And the results? They speak for themselves. If you haven't tried it yet, you're already behind.`,
        scenes: [
            { duration: '3s', visual: 'Bold text: "THIS IS GOING VIRAL"', text: '🔥 THIS IS GOING VIRAL', transition: 'zoom-in' },
            { duration: '7s', visual: 'Product logo with glowing animation', text: name, transition: 'fade' },
            { duration: '8s', visual: 'Screen recording or feature showcase', text: 'Seconds, not hours.', transition: 'slide-left' },
            { duration: '7s', visual: 'Results/testimonials montage', text: 'Results speak for themselves', transition: 'slide-up' },
            { duration: '5s', visual: 'CTA with link', text: 'Try it free ↓', transition: 'zoom-out' }
        ],
        music: 'Cinematic build, modern electronic',
        hook: 'Fast-cut text animation with sound effect'
    };
}

function getMockText(textType) {
    const name = currentProduct?.name || 'Our Product';
    if (textType === 'email') {
        return [
            { subject: `Welcome to ${name} 🎉`, preheader: 'Your journey starts now', body: `Hey there!\n\nWelcome to ${name}. You just made one of the best decisions.\n\nHere's what happens next:\n1. Open the app\n2. Try the main feature\n3. Watch the magic happen\n\nWe built this for people exactly like you.\n\nLet's go,\nThe ${name} Team`, cta: 'Get Started', sendDelay: 'immediate' },
            { subject: `Did you try this yet?`, preheader: 'Most users see results in 24 hours', body: `Hey!\n\nJust checking in. Have you had a chance to try ${name} yet?\n\nMost users report seeing results within their first session. Here's a quick tip: start with the main dashboard and explore from there.\n\nYou've got this.`, cta: 'Open App', sendDelay: '1day' },
            { subject: `You're in the top 10% 🏆`, preheader: 'Unlock your full potential', body: `Hey!\n\nYou've been using ${name} for a few days now, and you're already in the top 10% of active users.\n\nReady to go deeper? Here are 3 advanced features most people miss...\n\n1. Custom settings\n2. Export to share\n3. Community features\n\nKeep crushing it.`, cta: 'Explore Advanced', sendDelay: '3days' }
        ];
    }
    // Default: social captions
    return [
        { platform: 'Instagram', caption: `🔥 Stop what you're doing and try ${name}.\n\nThis isn't just another app. It's the one you'll actually keep using.\n\nSave this post and thank me later. ↓`, hashtags: ['#productivity', '#musttrythis', '#techreview', '#gamechanger', '#lifehack'], bestTimeToPost: 'Weekday morning 9-11am' },
        { platform: 'Twitter', caption: `Just discovered ${name} and I'm genuinely shook. This is what technology should feel like. 🧵👇`, hashtags: ['#tech', '#innovation', '#review'], bestTimeToPost: 'Weekday lunch 12-1pm' },
        { platform: 'LinkedIn', caption: `I've tested hundreds of productivity tools. ${name} is in a different league.\n\nHere's why:\n\n→ Intuitive UX (no learning curve)\n→ Real results in minutes\n→ Built for how people actually work\n\nIf your team isn't using this yet, you're leaving performance on the table.`, hashtags: ['#productivity', '#saas', '#techleadership', '#innovation', '#futureofwork'], bestTimeToPost: 'Tuesday/Wednesday morning' },
        { platform: 'TikTok', caption: `POV: you just found the app that changes everything 🤯 #${name.toLowerCase().replace(/\s/g, '')} #fyp #trending`, hashtags: ['#fyp', '#viral', '#techfyp'], bestTimeToPost: 'Evening 7-9pm' }
    ];
}

function getMockDemoScript() {
    const name = currentProduct?.name || 'Product';
    return {
        title: `${name} — 60 Second Demo`,
        duration: '60s',
        intro: `Let me show you exactly how ${name} works in 60 seconds.`,
        steps: [
            { step: 1, action: 'Open the main page', narration: `First, you land on the dashboard. Clean, minimal, no clutter.`, duration: '12s', highlight: 'Clean Dashboard' },
            { step: 2, action: 'Click the primary feature', narration: `Click here to access the main feature. This is where the magic happens.`, duration: '15s', highlight: 'Core Feature' },
            { step: 3, action: 'Show the result', narration: `And just like that — you have your result. What used to take hours now takes seconds.`, duration: '15s', highlight: 'Instant Results' },
            { step: 4, action: 'Show settings/customization', narration: `You can customize everything. It adapts to exactly how you work.`, duration: '10s', highlight: 'Full Customization' }
        ],
        outro: `That's ${name}. Try it free — link in the description.`
    };
}
