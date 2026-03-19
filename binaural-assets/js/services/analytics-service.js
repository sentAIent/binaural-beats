/**
 * Global Analytics Service
 * Syncs app events to Firestore for the Analytics Dashboard
 */

import {
    db,
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from './firebase.js';

const COLLECTION_NAME = 'global_analytics';

/**
 * Log a global event to Firestore
 * @param {string} eventName - Type of event (session_start, purchase, signup)
 * @param {object} params - Additional event data
 */
export async function trackGlobalEvent(eventName, params = {}) {
    try {
        if (!db) return;

        const eventData = {
            event: eventName,
            ...params,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };

        await addDoc(collection(db, COLLECTION_NAME), eventData);
        console.log(`[GlobalAnalytics] Event logged: ${eventName}`);
    } catch (e) {
        console.warn('[GlobalAnalytics] Failed to log event:', e);
    }
}

/**
 * Fetch aggregated stats for the dashboard
 * (WAU, Conversion Rate, etc.)
 */
export async function getGlobalStats() {
    if (!db) return null;

    try {
        const stats = {
            totalVisits: 0,
            totalSignups: 0,
            totalPurchases: 0,
            totalRevenue: 0,
            conversionRate: 0,
            recentEvents: []
        };

        // For a real app, you'd use a Cloud Function for this aggregation.
        // For this dashboard, we'll fetch recent records and simulate aggregation.
        const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const data = doc.data();
            stats.recentEvents.push(data);

            if (data.event === 'page_view') stats.totalVisits++;
            if (data.event === 'sign_up') stats.totalSignups++;
            if (data.event === 'purchase') {
                stats.totalPurchases++;
                stats.totalRevenue += (data.value || 0);
            }
        });

        if (stats.totalVisits > 0) {
            stats.conversionRate = (stats.totalPurchases / stats.totalVisits) * 100;
        }

        return stats;
    } catch (e) {
        console.error('[GlobalAnalytics] Failed to fetch stats:', e);
        return null;
    }
}
