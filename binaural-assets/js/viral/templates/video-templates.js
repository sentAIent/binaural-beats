/**
 * Video Scene Templates for Faceless Video Generation
 * Pre-built scene structures for common viral formats
 */

export const VIDEO_TEMPLATES = {

    // =========================================================================
    // FACELESS FORMATS
    // =========================================================================

    motivational: {
        name: 'Motivational/Inspirational',
        duration: '30-60s',
        style: 'Dark background, bold text, cinematic transitions',
        scenes: [
            { type: 'hook', duration: 3, visual: 'bold-text-center', transition: 'zoom-in' },
            { type: 'problem', duration: 8, visual: 'split-text-image', transition: 'slide-left' },
            { type: 'solution', duration: 10, visual: 'product-showcase', transition: 'fade' },
            { type: 'proof', duration: 8, visual: 'testimonial-card', transition: 'slide-up' },
            { type: 'cta', duration: 5, visual: 'bold-text-glow', transition: 'zoom-out' }
        ],
        musicMood: 'cinematic, building tension',
        fonts: { heading: 'bold sans-serif', body: 'clean sans-serif' }
    },

    educational: {
        name: 'Educational/How-To',
        duration: '45-90s',
        style: 'Clean, minimal, step-by-step',
        scenes: [
            { type: 'hook', duration: 3, visual: 'question-text', transition: 'fade' },
            { type: 'context', duration: 5, visual: 'stat-card', transition: 'slide-right' },
            { type: 'step1', duration: 10, visual: 'numbered-step', transition: 'slide-left' },
            { type: 'step2', duration: 10, visual: 'numbered-step', transition: 'slide-left' },
            { type: 'step3', duration: 10, visual: 'numbered-step', transition: 'slide-left' },
            { type: 'result', duration: 8, visual: 'before-after', transition: 'fade' },
            { type: 'cta', duration: 5, visual: 'product-link', transition: 'zoom-in' }
        ],
        musicMood: 'upbeat, tech',
        fonts: { heading: 'bold mono', body: 'clean sans-serif' }
    },

    testimonial: {
        name: 'Social Proof/Testimonial',
        duration: '30-45s',
        style: 'Dark luxury, glass cards, glow accents',
        scenes: [
            { type: 'hook', duration: 3, visual: 'shocking-stat', transition: 'zoom-in' },
            { type: 'review1', duration: 8, visual: 'glass-review-card', transition: 'slide-up' },
            { type: 'review2', duration: 8, visual: 'glass-review-card', transition: 'slide-up' },
            { type: 'review3', duration: 8, visual: 'glass-review-card', transition: 'slide-up' },
            { type: 'cta', duration: 5, visual: 'product-glow', transition: 'fade' }
        ],
        musicMood: 'ambient, trustworthy',
        fonts: { heading: 'bold serif', body: 'italic serif' }
    },

    comparison: {
        name: 'Before/After Comparison',
        duration: '30-45s',
        style: 'Split screen, dramatic reveal',
        scenes: [
            { type: 'hook', duration: 3, visual: 'question-bold', transition: 'fade' },
            { type: 'before', duration: 10, visual: 'left-panel-problem', transition: 'slide-left' },
            { type: 'transition', duration: 3, visual: 'product-reveal', transition: 'wipe' },
            { type: 'after', duration: 10, visual: 'right-panel-solution', transition: 'slide-right' },
            { type: 'cta', duration: 5, visual: 'bold-cta-glow', transition: 'zoom-in' }
        ],
        musicMood: 'dramatic, reveal',
        fonts: { heading: 'extra-bold sans', body: 'clean sans' }
    },

    productDemo: {
        name: 'Product Demo/Walkthrough',
        duration: '60-90s',
        style: 'Screen recording with callouts',
        scenes: [
            { type: 'intro', duration: 5, visual: 'product-hero', transition: 'fade' },
            { type: 'feature1', duration: 15, visual: 'screen-with-callout', transition: 'cut' },
            { type: 'feature2', duration: 15, visual: 'screen-with-callout', transition: 'cut' },
            { type: 'feature3', duration: 15, visual: 'screen-with-callout', transition: 'cut' },
            { type: 'result', duration: 10, visual: 'outcome-showcase', transition: 'fade' },
            { type: 'cta', duration: 5, visual: 'download-link', transition: 'zoom-in' }
        ],
        musicMood: 'tech, light beats',
        fonts: { heading: 'mono bold', body: 'sans-serif' }
    }
};

