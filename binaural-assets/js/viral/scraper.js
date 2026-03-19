/**
 * URL Scraper v2 — Rich product context extraction
 * 
 * Extracts: meta tags, JSON-LD/Schema.org, pricing signals,
 * social links, CTAs, tech stack, and structured content.
 * Falls back to manual input if CORS blocks fetching.
 */

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// =========================================================================
// PUBLIC API
// =========================================================================

/**
 * Scrape a URL and extract rich product context
 */
export async function scrapeUrl(url) {
    console.log('[Scraper] Analyzing:', url);

    if (!url.startsWith('http')) url = 'https://' + url;

    let html = '';
    try {
        const res = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(8000) });
        html = await res.text();
    } catch (e) {
        console.log('[Scraper] Direct fetch failed, trying CORS proxy...');
        try {
            const res = await fetch(CORS_PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(10000) });
            html = await res.text();
        } catch (e2) {
            console.warn('[Scraper] CORS proxy also failed:', e2.message);
            return { success: false, error: 'Unable to fetch URL. Please enter product details manually.' };
        }
    }

    if (!html || html.length < 100) {
        return { success: false, error: 'Page returned empty content.' };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const meta = extractMeta(doc, url);
    const structured = extractStructuredData(doc);
    const content = extractContent(doc);
    const pricing = extractPricing(doc, structured);
    const socialLinks = extractSocialLinks(doc, url);
    const ctas = extractCTAs(doc);
    const techStack = detectTechStack(html);
    const features = extractFeatures(doc);

    // Merge structured data into meta where it provides richer info
    if (structured.name && !meta.name) meta.name = structured.name;
    if (structured.description && !meta.description) meta.description = structured.description;
    if (structured.image && !meta.ogImage) meta.ogImage = structured.image;

    console.log('[Scraper] Extraction complete:', {
        hasStructuredData: !!structured.raw,
        hasPricing: !!pricing.text,
        socialLinksCount: Object.keys(socialLinks).length,
        ctasCount: ctas.length,
        techStackCount: techStack.length,
        featuresCount: features.length
    });

    return {
        success: true,
        url,
        ...meta,
        pageContent: content,
        pricing,
        socialLinks,
        ctas,
        techStack,
        features,
        structuredData: structured.raw || null,
        scrapedAt: new Date().toISOString()
    };
}

/**
 * Build a product context from manual input
 */
export function buildManualContext(data) {
    return {
        success: true,
        url: data.url || '',
        name: data.name || 'My Product',
        description: data.description || '',
        ogImage: '',
        logo: data.logo || '',
        favicon: '',
        keywords: data.keywords || [],
        themeColor: data.color || '',
        pageContent: data.description || '',
        pricing: { text: '', model: '' },
        socialLinks: {},
        ctas: [],
        techStack: [],
        features: [],
        structuredData: null,
        scrapedAt: new Date().toISOString(),
        manual: true
    };
}


// =========================================================================
// META TAGS (og, twitter, standard)
// =========================================================================

function extractMeta(doc, url) {
    const getMeta = (name) => {
        const el = doc.querySelector(
            `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"]`
        );
        return el?.getAttribute('content') || '';
    };

    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const ogTitle = getMeta('og:title') || getMeta('twitter:title') || '';
    const description = getMeta('description') || getMeta('og:description') || getMeta('twitter:description') || '';
    const ogImage = getMeta('og:image') || getMeta('twitter:image') || '';
    const siteName = getMeta('og:site_name') || '';
    const keywords = getMeta('keywords') || '';
    const themeColor = getMeta('theme-color') || '';

    // Favicon
    const faviconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    let favicon = faviconEl?.getAttribute('href') || '';
    if (favicon && !favicon.startsWith('http')) {
        try { favicon = new URL(favicon, url).href; } catch (e) { favicon = ''; }
    }

    // Logo
    let logo = ogImage;
    if (!logo) {
        const logoImg = doc.querySelector('img[alt*="logo" i], img[class*="logo" i], img[id*="logo" i]');
        if (logoImg) {
            logo = logoImg.getAttribute('src') || '';
            if (logo && !logo.startsWith('http')) {
                try { logo = new URL(logo, url).href; } catch (e) { logo = ''; }
            }
        }
    }

    return {
        name: ogTitle || siteName || title.split(/[|\-–—]/)[0]?.trim() || 'Unknown Product',
        description,
        ogImage: ogImage.startsWith('http') ? ogImage : '',
        logo: logo.startsWith('http') ? logo : favicon,
        favicon: favicon.startsWith('http') ? favicon : '',
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        themeColor,
        rawTitle: title
    };
}


