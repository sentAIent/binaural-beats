// Structured learning path for meditation consistency
import { state, VISUALIZER_VERSION } from '../state.js';
import { db, doc, setDoc, getDoc, serverTimestamp } from '../services/firebase.js';

// Journey stages and lessons
export const JOURNEY_STAGES = [
    {
        id: 'foundations',
        name: 'Foundations',
        emoji: '🌱',
        description: 'Learn the basics of binaural beats',
        duration: '1-2 weeks',
        lessons: [
            {
                id: 'lesson-1',
                day: 1,
                title: 'What Are Binaural Beats?',
                description: 'Understanding how binaural beats affect your brain',
                type: 'info',
                content: `Binaural beats are created when two slightly different frequencies are played in each ear. Your brain perceives the difference as a third tone, which can help guide your brainwaves into specific states.

For example, if 200Hz plays in your left ear and 210Hz in your right ear, you perceive a 10Hz "beat" - an Alpha wave frequency associated with relaxation.`,
                action: { preset: 'alpha', duration: 5 },
                completed: false
            },
            {
                id: 'lesson-2',
                day: 2,
                title: 'Your First Session',
                description: '5-minute Alpha wave relaxation',
                type: 'practice',
                content: 'Put on your headphones (required for binaural beats), get comfortable, and close your eyes. Let the Alpha waves guide you into a relaxed state.',
                action: { preset: 'alpha', duration: 5 },
                completed: false
            },
            {
                id: 'lesson-3',
                day: 3,
                title: 'Understanding Brain Waves',
                description: 'Delta, Theta, Alpha, Beta, Gamma explained',
                type: 'info',
                content: `**Delta (0.5-4 Hz)** - Deep sleep, healing
**Theta (4-8 Hz)** - Meditation, creativity, REM sleep
**Alpha (8-12 Hz)** - Relaxation, calm focus
**Beta (12-30 Hz)** - Active thinking, concentration
**Gamma (30-100 Hz)** - Peak focus, cognitive enhancement`,
                action: null,
                completed: false
            },
            {
                id: 'lesson-4',
                day: 4,
                title: 'Theta for Meditation',
                description: '7-minute Theta wave session',
                type: 'practice',
                content: 'Theta waves are associated with deep meditation and creativity. This session will help you access a meditative state more easily.',
                action: { preset: 'theta', duration: 7 },
                completed: false
            },
            {
                id: 'lesson-5',
                day: 5,
                title: 'Creating Your Routine',
                description: 'Tips for building a daily practice',
                type: 'info',
                content: `**Tips for success:**
• Same time each day (morning or before bed works best)
• Start with just 5-10 minutes
• Find a quiet, comfortable space
• Use quality headphones
• Track your progress (we'll do this for you!)`,
                action: null,
                completed: false
            },
            {
                id: 'lesson-6',
                day: 6,
                title: 'Beta for Focus',
                description: '10-minute concentration session',
                type: 'practice',
                content: 'Beta waves enhance concentration and alertness. Use this before work or study sessions.',
                action: { preset: 'beta', duration: 10 },
                completed: false
            },
            {
                id: 'lesson-7',
                day: 7,
                title: 'Week 1 Complete!',
                description: 'Review and reflection',
                type: 'milestone',
                content: 'Congratulations! You\'ve completed your first week. Reflect on how you felt during each session. Which frequencies resonated most with you?',
                action: null,
                completed: false,
                badge: 'week-1'
            }
        ]
    },
    {
        id: 'building-habit',
        name: 'Building Habits',
        emoji: '🌿',
        description: 'Establish your daily practice',
        duration: 'Week 3-4',
        lessons: [
            {
                id: 'lesson-8',
                day: 8,
                title: 'Morning Integration',
                description: 'Start your day with focus',
                type: 'practice',
                content: 'Use the Wake Up journey to transition from sleep to alertness naturally.',
                action: { journey: 'wakeUp' },
                completed: false
            },
            {
                id: 'lesson-9',
                day: 9,
                title: 'Longer Sessions',
                description: '15-minute Alpha session',
                type: 'practice',
                content: 'Extending your sessions helps deepen the benefits. Today, try a longer 15-minute relaxation session.',
                action: { preset: 'alpha', duration: 15 },
                completed: false
            },
            {
                id: 'lesson-10',
                day: 10,
                title: 'Evening Wind Down',
                description: 'Prepare for restful sleep',
                type: 'practice',
                content: 'Use the Wind Down journey 30-60 minutes before bed to transition into sleep mode.',
                action: { journey: 'windDown' },
                completed: false
            },
            {
                id: 'lesson-11',
                day: 11,
                title: 'Combining with Soundscapes',
                description: 'Layer nature sounds with frequencies',
                type: 'info',
                content: 'Adding ambient sounds like rain, ocean, or forest can enhance your sessions. The binaural beat remains effective underneath the soundscape.',
                action: null,
                completed: false
            },
            {
                id: 'lesson-12',
                day: 12,
                title: 'Meditation Session',
                description: 'Deep Theta meditation',
                type: 'practice',
                content: 'Use the Meditation journey for a guided frequency sweep into deep meditative states.',
                action: { journey: 'meditation' },
                completed: false
            },
            {
                id: 'lesson-13',
                day: 13,
                title: 'Rest Day',
                description: 'Reflection and integration',
                type: 'info',
                content: 'Taking breaks is important. Use today to reflect on your experiences so far. Notice any changes in your sleep, focus, or stress levels.',
                action: null,
                completed: false
            },
            {
                id: 'lesson-14',
                day: 14,
                title: 'Two Weeks Strong!',
                description: 'Habit milestone achieved',
                type: 'milestone',
                content: 'You\'ve meditated for two weeks! Research shows habits form after 14-21 days of consistency. You\'re on track!',
                action: null,
                completed: false,
                badge: 'two-weeks'
            }
        ]
    },
    {
        id: 'deepening',
        name: 'Deepening Practice',
        emoji: '🌳',
        description: 'Advanced techniques and personalization',
        duration: 'Week 5-8',
        lessons: [
            {
                id: 'lesson-15',
                day: 15,
                title: 'Sleep Stories Introduction',
                description: 'Combine narratives with frequencies',
                type: 'info',
                content: 'Sleep stories add a narrative element to your Delta sessions, guiding your mind while the frequencies work on a deeper level.',
                action: null,
                completed: false
            },
            {
                id: 'lesson-16',
                day: 16,
                title: 'Deep Sleep Session',
                description: 'Delta waves for restorative rest',
                type: 'practice',
                content: 'Use the Deep Sleep journey about 30 minutes before bed. Allow the frequencies to carry you into deep, restorative sleep.',
                action: { journey: 'deepSleep' },
                completed: false
            },
            {
                id: 'lesson-17',
                day: 17,
                title: 'Creative Flow State',
                description: 'Theta for creativity',
                type: 'practice',
                content: 'Artists, writers, and creators often use Theta to access flow states. Try this before any creative work.',
                action: { journey: 'creativity' },
                completed: false
            },
            {
                id: 'lesson-18',
                day: 18,
                title: 'Mu Waves Exploration',
                description: 'The empathy frequency',
                type: 'info',
                content: 'Mu waves (8-13 Hz, similar to Alpha) are associated with mirror neurons and empathy. Some research suggests they may enhance social connection.',
                action: { preset: 'mu', duration: 10 },
                completed: false
            },
            {
                id: 'lesson-19',
                day: 19,
                title: 'Custom Mix Creation',
                description: 'Design your own frequencies',
                type: 'info',
                content: 'Use the sliders to customize your base pitch and beat frequency. Experiment to find combinations that work best for your unique brain.',
                action: null,
                completed: false
            },
            {
                id: 'lesson-20',
                day: 20,
                title: 'Healing Frequencies',
                description: 'Solfeggio tones explained',
                type: 'info',
                content: 'The Healing presets use ancient Solfeggio frequencies: 528 Hz (Transformation), 432 Hz (Harmony), 396 Hz (Liberation). Try them during relaxation.',
                action: null,
                completed: false
            },
            {
                id: 'lesson-21',
                day: 21,
                title: 'Journey Master!',
                description: 'Program complete',
                type: 'milestone',
                content: 'You\'ve completed the MindWave journey! You now have the knowledge and habits to maintain a lifelong meditation practice with binaural beats.',
                action: null,
                completed: false,
                badge: 'journey-master'
            }
        ]
    }
];

