// ============================================================
//  src/screens/LoginScreen.js
//  REAL Auth — Google Login, Phone OTP, Email/Password
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { Ionicons } from '@expo/vector-icons';

import {
  registerWithEmail, loginWithEmail,
  loginWithGoogle, sendPhoneOTP, verifyPhoneOTP,
  resetPassword,
} from '../firebase/authService';
import { app } from '../firebase/config';
import { Colors, Radius, Spacing, FontSizes, Shadow } from '../utils/theme';

// ─── TAB TYPES ───────────────────────────────────────────────
const TABS = ['Email', 'Phone', 'Google'];

// ─── INPUT FIELD ─────────────────────────────────────────────
function Field({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, style }) {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.field, style]}>
      <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.fieldIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry && !show}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.fieldInput}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShow(s => !s)}>
          <Ionicons name={show ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EMAIL PANEL ─────────────────────────────────────────────
function EmailPanel({ onSuccess, showToast }) {
  const [mode,     setMode]     = useState('login'); // login | register | reset
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!email || !password) { showToast('Email aur password dalo', 'error'); return; }
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name) { showToast('Apna naam dalo', 'error'); setLoading(false); return; }
        await registerWithEmail(name, email, password);
        showToast('Account ban gaya! Welcome 🎉', 'success');
      } else if (mode === 'reset') {
        await resetPassword(email);
        showToast('Password reset email bhej diya!', 'success');
        setMode('login');
        setLoading(false);
        return;
      } else {
        await loginWithEmail(email, password);
        showToast('Login successful!', 'success');
      }
      onSuccess();
    } catch (e) {
      const msg = {
        'auth/user-not-found':    'Email registered nahi hai.',
        'auth/wrong-password':    'Password galat hai.',
        'auth/email-already-in-use': 'Ye email already registered hai.',
        'auth/weak-password':     'Password kam se kam 6 characters ka hona chahiye.',
        'auth/invalid-email':     'Email format sahi nahi hai.',
        'auth/too-many-requests': 'Bahut zyada attempts. Thodi der baad try karo.',
      }[e.code] || e.message;
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {mode === 'register' && (
        <Field icon="person-outline" placeholder="Apna poora naam" value={name} onChangeText={setName} />
      )}
      <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
      {mode !== 'reset' && (
        <Field icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>
              {mode === 'login' ? 'Login Karo' : mode === 'register' ? 'Account Banao' : 'Reset Link Bhejo'}
            </Text>
        }
      </TouchableOpacity>

      <View style={styles.modeRow}>
        {mode === 'login' && <>
          <TouchableOpacity onPress={() => setMode('register')}>
            <Text style={styles.modeLink}>Naya account banao</Text>
          </TouchableOpacity>
          <Text style={styles.modeSep}>·</Text>
          <TouchableOpacity onPress={() => setMode('reset')}>
            <Text style={styles.modeLink}>Password bhool gaye?</Text>
          </TouchableOpacity>
        </>}
        {mode !== 'login' && (
          <TouchableOpacity onPress={() => setMode('login')}>
            <Text style={styles.modeLink}>← Wapas Login pe</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── PHONE OTP PANEL ─────────────────────────────────────────
function PhonePanel({ onSuccess, showToast }) {
  const [phone,          setPhone]          = useState('');
  const [otp,            setOtp]            = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [loading,        setLoading]        = useState(false);
  const recaptchaVerifier = useRef(null);

  const sendOTP = async () => {
    const num = phone.startsWith('+') ? phone : `+91${phone}`;
    if (num.length < 12) { showToast('Sahi phone number dalo', 'error'); return; }
    setLoading(true);
    try {
      const vid = await sendPhoneOTP(num, recaptchaVerifier.current);
      setVerificationId(vid);
      showToast('OTP bhej diya! Check karo.', 'success');
    } catch (e) {
      showToast(e.message || 'OTP bhejne mein error aayi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) { showToast('6 digit OTP daalo', 'error'); return; }
    setLoading(true);
    try {
      await verifyPhoneOTP(verificationId, otp);
      showToast('Phone verified! Welcome 🎉', 'success');
      onSuccess();
    } catch (e) {
      showToast('OTP galat hai ya expired', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Firebase Recaptcha — invisible to user */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification
      />

      {!verificationId ? (
        <>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10 digit number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.phoneInput}
            />
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={sendOTP} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>OTP Bhejo</Text>
            }
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.otpSent}>
            OTP {phone} pe bheja gaya hai ✓
          </Text>
          <View style={styles.otpRow}>
            {[0,1,2,3,4,5].map(i => (
              <TextInput
                key={i}
                maxLength={1}
                keyboardType="numeric"
                style={[styles.otpBox, otp[i] && styles.otpBoxFilled]}
                value={otp[i] || ''}
                onChangeText={(v) => {
                  const arr = otp.split('');
                  arr[i] = v;
                  setOtp(arr.join(''));
                }}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={verifyOTP} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Verify Karo</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVerificationId(null)} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={styles.modeLink}>← Number badlo</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── GOOGLE PANEL ────────────────────────────────────────────
function GooglePanel({ onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('Google login successful! 🎉', 'success');
      onSuccess();
    } catch (e) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        showToast(e.message || 'Google login mein error', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.googlePanel}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🔐</Text>
      <Text style={styles.googleTitle}>Google Account Se Login Karo</Text>
      <Text style={styles.googleSub}>
        Apna Google/Gmail account use karo. Safe aur fast hai!
      </Text>
      <TouchableOpacity
        style={styles.googleBtn}
        onPress={handleGoogle}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={Colors.text} />
          : <>
              <Text style={{ fontSize: 20, marginRight: 10 }}>G</Text>
              <Text style={styles.googleBtnText}>Google Se Login Karo</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Email');
  const [toast, setToast]         = useState({ visible: false, message: '', type: 'info' });
  const toastAnim = useRef(new Animated.Value(-80)).current;

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -80, duration: 300, useNativeDriver: true }).start();
    }, 3000);
  };

  const onSuccess = () => {
    // Navigation automatically ho jaayegi AuthContext ke through
  };

  const toastColors = { success: Colors.green, error: Colors.red, info: Colors.accent };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Toast */}
        <Animated.View style={[styles.toast, {
          transform: [{ translateY: toastAnim }],
          borderColor: toastColors[toast.type] || Colors.accent,
        }]}>
          <Text style={[styles.toastText, { color: toastColors[toast.type] }]}>
            {toast.message}
          </Text>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Logo / Title */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={{ fontSize: 36 }}>◎</Text>
            </View>
            <Text style={styles.appName}>QR Reward App</Text>
            <Text style={styles.appTagline}>Scan karo · Points kamao · Rewards pao</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabs}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'Google' ? 'G  Google' : tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Panel */}
            <View style={styles.panel}>
              {activeTab === 'Email' && <EmailPanel onSuccess={onSuccess} showToast={showToast} />}
              {activeTab === 'Phone' && <PhonePanel onSuccess={onSuccess} showToast={showToast} />}
              {activeTab === 'Google' && <GooglePanel onSuccess={onSuccess} showToast={showToast} />}
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            Login karke aap hamare Terms of Service aur Privacy Policy se agree karte hain.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 40 },

  toast: {
    position: 'absolute', top: 0, left: 16, right: 16, zIndex: 999,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, ...Shadow.card,
  },
  toastText: { fontSize: FontSizes.sm, fontWeight: '600', textAlign: 'center' },

  logoSection: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 2, borderColor: Colors.borderAccent,
  },
  appName: { fontSize: FontSizes['3xl'], fontWeight: '900', color: Colors.text, marginBottom: 6 },
  appTagline: { fontSize: FontSizes.sm, color: Colors.textSub, letterSpacing: 0.5 },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    ...Shadow.card,
  },

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.accent, fontWeight: '700' },

  panel: { padding: Spacing.xl },

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, color: Colors.text, fontSize: FontSizes.md },

  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
    ...Shadow.accent,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '800', letterSpacing: 0.5 },

  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  modeLink: { fontSize: FontSizes.sm, color: Colors.accent, fontWeight: '600' },
  modeSep: { fontSize: FontSizes.sm, color: Colors.textMuted },

  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  countryCode: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center',
  },
  countryCodeText: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '600' },
  phoneInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.text, fontSize: FontSizes.md,
  },

  otpSent: { fontSize: FontSizes.sm, color: Colors.green, textAlign: 'center', marginBottom: 16 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  otpBox: {
    width: 44, height: 54, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    textAlign: 'center', color: Colors.text, fontSize: FontSizes.xl, fontWeight: '700',
  },
  otpBoxFilled: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },

  googlePanel: { alignItems: 'center', paddingVertical: 10 },
  googleTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  googleSub: { fontSize: FontSizes.sm, color: Colors.textSub, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: 28, width: '100%',
    ...Shadow.card,
  },
  googleBtnText: { fontSize: FontSizes.md, fontWeight: '800', color: '#333' },

  terms: {
    fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center',
    marginTop: 24, lineHeight: 16, paddingHorizontal: 20,
  },
});
