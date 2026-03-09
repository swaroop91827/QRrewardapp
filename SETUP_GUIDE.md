# QR Reward App — Firebase Setup Guide 🔥

## Step 1: Firebase Project Banao

1. **console.firebase.google.com** pe jao
2. **"Add project"** click karo
3. Project name: `qr-reward-app`
4. Google Analytics: Enable karo
5. **"Create project"** click karo

---

## Step 2: Firebase Services Enable Karo

### A) Authentication
1. Left menu → **Authentication** → **Get started**
2. **Sign-in method** tab pe jao
3. Enable karo:
   - ✅ **Email/Password** → Enable → Save
   - ✅ **Google** → Enable → Support email dalo → Save
   - ✅ **Phone** → Enable → Save

### B) Firestore Database
1. Left menu → **Firestore Database** → **Create database**
2. **Production mode** select karo
3. Region: `asia-south1` (India ke liye)
4. **Enable** karo
5. **Rules** tab pe jao → `firestore.rules` file ka content paste karo → **Publish**

### C) Storage (Profile photos ke liye)
1. Left menu → **Storage** → **Get started**
2. Production mode → Region same rakho
3. Enable karo

---

## Step 3: Android App Add Karo

1. Firebase Console → **Project Overview** → Android icon click karo
2. **Package name**: `com.yourname.qrrewardapp`
   _(app.json ke android.package se match karna chahiye)_
3. **App nickname**: QR Reward App
4. **Register app** click karo
5. **google-services.json** download karo
6. Is file ko project ke **root folder** mein daalo

---

## Step 4: Web App Add Karo (Firebase SDK ke liye)

1. Firebase Console → Project Overview → **</>** (Web) icon click karo
2. App nickname: `qr-reward-web`
3. **Register app** click karo
4. Config copy karo — ye dikhega:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "qr-reward-app.firebaseapp.com",
  projectId: "qr-reward-app",
  storageBucket: "qr-reward-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 5: app.json Mein Config Daalo

`app.json` file mein `extra` section mein apni values bharo:

```json
"extra": {
  "firebaseApiKey": "AIzaSy...",
  "firebaseAuthDomain": "qr-reward-app.firebaseapp.com",
  "firebaseProjectId": "qr-reward-app",
  "firebaseDatabaseUrl": "https://qr-reward-app-default-rtdb.firebaseio.com",
  "firebaseStorageBucket": "qr-reward-app.appspot.com",
  "firebaseMessagingSenderId": "123456789",
  "firebaseAppId": "1:123456789:web:abc123",
  "googleWebClientId": "123456789-abc.apps.googleusercontent.com"
}
```

---

## Step 6: Google Login Setup

1. Firebase Console → Authentication → Sign-in method → **Google**
2. **Web client ID** copy karo
3. app.json mein `googleWebClientId` mein paste karo

**Android ke liye:**
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client IDs mein Android entry add karo:
   - Package name: `com.yourname.qrrewardapp`
   - SHA-1: `eas credentials` command se milega

---

## Step 7: Firestore Initial Data Setup

Firebase Console → Firestore → Collections banao:

### verifiedQR Collection:
Document ID = QR code value
```
QR-PRODUCT-001:
  verified: true
  type: "Product"
  points: 2
  scanCount: 0
  createdAt: [timestamp]

QR-DIWALI-2X:
  verified: true
  type: "Event"
  points: 5
  eventId: "diwali2024"
  scanCount: 0
```

### countryEvents Collection:
Document ID = Country code (IN, US, etc.)
```
IN:
  events: [
    {
      id: "diwali2024"
      name: "Diwali Bonanza 🪔"
      start: "2024-10-25"
      end: "2025-12-31"
      multiplier: 2
      active: true
      info: "Festival of Lights — Double points!"
    }
  ]
```

### rewardPool Collection:
Document ID = YYYY-MM format
```
2025-03:
  totalRevenue: 50000
  distributionPct: 0.30
  totalPoints: 0
```

---

## Step 8: EAS Build Karo

```bash
# EAS CLI install karo (pehli baar)
npm install -g eas-cli

# Login karo
eas login

# Project initialize karo
eas build:configure

# Build karo (Android APK)
eas build --platform android --profile preview

# Ya production AAB (Play Store ke liye)
eas build --platform android --profile production
```

---

## Step 9: Phone Auth Ke Liye reCAPTCHA

Phone OTP ke liye Firebase automatically reCAPTCHA use karta hai.
Expo mein `FirebaseRecaptchaVerifierModal` already add hai code mein.

Test karte waqt real phone number use karo.

**Test numbers add karo (development ke liye):**
Firebase Console → Authentication → Phone → **Test phone numbers**
```
+91 9999999999 → OTP: 123456
```

---

## Firestore Indexes

Kuch queries ke liye indexes banana padega.
Jab app run karo aur error aaye toh Firebase console mein link milega —
us link pe click karo aur index create ho jaayega automatically.

Manually create karna ho toh:
Firestore → **Indexes** → **Composite** → Add:
- Collection: `users`
- Fields: `flagged` (Asc), `points` (Desc)

---

## Security Checklist ✅

- [ ] `firestore.rules` deploy karo (Firebase Console → Rules → Publish)
- [ ] Google SHA-1 fingerprint add karo Android OAuth client mein
- [ ] `google-services.json` gitignore mein add karo
- [ ] app.json ka sensitive data environment variables mein move karo (production ke liye)
- [ ] Firebase App Check enable karo (bot protection ke liye)

---

## Admin Panel Ke Liye

Admin functions (QR add/remove, user flag) ke liye:
1. Firebase Admin SDK use karo (Node.js Cloud Functions)
2. Ya Firebase Console se directly Firestore data edit karo

Cloud Functions (optional but recommended):
```bash
firebase init functions
cd functions
npm install firebase-admin
# functions/index.js mein admin logic likho
firebase deploy --only functions
```

---

## Support

Koi error aaye toh error message ke saath Claude se poochho! 🚀
