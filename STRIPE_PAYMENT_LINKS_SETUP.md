# Setting Up Stripe Payment Links (NO Cloud Functions!)

This is a much simpler approach that uses Stripe's hosted checkout pages.

## Step 1: Create Payment Links in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   https://dashboard.stripe.com/test/payment-links

2. **Create Monthly Payment Link:**
   - Click "+ New"
   - Product: Select "MindWave Premium" 
   - Price: $9.99/month
   - **After payment:** Redirect to `https://yourdomain.com/?payment=success`
   - **Collect customer information:** Email
   - **Advanced options:**
     - Enable "Ask for billing address"
     - Enable "Promotional codes"
   - Click "Create link"
   - **COPY THE LINK** (looks like: `https://buy.stripe.com/test_xxxxx`)

3. **Create Yearly Payment Link:**
   - Repeat above with $79/year price
   - Copy the link

4. **Create Lifetime Payment Link:**
   - Repeat above with $199 one-time price
   - Copy the link

## Step 2: Update the Code

Edit `js/services/stripe-simple.js` and replace:

```javascript
export const PAYMENT_LINKS = {
  monthly: 'YOUR_MONTHLY_LINK_HERE',
  yearly: 'YOUR_YEARLY_LINK_HERE',
  lifetime: 'YOUR_LIFETIME_LINK_HERE'
};
```

## Step 3: Set Up Stripe Webhook (for subscription updates)

1. **Go to Stripe Webhooks:**
   https://dashboard.stripe.com/test/webhooks

2. **Add endpoint:**
   - Endpoint URL: We'll use a simple tool like **Zapier** or **Pipedream** (free tier)
   - Or manually update subscriptions in Firebase Console when payments come in
   
3. **For now (MVP):** You can manually grant premium access to paying customers:
   - User pays via Payment Link
   - You see payment in Stripe Dashboard
   - You manually add them to `subscriptions/{userId}` collection in Firebase

## Step 4: Enable Customer Portal (Important!)

**Customer Portal lets users manage their own subscriptions.**

1. **Go to Stripe Dashboard:**
   https://dashboard.stripe.com/test/settings/billing/portal

2. **Configure Portal:**
   - Enable "Allow customers to cancel subscriptions"
   - Enable "Allow customers to update payment methods"
   - Enable "Invoice history"
   - Set business information (name, logo, support email)

3. **Save Settings**

4. **Copy Portal Link:**
   - The portal link format is: `https://billing.stripe.com/p/login/test_xxxxx`
   - Update `CUSTOMER_PORTAL_URL` in `js/services/stripe-simple.js`

## Step 5: Test It

1. Update the payment links in the code
2. Click "Upgrade to Premium" in your app
3. You'll be redirected to Stripe's checkout page
4. Use test card: `4242 4242 4242 4242`
5. You'll return to your app with `?payment=success`

## Step 6: (Optional) Automate with Zapier

**Free automation without Cloud Functions:**

1. Create Zapier account (free)
2. **Trigger:** Stripe - New Payment
3. **Action:** Firebase - Update Document
   - Collection: `subscriptions`
   - Document ID: Use customer metadata (user ID)
   - Data: 
     ```json
     {
       "plan": "monthly",
       "status": "active",
       "expiresAt": "{{subscription_end_date}}"
     }
     ```

This way, when someone pays, Zapier automatically updates Firebase!

---

## Advantages Over Cloud Functions

✅ **No deployment issues** - No Cloud Build permissions needed  
✅ **Stripe handles everything** - PCI compliance, security, checkout UI  
✅ **Easier to test** - Just update links  
✅ **Lower cost** - No Cloud Functions usage  
✅ **Faster implementation** - 30 minutes vs. days of troubleshooting  

---

## Next Steps

1. Create the 3 Payment Links in Stripe
2. Copy the links into `stripe-simple.js`
3. Build the pricing UI
4. Test checkout flow
5. (Optional) Set up Zapier automation
