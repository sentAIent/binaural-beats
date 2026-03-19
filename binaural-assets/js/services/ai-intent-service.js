import { SLEEP_STORIES } from '../content/stories.js';

const MAPPING = {
    focus: {
        keywords: ['focus', 'study', 'work', 'concentrate', 'productivity', 'coding', 'read', 'learn', 'beta', 'frequency'],
        preset: 'beta',
        soundscapes: ['rain', 'pink'],
        visuals: ['matrix', 'particles'],
        speed: 1.5,
        brightness: 1.1,
        insight: 'Focus mode engaged. Beta waves (12-30Hz) synchronized with pink noise and matrix-flow visuals for maximum cognitive throughput.'
    },
    deep_focus: {
        keywords: ['intense', 'deep work', 'deadline', 'flow state', 'absorption', 'hard'],
        preset: 'gamma',
        soundscapes: ['wind', 'white'],
        visuals: ['particles', 'matrix'],
        speed: 2.0,
        brightness: 1.2,
        carrier: 110, // Power frequency
        insight: 'Peak awareness activated. Gamma waves (40Hz) and neural flow patterns for high-level information synthesis.'
    },
    sleep: {
        keywords: ['sleep', 'nap', 'insomnia', 'night', 'rest', 'bed', 'tired', 'delta', 'deep sleep'],
        preset: 'delta',
        soundscapes: ['brown', 'wind'],
        visuals: ['zengarden'],
        speed: 0.2, // Very slow
        brightness: 0.3, // Dim
        carrier: 100, // Deep base
        insight: 'Sleep cycle initiation. Delta waves (0.5-4Hz) paired with brown noise and zen visuals for deep restorative rest.'
    },
    vivid_dream: {
        keywords: ['vivid', 'lucid', 'dreaming', 'astral', 'projection'],
        preset: 'theta',
        soundscapes: ['ocean', 'wind'],
        visuals: ['sphere', 'particles'],
        speed: 0.6,
        brightness: 0.7,
        carrier: 210,
        insight: 'Lucid dreaming protocol. 6Hz Theta synchronization with ethereal soundscapes to bridge conscious and subconscious.'
    },
    relax: {
        keywords: ['relax', 'calm', 'anxiety', 'stress', 'chill', 'peace', 'meditation', 'unwind', 'alpha', 'waves'],
        preset: 'alpha',
        soundscapes: ['ocean', 'rain'],
        visuals: ['ocean', 'zengarden'],
        speed: 0.5,
        brightness: 0.6,
        insight: 'Restorative calm. Alpha waves (8-12Hz) with rolling waves and zen patterns to bridge the mind between alertness and deep rest.'
    },
    morning_light: {
        keywords: ['morning', 'wake', 'sunrise', 'energy', 'start', 'awaken'],
        preset: 'beta',
        soundscapes: ['birds', 'pink'],
        visuals: ['particles', 'sphere'],
        speed: 1.2,
        brightness: 1.1,
        carrier: 440,
        insight: 'Circadian alignment. High-alpha/low-beta transition to stimulate natural wakefulness and renewed energy.'
    },
    manifestation: {
        keywords: ['manifest', 'attract', 'abundance', 'quantum', 'goal', 'future'],
        preset: 'theta',
        soundscapes: ['strings'],
        visuals: ['sphere', 'particles'],
        speed: 0.8,
        brightness: 0.9,
        carrier: 432, // Solfeggio / Miracle frequency
        insight: 'Quantum manifestation. 5.5Hz Theta waves at 432Hz carrier frequency to align intention with subconscious patterning.'
    },
    healing: {
        keywords: ['heal', 'pain', 'miracle', 'dna', 'repair', 'physical', 'body', 'recovery'],
        preset: 'heal-528',
        soundscapes: ['strings', 'wind'],
        visuals: ['lava', 'sphere'],
        speed: 0.4,
        brightness: 0.8,
        carrier: 528,
        insight: 'Solfeggio 528Hz DNA repair session. Miracle frequency synchronization for physical and cellular harmony.'
    },
    physical_power: {
        keywords: ['workout', 'gym', 'lift', 'strength', 'power', 'vitality', 'sport', 'push'],
        preset: 'gamma',
        soundscapes: ['wind', 'white'],
        visuals: ['matrix', 'lava'],
        speed: 1.8,
        brightness: 1.0,
        carrier: 111, // "Holy" frequency for strength
        insight: 'Cellular vitality. 40Hz Gamma waves at 111Hz carrier for maximum physical/mental coordination.'
    },
    creativity: {
        keywords: ['creative', 'brainstorm', 'idea', 'art', 'write', 'draw', 'design', 'inspiration'],
        preset: 'theta',
        soundscapes: ['ocean', 'pink'],
        visuals: ['particles', 'lava'],
        speed: 0.9,
        brightness: 1.0,
        insight: 'Flow state unlocked. Theta waves (5Hz) stimulate the bridge between conscious and subconscious creativity.'
    },
    nature_immersion: {
        keywords: ['nature', 'forest', 'rain', 'outdoors', 'earth', 'grounded'],
        preset: 'alpha',
        soundscapes: ['rain', 'birds'],
        visuals: ['rainforest', 'zengarden'],
        speed: 0.7,
        brightness: 0.8,
        insight: 'Biophilic immersion. Alpha waves paired with rain patterns and zen gardens to ground your awareness in nature.'
    }
};

