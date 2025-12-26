// MindWave Session Analytics
// Tracks listening sessions and provides stats

const ANALYTICS_KEY = 'mindwave_analytics';
const VISIT_KEY = 'mindwave_last_visit';

// --- DAILY VISIT TRACKING (updates streak on app load) ---

export function recordVisit() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem(VISIT_KEY);

    if (lastVisit === today) {
        // Already visited today
        return;
    }

    const analytics = getAnalytics();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastVisit === yesterday) {
        // Continuing streak
        analytics.stats.currentStreak++;
    } else if (lastVisit !== today) {
        // Streak broken or first visit
        analytics.stats.currentStreak = 1;
    }

    // Update longest streak
    if (analytics.stats.currentStreak > analytics.stats.longestStreak) {
        analytics.stats.longestStreak = analytics.stats.currentStreak;
    }

    localStorage.setItem(VISIT_KEY, today);
    saveAnalytics(analytics);

    console.log('[Analytics] Visit recorded. Streak:', analytics.stats.currentStreak);
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
    return session;
}

export function endSessionTracking(completed = false) {
    const sessionStr = localStorage.getItem('mindwave_current_session');
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    session.endTime = Date.now();
    session.duration = Math.round((session.endTime - session.startTime) / 1000);
    session.completed = completed;

    // Only save sessions longer than 30 seconds
    if (session.duration >= 30) {
        saveSession(session);
    }

    localStorage.removeItem('mindwave_current_session');
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
    analytics.stats.lastSessionDate = session.startTime;

    // Track preset usage
    if (!analytics.stats.presetUsage[session.preset]) {
        analytics.stats.presetUsage[session.preset] = 0;
    }
    analytics.stats.presetUsage[session.preset]++;

    // Update streaks
    updateStreak(analytics);

    saveAnalytics(analytics);
}

// --- STREAK TRACKING ---

function updateStreak(analytics) {
    const today = new Date().toDateString();
    const lastDate = analytics.stats.lastSessionDate
        ? new Date(analytics.stats.lastSessionDate).toDateString()
        : null;

    if (lastDate !== today) {
        // Check if streak continues (yesterday)
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDate === yesterday) {
            analytics.stats.currentStreak++;
        } else {
            // Streak broken, start new
            analytics.stats.currentStreak = 1;
        }

        // Update longest streak
        if (analytics.stats.currentStreak > analytics.stats.longestStreak) {
            analytics.stats.longestStreak = analytics.stats.currentStreak;
        }
    }
}

// --- DATA ACCESS ---

export function getAnalytics() {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.warn('[Analytics] Parse error, resetting');
        }
    }

    // Default structure
    return {
        sessions: [],
        stats: {
            totalSessions: 0,
            totalMinutes: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastSessionDate: null,
            presetUsage: {}
        }
    };
}

function saveAnalytics(analytics) {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
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

// --- CLEAR DATA ---

export function clearAnalytics() {
    localStorage.removeItem(ANALYTICS_KEY);
    localStorage.removeItem('mindwave_current_session');
}
