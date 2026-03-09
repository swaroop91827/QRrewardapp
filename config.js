// ============================================================
//  src/firebase/config.js
//  REAL Firebase setup — apna config yahan daalo
//  Firebase Console > Project Settings > Your Apps > SDK setup
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ─── FIREBASE CONFIG ─────────────────────────────────────────
// app.json ke extra section se aata hai (environment safe)
const firebaseConfig = {
  apiKey:            Constants.expoConfig.extra.firebaseApiKey,
  authDomain:        Constants.expoConfig.extra.firebaseAuthDomain,
  projectId:         Constants.expoConfig.extra.firebaseProjectId,
  databaseURL:       Constants.expoConfig.extra.firebaseDatabaseUrl,
  storageBucket:     Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId:             Constants.expoConfig.extra.firebaseAppId,
};

// ─── INITIALIZE (ek baar hi hoga) ───────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth — AsyncStorage se persistence (user logged in rahe)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const firestore = getFirestore(app);
const database  = getDatabase(app);
const storage   = getStorage(app);

export { app, auth, firestore, database, storage };
export default app;
