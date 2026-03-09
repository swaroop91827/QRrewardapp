// ============================================================
//  src/firebase/dbService.js
//  REAL Firestore operations — QR, Points, Leaderboard, Events
// ============================================================

import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, orderBy, limit, where,
  increment, serverTimestamp, runTransaction,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from './config';

// ─── CONFIG VALUES ────────────────────────────────────────────
export const APP_CONFIG = {
  DAILY_SCAN_LIMIT:  50,
  DAILY_POINTS_CAP:  100,
  REWARD_TOP_PCT:    0.30,
  POOL_REVENUE_PCT:  0.30,
};

// ─── QR CODE OPERATIONS ──────────────────────────────────────

// QR code verify karo (REAL Firestore check)
export const verifyQRCode = async (code) => {
  const snap = await getDoc(doc(firestore, 'verifiedQR', code));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

// Admin: QR add karo
export const addQRCode = async (code, data) => {
  await setDoc(doc(firestore, 'verifiedQR', code), {
    ...data,
    createdAt: serverTimestamp(),
    scanCount: 0,
  });
};

// Admin: QR remove karo
export const removeQRCode = async (code) => {
  await deleteDoc(doc(firestore, 'verifiedQR', code));
};

// Sab QR codes lo
export const getAllQRCodes = async () => {
  const snap = await getDocs(collection(firestore, 'verifiedQR'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── SCAN PROCESSING ─────────────────────────────────────────
// Ye transaction use karta hai — race condition safe hai
export const processScan = async (uid, qrCode) => {
  return await runTransaction(firestore, async (transaction) => {
    const userRef    = doc(firestore, 'users', uid);
    const qrRef      = doc(firestore, 'verifiedQR', qrCode);
    const userSnap   = await transaction.get(userRef);
    const qrSnap     = await transaction.get(qrRef);

    if (!userSnap.exists()) throw new Error('User not found');
    if (!qrSnap.exists() || !qrSnap.data().verified)
      throw new Error('Invalid or unverified QR code');

    const user   = userSnap.data();
    const qr     = qrSnap.data();

    if (user.flagged) throw new Error('Account flagged. Contact support.');

    // Daily reset check (midnight pe reset hota hai)
    const today = new Date().toDateString();
    const lastScan = user.lastScanDate?.toDate
      ? user.lastScanDate.toDate().toDateString()
      : null;

    let dailyScans  = lastScan === today ? (user.dailyScans  || 0) : 0;
    let dailyPoints = lastScan === today ? (user.dailyPoints || 0) : 0;

    if (dailyScans >= APP_CONFIG.DAILY_SCAN_LIMIT)
      throw new Error(`Daily scan limit reached (${APP_CONFIG.DAILY_SCAN_LIMIT}/day)`);
    if (dailyPoints >= APP_CONFIG.DAILY_POINTS_CAP)
      throw new Error(`Daily points cap reached (${APP_CONFIG.DAILY_POINTS_CAP} pts/day)`);

    // Active event multiplier check
    const eventsSnap = await transaction.get(
      doc(firestore, 'countryEvents', user.country || 'IN')
    );
    let multiplier  = 1;
    let activeEvent = null;
    if (eventsSnap.exists()) {
      const todayStr = new Date().toISOString().split('T')[0];
      const events = eventsSnap.data().events || [];
      for (const ev of events) {
        if (ev.active && todayStr >= ev.start && todayStr <= ev.end) {
          multiplier  = ev.multiplier;
          activeEvent = ev;
          break;
        }
      }
    }

    const basePoints   = qr.points || 1;
    const rawEarned    = basePoints * multiplier;
    const pointsEarned = Math.min(rawEarned, APP_CONFIG.DAILY_POINTS_CAP - dailyPoints);

    // User update
    transaction.update(userRef, {
      points:       increment(pointsEarned),
      totalScans:   increment(1),
      dailyScans:   increment(1),
      dailyPoints:  increment(pointsEarned),
      lastScanDate: serverTimestamp(),
    });

    // QR scan count update
    transaction.update(qrRef, { scanCount: increment(1) });

    // Reward pool update
    const monthKey = new Date().toISOString().slice(0, 7);
    const poolRef  = doc(firestore, 'rewardPool', monthKey);
    transaction.set(poolRef, {
      totalPoints: increment(pointsEarned),
      updatedAt:   serverTimestamp(),
    }, { merge: true });

    return {
      success:      true,
      pointsEarned,
      multiplier,
      basePoints,
      qrType:       qr.type,
      activeEvent,
      newDailyScans: dailyScans + 1,
      newDailyPoints: dailyPoints + pointsEarned,
    };
  });
};

// ─── LEADERBOARD ─────────────────────────────────────────────
export const getLeaderboard = async (limitCount = 50) => {
  const q = query(
    collection(firestore, 'users'),
    where('flagged', '==', false),
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ ...d.data(), id: d.id, rank: i + 1 }));
};

// Real-time leaderboard (live updates)
export const subscribeLeaderboard = (callback, limitCount = 50) => {
  const q = query(
    collection(firestore, 'users'),
    where('flagged', '==', false),
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d, i) => ({ ...d.data(), id: d.id, rank: i + 1 }));
    callback(users);
  });
};

