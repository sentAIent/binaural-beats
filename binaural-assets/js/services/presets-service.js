/**
 * Presets Service
 * Handles fetching and syncing binaural presets and user-saved mixes from Firestore.
 */

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    setDoc,
    addDoc,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { PRESET_COMBOS, SOUNDSCAPES } from '../state.js';

const PRESETS_COLLECTION = 'global_presets';
const SOUNDSCAPES_COLLECTION = 'global_soundscapes';
const PUBLIC_GALLERY_COLLECTION = 'public_gallery';

/**
 * Fetch all global preset combos from Firestore
 * Fallback to hardcoded state.js if offline or empty
 */
export async function getCloudPresets() {
    try {
        // Safety: Check if Firebase is initialized
        if (getApps().length === 0) {
            console.warn('[Presets] Firebase not initialized yet, using local fallbacks');
            return PRESET_COMBOS;
        }

        const db = getFirestore();

        const q = query(collection(db, PRESETS_COLLECTION), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('[Presets] Cloud registry empty, using local defaults');
            return PRESET_COMBOS;
        }

        const cloudPresets = [];
        snapshot.forEach(doc => {
            cloudPresets.push({ id: doc.id, ...doc.data() });
        });

        return cloudPresets;
    } catch (err) {
        console.warn('[Presets] Cloud fetch failed, using local fallback:', err.message);
        return PRESET_COMBOS;
    }
}

/**
 * Fetch all available soundscapes from Firestore
 * Fallback to hardcoded state.js
 */
export async function getCloudSoundscapes() {
    try {
        const db = getFirestore();
        if (!db) return SOUNDSCAPES;

        const snapshot = await getDocs(collection(db, SOUNDSCAPES_COLLECTION));
        if (snapshot.empty) return SOUNDSCAPES;

        const cloudSounds = [];
        snapshot.forEach(doc => {
            cloudSounds.push({ id: doc.id, ...doc.data() });
        });

        return cloudSounds;
    } catch (err) {
        return SOUNDSCAPES;
    }
}

/**
 * Sync Local Storage mixes to Firestore for a logged-in user
 */
export async function syncLocalMixesToCloud(user) {
    if (!user) return;

    try {
        const localMixes = JSON.parse(localStorage.getItem('mindwave_library') || '[]');
        if (localMixes.length === 0) return;

        const db = getFirestore();
        const userMixesRef = collection(db, 'users', user.uid, 'mixes');

        console.log(`[Presets] Syncing ${localMixes.length} local mixes to cloud...`);

        // Batch set docs (simplified)
        for (const mix of localMixes) {
            const mixId = mix.id || `mix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await setDoc(doc(userMixesRef, mixId), {
                ...mix,
                updatedAt: serverTimestamp(),
                syncSource: 'local_migration'
            }, { merge: true });
        }

        // Clear local storage migration flag
        localStorage.setItem('mindwave_mixes_synced', 'true');
        console.log('[Presets] Cloud sync complete.');
    } catch (err) {
        console.error('[Presets] Local-to-cloud sync failed:', err);
    }
}

/**
 * Publish a mix to the public gallery
 */
export async function publishPreset(mix, user) {
    if (!user) throw new Error("Must be logged in to publish");

    try {
        const db = getFirestore();
        const galleryRef = collection(db, PUBLIC_GALLERY_COLLECTION);

        await addDoc(galleryRef, {
            ...mix,
            publishedBy: user.displayName || user.email,
            uid: user.uid,
            likes: 0,
            views: 0,
            publishedAt: serverTimestamp(),
            isApproved: true // Auto-approve for now
        });

        return true;
    } catch (err) {
        console.error('[Presets] Failed to publish:', err);
        throw err;
    }
}

/**
 * Fetch public gallery presets
 */
export async function getPublicGallery(category = null) {
    try {
        const db = getFirestore();
        if (!db) return [];

        let q;
        if (category && category !== 'all') {
            q = query(
                collection(db, PUBLIC_GALLERY_COLLECTION),
                where('category', '==', category),
                orderBy('publishedAt', 'desc'),
                limit(50)
            );
        } else {
            q = query(
                collection(db, PUBLIC_GALLERY_COLLECTION),
                orderBy('publishedAt', 'desc'),
                limit(50)
            );
        }

        const snapshot = await getDocs(q);
        const gallery = [];
        snapshot.forEach(doc => {
            gallery.push({ id: doc.id, ...doc.data() });
        });

        return gallery;
    } catch (err) {
        console.warn('[Presets] Failed to fetch gallery:', err);
        return [];
    }
}
