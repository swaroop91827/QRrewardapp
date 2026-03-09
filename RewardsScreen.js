// ============================================================
//  src/screens/RewardsScreen.js
//  REAL Reward Claims — Amazon Gift Card + Bank Transfer
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Animated, RefreshControl, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import {
  computeEligibility, getCurrentMonthPool,
  submitRewardClaim, getUserClaims,
} from '../firebase/dbService';
import { updateUserProfile } from '../firebase/authService';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';

// ─── STATUS BADGE ────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    pending:   { color: Colors.gold,   label: '⏳ Pending' },
    approved:  { color: Colors.green,  label: '✅ Approved' },
    rejected:  { color: Colors.red,    label: '❌ Rejected' },
    sent:      { color: Colors.blue,   label: '📤 Sent' },
  }[status] || { color: Colors.textMuted, label: status };
  return (
    <View style={{ backgroundColor: cfg.color + '20', borderRadius: Radius.full,
      paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: cfg.color + '40' }}>
      <Text style={{ fontSize: FontSizes.xs, color: cfg.color, fontWeight: '700' }}>{cfg.label}</Text>
    </View>
  );
}

// ─── GIFT CARD CLAIM MODAL ───────────────────────────────────
function GiftCardModal({ visible, onClose, onSubmit, loading, estimatedReward, defaultEmail }) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [amount, setAmount] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎁 Amazon Gift Card Claim</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.estimateBox}>
            <Text style={styles.estimateLabel}>Estimated Reward</Text>
            <Text style={styles.estimateAmt}>₹{estimatedReward}</Text>
            <Text style={styles.estimateNote}>
              Final amount admin approve karne ke baad milega
            </Text>
          </View>

          <Text style={styles.fieldLabel}>Amazon Account Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="amazon@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.modalInput}
          />

          <Text style={styles.fieldLabel}>Claimed Amount (₹)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={`Max ₹${estimatedReward}`}
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            style={styles.modalInput}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📌 Gift card 2-3 business days mein Amazon account pe credit hoga.
              {'\n'}📌 Minimum claim amount: ₹100
              {'\n'}📌 Month end ke baad claim kar sakte ho
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={() => {
              if (!email) { Alert.alert('Email daalo'); return; }
              if (!amount || Number(amount) < 100) {
                Alert.alert('Minimum ₹100 claim karo'); return;
              }
              onSubmit({ type: 'gift_card', email, amount: Number(amount) });
            }}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Submit ho raha hai...' : 'Claim Submit Karo'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── BANK TRANSFER MODAL ─────────────────────────────────────
function BankModal({ visible, onClose, onSubmit, loading, estimatedReward }) {
  const [form, setForm] = useState({
    accountName:   '',
    accountNumber: '',
    ifscCode:      '',
    bankName:      '',
    amount:        '',
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏦 Bank Transfer Claim</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>Estimated Reward</Text>
              <Text style={styles.estimateAmt}>₹{estimatedReward}</Text>
            </View>

            {[
              ['accountName',   'Account Holder Ka Naam',  'default',  'Pura naam jaise bank mein hai'],
              ['accountNumber', 'Account Number',           'numeric',  'Bank account number'],
              ['ifscCode',      'IFSC Code',                'default',  'e.g. SBIN0001234'],
              ['bankName',      'Bank Ka Naam',             'default',  'e.g. State Bank of India'],
              ['amount',        'Claimed Amount (₹)',       'numeric',  `Max ₹${estimatedReward}`],
            ].map(([key, label, kbType, placeholder]) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  value={form[key]}
                  onChangeText={set(key)}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={kbType}
                  autoCapitalize={key === 'ifscCode' ? 'characters' : 'words'}
                  autoCorrect={false}
                  style={styles.modalInput}
                />
              </View>
            ))}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📌 Transfer 5-7 business days mein hoga.
                {'\n'}📌 Minimum claim: ₹200
                {'\n'}📌 TDS deduction applicable hai
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: Colors.blue }, loading && { opacity: 0.6 }]}
              onPress={() => {
                if (!form.accountName || !form.accountNumber || !form.ifscCode || !form.bankName) {
                  Alert.alert('Saari details bharo'); return;
                }
                if (Number(form.amount) < 200) {
                  Alert.alert('Minimum ₹200 claim karo'); return;
                }
                onSubmit({ type: 'bank_transfer', ...form, amount: Number(form.amount) });
              }}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Submit ho raha hai...' : 'Bank Claim Submit Karo'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── REWARDS SCREEN ──────────────────────────────────────────