// ─── EVENTS ──────────────────────────────────────────────────
export const getCountryEvents = async (countryCode = 'IN') => {
  const snap = await getDoc(doc(firestore, 'countryEvents', countryCode));
  return snap.exists() ? snap.data().events || [] : [];
};

export const updateCountryEvents = async (countryCode, events) => {
  await setDoc(doc(firestore, 'countryEvents', countryCode), {
    events,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ─── REWARD POOL ─────────────────────────────────────────────
export const getRewardPool = async (monthKey) => {
  const snap = await getDoc(doc(firestore, 'rewardPool', monthKey));
  return snap.exists() ? { ...snap.data(), monthKey } : null;
};

export const getCurrentMonthPool = async () => {
  const monthKey = new Date().toISOString().slice(0, 7);
  return getRewardPool(monthKey);
};

export const setPoolRevenue = async (monthKey, totalRevenue) => {
  await setDoc(doc(firestore, 'rewardPool', monthKey), {
    totalRevenue,
    distributionPct: APP_CONFIG.POOL_REVENUE_PCT,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ─── ELIGIBILITY COMPUTE ─────────────────────────────────────
export const computeEligibility = async () => {
  const users  = await getLeaderboard(200);
  const topCnt = Math.ceil(users.length * APP_CONFIG.REWARD_TOP_PCT);
  const topUsers = users.slice(0, topCnt);
  const topPoints = topUsers.reduce((s, u) => s + (u.points || 0), 0);

  const pool = await getCurrentMonthPool();
  const poolAmt = pool
    ? (pool.totalRevenue || 0) * APP_CONFIG.POOL_REVENUE_PCT
    : 0;

  return topUsers.map(u => ({
    ...u,
    eligible:        true,
    estimatedReward: topPoints > 0
      ? ((u.points / topPoints) * poolAmt).toFixed(2)
      : '0.00',
  }));
};

// ─── USER MANAGEMENT (Admin) ──────────────────────────────────
export const flagUser = async (uid, flagged, reason = '') => {
  await updateDoc(doc(firestore, 'users', uid), {
    flagged,
    flagReason:  reason,
    flaggedAt:   flagged ? serverTimestamp() : null,
  });
};

export const getAllUsers = async () => {
  const snap = await getDocs(
    query(collection(firestore, 'users'), orderBy('points', 'desc'))
  );
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
};

// ─── REWARD CLAIM ────────────────────────────────────────────
export const submitRewardClaim = async (uid, claimData) => {
  const claimRef = doc(collection(firestore, 'rewardClaims'));
  await setDoc(claimRef, {
    uid,
    ...claimData,
    status:    'pending',
    createdAt: serverTimestamp(),
  });
  return claimRef.id;
};

export const getUserClaims = async (uid) => {
  const q = query(
    collection(firestore, 'rewardClaims'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