// =========================================================================
// AVATAR PERSONAS
// =========================================================================

export const AVATAR_PERSONAS = [
    {
        id: 'tech-reviewer',
        name: 'Alex Chen',
        type: 'Tech Reviewer',
        style: 'Casual, authentic, conversational',
        avatar: '👨‍💻',
        defaultScript: 'ugc-review',
        voiceTone: 'Enthusiastic but genuine',
        bestFor: ['SaaS', 'Mobile Apps', 'Developer Tools']
    },
    {
        id: 'wellness-guru',
        name: 'Maya River',
        type: 'Wellness Influencer',
        style: 'Calm, warm, aspirational',
        avatar: '🧘‍♀️',
        defaultScript: 'lifestyle-review',
        voiceTone: 'Soothing and inspirational',
        bestFor: ['Health', 'Meditation', 'Wellness', 'Self-help']
    },
    {
        id: 'business-pro',
        name: 'Jordan Blake',
        type: 'Business Professional',
        style: 'Polished, data-driven, authoritative',
        avatar: '👩‍💼',
        defaultScript: 'professional-review',
        voiceTone: 'Confident and trustworthy',
        bestFor: ['B2B', 'Productivity', 'Finance', 'Enterprise']
    },
    {
        id: 'gen-z-creator',
        name: 'Kai Storm',
        type: 'Gen-Z Creator',
        style: 'High-energy, meme-aware, relatable',
        avatar: '🤳',
        defaultScript: 'ugc-hype',
        voiceTone: 'Excited and informal',
        bestFor: ['Consumer Apps', 'Social', 'Gaming', 'Lifestyle']
    },
    {
        id: 'expert-scientist',
        name: 'Dr. Nova',
        type: 'Science Expert',
        style: 'Educational, backed by research, calm authority',
        avatar: '🔬',
        defaultScript: 'science-backed',
        voiceTone: 'Measured and educational',
        bestFor: ['Health Tech', 'BioTech', 'Neuroscience', 'Research']
    },
    {
        id: 'lifestyle-mom',
        name: 'Sarah Mills',
        type: 'Lifestyle/Parenting',
        style: 'Warm, relatable, "life hack" energy',
        avatar: '👩‍👧',
        defaultScript: 'life-hack-review',
        voiceTone: 'Friendly and genuine',
        bestFor: ['Family', 'Education', 'Home', 'Lifestyle']
    }
];

// =========================================================================
// CONTENT PLATFORMS
// =========================================================================

export const PLATFORMS = {
    tiktok: { name: 'TikTok', icon: '🎵', maxLength: '60s', aspectRatio: '9:16', hashtagLimit: 5 },
    instagram_reels: { name: 'Instagram Reels', icon: '📸', maxLength: '90s', aspectRatio: '9:16', hashtagLimit: 30 },
    instagram_post: { name: 'Instagram Post', icon: '📷', maxLength: null, aspectRatio: '1:1', hashtagLimit: 30 },
    youtube_shorts: { name: 'YouTube Shorts', icon: '▶️', maxLength: '60s', aspectRatio: '9:16', hashtagLimit: 3 },
    facebook: { name: 'Facebook', icon: '👤', maxLength: '120s', aspectRatio: '16:9', hashtagLimit: 3 },
    linkedin: { name: 'LinkedIn', icon: '💼', maxLength: null, aspectRatio: '1:1', hashtagLimit: 5 },
    twitter: { name: 'X (Twitter)', icon: '🐦', maxLength: null, aspectRatio: '16:9', hashtagLimit: 3 }
};
