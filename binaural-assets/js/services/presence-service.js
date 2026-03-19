/**
 * Presence Service
 * Handles real-time Social Pulse by tracking active sessions in Firestore.
 */

import { state } from '../state.js';
import { db, doc, setDoc, deleteDoc, collection, onSnapshot, query, where, serverTimestamp } from './firebase.js';

let heartbeatInterval = null;
let currentSessionId = null;
let unsubscribeCounts = null;

// Allow external scripts to pass in their current Pomodoro phase (FOCUS, REST, NONE)
let currentPhaseTracker = 'NONE';

export function setPresencePhase(phase) {
    currentPhaseTracker = phase;
    syncPresence(); // Force an immediate update to the network
}

/**
 * Force an immediate presence update (e.g. when changing presets or phases).
 */
export const syncPresence = async () => {
    if (!db) return;

    try {
        const docRef = doc(db, 'presence_sessions', currentSessionId);
        await setDoc(docRef, {
            uid: state.currentUser ? state.currentUser.uid : 'anonymous',
            preset: state.activePresetType || 'none',
            phase: currentPhaseTracker,
            lastActive: serverTimestamp(),
            status: 'active'
        }, { merge: true });
    } catch (e) {
        console.warn('[Presence] Sync failed:', e);
    }
};

/**
 * Starts the presence heartbeat.
 * Updates Firestore every 60 seconds with current state.
 */
export function startPresenceHeartbeat() {
    if (heartbeatInterval) stopPresenceHeartbeat();

    // Generate a unique session ID for this tab/instance
    currentSessionId = `session_${Math.random().toString(36).substr(2, 9)}`;

    // Initial update
    syncPresence();

    // Heartbeat every 60s
    heartbeatInterval = setInterval(syncPresence, 60000);

    // Cleanup on window close
    window.addEventListener('beforeunload', stopPresenceHeartbeat);
}

/**
 * Stops the presence heartbeat and removes the session.
 */
export async function stopPresenceHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    if (currentSessionId && db) {
        try {
            const docRef = doc(db, 'presence_sessions', currentSessionId);
            await deleteDoc(docRef);
        } catch (e) {
            console.warn('[Presence] Cleanup failed:', e);
        }
        currentSessionId = null;
    }

    window.removeEventListener('beforeunload', stopPresenceHeartbeat);
}

/**
 * Listens for active session counts.
 * @param {Function} callback - Called with { total, byPreset: { alpha, beta, etc. }, totalFocus, totalRest }
 */
export function subscribeToPresenceCounts(callback) {
    if (!db) {
        console.warn("[Presence] No Firebase DB, running mock sync data.");
        setTimeout(() => callback({
            total: 42,
            byPreset: { alpha: 12, beta: 8, gamma: 5, delta: 10, theta: 7 },
            totalFocus: 18,
            totalRest: 3
        }), 1000);
        return () => { };
    }

    if (unsubscribeCounts) unsubscribeCounts();

    const q = query(collection(db, 'presence_sessions'), where('status', '==', 'active'));

    unsubscribeCounts = onSnapshot(q, (snapshot) => {
        const counts = {
            total: snapshot.size,
            byPreset: {},
            totalFocus: 0,
            totalRest: 0
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            const preset = data.preset || 'none';
            counts.byPreset[preset] = (counts.byPreset[preset] || 0) + 1;

            if (data.phase === 'FOCUS') counts.totalFocus++;
            if (data.phase === 'REST') counts.totalRest++;
        });

        callback(counts);
    }, (error) => {
        console.error('[Presence] Subscription failed:', error);
    });

    return unsubscribeCounts;
}
