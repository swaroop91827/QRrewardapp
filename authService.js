// ============================================================
//  src/firebase/authService.js
//  REAL Authentication — Google, Phone OTP, Email/Password
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  PhoneAuthProvider,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  RecaptchaVerifier,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { auth, firestore } from './config';

// ─── GOOGLE SIGNIN SETUP ─────────────────────────────────────
GoogleSignin.configure({
  webClientId: Constants.expoConfig.extra.googleWebClientId,
  offlineAccess: true,
  scopes: ['email', 'profile'],
});

// ─── CREATE USER DOCUMENT IN FIRESTORE ───────────────────────
const createUserDocument = async (user, extraData = {}) => {
  const userRef = doc(firestore, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid:           user.uid,
      name:          user.displayName || extraData.name || 'User',
      email:         user.email || '',
      phone:         user.phoneNumber || '',
      photoURL:      user.photoURL || '',
      points:        0,
      totalScans:    0,
      dailyScans:    0,
      dailyPoints:   0,
      country:       'IN',
      flagged:       false,
      eligible:      false,
      referrals:     0,
      bankDetails:   null,   // Bank transfer ke liye
      giftCardEmail: user.email || '',  // Gift card ke liye
      createdAt:     serverTimestamp(),
      lastScanDate:  null,
      loginMethod:   extraData.loginMethod || 'email',
    });
  }
  return userRef;
};

// ─── 1. EMAIL + PASSWORD LOGIN ───────────────────────────────
export const registerWithEmail = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await createUserDocument(cred.user, { name, loginMethod: 'email' });
  return cred.user;
};

export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

// ─── 2. GOOGLE LOGIN ─────────────────────────────────────────
export const loginWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const { idToken } = await GoogleSignin.signIn();
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  await createUserDocument(cred.user, { loginMethod: 'google' });
  return cred.user;
};

// ─── 3. PHONE OTP LOGIN ──────────────────────────────────────
// Step 1: OTP bhejo
export const sendPhoneOTP = async (phoneNumber, recaptchaVerifier) => {
  // phoneNumber format: +91XXXXXXXXXX
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(
    phoneNumber,
    recaptchaVerifier
  );
  return verificationId;
};

// Step 2: OTP verify karo
export const verifyPhoneOTP = async (verificationId, otpCode) => {
  const credential = PhoneAuthProvider.credential(verificationId, otpCode);
  const cred = await signInWithCredential(auth, credential);
  await createUserDocument(cred.user, { loginMethod: 'phone' });
  return cred.user;
};

// ─── LOGOUT ──────────────────────────────────────────────────
export const logout = async () => {
  try { await GoogleSignin.revokeAccess(); } catch (_) {}
  await signOut(auth);
};

// ─── AUTH STATE LISTENER ─────────────────────────────────────
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ─── GET CURRENT USER DATA FROM FIRESTORE ────────────────────
export const getUserData = async (uid) => {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
};

// ─── UPDATE USER PROFILE ─────────────────────────────────────
export const updateUserProfile = async (uid, updates) => {
  await updateDoc(doc(firestore, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
