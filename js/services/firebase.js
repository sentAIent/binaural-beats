// Firebase SDKs loaded dynamically to prevent render blocking
// import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
// ... imports removed ...

import { state } from '../state.js';

// Module-level variables (populated after init)
let app, auth, db, storage;
let initializeApp, getAuth, getFirestore, getStorage;
let onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile;
let collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, orderBy, serverTimestamp;
let ref, uploadBytes, getDownloadURL, deleteObject;

const authCallbacks = [];
let unsubscribeLibrary = null;
let unsubscribeAudioLibrary = null;

export function registerAuthCallback(cb) {
    authCallbacks.push(cb);
}

export function isLoggedIn() {
    return !!state.currentUser;
}

export function getCurrentUser() {
    return state.currentUser;
}

// MOCK STATE
let isMock = false;

export async function initFirebase() {
    try {
        const firebaseConfig = JSON.parse(window.__firebase_config || '{}');

        // Validation: Check if config is dummy
        if (firebaseConfig.apiKey === "dummy-api-key") {
            console.warn("Using Dummy Firebase Config - ACTIVATING MOCK MODE");
            isMock = true;
            // ... (Mock logic same as before)
            const storedUser = localStorage.getItem('mindwave_mock_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                state.currentUser = user;
                console.log("[Mock] Auto-login:", user.displayName);
                authCallbacks.forEach(cb => cb(user));
            } else {
                authCallbacks.forEach(cb => cb(null));
            }
            return;
        }

        console.log("[Firebase] Starting lazy load...");

        // DYNAMIC IMPORT: Load SDKs in parallel
        const [
            firebaseApp,
            firebaseAuth,
            firebaseFirestore,
            firebaseStorage
        ] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js'),
            import('https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js')
        ]);

        console.log("[Firebase] SDKs Loaded.");

        // Assign functions to module scope
        initializeApp = firebaseApp.initializeApp;

        getAuth = firebaseAuth.getAuth;
        onAuthStateChanged = firebaseAuth.onAuthStateChanged;
        signInWithCustomToken = firebaseAuth.signInWithCustomToken;
        signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
        createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
        signOut = firebaseAuth.signOut;
        sendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail;
        updateProfile = firebaseAuth.updateProfile;

        getFirestore = firebaseFirestore.getFirestore;
        collection = firebaseFirestore.collection;
        doc = firebaseFirestore.doc;
        setDoc = firebaseFirestore.setDoc;
        getDoc = firebaseFirestore.getDoc;
        getDocs = firebaseFirestore.getDocs;
        deleteDoc = firebaseFirestore.deleteDoc;
        onSnapshot = firebaseFirestore.onSnapshot;
        query = firebaseFirestore.query;
        orderBy = firebaseFirestore.orderBy;
        serverTimestamp = firebaseFirestore.serverTimestamp;

        getStorage = firebaseStorage.getStorage;
        ref = firebaseStorage.ref;
        uploadBytes = firebaseStorage.uploadBytes;
        getDownloadURL = firebaseStorage.getDownloadURL;
        deleteObject = firebaseStorage.deleteObject;

        // Initialize App
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        console.log("Firebase initialized successfully");

        // Auth Listener
        onAuthStateChanged(auth, (user) => {
            state.currentUser = user;
            console.log("Auth State Changed:", user ? user.uid : "No User");
            authCallbacks.forEach(cb => cb(user));

            if (user) {
                if (!user.displayName && user.email) user.displayName = user.email.split('@')[0];
            } else {
                if (unsubscribeLibrary) { unsubscribeLibrary(); unsubscribeLibrary = null; }
                if (unsubscribeAudioLibrary) { unsubscribeAudioLibrary(); unsubscribeAudioLibrary = null; }
            }
        });

        // Auto-login
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
        }

    } catch (e) {
        console.warn("Firebase Init Failed (Network or Config):", e);
        // Fallback to offline mode?
        // Could enable isMock = true here as fallback? 
    }
}

// --- AUTH ACTIONS ---

