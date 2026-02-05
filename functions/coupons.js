const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Get Firestore instance (admin is already initialized in index.js)
const getDb = () => admin.firestore();

/**
 * Admin: Create new coupon
 * Requires admin authentication
 */
exports.createCoupon = functions.https.onCall(async (data, context) => {
    // Check admin permission
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { code, type, value, maxUses, expiresAt } = data;

    // Validate
    if (!code || !type || value == null) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const couponCode = code.toUpperCase();

    // Check if exists
    const existing = await getDb().collection('coupons').doc(couponCode).get();
    if (existing.exists) {
        throw new functions.https.HttpsError('already-exists', 'Coupon code already exists');
    }

    const couponData = {
        code: couponCode,
        type, // 'percentage' or 'free_access'
        value, // 10, 20, 100
        maxUses: maxUses || null,
        usedCount: 0,
        expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
        active: true,
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await getDb().collection('coupons').doc(couponCode).set(couponData);

    return { success: true, couponCode };
});

/**
 * Admin: Update coupon
 */
exports.updateCoupon = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { code, updates } = data;

    await getDb().collection('coupons').doc(code.toUpperCase()).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
});

/**
 * Admin: Deactivate coupon
 */
exports.deactivateCoupon = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { code } = data;

    await getDb().collection('coupons').doc(code.toUpperCase()).update({
        active: false,
        deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
});

/**
 * Admin: Grant free premium access to user
 */
exports.grantFreeAccess = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { userId, duration } = data; // duration: '1month', '1year', 'lifetime'

    let expiresAt = null;
    if (duration !== 'lifetime') {
        const now = new Date();
        if (duration === '1month') {
            now.setMonth(now.getMonth() + 1);
        } else if (duration === '1year') {
            now.setFullYear(now.getFullYear() + 1);
        }
        expiresAt = admin.firestore.Timestamp.fromDate(now);
    }

    await getDb().collection('subscriptions').doc(userId).set({
        plan: duration === 'lifetime' ? 'lifetime' : 'free_grant',
        status: 'active',
        currentPeriodEnd: expiresAt,
        grantedBy: context.auth.uid,
        grantedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, userId, expiresAt: expiresAt ? expiresAt.toDate() : null };
});

/**
 * Validate coupon (public, for checkout preview)
 */
exports.validateCoupon = functions.https.onCall(async (data, context) => {
    const { code } = data;

    if (!code) {
        throw new functions.https.HttpsError('invalid-argument', 'Coupon code required');
    }

    const couponDoc = await getDb().collection('coupons').doc(code.toUpperCase()).get();

    if (!couponDoc.exists) {
        return { valid: false, error: 'Invalid coupon code' };
    }

    const coupon = couponDoc.data();

    // Check active
    if (!coupon.active) {
        return { valid: false, error: 'Coupon is inactive' };
    }

    // Check expiration
    if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
        return { valid: false, error: 'Coupon has expired' };
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return { valid: false, error: 'Coupon usage limit reached' };
    }

    return {
        valid: true,
        coupon: {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            description: `${coupon.value}% off`
        }
    };
});

/**
 * Get coupon usage statistics (admin)
 */
exports.getCouponStats = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { code } = data;

    const usageSnapshot = await getDb().collection('couponUsage')
        .where('couponCode', '==', code.toUpperCase())
        .orderBy('usedAt', 'desc')
        .limit(100)
        .get();

    const usage = usageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        usedAt: doc.data().usedAt.toDate()
    }));

    const couponDoc = await getDb().collection('coupons').doc(code.toUpperCase()).get();
    const couponData = couponDoc.data();

    return {
        coupon: couponData,
        usage,
        totalUses: usage.length
    };
});
