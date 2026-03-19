/**
 * Referral System
 * Handle referral links and tracking
 */

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

const REFERRAL_PARAM = 'ref';
const STORAGE_KEY = 'mindwave_referrer';

/**
 * Get current user's referral link
 */
export function getReferralLink() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set(REFERRAL_PARAM, user.uid);
    return url.toString();
}

/**
 * Check for referral code in URL and save it
 */
export function checkReferral() {
    const params = new URLSearchParams(window.location.search);
    const referrerId = params.get(REFERRAL_PARAM);

    if (referrerId) {
        console.log('[Referral] Found referrer:', referrerId);
        localStorage.setItem(STORAGE_KEY, referrerId);

        // Clear param from URL to keep it clean
        const url = new URL(window.location.href);
        url.searchParams.delete(REFERRAL_PARAM);
        window.history.replaceState({}, '', url.toString());
    }
}

/**
 * Link new user to their referrer (call on signup/first login)
 */
export async function trackReferralSignup(user) {
    const referrerId = localStorage.getItem(STORAGE_KEY);
    if (!referrerId) return;

    if (referrerId === user.uid) return; // Cannot refer self

    const db = getFirestore();
    const referralRef = doc(db, 'referrals', user.uid);

    try {
        const docSnap = await getDoc(referralRef);
        if (docSnap.exists()) return; // Already tracked

        await setDoc(referralRef, {
            userId: user.uid,
            referrerId: referrerId,
            status: 'pending',
            createdAt: serverTimestamp(),
            userEmail: user.email,
            userName: user.displayName
        });

        console.log('[Referral] Tracked signup from:', referrerId);

        // Optional: Clear storage to prevent double tracking? 
        // Keep it for now in case of retry needed
    } catch (e) {
        console.error('[Referral] Error tracking:', e);
    }
}

/**
 * Share referral link
 */
export async function shareReferral() {
    const link = getReferralLink();
    if (!link) return { success: false, error: 'not_logged_in' };

    const shareData = {
        title: 'Join me on MindWave',
        text: 'Get 1 month of MindWave Premium for free!',
        url: link
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return { success: true };
        } else {
            await navigator.clipboard.writeText(link);
            return { success: true, copied: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Get total referral count for a user
 */
export async function getReferralCount(userId) {
    if (!userId) return 0;

    const db = getFirestore();
    const referralsRef = collection(db, 'referrals');
    const q = query(referralsRef, where('referrerId', '==', userId));

    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (e) {
        console.error('[Referral] Error getting count:', e);
        return 0;
    }
}