// Badges
export const BADGES = {
    'week-1': { name: 'First Week', emoji: '🌟', description: 'Completed 7 days of practice' },
    'two-weeks': { name: 'Two Weeks Strong', emoji: '💪', description: 'Built a consistent habit' },
    'journey-master': { name: 'Journey Master', emoji: '🎓', description: 'Completed the full program' },
    'streak-7': { name: 'Week Streak', emoji: '🔥', description: '7 day practice streak' },
    'streak-30': { name: 'Month Streak', emoji: '🏆', description: '30 day practice streak' }
};

// Storage keys
const STORAGE_KEY = 'mindwave_journey_progress';

// Journey state
let journeyState = {
    currentStage: 0,
    currentLesson: 0,
    completedLessons: [],
    earnedBadges: [],
    startedAt: null,
    lastSessionAt: null
};

// Active session tracking
let activeJourneySession = null; // { lessonId, startedAt, preset }

// Export function to check if journey is active
export function isJourneyActive() {
    return activeJourneySession !== null;
}

// Export function to get active session info
export function getActiveJourneySession() {
    return activeJourneySession;
}

// Clear active session
export function clearActiveJourneySession() {
    console.log('[Journey] Clearing active session');
    activeJourneySession = null;
}

// Expose globally for controls.js
window.isJourneyActive = isJourneyActive;
window.getActiveJourneySession = getActiveJourneySession;

