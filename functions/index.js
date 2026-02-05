const functions = require('firebase-functions');
const admin = require('firebase-admin');
const couponFunctions = require('./coupons');

admin.initializeApp();
const db = admin.firestore();

// Lazy-load Stripe to avoid initialization issues
let stripeInstance = null;
function getStripe() {
    if (!stripeInstance) {
        const secretKey = functions.config().stripe?.secret_key;
        if (!secretKey) {
            throw new Error('Stripe secret key not configured');
        }
        const stripe = require('stripe');
        stripeInstance = stripe(secretKey);
    }
    return stripeInstance;
}

// Stripe Configuration
const STRIPE_PRICES = {
    get monthly() { return functions.config().stripe?.price_monthly; },
    get yearly() { return functions.config().stripe?.price_yearly; },
    get lifetime() { return functions.config().stripe?.price_lifetime; }
};

/**
 * Create Stripe Checkout Session
 * Called from client to start subscription purchase
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    // Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { priceId, couponCode, successUrl, cancelUrl } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    try {
        // Get or create Stripe customer
        let customerId;
        const userDoc = await db.collection('subscriptions').doc(userId).get();

        if (userDoc.exists && userDoc.data().stripeCustomerId) {
            customerId = userDoc.data().stripeCustomerId;
        } else {
            const customer = await getStripe().customers.create({
                email: userEmail,
                metadata: { firebaseUID: userId }
            });
            customerId = customer.id;

            // Save customer ID
            await db.collection('subscriptions').doc(userId).set({
                stripeCustomerId: customerId,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        // Validate and apply coupon
        const sessionConfig = {
            customer: customerId,
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: priceId === STRIPE_PRICES.lifetime ? 'payment' : 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: userId,
            metadata: { firebaseUID: userId }
        };

        // Apply coupon if provided
        if (couponCode) {
            const couponDoc = await db.collection('coupons').doc(couponCode.toUpperCase()).get();

            if (!couponDoc.exists) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid coupon code');
            }

            const coupon = couponDoc.data();

            // Validate coupon
            if (!coupon.active) {
                throw new functions.https.HttpsError('failed-precondition', 'Coupon is inactive');
            }

            if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
                throw new functions.https.HttpsError('failed-precondition', 'Coupon expired');
            }

            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                throw new functions.https.HttpsError('resource-exhausted', 'Coupon usage limit reached');
            }

            // Create or get Stripe coupon
            const stripeCouponId = `COUPON_${couponCode.toUpperCase()}`;
            try {
                await getStripe().coupons.retrieve(stripeCouponId);
            } catch (err) {
                // Create if doesn't exist
                await getStripe().coupons.create({
                    id: stripeCouponId,
                    percent_off: coupon.value,
                    duration: 'once'
                });
            }

            sessionConfig.discounts = [{ coupon: stripeCouponId }];
            sessionConfig.metadata.couponCode = couponCode.toUpperCase();
        }

        const session = await getStripe().checkout.sessions.create(sessionConfig);

        return { sessionId: session.id, url: session.url };
    } catch (error) {
        console.error('Checkout session error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Create Customer Portal Session
 * Allows users to manage their subscription
 */
exports.createPortalSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const userId = context.auth.uid;
    const { returnUrl } = data;

    try {
        const userDoc = await db.collection('subscriptions').doc(userId).get();

        if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
            throw new functions.https.HttpsError('not-found', 'No subscription found');
        }

        const session = await getStripe().billingPortal.sessions.create({
            customer: userDoc.data().stripeCustomerId,
            return_url: returnUrl
        });

        return { url: session.url };
    } catch (error) {
        console.error('Portal session error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Stripe Webhook Handler
 * Processes events from Stripe (payments, cancellations, etc)
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = functions.config().stripe.webhook_secret;

    let event;
    try {
        event = getStripe().webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object);
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await handleSubscriptionChange(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSuccess(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).send('Webhook handler failed');
    }
});

// Helper: Handle successful checkout
async function handleCheckoutComplete(session) {
    const userId = session.client_reference_id || session.metadata.firebaseUID;

    if (!userId) {
        console.error('No user ID in checkout session');
        return;
    }

    const subscriptionData = {
        stripeCustomerId: session.customer,
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Determine plan type
    if (session.mode === 'subscription') {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0].price.id;

        subscriptionData.stripeSubscriptionId = session.subscription;
        subscriptionData.plan = priceId === STRIPE_PRICES.monthly ? 'monthly' : 'yearly';
        subscriptionData.currentPeriodEnd = admin.firestore.Timestamp.fromDate(
            new Date(subscription.current_period_end * 1000)
        );
    } else {
        // Lifetime purchase
        subscriptionData.plan = 'lifetime';
        subscriptionData.currentPeriodEnd = null;
    }

    // Track coupon usage
    if (session.metadata.couponCode) {
        subscriptionData.couponUsed = session.metadata.couponCode;

        // Increment coupon usage
        await db.collection('coupons').doc(session.metadata.couponCode).update({
            usedCount: admin.firestore.FieldValue.increment(1)
        });

        // Log usage
        await db.collection('couponUsage').add({
            userId,
            couponCode: session.metadata.couponCode,
            planPurchased: subscriptionData.plan,
            usedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    await db.collection('subscriptions').doc(userId).set(subscriptionData, { merge: true });
}

// Helper: Handle subscription changes
async function handleSubscriptionChange(subscription) {
    const customerId = subscription.customer;

    // Find user by customer ID
    const userQuery = await db.collection('subscriptions')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

    if (userQuery.empty) {
        console.error('User not found for customer:', customerId);
        return;
    }

    const userId = userQuery.docs[0].id;

    await db.collection('subscriptions').doc(userId).update({
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(
            new Date(subscription.current_period_end * 1000)
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

// Helper: Handle successful payment
async function handlePaymentSuccess(invoice) {
    console.log('Payment succeeded:', invoice.id);
    // Additional logic for payment success notifications
}

// Helper: Handle failed payment  
async function handlePaymentFailed(invoice) {
    console.log('Payment failed:', invoice.id);
    // TODO: Send email notification to user
}
// Export coupon management functions
exports.createCoupon = couponFunctions.createCoupon;
exports.updateCoupon = couponFunctions.updateCoupon;
exports.deactivateCoupon = couponFunctions.deactivateCoupon;
exports.grantFreeAccess = couponFunctions.grantFreeAccess;
exports.validateCoupon = couponFunctions.validateCoupon;
exports.getCouponStats = couponFunctions.getCouponStats;
// End of file
