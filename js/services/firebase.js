import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithCustomToken,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { state } from '../state.js';

let app, auth, db;
const authCallbacks = [];
let unsubscribeLibrary = null; // Listener for real-time updates

export function registerAuthCallback(cb) {
    authCallbacks.push(cb);
}

export async function initFirebase() {
    try {
        const firebaseConfig = JSON.parse(window.__firebase_config || '{}');

        // Validation: Check if config is dummy
        if (firebaseConfig.apiKey === "dummy-api-key") {
            console.warn("Using Dummy Firebase Config. Auth/DB will fail unless you provide real keys.");
        }

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");

        // Auth Listener
        onAuthStateChanged(auth, (user) => {
            state.currentUser = user;
            console.log("Auth State Changed:", user ? user.uid : "No User");

            // Notify Subscribers
            authCallbacks.forEach(cb => cb(user));

            if (user) {
                // Determine display name
                if (!user.displayName && user.email) {
                    // Temporary name from email
                    user.displayName = user.email.split('@')[0];
                }
            } else {
                // Cleanup
                if (unsubscribeLibrary) {
                    unsubscribeLibrary();
                    unsubscribeLibrary = null;
                }
            }
        });

        // Auto-login logic (Anonymously if no token provided)
        // Note: For a "Login" feature, we might NOT want to auto-login anonymously immediately 
        // to avoid cluttering usage, but for this app it might be fine.
        // Let's stick to explicit login mostly, or anonymous only if needed.
        // Existing behavior:
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
            // Check if we are already signed in? onAuthStateChanged handles that.
            // If not, we do nothing and let user choose to login or stay guest.
        }

    } catch (e) {
        console.warn("Firebase Init Failed (Check Config):", e);
    }
}

// --- AUTH ACTIONS ---

export async function loginUser(email, password) {
    if (!auth) throw new Error("Firebase not initialized");
    return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password, displayName) {
    if (!auth) throw new Error("Firebase not initialized");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(cred.user, { displayName });
    }
    return cred;
}

export async function logoutUser() {
    if (!auth) return;
    return signOut(auth);
}

export async function resetPassword(email) {
    if (!auth) throw new Error("Firebase not initialized");
    return sendPasswordResetEmail(auth, email);
}

// --- FIRESTORE ACTIONS (LIBRARY) ---

export function subscribeToLibrary(onUpdate) {
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
    if (!auth || !state.currentUser || !db) throw new Error("Must be logged in");
    const uid = state.currentUser.uid;
    const docRef = doc(db, 'users', uid, 'mixes', mixId);
    await deleteDoc(docRef);
}

export { auth, db };