// =========================================================================
// JSON-LD / SCHEMA.ORG
// =========================================================================

function extractStructuredData(doc) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    if (!scripts.length) return {};

    let bestMatch = null;

    for (const script of scripts) {
        try {
            let data = JSON.parse(script.textContent);

            // Handle @graph arrays (common in CMS sites)
            if (data['@graph'] && Array.isArray(data['@graph'])) {
                data = data['@graph'];
            }

            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                const type = (item['@type'] || '').toLowerCase();

                // Prioritize product-like schemas
                if (['product', 'softwareapplication', 'webapp', 'mobileapplication'].includes(type)) {
                    bestMatch = item;
                    break;
                }
                // Fall back to Organization/WebSite
                if (!bestMatch && ['organization', 'website', 'webpage'].includes(type)) {
                    bestMatch = item;
                }
            }
        } catch (e) {
            console.log('[Scraper] Failed to parse JSON-LD block:', e.message);
        }
    }

    if (!bestMatch) return {};

    console.log('[Scraper] Found JSON-LD:', bestMatch['@type']);

    const result = { raw: bestMatch };

    // Extract specific fields
    if (bestMatch.name) result.name = bestMatch.name;
    if (bestMatch.description) result.description = bestMatch.description;
    if (bestMatch.image) {
        result.image = typeof bestMatch.image === 'string'
            ? bestMatch.image
            : bestMatch.image?.url || bestMatch.image?.[0] || '';
    }

    // Pricing from offers
    if (bestMatch.offers) {
        const offers = Array.isArray(bestMatch.offers) ? bestMatch.offers : [bestMatch.offers];
        const offer = offers[0];
        if (offer) {
            result.price = offer.price;
            result.priceCurrency = offer.priceCurrency || 'USD';
            result.priceText = offer.price
                ? `${offer.priceCurrency || '$'}${offer.price}`
                : '';
        }
    }

    // Rating
    if (bestMatch.aggregateRating) {
        result.rating = {
            value: bestMatch.aggregateRating.ratingValue,
            count: bestMatch.aggregateRating.ratingCount || bestMatch.aggregateRating.reviewCount
        };
    }

    // Category
    if (bestMatch.applicationCategory) result.category = bestMatch.applicationCategory;

    return result;
}


// =========================================================================
// PRICING DETECTION
// =========================================================================

