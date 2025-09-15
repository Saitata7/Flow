# 🔐 Firebase Security Guide for Flow API

This guide covers secure handling of Firebase Admin SDK keys and authentication configuration.

## 🚨 Security Overview

Firebase Admin SDK keys provide **full administrative access** to your Firebase project. They must be handled with extreme care.

### ⚠️ Critical Security Rules

1. **NEVER commit Firebase Admin SDK JSON files to git**
2. **NEVER share keys in chat, email, or public repositories**
3. **Use environment variables in production**
4. **Rotate keys regularly**
5. **Use least privilege access**

## 🔧 Secure Setup Options

### Option 1: Environment Variables (Recommended)

#### Step 1: Extract Values from JSON File

Your Firebase Admin SDK JSON file contains these values:
```json
{
  "type": "service_account",
  "project_id": "quick-doodad-472200-k0",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@quick-doodad-472200-k0.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40quick-doodad-472200-k0.iam.gserviceaccount.com"
}
```

#### Step 2: Create Environment File

Create `services/api/.env.local` (development) or `services/api/.env.production` (production):

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=quick-doodad-472200-k0
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@quick-doodad-472200-k0.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40quick-doodad-472200-k0.iam.gserviceaccount.com
```

#### Step 3: Update API Configuration

The API is already configured to use these environment variables in `src/middleware/auth.js`:

```javascript
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}
```

### Option 2: JSON File (Development Only)

#### Step 1: Place JSON File Securely

```bash
# Place your Firebase Admin SDK JSON file in:
services/api/keys/quick-doodad-472200-k0-firebase-adminsdk-fbsvc-2b62aa9691.json
```

#### Step 2: Update Auth Middleware

Modify `src/middleware/auth.js` to use the JSON file:

```javascript
const serviceAccount = require('../keys/quick-doodad-472200-k0-firebase-adminsdk-fbsvc-2b62aa9691.json');

firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
```

## 🛡️ Production Security

### Google Cloud Secret Manager

For production deployment on GCP, use Secret Manager:

```bash
# Store secrets in Google Cloud Secret Manager
gcloud secrets create firebase-admin-key --data-file=firebase-adminsdk-key.json

# Access in Cloud Run
gcloud run services update flow-api \
  --set-env-vars="FIREBASE_PROJECT_ID=quick-doodad-472200-k0" \
  --set-secrets="FIREBASE_PRIVATE_KEY=firebase-admin-key:private_key"
```

### Environment Variables in Production

```bash
# Cloud Run environment variables
FIREBASE_PROJECT_ID=quick-doodad-472200-k0
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@quick-doodad-472200-k0.iam.gserviceaccount.com
```

## 🔄 Key Rotation Process

### Step 1: Generate New Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `quick-doodad-472200-k0`
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the new JSON file

### Step 2: Update Configuration

1. **Extract new values** from the JSON file
2. **Update environment variables** with new values
3. **Deploy updated configuration**
4. **Test authentication** with new key

### Step 3: Revoke Old Key

1. **Wait 24-48 hours** for deployment to complete
2. **Verify new key is working**
3. **Revoke old key** in Firebase Console
4. **Monitor for any issues**

## 🚨 Security Monitoring

### Key Usage Monitoring

```javascript
// Add logging to track key usage
const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Log successful authentication
    console.log(`✅ Firebase auth successful for user: ${decodedToken.uid}`);
    
    return {
      id: decodedToken.uid,
      email: decodedToken.email,
      // ... other fields
    };
  } catch (error) {
    // Log authentication failures
    console.error(`❌ Firebase auth failed: ${error.message}`);
    throw error;
  }
};
```

### Error Handling

```javascript
// Secure error handling
if (!firebaseApp) {
  console.error('❌ Firebase Admin SDK not initialized');
  throw new UnauthorizedError('Authentication service unavailable');
}
```

## 📋 Security Checklist

### ✅ Development Setup
- [ ] Firebase Admin SDK JSON file placed in `services/api/keys/`
- [ ] JSON file added to `.gitignore`
- [ ] Environment variables configured
- [ ] Auth middleware updated
- [ ] Test authentication works

### ✅ Production Setup
- [ ] Environment variables set in production
- [ ] Secrets stored in secure management system
- [ ] Key rotation process documented
- [ ] Monitoring and logging configured
- [ ] Security rules enabled

### ✅ Ongoing Security
- [ ] Keys rotated regularly (every 90 days)
- [ ] Access logs monitored
- [ ] Security updates applied
- [ ] Team trained on security practices
- [ ] Incident response plan ready

## 🔍 Troubleshooting

### Common Issues

1. **"Firebase Admin SDK not initialized"**
   - Check environment variables are set
   - Verify private key format (include `\n` characters)
   - Check Firebase project ID matches

2. **"Invalid private key"**
   - Ensure private key includes full PEM format
   - Check for missing `\n` characters
   - Verify key hasn't expired

3. **"Permission denied"**
   - Check service account has proper permissions
   - Verify project ID is correct
   - Ensure key hasn't been revoked

### Debug Commands

```bash
# Check environment variables
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Test Firebase connection
node -e "
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
console.log('✅ Firebase Admin SDK initialized successfully');
"
```

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Remember: Security is not optional, it's essential! 🔒**

## 🆘 Emergency Response

If you suspect a key has been compromised:

1. **Immediately revoke the key** in Firebase Console
2. **Generate a new key** and update configuration
3. **Deploy new configuration** to all environments
4. **Monitor logs** for suspicious activity
5. **Notify your team** of the incident
6. **Review access logs** for unauthorized usage
