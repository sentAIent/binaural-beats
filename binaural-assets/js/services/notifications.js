/**
 * Push Notifications Service
 * Handles permission requests, daily reminders, and streak alerts
 */

const NOTIFICATION_KEY = 'mindwave_notifications';
const REMINDER_TIME_KEY = 'mindwave_reminder_time';

export function initNotifications() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('[Notifications] Not supported in this browser');
        return;
    }

    // Expose global function for permission request
    window.requestNotificationPermission = requestNotificationPermission;
}

/**
 * Request notification permission (call this after user action)
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return { granted: false, reason: 'not_supported' };
    }

    if (Notification.permission === 'granted') {
        return { granted: true };
    }

    if (Notification.permission === 'denied') {
        return { granted: false, reason: 'denied' };
    }

    try {
        const result = await Notification.requestPermission();

        if (result === 'granted') {
            // Save preference
            localStorage.setItem(NOTIFICATION_KEY, 'enabled');

            // Show welcome notification
            showNotification(
                'Notifications Enabled! 🎉',
                'We\'ll remind you to meditate and keep your streak going.'
            );

            // Schedule daily reminder
            scheduleDailyReminder();

            return { granted: true };
        }

        return { granted: false, reason: 'declined' };
    } catch (e) {
        console.error('[Notifications] Error requesting permission:', e);
        return { granted: false, reason: 'error' };
    }
}

/**
 * Show a notification
 */
export function showNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: options.tag || 'mindwave-notification',
        requireInteraction: options.requireInteraction || false,
        ...options
    });

    notification.onclick = () => {
        window.focus();
        notification.close();

        if (options.onClick) {
            options.onClick();
        }
    };

    return notification;
}

/**
 * Schedule daily meditation reminder
 */
export function scheduleDailyReminder(hour = 9) {
    // Store reminder time
    localStorage.setItem(REMINDER_TIME_KEY, hour.toString());

    // Use Service Worker for reliable scheduling
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_REMINDER',
            hour: hour
        });
    }

    console.log(`[Notifications] Daily reminder scheduled for ${hour}:00`);
}

/**
 * Check if user should be notified about streak
 */
export function checkStreakReminder() {
    const analytics = JSON.parse(localStorage.getItem('mindwave_analytics') || '{}');
    const currentStreak = analytics.stats?.currentStreak || 0;

    if (currentStreak >= 3) {
        // User has a streak going - remind them not to break it
        const lastVisit = localStorage.getItem('mindwave_last_visit');
        const today = new Date().toDateString();

        if (lastVisit !== today) {
            // Haven't visited today
            const hour = new Date().getHours();

            // Evening reminder (6-9 PM)
            if (hour >= 18 && hour <= 21) {
                showStreakReminder(currentStreak);
            }
        }
    }
}

function showStreakReminder(streak) {
    if (Notification.permission !== 'granted') return;

    const messages = [
        `🔥 Your ${streak}-day streak is at risk!`,
        `Don't break your ${streak}-day streak! 🧘`,
        `Keep it going! You're on day ${streak} 🌟`
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    showNotification(message, 'Take a few minutes to meditate today.', {
        tag: 'streak-reminder',
        requireInteraction: true
    });
}

/**
 * Send a milestone notification
 */
export function notifyMilestone(type, value) {
    if (Notification.permission !== 'granted') return;

    const milestones = {
        'streak-7': { title: '🔥 Week Streak!', body: 'You\'ve meditated 7 days in a row!' },
        'streak-30': { title: '🏆 Month Streak!', body: 'Incredible! 30 days of practice.' },
        'sessions-10': { title: '🧘 10 Sessions!', body: 'You\'re building a great habit.' },
        'hours-5': { title: '⏰ 5 Hours!', body: 'You\'ve meditated for 5 hours total.' }
    };

    const milestone = milestones[`${type}-${value}`];
    if (milestone) {
        showNotification(milestone.title, milestone.body, {
            tag: `milestone-${type}-${value}`,
            requireInteraction: true
        });
    }
}