// Initialize journey
export async function initJourney() {
    loadProgress();

    // Register auth listener for seamless sync
    import('../services/firebase.js').then(({ registerAuthCallback }) => {
        registerAuthCallback(async (user) => {
            if (user && !user.isAnonymous) {
                await syncWithCloud();
                // Re-render UI if container exists
                const container = document.getElementById('journeyContainer');
                if (container) renderJourneyUI(container);
            }
        });
    });
}

// Cloud Sync logic
async function syncWithCloud() {
    if (!db || !state.currentUser) return;

    try {
        const uid = state.currentUser.uid;
        const docRef = doc(db, 'users', uid, 'progress', 'journey');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const cloudState = docSnap.data();
            console.log('[Journey] Cloud state found, merging...');

            // Merge logic: Combine completed lessons and take latest timestamps
            const combinedCompleted = Array.from(new Set([
                ...journeyState.completedLessons,
                ...(cloudState.completedLessons || [])
            ]));

            const combinedBadges = Array.from(new Set([
                ...journeyState.earnedBadges,
                ...(cloudState.earnedBadges || [])
            ]));

            journeyState = {
                ...journeyState,
                ...cloudState,
                completedLessons: combinedCompleted,
                earnedBadges: combinedBadges
            };

            saveProgress(); // Save merged state locally
        } else {
            console.log('[Journey] No cloud state, uploading local progress...');
            await saveToCloud();
        }
    } catch (e) {
        console.warn('[Journey] Cloud sync failed:', e);
    }
}

async function saveToCloud() {
    if (!db || !state.currentUser || state.currentUser.isAnonymous) return;

    try {
        const uid = state.currentUser.uid;
        const docRef = doc(db, 'users', uid, 'progress', 'journey');
        await setDoc(docRef, {
            ...journeyState,
            updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('[Journey] Progress saved to cloud');
    } catch (e) {
        console.warn('[Journey] Cloud save failed:', e);
    }
}

// Load progress from localStorage
function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            journeyState = { ...journeyState, ...data };
        }
    } catch (e) {
        console.error('[Journey] Failed to load progress:', e);
    }
}

// Save progress to localStorage
function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journeyState));
    } catch (e) {
        console.error('[Journey] Failed to save progress:', e);
    }
}

// Mark lesson as completed
export function completeLesson(lessonId) {
    if (!journeyState.completedLessons.includes(lessonId)) {
        journeyState.completedLessons.push(lessonId);
        journeyState.lastSessionAt = new Date().toISOString();

        // Check for badge
        const lesson = getAllLessons().find(l => l.id === lessonId);
        if (lesson?.badge && !journeyState.earnedBadges.includes(lesson.badge)) {
            journeyState.earnedBadges.push(lesson.badge);
            showBadgeEarned(lesson.badge);
        }

        saveProgress();
        saveToCloud(); // Fire and forget cloud sync
        console.log('[Journey] Completed lesson:', lessonId);
        return true;
    }
    return false;
}

