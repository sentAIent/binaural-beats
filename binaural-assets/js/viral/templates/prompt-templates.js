/**
 * AI Prompt Templates for Viral Content Generation
 * Used by generators to construct prompts for Gemini API
 */

export const PROMPT_TEMPLATES = {

    // =========================================================================
    // PRODUCT ANALYSIS
    // =========================================================================
    analyzeProduct: (context) => `
You are a world-class digital marketing strategist. Analyze this product and return a JSON object with the following fields:

Product Info:
- Name: ${context.name || 'Unknown'}
- URL: ${context.url || 'N/A'}  
- Description: ${context.description || 'N/A'}
- Page Content: ${context.pageContent || 'N/A'}

Return ONLY valid JSON:
{
    "name": "Product Name",
    "tagline": "One-line value proposition (max 10 words)",
    "description": "2-sentence product description",
    "category": "SaaS|Mobile App|E-commerce|Content|Service|Other",
    "targetAudience": ["audience segment 1", "audience segment 2", "audience segment 3"],
    "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
    "keyFeatures": ["feature 1", "feature 2", "feature 3", "feature 4"],
    "emotionalHooks": ["emotional angle 1", "emotional angle 2"],
    "competitors": ["competitor 1", "competitor 2"],
    "toneOfVoice": "professional|casual|edgy|inspirational|scientific",
    "primaryColor": "#hex",
    "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}`,

    // =========================================================================
    // AD SCRIPTS & COPY
    // =========================================================================
    generateAdScript: (product, platform, style) => `
You are a viral content copywriter who has generated $100M+ in ad revenue.
Write a ${style || 'UGC-style'} ad script for ${platform || 'TikTok/Instagram Reels'}.

Product: ${product.name}
Tagline: ${product.tagline}
Target Audience: ${product.targetAudience?.join(', ')}
Pain Points: ${product.painPoints?.join(', ')}
Key Features: ${product.keyFeatures?.join(', ')}
Tone: ${product.toneOfVoice || 'casual'}

Return ONLY valid JSON array with 3 scripts:
[
    {
        "platform": "${platform || 'TikTok'}",
        "style": "${style || 'UGC'}",
        "hook": "Opening line that stops the scroll (max 15 words)",
        "body": "Main content (3-5 sentences, conversational)",
        "cta": "Call to action (max 10 words)",
        "hashtags": ["#tag1", "#tag2", "#tag3"],
        "estimatedLength": "30s|60s|90s",
        "visualNotes": "Brief description of what should be on screen"
    }
]`,

    generateEmailSequence: (product) => `
You are an email marketing expert. Write a 3-email welcome/nurture sequence.

Product: ${product.name}  
Description: ${product.description}
Audience: ${product.targetAudience?.join(', ')}
Pain Points: ${product.painPoints?.join(', ')}

Return ONLY valid JSON array:
[
    {
        "subject": "Email subject line",
        "preheader": "Preview text",
        "body": "Full email body with line breaks as \\n",
        "cta": "Button text",
        "sendDelay": "immediate|1day|3days"
    }
]`,

    generateSocialCaptions: (product, platforms) => `
You are a social media manager for top brands. Write engaging captions.

Product: ${product.name} — ${product.tagline}
Platforms: ${(platforms || ['Instagram', 'Twitter', 'LinkedIn', 'TikTok']).join(', ')}

Return ONLY valid JSON array with one caption per platform:
[
    {
        "platform": "Instagram",
        "caption": "Full caption with emojis and line breaks as \\n",
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
        "bestTimeToPost": "Weekday morning|Weekend evening|etc"
    }
]`,

    // =========================================================================
    // IMAGE PROMPTS
    // =========================================================================
    generateImagePrompts: (product, style) => `
You are an art director creating scroll-stopping social media visuals.

Product: ${product.name} — ${product.tagline}
Visual Style: ${style || 'modern, cinematic, dark luxury'}
Brand Color: ${product.primaryColor || '#2dd4bf'}
Category: ${product.category}

Generate 4 image concepts. Return ONLY valid JSON array:
[
    {
        "title": "Short concept name",
        "prompt": "Detailed image generation prompt (50-100 words, photorealistic style)",
        "aspectRatio": "1:1|9:16|16:9",
        "platform": "Instagram Post|Instagram Story|Facebook Ad|LinkedIn",
        "overlayText": "Optional text to overlay on the image"
    }
]`,

    // =========================================================================
    // AVATAR VIDEO SCRIPTS
    // =========================================================================
    generateAvatarScript: (product, avatarPersona) => `
You are writing a script for an AI avatar spokesperson video.

Product: ${product.name} — ${product.tagline}
Avatar Persona: ${avatarPersona || 'Professional tech reviewer, friendly and authentic'}
Target Audience: ${product.targetAudience?.join(', ')}
Pain Points: ${product.painPoints?.join(', ')}

Write a 45-60 second UGC-style script. Return ONLY valid JSON:
{
    "title": "Video title",
    "duration": "45s|60s",
    "script": "Full spoken script with natural pauses marked as [pause]",
    "scenes": [
        {
            "timestamp": "0-5s",
            "action": "What the avatar does",
            "bRoll": "Optional background/overlay description"
        }
    ],
    "thumbnail": "Description of ideal thumbnail"
}`,

    // =========================================================================
    // FACELESS VIDEO SCRIPTS
    // =========================================================================
    generateFacelessVideo: (product, format) => `
You are a viral faceless content creator on TikTok/YouTube Shorts.

Product: ${product.name} — ${product.tagline}
Format: ${format || 'motivational/educational'}
Key Features: ${product.keyFeatures?.join(', ')}

Write a 30-60 second faceless video script. Return ONLY valid JSON:
{
    "title": "Video title",
    "duration": "30s|45s|60s",
    "voiceover": "Full voiceover script",
    "scenes": [
        {
            "duration": "5s",
            "visual": "Description of what appears on screen",
            "text": "On-screen text overlay",
            "transition": "fade|slide|zoom|cut"
        }
    ],
    "music": "Background music mood suggestion",
    "hook": "First 3 seconds hook description"
}`,

    // =========================================================================
    // PRODUCT DEMO SCRIPT
    // =========================================================================
    generateDemoScript: (product, format) => {
        const isDetailed = format === 'detailed';
        const duration = isDetailed ? '90' : '60';
        const stepCount = isDetailed ? '5-7' : '3-4';
        const pacing = isDetailed ? 'Take time to explain each feature thoroughly with context and benefits.' : 'Keep it punchy — show, don\'t over-explain. Fast-paced and exciting.';

        return `
You are creating a product demo walkthrough video script.

Product: ${product.name}
URL: ${product.url}
Features: ${product.keyFeatures?.join(', ')}
Audience: ${product.targetAudience?.join(', ')}

Format: ${duration} second ${isDetailed ? 'detailed walkthrough' : 'quick demo'}
Pacing: ${pacing}

Write a ${duration}-second demo script with ${stepCount} steps. Return ONLY valid JSON:
{
    "title": "Demo video title",
    "duration": "${duration}s",
    "intro": "Opening narration (${isDetailed ? '5-10' : '3-5'} seconds)",
    "steps": [
        {
            "step": 1,
            "action": "What to show/click in the product",
            "narration": "What to say",
            "duration": "10s",
            "highlight": "Key feature being demonstrated"
        }
    ],
    "outro": "Closing narration with CTA"
}`;
    }
};