function extractPricing(doc, structured) {
    // 1. Check structured data first
    if (structured.priceText) {
        return {
            text: structured.priceText,
            model: inferPricingModel(structured.priceText),
            source: 'json-ld'
        };
    }

    // 2. Scan page for pricing patterns
    const clone = doc.body?.cloneNode(true);
    if (!clone) return { text: '', model: '' };

    // Remove noise
    ['script', 'style', 'nav', 'footer'].forEach(tag => {
        clone.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Look for pricing containers
    const pricingEls = clone.querySelectorAll(
        '[class*="price" i], [class*="pricing" i], [class*="plan" i], [id*="price" i], [id*="pricing" i]'
    );

    const bodyText = clone.textContent || '';

    // Regex for price patterns: $X, $X/mo, $X.XX/month, etc.
    const priceRegex = /\$\d{1,5}(?:\.\d{2})?(?:\s*\/\s*(?:mo(?:nth)?|yr|year|week|user))?/gi;
    let prices = [];

    // Check pricing containers first (more specific)
    for (const el of pricingEls) {
        const text = el.textContent || '';
        const matches = text.match(priceRegex);
        if (matches) prices.push(...matches);
    }

    // Fall back to full body scan
    if (!prices.length) {
        const bodyMatches = bodyText.match(priceRegex);
        if (bodyMatches) prices = bodyMatches.slice(0, 5);
    }

    if (!prices.length) return { text: '', model: '' };

    // Deduplicate and sort
    prices = [...new Set(prices)];

    // Check for free tier indicators
    const hasFree = /\bfree\b/i.test(bodyText) && /\b(?:plan|tier|trial|version)\b/i.test(bodyText);

    const text = hasFree
        ? `Free + ${prices[0]}`
        : prices.slice(0, 3).join(' / ');

    return {
        text,
        model: inferPricingModel(text),
        prices,
        hasFree,
        source: 'page-scan'
    };
}

function inferPricingModel(text) {
    if (!text) return '';
    const t = text.toLowerCase();
    if (/\/\s*mo|\/\s*month/i.test(t)) return 'subscription';
    if (/\/\s*yr|\/\s*year/i.test(t)) return 'annual';
    if (/free/i.test(t) && /\$/i.test(t)) return 'freemium';
    if (/free/i.test(t)) return 'free';
    if (/\$/.test(t)) return 'one-time';
    return '';
}


// =========================================================================
// SOCIAL LINKS
// =========================================================================

function extractSocialLinks(doc, baseUrl) {
    const links = {};
    const anchors = doc.querySelectorAll('a[href]');

    const SOCIAL_PATTERNS = {
        twitter: /(?:twitter\.com|x\.com)\//i,
        instagram: /instagram\.com\//i,
        linkedin: /linkedin\.com\//i,
        youtube: /youtube\.com\//i,
        facebook: /facebook\.com\//i,
        tiktok: /tiktok\.com\/@/i,
        github: /github\.com\//i,
        discord: /discord\.(?:gg|com)\//i
    };

    for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        if (!href || href === '#') continue;

        let fullUrl = href;
        if (!href.startsWith('http')) {
            try { fullUrl = new URL(href, baseUrl).href; } catch { continue; }
        }

        for (const [platform, regex] of Object.entries(SOCIAL_PATTERNS)) {
            if (!links[platform] && regex.test(fullUrl)) {
                links[platform] = fullUrl;
            }
        }
    }

    return links;
}


// =========================================================================
// CTA DETECTION
// =========================================================================

function extractCTAs(doc) {
    const ctas = [];
    const seen = new Set();

    // CTA button patterns (text content)
    const CTA_PATTERNS = /^(get started|start free|try (?:it )?free|sign up|start trial|free trial|download|buy now|subscribe|join|create account|book (?:a )?demo|request demo|learn more|explore|shop now|add to cart|begin|launch)/i;

    // Check buttons and links with CTA-like classes or text
    const candidates = doc.querySelectorAll(
        'a[class*="cta" i], a[class*="btn" i], a[class*="button" i], ' +
        'button[class*="cta" i], button[class*="btn" i], button[class*="primary" i], ' +
        'a[role="button"], [class*="hero" i] a, [class*="hero" i] button'
    );

    for (const el of candidates) {
        const text = el.textContent?.trim().replace(/\s+/g, ' ');
        if (!text || text.length > 40 || text.length < 3) continue;

        const normalized = text.toLowerCase();
        if (seen.has(normalized)) continue;

        if (CTA_PATTERNS.test(text)) {
            seen.add(normalized);
            ctas.push(text);
        }
    }

    // Also scan for any button/link matching CTA patterns in body
    if (ctas.length === 0) {
        const allButtons = doc.querySelectorAll('a, button');
        for (const el of allButtons) {
            const text = el.textContent?.trim().replace(/\s+/g, ' ');
            if (!text || text.length > 40 || text.length < 3) continue;
            const normalized = text.toLowerCase();
            if (seen.has(normalized)) continue;
            if (CTA_PATTERNS.test(text)) {
                seen.add(normalized);
                ctas.push(text);
                if (ctas.length >= 5) break;
            }
        }
    }

    return ctas.slice(0, 5);
}


// =========================================================================
// TECH STACK DETECTION
// =========================================================================

function detectTechStack(html) {
    const detected = [];

    const TECH_SIGNATURES = {
        'stripe': /stripe\.com\/|Stripe\(/i,
        'intercom': /intercom|widget\.intercom\.io/i,
        'google-analytics': /google-analytics|gtag|googletagmanager/i,
        'segment': /cdn\.segment\.com|analytics\.js/i,
        'hotjar': /hotjar\.com/i,
        'hubspot': /hubspot\.com|hs-scripts/i,
        'drift': /drift\.com|driftt/i,
        'crisp': /crisp\.chat/i,
        'zendesk': /zendesk\.com|zdassets/i,
        'mixpanel': /mixpanel\.com/i,
        'amplitude': /amplitude\.com|cdn\.amplitude/i,
        'sentry': /sentry\.io|browser\.sentry/i,
        'cloudflare': /cloudflare\.com|cdnjs\.cloudflare/i,
        'vercel': /vercel\.com|_next\//i,
        'netlify': /netlify/i,
        'shopify': /shopify\.com|cdn\.shopify/i,
        'wordpress': /wp-content|wp-includes/i,
        'react': /react(?:\.production|DOM)/i,
        'vue': /vue(?:\.runtime|\.global)/i,
        'angular': /angular(?:\.min)?\.js|ng-version/i,
        'tailwind': /tailwindcss|tailwind\.config/i,
        'firebase': /firebase(?:app|\.google)/i
    };

    for (const [tech, regex] of Object.entries(TECH_SIGNATURES)) {
        if (regex.test(html)) {
            detected.push(tech);
        }
    }

    return detected;
}


// =========================================================================
// FEATURE EXTRACTION
// =========================================================================

function extractFeatures(doc) {
    const features = [];
    const seen = new Set();

    // 1. Look for feature sections (common landing page patterns)
    const featureContainers = doc.querySelectorAll(
        '[class*="feature" i], [class*="benefit" i], [id*="feature" i], [id*="benefit" i]'
    );

    for (const container of featureContainers) {
        // Get headings within feature sections
        const headings = container.querySelectorAll('h2, h3, h4');
        for (const h of headings) {
            const text = h.textContent?.trim();
            if (text && text.length > 3 && text.length < 80 && !seen.has(text.toLowerCase())) {
                seen.add(text.toLowerCase());
                features.push(text);
            }
        }
    }

    // 2. Look for list items in sections that seem feature-related
    if (features.length < 3) {
        const listItems = doc.querySelectorAll(
            '[class*="feature" i] li, [class*="benefit" i] li, ' +
            '[class*="check" i] li, [class*="highlight" i] li'
        );
        for (const li of listItems) {
            const text = li.textContent?.trim();
            if (text && text.length > 5 && text.length < 100 && !seen.has(text.toLowerCase())) {
                seen.add(text.toLowerCase());
                features.push(text);
            }
        }
    }

    // 3. Fall back to generic h3s in main content (often features on landing pages)
    if (features.length < 3) {
        const h3s = doc.querySelectorAll('main h3, section h3, [role="main"] h3');
        for (const h of h3s) {
            const text = h.textContent?.trim();
            if (text && text.length > 3 && text.length < 60 && !seen.has(text.toLowerCase())) {
                seen.add(text.toLowerCase());
                features.push(text);
            }
        }
    }

    return features.slice(0, 10);
}


// =========================================================================
// CONTENT EXTRACTION (enhanced)
// =========================================================================

function extractContent(doc) {
    const clone = doc.body?.cloneNode(true);
    if (!clone) return '';

    ['script', 'style', 'nav', 'footer', 'iframe', 'noscript', 'svg'].forEach(tag => {
        clone.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Prioritize hero/main content
    const hero = clone.querySelector('[class*="hero" i], [id*="hero" i], main, [role="main"]');
    const contentRoot = hero || clone;

    // Headings
    const headings = Array.from(contentRoot.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent?.trim())
        .filter(Boolean);

    // Paragraphs (prioritize longer, more meaningful content)
    const paragraphs = Array.from(contentRoot.querySelectorAll('p, li'))
        .map(p => p.textContent?.trim())
        .filter(t => t && t.length > 20)
        .sort((a, b) => b.length - a.length); // Longest first = most informative

    const combined = [
        ...headings.slice(0, 10).map(h => `## ${h}`),
        ...paragraphs.slice(0, 20)
    ].join('\n');

    return combined.slice(0, 3000);
}