// Get all lessons flat list
export function getAllLessons() {
    return JOURNEY_STAGES.flatMap(stage => stage.lessons);
}

// Get current progress
export function getProgress() {
    const totalLessons = getAllLessons().length;
    const completedCount = journeyState.completedLessons.length;
    return {
        completed: completedCount,
        total: totalLessons,
        percentage: Math.round((completedCount / totalLessons) * 100),
        badges: journeyState.earnedBadges
    };
}

// Get next lesson to complete
export function getNextLesson() {
    const lessons = getAllLessons();
    return lessons.find(l => !journeyState.completedLessons.includes(l.id)) || null;
}

// Check if lesson is available (unlocked)
export function isLessonAvailable(lessonId) {
    const lessons = getAllLessons();
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);

    if (lessonIndex === 0) return true; // First lesson always available

    // Check if previous lesson is completed
    const previousLesson = lessons[lessonIndex - 1];
    return previousLesson ? journeyState.completedLessons.includes(previousLesson.id) : false;
}

// Check if lesson is completed
export function isLessonCompleted(lessonId) {
    return journeyState.completedLessons.includes(lessonId);
}

// Show badge earned notification
function showBadgeEarned(badgeId) {
    const badge = BADGES[badgeId];
    if (!badge) return;

    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm';
    notification.innerHTML = `
        <div class="text-center animate-bounce-in">
            <div class="text-6xl mb-4">${badge.emoji}</div>
            <div class="text-xl font-bold text-[var(--accent)] mb-2">Badge Earned!</div>
            <div class="text-lg font-medium text-white mb-1">${badge.name}</div>
            <div class="text-sm text-[var(--text-muted)]">${badge.description}</div>
        </div>
    `;

    notification.addEventListener('click', () => notification.remove());
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 4000);
}

