/**
 * Journal Service
 * Manages user reflections and session insights.
 */

import { state } from '../state.js';
import { db, doc, setDoc, getDoc, serverTimestamp } from './firebase.js';

const JOURNAL_KEY = 'mindwave_reflections';

export const FEELINGS = [
    { id: 'calm', icon: '🌿', label: 'Calm' },
    { id: 'focused', icon: '⚡', label: 'Focused' },
    { id: 'energized', icon: '✨', label: 'Energized' },
    { id: 'relaxed', icon: '🌊', label: 'Relaxed' },
    { id: 'sleepy', icon: '🌙', label: 'Sleepy' }
];

/**
 * Saves a new reflection entry.
 */
export async function saveReflection(entry) {
    const reflections = getLocalReflections();

    const newEntry = {
        id: `ref_${Date.now()}`,
        timestamp: Date.now(),
        preset: state.activePresetType || 'none',
        ...entry
    };

    reflections.unshift(newEntry);

    // Save locally
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(reflections.slice(0, 50))); // Keep last 50

    // Sync to Cloud if possible
    await syncReflectionToCloud(newEntry);

    console.log('[Journal] Saved reflection:', newEntry.id);
    return newEntry;
}

/**
 * Fetches reflections from local storage.
 */
export function getLocalReflections() {
    try {
        const stored = localStorage.getItem(JOURNAL_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn('[Journal] Error loading reflections:', e);
        return [];
    }
}

/**
 * Syncs a single entry to Firebase.
 */
async function syncReflectionToCloud(entry) {
    if (!db || !state.currentUser || state.currentUser.isAnonymous) return;

    try {
        const uid = state.currentUser.uid;
        const docRef = doc(db, 'users', uid, 'reflections', entry.id);
        await setDoc(docRef, {
            ...entry,
            syncedAt: serverTimestamp()
        });
        console.log('[Journal] Synced to cloud');
    } catch (e) {
        console.warn('[Journal] Cloud sync failed:', e);
    }
}

/**
 * Initial sync to pull down cloud reflections (Batch).
 */
export async function syncAllReflections() {
    if (!db || !state.currentUser || state.currentUser.isAnonymous) return;
    // Implementation for pulling history could be added here if needed for Phase 6
}