export default function RewardsScreen() {
  const { user, userData, refreshUserData } = useAuth();

  const [pool,          setPool]          = useState(null);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [myRecord,      setMyRecord]      = useState(null);
  const [claims,        setClaims]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [claimLoading,  setClaimLoading]  = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [p, eligible, userClaims] = await Promise.all([
        getCurrentMonthPool(),
        computeEligibility(),
        getUserClaims(user.uid),
      ]);
      setPool(p);
      setEligibleUsers(eligible);
      setClaims(userClaims);
      const me = eligible.find(e => e.id === user.uid);
      setMyRecord(me || null);
    } catch (e) {
      showToast('Data load nahi hua', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const handleClaim = async (claimData) => {
    setClaimLoading(true);
    try {
      const claimId = await submitRewardClaim(user.uid, {
        ...claimData,
        userName:        userData?.name || '',
        userEmail:       userData?.email || '',
        userPoints:      userData?.points || 0,
        estimatedReward: myRecord?.estimatedReward || '0',
        monthKey:        new Date().toISOString().slice(0, 7),
      });
      setShowGiftModal(false);
      setShowBankModal(false);
      showToast('✅ Claim submit ho gaya! Admin review karega.', 'success');
      await loadData();
    } catch (e) {
      showToast(e.message || 'Claim submit nahi hua', 'error');
    } finally {
      setClaimLoading(false);
    }
  };

  const poolAmt = pool ? (pool.totalRevenue || 0) * 0.30 : 0;
  const isEligible = !!myRecord;
  const hasPendingClaim = claims.some(c => c.status === 'pending');

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor: Colors.bg, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ color: Colors.textSub }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { borderColor: toast.type === 'success' ? Colors.green : Colors.red }]}>
          <Text style={{ color: toast.type === 'success' ? Colors.green : Colors.red, fontWeight: '600', fontSize: 13 }}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Modals */}
      <GiftCardModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSubmit={handleClaim}
        loading={claimLoading}
        estimatedReward={myRecord?.estimatedReward || '0'}
        defaultEmail={userData?.email || userData?.giftCardEmail || ''}
      />
      <BankModal
        visible={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSubmit={handleClaim}
        loading={claimLoading}
        estimatedReward={myRecord?.estimatedReward || '0'}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <Text style={styles.title}>Reward Pool</Text>
        <Text style={styles.subtitle}>Monthly Distribution</Text>

        {/* Pool Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroMonth}>
            {new Date().toLocaleString('hi-IN', { month: 'long', year: 'numeric' })} Pool
          </Text>
          <Text style={styles.heroAmount}>
            ₹{poolAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.heroSub}>Ad Revenue ka 30%</Text>
          <View style={styles.heroStatsRow}>
            {[
              ['👥', 'Eligible', `${eligibleUsers.length} users`],
              ['⭐', 'Tumhare Pts', `${(userData?.points || 0).toLocaleString()}`],
              ['📊', 'Rank', myRecord ? `#${eligibleUsers.findIndex(e=>e.id===user.uid)+1}` : 'N/A'],
            ].map(([icon, label, val]) => (
              <View key={label} style={styles.heroStat}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
                <Text style={styles.heroStatVal}>{val}</Text>
                <Text style={styles.heroStatLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Eligibility Card */}
        <View style={[styles.eligCard, isEligible ? styles.eligCardYes : styles.eligCardNo]}>
          <View style={styles.eligTop}>
            <Text style={{ fontSize: 36 }}>{isEligible ? '🎁' : '⏳'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eligTitle, { color: isEligible ? Colors.green : Colors.textSub }]}>
                {isEligible ? 'Tum Eligible Ho!' : 'Abhi Eligible Nahi'}
              </Text>
              <Text style={styles.eligSub}>
                {isEligible
                  ? `Estimated reward: ₹${myRecord?.estimatedReward}`
                  : 'Top 30% mein aao reward claim karne ke liye'}
              </Text>
            </View>
          </View>

          {isEligible && !hasPendingClaim && (
            <View style={styles.claimBtns}>
              <TouchableOpacity style={styles.giftBtn} onPress={() => setShowGiftModal(true)}>
                <Text style={{ fontSize: 18 }}>🎁</Text>
                <Text style={styles.giftBtnText}>Amazon{'\n'}Gift Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bankBtn} onPress={() => setShowBankModal(true)}>
                <Text style={{ fontSize: 18 }}>🏦</Text>
                <Text style={styles.bankBtnText}>Bank{'\n'}Transfer</Text>
              </TouchableOpacity>
            </View>
          )}

          {hasPendingClaim && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingText}>
                ⏳ Tumhara claim pending hai. Admin review kar raha hai.
              </Text>
            </View>
          )}
        </View>

        {/* My Claims History */}
        {claims.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Meri Claims History</Text>
            {claims.map(c => (
              <View key={c.id} style={styles.claimRow}>
                <View style={styles.claimLeft}>
                  <Text style={styles.claimType}>
                    {c.type === 'gift_card' ? '🎁 Gift Card' : '🏦 Bank Transfer'}
                  </Text>
                  <Text style={styles.claimDate}>
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('en-IN') : 'Recently'}
                  </Text>
                </View>
                <View style={styles.claimRight}>
                  <Text style={styles.claimAmt}>₹{c.amount}</Text>
                  <StatusBadge status={c.status} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* Eligible Users List */}
        <Text style={styles.sectionTitle}>Top 30% Users ({eligibleUsers.length})</Text>
        {eligibleUsers.slice(0, 10).map((u, i) => (
          <View key={u.id} style={[styles.userRow, u.id === user.uid && styles.userRowMe]}>
            <Text style={[styles.userRank, i < 3 && { color: Colors.gold }]}>#{i + 1}</Text>
            <View style={styles.userAvatar}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                {u.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.userName, u.id === user.uid && { color: Colors.accent }]}>
                {u.name} {u.id === user.uid ? '← Tum' : ''}
              </Text>
              <Text style={styles.userPts}>{u.points.toLocaleString()} pts</Text>
            </View>
            <Text style={styles.userReward}>₹{u.estimatedReward}</Text>
          </View>
        ))}

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>Reward Kaise Milta Hai?</Text>
          {[
            '30% ad revenue monthly pool mein jata hai',
            'Top 30% users points ke hisaab se eligible hote hain',
            'Month end pe claim karo — Gift Card ya Bank Transfer',
            'Admin 2-7 days mein process karta hai',
          ].map((t, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howNum}><Text style={{ color: Colors.accent, fontWeight: '900', fontSize: 11 }}>{i+1}</Text></View>
              <Text style={styles.howText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg },

  toast: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 999,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 12,
    borderWidth: 1, alignItems: 'center',
  },

  title: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.text, marginBottom: 2 },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xl },

  heroCard: {
    backgroundColor: '#18120A', borderRadius: Radius['2xl'], padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.borderGold, marginBottom: Spacing.lg, ...Shadow.gold,
  },
  heroMonth: { fontSize: FontSizes.xs, color: Colors.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  heroAmount: { fontSize: FontSizes['5xl'], fontWeight: '900', color: Colors.gold, marginBottom: 4 },
  heroSub: { fontSize: FontSizes.sm, color: Colors.textSub, marginBottom: Spacing.lg },
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderGold },
  heroStat: { alignItems: 'center', gap: 3 },
  heroStatVal: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.text },
  heroStatLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  eligCard: { borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1.5, marginBottom: Spacing.xl },
  eligCardYes: { backgroundColor: Colors.greenSoft, borderColor: Colors.green + '55' },
  eligCardNo: { backgroundColor: Colors.card, borderColor: Colors.border },
  eligTop: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: Spacing.lg },
  eligTitle: { fontSize: FontSizes.lg, fontWeight: '800' },
  eligSub: { fontSize: FontSizes.sm, color: Colors.textSub, marginTop: 4, lineHeight: 18 },

  claimBtns: { flexDirection: 'row', gap: 12 },
  giftBtn: {
    flex: 1, backgroundColor: Colors.green, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 4,
    ...Shadow.card,
  },
  giftBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSizes.sm, textAlign: 'center' },
  bankBtn: {
    flex: 1, backgroundColor: Colors.blue, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 4,
    ...Shadow.card,
  },
  bankBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSizes.sm, textAlign: 'center' },

  pendingBox: {
    backgroundColor: Colors.goldSoft, borderRadius: Radius.md, padding: 12,
    borderWidth: 1, borderColor: Colors.borderGold,
  },
  pendingText: { fontSize: FontSizes.sm, color: Colors.gold, lineHeight: 18 },

  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  claimRow: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  claimLeft: {},
  claimType: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  claimDate: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 3 },
  claimRight: { alignItems: 'flex-end', gap: 6 },
  claimAmt: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.gold },

  userRow: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  userRowMe: { borderColor: Colors.borderAccent, backgroundColor: Colors.accentSoft + '30' },
  userRank: { width: 30, fontSize: FontSizes.sm, fontWeight: '800', color: Colors.textSub },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  userPts: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  userReward: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.gold },

  howCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.lg,
  },
  howTitle: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  howRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  howNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSub, lineHeight: 18 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.text },

  estimateBox: {
    backgroundColor: Colors.goldSoft, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.borderGold, marginBottom: Spacing.xl, alignItems: 'center',
  },
  estimateLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  estimateAmt: { fontSize: FontSizes['3xl'], fontWeight: '900', color: Colors.gold },
  estimateNote: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  fieldLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  modalInput: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.text, fontSize: FontSizes.md,
  },

  infoBox: {
    backgroundColor: Colors.blueSoft, borderRadius: Radius.md, padding: 12,
    borderWidth: 1, borderColor: Colors.blue + '30', marginTop: Spacing.lg,
  },
  infoText: { fontSize: FontSizes.xs, color: Colors.textSub, lineHeight: 18 },

  submitBtn: {
    backgroundColor: Colors.green, borderRadius: Radius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing.xl,
    ...Shadow.card,
  },
  submitBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '800' },
});