export async function loginUser(email, password) {
    if (isMock) {
        // Mock Login
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    uid: 'mock-user-123',
                    email: email,
                    displayName: email.split('@')[0],
                    emailVerified: true,
                    isAnonymous: false,
                    metadata: { creationTime: new Date().toISOString() }
                };
                localStorage.setItem('mindwave_mock_user', JSON.stringify(user));
                state.currentUser = user;
                authCallbacks.forEach(cb => cb(user));
                resolve(user);
            }, 600); // Simulate network delay
        });
    }

    if (!auth) throw new Error("Firebase not initialized");
    return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password, displayName) {
    if (isMock) {
        // Mock Register
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    uid: 'mock-user-123',
                    email: email,
                    displayName: displayName || email.split('@')[0],
                    emailVerified: true,
                    isAnonymous: false,
                    metadata: { creationTime: new Date().toISOString() }
                };
                localStorage.setItem('mindwave_mock_user', JSON.stringify(user));
                state.currentUser = user;
                authCallbacks.forEach(cb => cb(user));
                resolve({ user });
            }, 800);
        });
    }

    if (!auth) throw new Error("Firebase not initialized");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(cred.user, { displayName });
    }
    return cred;
}

export async function logoutUser() {
    if (isMock) {
        localStorage.removeItem('mindwave_mock_user');
        state.currentUser = null;
        authCallbacks.forEach(cb => cb(null));
        return Promise.resolve();
    }
    if (!auth) return;
    return signOut(auth);
}

export async function resetPassword(email) {
    if (isMock) {
        return Promise.resolve(); // Just pretend it worked
    }
    if (!auth) throw new Error("Firebase not initialized");
    return sendPasswordResetEmail(auth, email);
}

// --- FIRESTORE ACTIONS (MIXES LIBRARY) ---

export function subscribeToLibrary(onUpdate) {
    if (isMock) {
        // Return Mock Library from LocalStorage
        const existing = JSON.parse(localStorage.getItem('mindwave_mock_library') || '[]');
        onUpdate(existing);
        return;
    }

    if (!auth || !state.currentUser || !db) {
        console.warn("Cannot subscribe to library: Not logged in");
        onUpdate([]); // Return empty
        return;
    }

    const uid = state.currentUser.uid;
    const mixesRef = collection(db, 'users', uid, 'mixes');
    const q = query(mixesRef, orderBy('updatedAt', 'desc'));

    unsubscribeLibrary = onSnapshot(q, (snapshot) => {
        const mixes = [];
        snapshot.forEach(doc => {
            mixes.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(mixes);
    }, (error) => {
        console.error("Library sync error:", error);
    });
}

export async function saveMixToCloud(mixData) {
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('mindwave_mock_library') || '[]');
        const id = mixData.id || `mock-mix-${Date.now()}`;
        const newMix = {
            ...mixData,
            id: id,
            updatedAt: { seconds: Date.now() / 1000 },
            name: mixData.name || "Untitled Mix"
        };

        // Update or Add
        const idx = existing.findIndex(m => m.id === id);
        if (idx !== -1) existing[idx] = newMix;
        else existing.unshift(newMix);

        localStorage.setItem('mindwave_mock_library', JSON.stringify(existing));

        // Trigger update manually since no real subscription
        // Note: In real app, onSnapshot would fire. Here we might need to manually refresh UI if we can't trigger the listener directly.
        // We can just re-read via subscribeToLibrary if we had a reference to the callback... 
        // But for simpler approach, let's assume UI refreshes on next load or we need hacky re-trigger.
        // Actually, we can store the callback locally!
        return id;
    }

    if (!auth || !state.currentUser || !db) throw new Error("Must be logged in to save to cloud");

    const uid = state.currentUser.uid;
    const mixId = mixData.id || `mix_${Date.now()}`;
    const docRef = doc(db, 'users', uid, 'mixes', mixId);

    const payload = {
        ...mixData,
        id: mixId,
        uid: uid,
        updatedAt: serverTimestamp(),
        // Ensure name is present
        name: mixData.name || "Untitled Mix"
    };

    await setDoc(docRef, payload, { merge: true });
    return mixId;
}

export async function deleteMixFromCloud(mixId) {
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('mindwave_mock_library') || '[]');
        const filtered = existing.filter(m => m.id !== mixId);
        localStorage.setItem('mindwave_mock_library', JSON.stringify(filtered));
        return;
    }

    if (!auth || !state.currentUser || !db) throw new Error("Must be logged in");
    const uid = state.currentUser.uid;
    const docRef = doc(db, 'users', uid, 'mixes', mixId);
    await deleteDoc(docRef);
}

// --- AUDIO LIBRARY (CLOUD STORAGE) ---

/**
 * Upload an audio file to Firebase Storage and save metadata to Firestore
 * @param {File} file - The audio file to upload
 * @param {object} metadata - Track metadata (name, size, type, etc.)
 * @returns {Promise<{id: string, downloadUrl: string}>}
 */
