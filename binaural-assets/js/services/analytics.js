// MindWave Session Analytics
// Tracks listening sessions and provides stats

const ANALYTICS_KEY = 'mindwave_analytics';

// Integration Imports
import * as ga from '../utils/analytics.js';
import * as firestore from './analytics-service.js';
import { getCurrentUser } from './firebase.js';

// --- STREAK & VISIT TRACKING ---

/**
 * Unified helper to update user streaks based on activity date.
 * @param {Object} analytics The current analytics object
 * @param {number} timestamp The timestamp of the new activity
 * @returns {boolean} True if a new day milestone was reached
 */
function internalUpdateStreak(analytics, timestamp) {
    const today = new Date(timestamp).toDateString();
    const lastDate = analytics.stats.lastActivityDate
        ? new Date(analytics.stats.lastActivityDate).toDateString()
        : null;

    if (lastDate === today) return false; // Already recorded today

    const yesterday = new Date(timestamp - 86400000).toDateString();

    if (lastDate === yesterday) {
        analytics.stats.currentStreak++;
    } else {
        analytics.stats.currentStreak = 1;
    }

    if (analytics.stats.currentStreak > analytics.stats.longestStreak) {
        analytics.stats.longestStreak = analytics.stats.currentStreak;
    }

    analytics.stats.lastActivityDate = timestamp;
    return true;
}

export function recordVisit() {
    const analytics = getAnalytics();
    const now = Date.now();

    if (internalUpdateStreak(analytics, now)) {
        saveAnalytics(analytics);
        console.log('[Analytics] Daily visit recorded. Streak:', analytics.stats.currentStreak);

        // Track in Cloud Analytics (once per day)
        firestore.trackGlobalEvent('daily_visit', { streak: analytics.stats.currentStreak });
    }
}

export function startSessionTracking(presetName = 'Custom') {
    const session = {
        id: `session_${Date.now()}`,
        startTime: Date.now(),
        endTime: null,
        duration: 0, // in seconds
        preset: presetName,
        completed: false
    };

    // Store in-progress session
    localStorage.setItem('mindwave_current_session', JSON.stringify(session));

    // Track in external services
    ga.trackSessionStart(presetName, presetName);
    firestore.trackGlobalEvent('session_start', { preset: presetName });

    return session;
}

export function endSessionTracking(completed = false) {
    const sessionStr = localStorage.getItem('mindwave_current_session');
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    session.endTime = Date.now();
    session.duration = Math.round((session.endTime - session.startTime) / 1000);
    session.completed = completed;

    // Store for UI triggers (Phase 5)
    localStorage.setItem('mindwave_last_session_duration', session.duration.toString());

    // Only save sessions longer than 30 seconds
    if (session.duration >= 30) {
        saveSession(session);
    }

    localStorage.removeItem('mindwave_current_session');

    // Track in external services
    ga.trackSessionEnd(session.preset, Math.round(session.duration / 60));
    firestore.trackGlobalEvent('session_end', {
        preset: session.preset,
        duration_sec: session.duration,
        completed: completed
    });

    return session;
}

function saveSession(session) {
    const analytics = getAnalytics();
    analytics.sessions.unshift(session);

    // Keep last 100 sessions
    if (analytics.sessions.length > 100) {
        analytics.sessions = analytics.sessions.slice(0, 100);
    }

    // Update stats
    analytics.stats.totalSessions++;
    analytics.stats.totalMinutes += Math.round(session.duration / 60);

    // Unified streak update
    internalUpdateStreak(analytics, session.startTime);

    // Track preset usage
    if (!analytics.stats.presetUsage[session.preset]) {
        analytics.stats.presetUsage[session.preset] = 0;
    }
    analytics.stats.presetUsage[session.preset]++;

    saveAnalytics(analytics);

    // Increment global session count for NPS trigger
    const currentCount = parseInt(localStorage.getItem('mindwave_session_count') || '0');
    localStorage.setItem('mindwave_session_count', (currentCount + 1).toString());
}

export function logPomodoroCycle(durationMinutes) {
    const analytics = getAnalytics();

    analytics.stats.pomodoroCyclesCompleted++;
    analytics.stats.totalPomodoroMinutes += durationMinutes;

    saveAnalytics(analytics);
    console.log(`[Analytics] Tracked Completed Pomodoro. Total Cycles: ${analytics.stats.pomodoroCyclesCompleted}`);
}

// --- DATA ACCESS ---

