# Firebase Cloud Functions Deployment - Permissions Fix

## The Problem
Firebase Functions are failing to deploy with: "Could not build the function due to a missing permission on the build service account"

## Root Cause
The Cloud Build service account (`281133643186@cloudbuild.gserviceaccount.com`) doesn't have all required permissions for building and deploying 2nd Gen Cloud Functions.

---

## Solution: Grant All Required Permissions

### Step 1: Open IAM Console
Go to: https://console.cloud.google.com/iam-admin/iam?project=mindwave-binaural-beats

### Step 2: Find the Service Account
Look for: `281133643186@cloudbuild.gserviceaccount.com`
- If you don't see it, click "Include Google-provided role grants"

### Step 3: Add ALL These Roles

Click "Edit principal" (pencil icon) on the service account, then add:

1. **Cloud Build Service Account**
   - Role ID: `roles/cloudbuild.builds.builder`
   
2. **Cloud Functions Developer**  
   - Role ID: `roles/cloudfunctions.developer`

3. **Service Account User**
   - Role ID: `roles/iam.serviceAccountUser`

4. **Artifact Registry Writer**
   - Role ID: `roles/artifactregistry.writer`

5. **Cloud Run Admin** ← **IMPORTANT** (2nd Gen functions use Cloud Run)
   - Role ID: `roles/run.admin`

6. **Eventarc Event Receiver**
   - Role ID: `roles/eventarc.eventReceiver`

7. **Service Usage Consumer**
   - Role ID: `roles/serviceusage.serviceUsageConsumer`

### Step 4: Save Changes
Click "SAVE" after adding all roles.

---

## Alternative: Use Console UI

If IAM is confusing, you can deploy directly from Firebase Console:

1. Go to: https://console.firebase.google.com/project/mindwave-binaural-beats/functions
2. Click "Get started" or "Create your first function"
3. Upload the ZIP manually

---

## Alternative 2: Use gcloud CLI

If you have gcloud installed:

\`\`\`bash
# Grant all permissions at once
gcloud projects add-iam-policy-binding mindwave-binaural-beats \\
  --member="serviceAccount:281133643186@cloudbuild.gserviceaccount.com" \\
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding mindwave-binaural-beats \\
  --member="serviceAccount:281133643186@cloudbuild.gserviceaccount.com" \\
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding mindwave-binaural-beats \\
  --member="serviceAccount:281133643186@cloudbuild.gserviceaccount.com" \\
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding mindwave-binaural-beats \\
  --member="serviceAccount:281133643186@cloudbuild.gserviceaccount.com" \\
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding mindwave-binaural-beats \\
  --member="serviceAccount:281133643186@cloudbuild.gserviceaccount.com" \\
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding mindwave-binaural-beats \\
  --member="serviceAccount:281133643186@cloudbuild.gserviceaccount.com" \\
  --role="roles/eventarc.eventReceiver"
\`\`\`

Then deploy:
\`\`\`bash
cd /Users/infinitealpha/Dev/BinauralBeats/binaural-beats
firebase deploy --only functions
\`\`\`

---

## Verification

After adding permissions, wait 1-2 minutes for them to propagate, then:

\`\`\`bash
firebase deploy --only functions
\`\`\`

You should see:
\`\`\`
✔  functions[createCheckoutSession]: Successful update operation
✔  functions[createPortalSession]: Successful update operation
✔  functions[stripeWebhook]: Successful update operation
... (6 more)
\`\`\`

---

## If Still Failing

1. Check build logs: https://console.cloud.google.com/cloud-build/builds?project=281133643186
2. Look for specific permission error
3. Grant that specific permission to `281133643186@cloudbuild.gserviceaccount.com`

---

## Success Indicators

✅ All 9 functions deployed
✅ No permission errors
✅ Functions visible in Firebase Console
✅ Webhook URL available for Stripe configuration
