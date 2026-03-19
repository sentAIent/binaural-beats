import { db, doc, getDoc, setDoc, serverTimestamp } from './firebase.js';

const ANALYTICS_KEY = 'mindwave_analytics';

/**
 * Pushes the local analytics data to Firestore.
 * Automatically called when new sessions or pomodoros are completed.
 * @param {string} uid The user's Firebase UID
 */
export async function syncAnalyticsToCloud(uid) {
    if (!uid || !db) return;

    try {
        const stored = localStorage.getItem(ANALYTICS_KEY);
        if (!stored) return;

        const analytics = JSON.parse(stored);

        // Push the entire analytics object (stats + last 100 sessions)
        const docRef = doc(db, 'users', uid, 'analytics', 'stats');
        await setDoc(docRef, {
            ...analytics,
            lastSynced: serverTimestamp()
        }, { merge: true });

        console.log('[Cloud Sync] Successfully pushed local analytics to cloud.');
    } catch (err) {
        console.warn('[Cloud Sync] Failed to push analytics to cloud:', err);
    }
}

/**
 * Pulls the analytics data from Firestore.
 * Overwrites local data if the cloud has more progress (e.g. more pomodoros or total minutes).
 * @param {string} uid The user's Firebase UID
 */
export async function syncAnalyticsFromCloud(uid) {
    if (!uid || !db) return;

    try {
        const docRef = doc(db, 'users', uid, 'analytics', 'stats');
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            const cloudData = snapshot.data();
            const localStored = localStorage.getItem(ANALYTICS_KEY);
            let localData = null;

            if (localStored) {
                try {
                    localData = JSON.parse(localStored);
                } catch (e) { }
            }

            let shouldOverwriteLocal = false;

            if (!localData) {
                // No local data, accept cloud data
                shouldOverwriteLocal = true;
            } else if (cloudData.stats && localData.stats) {
                // Compare total sessions or pomodoro cycles.
                // If cloud has strictly more completed cycles or session time, it's the dominant save.
                const cloudScore = (cloudData.stats.totalSessions || 0) + (cloudData.stats.pomodoroCyclesCompleted || 0);
                const localScore = (localData.stats.totalSessions || 0) + (localData.stats.pomodoroCyclesCompleted || 0);

                if (cloudScore > localScore) {
                    shouldOverwriteLocal = true;
                }
            }

            if (shouldOverwriteLocal) {
                // Remove the Firebase Timestamp object before saving to localStorage
                delete cloudData.lastSynced;
                localStorage.setItem(ANALYTICS_KEY, JSON.stringify(cloudData));
                console.log('[Cloud Sync] Restored analytics from cloud (cloud > local).');

                // If the UI is open, it will read from localStorage on next refresh.
                // We might want to dispatch an event to optionally update live numbers.
                window.dispatchEvent(new Event('mindwave_analytics_synced'));
            } else {
                console.log('[Cloud Sync] Local analytics are equal or superior; skipping cloud restore.');
                // Push local to cloud to ensure cloud is up-to-date
                syncAnalyticsToCloud(uid);
            }
        }
    } catch (err) {
        console.warn('[Cloud Sync] Failed to pull analytics from cloud:', err);
    }
}