export async function uploadAudioToCloud(file, metadata) {
    if (isMock) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const trackId = `mock-track-${Date.now()}`;
                // Use Object URL as fake download URL
                const downloadUrl = URL.createObjectURL(file);

                const existing = JSON.parse(localStorage.getItem('mindwave_mock_audio') || '[]');
                const newTrack = {
                    id: trackId,
                    name: metadata.name || file.name.replace(/\.[^/.]+$/, ''),
                    fileName: file.name,
                    type: file.type,
                    size: file.size,
                    storagePath: 'mock/path',
                    downloadUrl: downloadUrl,
                    dateAdded: { seconds: Date.now() / 1000 },
                    uid: 'mock-user-123'
                };
                existing.unshift(newTrack);
                localStorage.setItem('mindwave_mock_audio', JSON.stringify(existing));

                resolve({ id: trackId, downloadUrl });
            }, 1000);
        });
    }

    if (!auth || !state.currentUser || !storage || !db) {
        throw new Error("Must be logged in to upload audio");
    }

    const uid = state.currentUser.uid;
    const trackId = `track-${Date.now()}`;
    const storagePath = `users/${uid}/audio/${trackId}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    console.log('[Firebase] Uploading audio:', file.name);

    // Upload file to Storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore
    const docRef = doc(db, 'users', uid, 'audioLibrary', trackId);
    const trackData = {
        id: trackId,
        name: metadata.name || file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        type: file.type,
        size: file.size,
        storagePath: storagePath,
        downloadUrl: downloadUrl,
        dateAdded: serverTimestamp(),
        uid: uid
    };

    await setDoc(docRef, trackData);
    console.log('[Firebase] Audio uploaded:', trackId);

    return { id: trackId, downloadUrl };
}

/**
 * Delete an audio file from Firebase Storage and Firestore
 * @param {string} trackId - The track ID to delete
 * @param {string} storagePath - The storage path of the file
 */
export async function deleteAudioFromCloud(trackId, storagePath) {
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('mindwave_mock_audio') || '[]');
        const filtered = existing.filter(t => t.id !== trackId);
        localStorage.setItem('mindwave_mock_audio', JSON.stringify(filtered));
        return;
    }

    if (!auth || !state.currentUser || !storage || !db) {
        throw new Error("Must be logged in to delete audio");
    }

    const uid = state.currentUser.uid;

    // Delete from Storage
    if (storagePath) {
        try {
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);
        } catch (e) {
            console.warn('[Firebase] Storage delete failed (may not exist):', e);
        }
    }

    // Delete from Firestore
    const docRef = doc(db, 'users', uid, 'audioLibrary', trackId);
    await deleteDoc(docRef);
    console.log('[Firebase] Audio deleted:', trackId);
}

/**
 * Subscribe to the user's audio library for real-time updates
 * @param {Function} onUpdate - Callback with array of tracks
 */
export function subscribeToAudioLibrary(onUpdate) {
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('mindwave_mock_audio') || '[]');
        onUpdate(existing);
        return;
    }

    if (!auth || !state.currentUser || !db) {
        console.warn("Cannot subscribe to audio library: Not logged in");
        onUpdate([]);
        return;
    }

    const uid = state.currentUser.uid;
    const audioRef = collection(db, 'users', uid, 'audioLibrary');
    const q = query(audioRef, orderBy('dateAdded', 'desc'));

    unsubscribeAudioLibrary = onSnapshot(q, (snapshot) => {
        const tracks = [];
        snapshot.forEach(doc => {
            tracks.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(tracks);
        console.log('[Firebase] Audio library updated:', tracks.length, 'tracks');
    }, (error) => {
        console.error("Audio library sync error:", error);
    });
}

/**
 * Fetch all audio library tracks (one-time, not real-time)
 * @returns {Promise<Array>}
 */
export async function fetchAudioLibrary() {
    if (isMock) {
        return JSON.parse(localStorage.getItem('mindwave_mock_audio') || '[]');
    }

    if (!auth || !state.currentUser || !db) {
        return [];
    }

    const uid = state.currentUser.uid;
    const audioRef = collection(db, 'users', uid, 'audioLibrary');
    const q = query(audioRef, orderBy('dateAdded', 'desc'));
    const snapshot = await getDocs(q);

    const tracks = [];
    snapshot.forEach(doc => {
        tracks.push({ id: doc.id, ...doc.data() });
    });
    return tracks;
}

export {
    auth,
    db,
    storage,
    doc,
    setDoc,
    deleteDoc,
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
};