/**
 * Extracts "intensity" multiplier based on adjectives.
 */
function parseIntensity(text) {
    if (text.match(/intense|hard|strong|maximum|deep|very/i)) return 1.25;
    if (text.match(/gentle|soft|light|subtle|kind/i)) return 0.75;
    return 1.0;
}

/**
 * Extracts duration in minutes from text using regex.
 * Supports "10 mins", "20 minutes", "1 hour", etc.
 */
function parseDuration(text) {
    const minMatch = text.match(/(\d+)\s*(min|minute|m)\b/i);
    const hourMatch = text.match(/(\d+)\s*(hour|hr|h)\b/i);

    if (hourMatch) return parseInt(hourMatch[1]) * 60;
    if (minMatch) return parseInt(minMatch[1]);

    return null;
}

/**
 * Parses user input and returns the most relevant frequency/soundscape combo.
 * @param {string} text - The user's goal text.
 * @returns {object} - { preset, soundscapes, insight, duration, intensity, carrier }
 */
export function calculateFrequencyFromGoal(text) {
    if (!text) return null;

    const goal = text.toLowerCase();
    const duration = parseDuration(goal);
    const intensity = parseIntensity(goal);

    // Check for direct keyword matches
    for (const [key, data] of Object.entries(MAPPING)) {
        if (data.keywords.some(kw => goal.includes(kw))) {
            return {
                preset: data.preset,
                soundscapes: data.soundscapes,
                insight: data.insight,
                duration: duration,
                intensity: intensity,
                carrier: data.carrier || null,
                visuals: data.visuals || ['zengarden'],
                speed: data.speed || 1.0,
                brightness: data.brightness || 1.0
            };
        }
    }

    // Default to Alpha if no match found
    return {
        preset: 'alpha',
        soundscapes: ['pink'],
        insight: "I've optimized a balanced Alpha state for your request. Relaxed awareness is the foundation of flow.",
        duration: duration,
        intensity: intensity,
        carrier: null,
        visuals: ['zengarden'],
        speed: 1.0,
        brightness: 1.0
    };
}

/**
 * Finds the most relevant Sleep Story based on user intent.
 * @param {string} text - The user's goal text.
 * @returns {object|null} - The matched story object or null.
 */
export function findBestStoryForGoal(text) {
    if (!text) return null;
    const goal = text.toLowerCase();

    // Check for "story" or "tell me" keywords to prioritize story matching
    const isStoryRequest = goal.includes('story') || goal.includes('narrate') || goal.includes('tell me') || goal.includes('read');

    let bestStory = null;
    let maxScore = 0;

    SLEEP_STORIES.forEach(story => {
        let score = 0;
        const searchPool = `${story.title} ${story.description} ${story.category}`.toLowerCase();

        // Match against story-specific keywords
        if (goal.includes(story.category)) score += 5;

        // Multi-keyword scoring
        const keywords = goal.split(' ');
        keywords.forEach(kw => {
            if (kw.length < 3) return;
            if (searchPool.includes(kw)) score += 2;
        });

        if (score > maxScore) {
            maxScore = score;
            bestStory = story;
        }
    });

    // If it's a specific story request but score is low, try a fallback
    if (isStoryRequest && !bestStory) {
        return SLEEP_STORIES[0]; // Fallback to first story
    }

    return maxScore > 2 ? bestStory : null;
}

/**
 * Specialized parser for multi-stage goals.
 * Example: "Focus for 10 mins then sleep."
 */
export function parseComplexGoal(text) {
    if (!text) return [];

    const goal = text.toLowerCase();
    const stages = goal.split(/\bthen\b|\band then\b|\bfollowed by\b/);

    if (stages.length <= 1) {
        const single = calculateFrequencyFromGoal(goal);
        return single ? [single] : [];
    }

    return stages.map(s => calculateFrequencyFromGoal(s.trim())).filter(Boolean);
}
