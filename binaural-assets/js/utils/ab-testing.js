/**
 * A/B Testing Framework
 * Simple client-side variant selection with analytics tracking
 */

const AB_STORAGE_KEY = 'mindwave_ab_tests';

// Active experiments configuration
const EXPERIMENTS = {
    'pricing_cta': {
        variants: ['control', 'urgency', 'social_proof'],
        weights: [34, 33, 33] // Percentage weights
    },
    'onboarding_flow': {
        variants: ['classic', 'simplified', 'gamified'],
        weights: [34, 33, 33]
    },
    'exit_intent_offer': {
        variants: ['50_percent', '7_day_trial', 'countdown'],
        weights: [34, 33, 33]
    }
};

/**
 * Get assigned variant for an experiment
 * @param {string} experimentId - The experiment identifier
 * @returns {string} The assigned variant
 */
export function getVariant(experimentId) {
    const stored = getStoredVariants();

    // Return cached variant if exists
    if (stored[experimentId]) {
        return stored[experimentId];
    }

    // Get experiment config
    const experiment = EXPERIMENTS[experimentId];
    if (!experiment) {
        console.warn(`[AB] Unknown experiment: ${experimentId}`);
        return 'control';
    }

    // Assign new variant based on weights
    const variant = selectVariantByWeight(experiment.variants, experiment.weights);

    // Store assignment
    stored[experimentId] = variant;
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(stored));

    console.log(`[AB] Assigned ${experimentId}: ${variant}`);

    // Track assignment
    trackExperimentAssignment(experimentId, variant);

    return variant;
}

/**
 * Select variant based on weighted probability
 */
function selectVariantByWeight(variants, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * total;

    let cumulative = 0;
    for (let i = 0; i < variants.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
            return variants[i];
        }
    }

    return variants[0]; // Fallback
}

/**
 * Get stored variant assignments
 */
function getStoredVariants() {
    try {
        return JSON.parse(localStorage.getItem(AB_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

/**
 * Track experiment assignment in analytics
 */
function trackExperimentAssignment(experimentId, variant) {
    // Use existing analytics if available
    if (window.gtag) {
        window.gtag('event', 'experiment_assignment', {
            experiment_id: experimentId,
            variant_id: variant
        });
    }

    // Also track in local analytics
    const assignments = JSON.parse(localStorage.getItem('mindwave_ab_assignments') || '{}');
    assignments[experimentId] = {
        variant,
        assignedAt: Date.now()
    };
    localStorage.setItem('mindwave_ab_assignments', JSON.stringify(assignments));
}

/**
 * Track a conversion event for A/B analysis
 * @param {string} experimentId - The experiment
 * @param {string} conversionType - Type of conversion (e.g., 'purchase', 'signup')
 * @param {object} metadata - Additional data
 */
export function trackConversion(experimentId, conversionType, metadata = {}) {
    const variant = getStoredVariants()[experimentId];
    if (!variant) return;

    // Track with analytics
    if (window.gtag) {
        window.gtag('event', 'ab_conversion', {
            experiment_id: experimentId,
            variant_id: variant,
            conversion_type: conversionType,
            ...metadata
        });
    }

    console.log(`[AB] Conversion: ${experimentId}/${variant} -> ${conversionType}`);
}

/**
 * Reset a user's variant assignment (for testing)
 */
export function resetExperiment(experimentId) {
    const stored = getStoredVariants();
    delete stored[experimentId];
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(stored));
}

/**
 * Get all current assignments (for debugging)
 */
export function getAssignments() {
    return getStoredVariants();
}

/**
 * Force a specific variant (for testing/admin)
 */
export function forceVariant(experimentId, variant) {
    const stored = getStoredVariants();
    stored[experimentId] = variant;
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(stored));
    console.log(`[AB] Forced ${experimentId}: ${variant}`);
}

// Expose for debugging in console
window.AB = {
    getVariant,
    getAssignments,
    resetExperiment,
    forceVariant,
    trackConversion
};
