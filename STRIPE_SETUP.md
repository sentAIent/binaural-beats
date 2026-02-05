# Stripe Integration Setup Guide

## Prerequisites

1. **Stripe Account**
   - Sign up at https://stripe.com
   - Get API keys from Dashboard → Developers → API keys

2. **Firebase Project**
   - Ensure Firebase project is configured
   - Billing must be enabled for Cloud Functions

---

## Setup Steps

### 1. Configure Stripe in Firebase

```bash
cd functions
npm install

# Set Stripe configuration
firebase functions:config:set \
  stripe.secret_key="sk_test_YOUR_SECRET_KEY" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET" \
  stripe.price_monthly="price_YOUR_MONTHLY_ID" \
  stripe.price_yearly="price_YOUR_YEARLY_ID" \
  stripe.price_lifetime="price_YOUR_LIFETIME_ID"
```

### 2. Create Products in Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Create "MindWave Premium" product
3. Add three prices:
   - **Monthly**: $9.99/month recurring
   - **Yearly**: $79/year recurring  
   - **Lifetime**: $199 one-time payment
4. Copy price IDs (start with `price_`)

### 3. Update Frontend Config

Edit `js/services/stripe.js`:
```javascript
export const STRIPE_CONFIG = {
  publishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY', // From Stripe dashboard
  prices: {
    monthly: { id: 'price_YOUR_MONTHLY_ID', amount: 9.99 },
    yearly: { id: 'price_YOUR_YEARLY_ID', amount: 79 },
    lifetime: { id: 'price_YOUR_LIFETIME_ID', amount: 199 }
  }
};
```

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

### 5. Set up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret → Update Firebase config

### 6. Set Admin Users

In Firebase Console → Authentication → Users:
1. Click on admin user
2. Set custom claims:
```json
{
  "admin": true
}
```

---

## Testing

### Test Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3DS**: `4000 0027 6000 3184`

Use any future expiry date and any CVC.

### Test Coupons

1. Create test coupon in admin panel:
   - Code: `TEST10`
   - Type: Percentage
   - Value: 10
   - Max Uses: 100

2. Go to pricing page
3. Enter coupon code
4. Verify discount appears
5. Complete checkout with test card

---

## Go Live Checklist

- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint to production
- [ ] Test full checkout flow in production
- [ ] Set up Stripe Radar for fraud detection
- [ ] Configure email receipts in Stripe
- [ ] Set up failed payment retry logic
- [ ] Enable Stripe Tax if needed
- [ ] Add terms of service link to checkout
