/**
 * Test Helper for Stripe Payment & Paywall System
 * Run these commands in browser console to test payment integration
 * 
 * Usage:
 * 1. Open your app in browser
 * 2. Open DevTools Console (F12)
 * 3. Copy and run the commands below
 */

// ==================================================
// TEST 1: Check Paywall for Free User
// ==================================================
console.log('📋 Test 1: Paywall Access Control');

// Test premium preset access (should be blocked for free users)
window.canAccessFeature('preset', 6).then(result => {
    console.log('Premium Preset (index 6):', result);
    // Expected: { allowed: false, reason: 'premium_preset' }
});

// Test free preset access (should work)
window.canAccessFeature('preset', 2).then(result => {
    console.log('Free Preset (index 2):', result);
    // Expected: { allowed: true }
});

// Test premium journey lesson
window.canAccessFeature('journey_lesson', 5).then(result => {
    console.log('Premium Journey Lesson 5:', result);
    // Expected: { allowed: false, reason: 'premium_lesson' }
});

// Test export feature
window.canAccessFeature('export').then(result => {
    console.log('Export Feature:', result);
    // Expected: { allowed: false, reason: 'premium_feature' }
});

// ==================================================
// TEST 2: Show Upgrade Prompts
// ==================================================
console.log('\n📋 Test 2: Upgrade Prompts');

// Show upgrade modal for premium preset
// window.showUpgradePrompt('premium_preset');

// Show upgrade modal for premium lesson
// window.showUpgradePrompt('premium_lesson');

// Show upgrade modal for premium feature
// window.showUpgradePrompt('premium_feature');


// ==================================================
// TEST 3: Show Pricing Modal
// ==================================================
console.log('\n📋 Test 3: Pricing Modal');

// Uncomment to open pricing modal
// window.showPricingModal();


// ==================================================
// TEST 4: Check Current Subscription Status
// ==================================================
console.log('\n📋 Test 4: Subscription Status');

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

if (auth.currentUser) {
    getDoc(doc(db, 'subscriptions', auth.currentUser.uid))
        .then(subDoc => {
            if (subDoc.exists()) {
                console.log('✅ Subscription found:', subDoc.data());
            } else {
                console.log('ℹ️ No subscription (free user)');
            }
        })
        .catch(err => console.error('Error fetching subscription:', err));
} else {
    console.log('⚠️ Not logged in');
}


// ==================================================
// TEST 5: Manually Grant Premium Access (Testing Only)
// ==================================================
console.log('\n📋 Test 5: Grant Premium Access');
console.log('To manually grant premium access:');
console.log('1. Go to Firebase Console');
console.log('2. Firestore Database → subscriptions collection');
console.log('3. Create/Update document with user ID as document ID');
console.log('4. Set fields:');
console.log('   {');
console.log('     "plan": "monthly" or "yearly" or "lifetime",');
console.log('     "status": "active",');
console.log('     "currentPeriodEnd": [Timestamp 1 month from now]  // Skip for lifetime');
console.log('   }');


// ==================================================
// QUICK ACCESS FUNCTIONS
// ==================================================
console.log('\n🚀 Quick Test Commands:');
console.log('window.showPricingModal()        - Open pricing modal');
console.log('window.showUpgradePrompt(...)    - Show upgrade prompt');
console.log('window.canAccessFeature(...)     - Check feature access');