export function getAnalytics() {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    // Default structure
    const analytics = {
        sessions: [],
        stats: {
            totalSessions: 0,
            totalMinutes: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            presetUsage: {},
            // Pomodoro Stats
            pomodoroCyclesCompleted: 0,
            totalPomodoroMinutes: 0
        }
    };

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Migration: lastSessionDate -> lastActivityDate
            if (parsed.stats && parsed.stats.lastSessionDate && !parsed.stats.lastActivityDate) {
                parsed.stats.lastActivityDate = parsed.stats.lastSessionDate;
            }
            // Migration: Add Pomodoro tracking for older accounts
            if (parsed.stats) {
                if (parsed.stats.pomodoroCyclesCompleted === undefined) parsed.stats.pomodoroCyclesCompleted = 0;
                if (parsed.stats.totalPomodoroMinutes === undefined) parsed.stats.totalPomodoroMinutes = 0;
            }

            return { ...analytics, ...parsed, stats: { ...analytics.stats, ...parsed.stats } };
        } catch (e) {
            console.warn('[Analytics] Parse error, resetting');
        }
    }

    return analytics;
}

function saveAnalytics(analytics) {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));

    // Cloud Sync Integration
    const user = getCurrentUser();
    if (user && user.uid) {
        import('./cloud-sync.js').then(module => {
            module.syncAnalyticsToCloud(user.uid);
        }).catch(err => {
            console.warn('[Cloud Sync] Failed to load module:', err);
        });
    }
}

// --- COMPUTED STATS ---

export function getStats() {
    const analytics = getAnalytics();
    const stats = analytics.stats;

    // Weekly listening minutes (last 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyMinutes = analytics.sessions
        .filter(s => s.startTime >= weekAgo)
        .reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

    // Top preset
    const presets = Object.entries(stats.presetUsage);
    presets.sort((a, b) => b[1] - a[1]);
    const topPreset = presets.length > 0 ? presets[0][0] : 'None';

    // Average session length
    const avgMinutes = stats.totalSessions > 0
        ? Math.round(stats.totalMinutes / stats.totalSessions)
        : 0;

    return {
        totalSessions: stats.totalSessions,
        totalMinutes: stats.totalMinutes,
        totalHours: Math.round(stats.totalMinutes / 60 * 10) / 10,
        weeklyMinutes,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        topPreset,
        avgMinutes
    };
}

/**
 * Calculates session distribution across mental states and community sync impact.
 * States: Delta (<4Hz), Theta (4-8Hz), Alpha (8-13Hz), Beta (13-30Hz), Gamma (>30Hz)
 */
export function getImpactStats() {
    const analytics = getAnalytics();
    const distribution = {
        delta: 0,
        theta: 0,
        alpha: 0,
        beta: 0,
        gamma: 0
    };

    analytics.sessions.forEach(s => {
        // Map common presets to states
        const p = s.preset.toLowerCase();
        let state = 'alpha'; // Default
        if (p.includes('delta')) state = 'delta';
        else if (p.includes('theta')) state = 'theta';
        else if (p.includes('alpha')) state = 'alpha';
        else if (p.includes('beta')) state = 'beta';
        else if (p.includes('gamma')) state = 'gamma';
        // Handle common combos
        else if (p.includes('focus') || p.includes('sharp')) state = 'beta';
        else if (p.includes('drift') || p.includes('creative')) state = 'theta';
        else if (p.includes('sleep') || p.includes('night')) state = 'delta';

        distribution[state] += Math.round(s.duration / 60);
    });

    // Calculate Community Sync (Pulse Hours)
    // Formula: Total Hours * (Random modifier between 4-12 to simulate avg community size)
    const basePulseHours = (analytics.stats.totalMinutes / 60) * 8.5;
    const pulseHours = Math.round(basePulseHours * 10) / 10;

    return {
        distribution,
        pulseHours,
        totalMinutes: analytics.stats.totalMinutes
    };
}

// --- WEEKLY CHART DATA ---

export function getWeeklyData() {
    const analytics = getAnalytics();
    const days = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
        const dayEnd = dayStart + 86400000;

        const minutes = analytics.sessions
            .filter(s => s.startTime >= dayStart && s.startTime < dayEnd)
            .reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

        days.push({
            label: labels[date.getDay()],
            minutes,
            date: new Date(dayStart)
        });
    }

    return days;
}

// --- SYNC DAILY USAGE ---

export function syncDailyUsage() {
    try {
        const dailyUsage = JSON.parse(localStorage.getItem('mindwave_daily_usage') || '{}');
        if (!dailyUsage.minutes || dailyUsage.synced) return;

        const analytics = getAnalytics();
        analytics.stats.totalMinutes += dailyUsage.minutes;

        // Mark as synced to avoid double-counting
        dailyUsage.synced = true;
        localStorage.setItem('mindwave_daily_usage', JSON.stringify(dailyUsage));

        saveAnalytics(analytics);
        console.log('[Analytics] Synced daily usage:', dailyUsage.minutes, 'minutes');
    } catch (e) {
        console.warn('[Analytics] Failed to sync daily usage:', e);
    }
}

// --- CLEAR DATA ---

export function clearAnalytics() {
    localStorage.removeItem(ANALYTICS_KEY);
    localStorage.removeItem('mindwave_current_session');
}