export function renderJourneyUI(container) {
    if (!container) return;

    const progress = getProgress();
    const nextLesson = getNextLesson();

    container.innerHTML = `
        <!-- Progress Header -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-white">Your Progress</span>
                <span class="text-sm font-bold text-[var(--primary)]">${progress.completed} / ${progress.total} lessons</span>
            </div>
            <div class="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500" 
                    style="width: ${progress.percentage}%"></div>
            </div>
            <div class="text-xs text-[var(--text-secondary)] mt-2">${progress.percentage}% complete</div>
        </div>
        
        <!-- Next Lesson Card -->
        ${nextLesson ? `
        <div class="mb-6 p-4 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 border border-[var(--primary)]/40">
            <div class="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold mb-1">Up Next</div>
            <div class="text-base font-bold text-white mb-1">Day ${nextLesson.day}: ${nextLesson.title}</div>
            <div class="text-sm text-[var(--text-secondary)] mb-3">${nextLesson.description}</div>
            <button onclick="window.openLesson('${nextLesson.id}')" 
                class="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)] text-sm font-bold uppercase tracking-wide hover:brightness-110 transition-all shadow-lg">
                Start Lesson →
            </button>
        </div>
        ` : `
        <div class="mb-6 p-4 rounded-xl bg-gradient-to-br from-[var(--success)]/20 to-[var(--accent)]/20 border border-[var(--success)]/40 text-center">
            <div class="text-3xl mb-2">🎉</div>
            <div class="text-base font-bold text-[var(--success)]">Journey Complete!</div>
            <div class="text-sm text-[var(--text-secondary)]">You've mastered binaural beats meditation</div>
        </div>
        `}
        
        <!-- Stages -->
        ${JOURNEY_STAGES.map((stage, index) => {
        const stageCompleted = stage.lessons.every(l => journeyState.completedLessons.includes(l.id));
        const stageLessonsCompleted = stage.lessons.filter(l => journeyState.completedLessons.includes(l.id)).length;

        // Extra padding for Building Habits and Deepening Practice sections
        const sectionPadding = index > 0 ? 'pt-8 mt-10' : '';

        return `
            <div class="${sectionPadding} ${index > 0 ? 'border-t border-white/10' : ''} mb-6 pb-4">
                <div class="flex items-center gap-3 mb-4">
                    <span class="text-2xl">${stage.emoji}</span>
                    <div class="flex-1">
                        <span class="text-sm font-bold text-white">${stage.name}</span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] text-[var(--primary)] bg-[var(--primary)]/20 px-2 py-0.5 rounded-full font-medium">${stageLessonsCompleted}/${stage.lessons.length}</span>
                            ${stageCompleted ? '<span class="text-[var(--success)] text-xs font-bold">✓ Complete</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="grid gap-2" style="grid-template-columns: repeat(7, minmax(0, 1fr))">
                    ${stage.lessons.map(lesson => {
            const completed = journeyState.completedLessons.includes(lesson.id);
            const isMilestone = lesson.type === 'milestone';
            const isAvailable = isLessonAvailable(lesson.id);
            const isActive = activeJourneySession && activeJourneySession.lessonId === lesson.id;
            const isNext = nextLesson && nextLesson.id === lesson.id;

            // Determine button styling based on state
            let btnClasses = '';
            let content = '';
            let clickable = true;

            if (completed) {
                btnClasses = 'bg-[var(--success)]/30 text-[var(--success)] border-[var(--success)]/50';
                clickable = true;
            } else if (!isAvailable) {
                // Locked lesson
                btnClasses = 'bg-gray-700/30 text-gray-500/70 border-gray-600/30 cursor-not-allowed opacity-50';
                content = '🔒';
                clickable = false;
            } else if (isActive) {
                // Currently active session
                btnClasses = 'bg-[var(--primary)]/30 text-[var(--primary)] border-[var(--primary)] ring-2 ring-[var(--primary)]/40 animate-pulse';
                clickable = true;
            } else if (isNext) {
                // Next suggested lesson
                btnClasses = 'bg-[var(--primary)]/20 text-white border-[var(--primary)]/60 shadow-[0_0_15px_rgba(96,169,255,0.3)] scale-105 z-10';
                clickable = true;
            } else if (isMilestone) {
                btnClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                clickable = isAvailable;
            } else {
                btnClasses = 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-[var(--primary)]/50';
                clickable = true;
            }

            // Determine button content
            if (!content) {
                content = isMilestone ? (lesson.badge ? BADGES[lesson.badge]?.emoji : '⭐') : lesson.day;
            }

            return `
                        <button ${clickable ? `onclick="window.openLesson('${lesson.id}')"` : 'disabled'}
                            class="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${btnClasses}"
                            title="Day ${lesson.day}: ${lesson.title}${!isAvailable ? ' (Locked - complete previous lessons)' : ''}">
                            ${content}
                        </button>
                        `;
        }).join('')}
                </div>
            </div>
            `;
    }).join('')}
        
        <!-- Badges Section -->
        <div class="mt-6 pt-4 border-t border-white/10">
            <div class="text-sm font-bold text-white mb-3">Your Badges</div>
            <div class="flex flex-wrap gap-2">
                ${Object.entries(BADGES).map(([id, badge]) => {
        const earned = journeyState.earnedBadges.includes(id);
        return `
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full ${earned
                ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/40'
                : 'bg-white/5 border border-white/10'
            }" title="${badge.description}">
                        <span class="text-base ${earned ? '' : 'opacity-70'}">${badge.emoji}</span>
                        <span class="text-xs font-medium ${earned ? 'text-[var(--accent)]' : 'text-white/80'}">${badge.name}</span>
                    </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

// Global function for lesson click
window.openLesson = async (lessonId) => {
    const lesson = getAllLessons().find(l => l.id === lessonId);
    if (!lesson) return;

    // Check paywall access
    const lessonNumber = lesson.day;
    if (window.canAccessFeature) {
        const access = await window.canAccessFeature('journey_lesson', lessonNumber);
        if (!access.allowed) {
            window.showUpgradePrompt(access.reason);
            return;
        }
    }

    // Show lesson modal
    showLessonModal(lesson);
};

// Show lesson detail modal
function showLessonModal(lesson) {
    const existing = document.getElementById('lessonModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'lessonModal';
    modal.className = 'fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm';
    modal.style.zIndex = '1100'; // Higher than .modal z-index: 1000
    modal.innerHTML = `
        <div class="glass-card w-full max-w-md rounded-2xl overflow-hidden">
            <div class="p-6 border-b border-white/10">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-1">Day ${lesson.day}</div>
                        <h3 class="text-lg font-bold text-white">${lesson.title}</h3>
                    </div>
                    <button onclick="document.getElementById('lessonModal').remove()" 
                        class="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <div class="text-sm text-[var(--text-muted)] whitespace-pre-line mb-6">${lesson.content}</div>
                ${lesson.action ? `
                <button onclick="window.startLessonAction('${lesson.id}')" 
                    class="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] text-gray-900 text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-all">
                    ${lesson.action.preset ? `Start ${lesson.action.duration} Min Session` : 'Begin Journey'}
                </button>
                ` : `
                <button onclick="window.markLessonComplete('${lesson.id}')" 
                    class="w-full py-3 rounded-xl bg-[var(--accent)] text-gray-900 text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-all">
                    ${isLessonCompleted(lesson.id) ? '✓ Completed' : 'Mark as Complete'}
                </button>
                `}
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

// Track pending lesson for completion on timer end
let pendingLessonId = null;

// Start lesson action (preset or journey)
window.startLessonAction = async (lessonId) => {
    const lesson = getAllLessons().find(l => l.id === lessonId);
    if (!lesson?.action) return;

    // Prevent starting if another journey session is active
    if (activeJourneySession && activeJourneySession.lessonId !== lessonId) {
        const currentLesson = getAllLessons().find(l => l.id === activeJourneySession.lessonId);
        const confirmStart = confirm(
            `You have an active journey session: "${currentLesson?.title || 'Unknown'}".\n\nDo you want to stop it and start this lesson instead?`
        );

        if (!confirmStart) {
            console.log('[Journey] User cancelled - keeping current session');
            return;
        }

        // Stop current session
        console.log('[Journey] Stopping current session to start new one');
        clearActiveJourneySession();
    }

    // Close modals immediately for seamless experience
    document.getElementById('lessonModal')?.remove();
    document.getElementById('journeyModal')?.classList.add('hidden');

    // Get duration from lesson action (default 5 minutes if not specified)
    const durationMinutes = lesson.action.duration || 5;

    // Set active session BEFORE starting audio
    activeJourneySession = {
        lessonId: lessonId,
        startedAt: new Date().toISOString(),
        preset: lesson.action.preset || lesson.action.journey,
        duration: durationMinutes
    };
    console.log('[Journey] Active session set:', activeJourneySession);

    // Apply preset or start journey sweep
    if (lesson.action.preset) {
        console.log('[Journey] Attempting to apply preset:', lesson.action.preset);
        // Initialize lesson action but don't close modal yet
        if (window.applyMixState) { // Check if applyMixState is available
            try {
                // Track feature usage
                if (window.trackFeatureUse) {
                    window.trackFeatureUse('journey_lesson_start', {
                        lesson_id: lessonId,
                        preset: lesson.action.preset
                    });
                }

                // Apply preset and duration
                window.applyMixState(lesson.action.preset);
                console.log('[Journey] Preset applied successfully');
            } catch (e) {
                console.error('[Journey] Failed to apply preset:', e);
                alert(`Error starting preset: ${e.message}`);
                return;
            }
        } else {
            console.error('[Journey] window.applyPreset is not defined!');
            alert('Error: Preset function not available. Please refresh the page.');
            return;
        }
    } else if (lesson.action.journey) {
        console.log('[Journey] Attempting to start sweep:', lesson.action.journey);
        if (typeof window.startSweepPreset === 'function') {
            try {
                window.startSweepPreset(lesson.action.journey);
                console.log('[Journey] Sweep started successfully');
            } catch (e) {
                console.error('[Journey] Failed to start sweep:', e);
                alert(`Error starting journey: ${e.message}`);
                return;
            }
        } else {
            console.error('[Journey] window.startSweepPreset is not defined!');
            alert('Error: Journey function not available. Please refresh the page.');
            return;
        }
    }

    // Store pending lesson for completion
    pendingLessonId = lessonId;

    try {
        // Import required modules
        const [sessionTimer, { startAudio, fadeIn, fadeOut, stopAudio }, { toggleVisual }, { syncAllButtons }] = await Promise.all([
            import('../audio/session-timer.js'),
            import('../audio/engine.js'),
            import(`../visuals/visualizer_nuclear_v4.js?v=${VISUALIZER_VERSION}`),
            import('../ui/controls_v3.js')
        ]);

        // Start audio playback and visuals
        await startAudio();
        fadeIn(1.5);
        resumeVisuals();
        syncAllButtons();

        // Set session duration in the dropdown (so timer UI shows)
        const sessionDurationSelect = document.getElementById('sessionDuration');
        if (sessionDurationSelect) {
            sessionDurationSelect.value = String(durationMinutes);
        }

        // Start the timed session with timer UI
        sessionTimer.startSession(durationMinutes, {
            onTick: (data) => {
                // Update timer display
                const timerDisplay = document.getElementById('timerDisplay');
                const timerProgress = document.getElementById('timerProgress');

                if (timerDisplay) {
                    timerDisplay.textContent = data.formatted;
                    timerDisplay.style.opacity = '1';
                }

                if (timerProgress) {
                    const circumference = 339.292;
                    const offset = circumference - (data.progress / 100) * circumference;
                    timerProgress.style.strokeDashoffset = offset;
                }
            },
            onComplete: async () => {
                console.log('[Journey] Timer complete, checking pendingLessonId:', pendingLessonId, 'expected:', lessonId);

                // Mark lesson complete when timer finishes
                if (pendingLessonId === lessonId) {
                    const wasCompleted = completeLesson(lessonId);
                    console.log('[Journey] Lesson completion result:', wasCompleted);
                    pendingLessonId = null;

                    // Clear active session
                    clearActiveJourneySession();

                    // Show completion notification
                    showLessonCompleteNotification(lesson);

                    // Fade out and stop audio
                    fadeOut(3, () => {
                        stopAudio();
                        // Reset play button to show play icon
                        const playIcon = document.getElementById('playIcon');
                        const pauseIcon = document.getElementById('pauseIcon');
                        if (playIcon) playIcon.classList.remove('hidden');
                        if (pauseIcon) pauseIcon.classList.add('hidden');
                    });

                    // Hide timer and remove timer-active class
                    const timerRing = document.getElementById('timerRing');
                    const timerDisplay = document.getElementById('timerDisplay');
                    if (timerRing) {
                        timerRing.style.opacity = '0';
                        timerRing.classList.remove('timer-active');
                    }
                    if (timerDisplay) {
                        timerDisplay.style.opacity = '0';
                        timerDisplay.classList.remove('timer-active');
                    }

                    // Refresh journey UI if visible
                    const container = document.getElementById('journeyContainer');
                    if (container) renderJourneyUI(container);
                } else {
                    console.warn('[Journey] pendingLessonId mismatch, not completing');
                }
            }
        });

        // Show timer UI and add timer-active class for hover persistence
        const timerRing = document.getElementById('timerRing');
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerRing) {
            timerRing.style.opacity = '1';
            timerRing.classList.add('timer-active');
        }
        if (timerDisplay) {
            timerDisplay.style.opacity = '1';
            timerDisplay.classList.add('timer-active');
        }

        // Update play button state
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');

        console.log(`[Journey] Started ${durationMinutes} min session for lesson: ${lessonId}`);
    } catch (e) {
        console.error('[Journey] Failed to start session:', e);
        // Clear session on error
        clearActiveJourneySession();
        alert('Failed to start lesson session. Please try again.');
    }
};

// Show completion notification
function showLessonCompleteNotification(lesson) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-green-500/90 text-white font-bold text-sm shadow-lg backdrop-blur-sm';
    notification.style.zIndex = '9999';
    notification.innerHTML = `✓ Lesson Complete: ${lesson.title}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Mark lesson complete manually
window.markLessonComplete = (lessonId) => {
    completeLesson(lessonId);
    document.getElementById('lessonModal')?.remove();

    // Refresh journey UI if visible
    const container = document.getElementById('journeyContainer');
    if (container) renderJourneyUI(container);
};
