import { db, collectionGroup, query, orderBy, limit, getDocs } from './firebase.js';

/**
 * Leaderboard Service (Phase 5)
 * Fetches global community data ranked by total Pomodoro minutes and cycles.
 */

// A mapping of anonymous names to display if Google Auth name is empty
const ANONYMOUS_NAMES = [
    "Zen Voyager", "Deep Work Master", "Focus Architect",
    "Mindful Traveler", "Brainwave Explorer", "Flow State Ninja",
    "Alpha Meditator", "Theta Dreamer", "Gamma Scholar"
];

function getAnonymousName(uid) {
    // Generate a consistent pseudo-random index based on the user's uid characters
    const charCodeSum = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ANONYMOUS_NAMES[charCodeSum % ANONYMOUS_NAMES.length];
}

/**
 * Fetches the Top 10 meditators based on total Pomodoro cycles completed.
 * Targets the 'analytics' collectionGroup created by the Cloud Sync service.
 */
export async function getLeaderboard(limitCount = 10) {
    if (!db) {
        console.warn("[Leaderboard] Firebase not initialized.");
        return [];
    }

    try {
        // Query the 'analytics' group where Cloud Sync writes its stats object.
        const leaderboardQuery = query(
            collectionGroup(db, 'analytics'),
            orderBy('stats.pomodoroCyclesCompleted', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(leaderboardQuery);
        const users = [];

        snapshot.forEach((doc) => {
            // Document path is 'users/{uid}/analytics/stats'
            const pathSegments = doc.ref.path.split('/');
            const uidStr = pathSegments[1];
            const data = doc.data();

            // Reconstruct a public profile
            const publicUser = {
                uid: uidStr,
                displayName: data.displayName || getAnonymousName(uidStr),
                cycles: data.stats?.pomodoroCyclesCompleted || 0,
                minutes: data.stats?.totalPomodoroMinutes || 0,
                photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uidStr}`
            };

            users.push(publicUser);
        });

        // Add a fake entry if the database is currently empty (for visual debugging without users)
        if (users.length === 0) {
            users.push({
                uid: 'demo-user-1',
                displayName: 'Deep Work Master',
                cycles: 142,
                minutes: 3550,
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo1'
            });
            users.push({
                uid: 'demo-user-2',
                displayName: 'Zen Voyager',
                cycles: 89,
                minutes: 2225,
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo2'
            });
            users.push({
                uid: 'demo-user-3',
                displayName: 'Focus Architect',
                cycles: 45,
                minutes: 1125,
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo3'
            });
        }

        return users;
    } catch (err) {
        console.warn("[Leaderboard] Failed to fetch leaderboard data:", err);
        return [];
    }
}
