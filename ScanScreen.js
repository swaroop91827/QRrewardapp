// ============================================================
//  src/screens/ScanScreen.js
//  REAL QR Scanner — expo-camera + expo-barcode-scanner
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ScrollView, Vibration, Alert, Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { processScan } from '../firebase/dbService';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';

// Demo test codes (real app mein ye nahi hoga — admin se QR add hoga)
const DEMO_CODES = [
  { code: 'QR-DIWALI-2X',   label: '🪔 Event QR',   color: Colors.gold },
  { code: 'QR-PRODUCT-001', label: '📦 Product QR', color: Colors.blue },
  { code: 'QR-COUPON-XYZ',  label: '🎟 Coupon QR',  color: Colors.purple },
];

// ─── RESULT CARD ─────────────────────────────────────────────
function ResultCard({ result, onDismiss }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (result) Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  }, [result]);
  if (!result) return null;
  const ok = result.success;
  return (
    <Animated.View style={[styles.resultCard, {
      borderColor: ok ? Colors.green : Colors.red,
      backgroundColor: ok ? Colors.greenSoft : Colors.redSoft,
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [40,0] }) }],
    }]}>
      <View style={styles.resultHeader}>
        <View style={[styles.resultIcon, { backgroundColor: (ok ? Colors.green : Colors.red) + '30' }]}>
          <Text style={{ fontSize: 20, color: ok ? Colors.green : Colors.red, fontWeight: '800' }}>
            {ok ? '✓' : '✗'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.resultTitle, { color: ok ? Colors.green : Colors.red }]}>
            {ok ? 'QR Verified!' : 'Scan Failed'}
          </Text>
          {!ok && <Text style={styles.resultReason}>{result.reason}</Text>}
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      {ok && (
        <>
          <View style={styles.resultGrid}>
            {[
              ['Type',       result.qrType],
              ['Base Pts',   `${result.basePoints}`],
              ['Multiplier', `${result.multiplier}×`],
              ['Daily Scans',`${result.newDailyScans}/50`],
            ].map(([k, v]) => (
              <View key={k} style={styles.resultCell}>
                <Text style={styles.resultKey}>{k}</Text>
                <Text style={styles.resultVal}>{v}</Text>
              </View>
            ))}
          </View>
          {result.activeEvent && (
            <View style={styles.eventTag}>
              <Text style={styles.eventTagText}>
                🎉 {result.activeEvent.name} — {result.multiplier}× Bonus!
              </Text>
            </View>
          )}
          <Text style={styles.resultPoints}>+{result.pointsEarned} POINTS</Text>
        </>
      )}
    </Animated.View>
  );
}

// ─── SCAN SCREEN ─────────────────────────────────────────────
export default function ScanScreen({ navigation }) {
  const { user, userData, refreshUserData } = useAuth();

  const [hasPermission, setHasPermission] = useState(null);
  const [cameraActive,  setCameraActive]  = useState(false);
  const [scanned,       setScanned]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [flashOn,       setFlashOn]       = useState(false);
  const [toast,         setToast]         = useState(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cameraActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [cameraActive]);

  const requestCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setCameraActive(true);
    } else {
      Alert.alert(
        'Camera Permission',
        'QR scan ke liye camera access chahiye. Settings mein jaake allow karo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setCameraActive(false);
    await doScan(data);
  };

  const doScan = async (code) => {
    if (!user) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await processScan(user.uid, code);
      setResult({ ...res, success: true });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshUserData();
    } catch (e) {
      setResult({ success: false, reason: e.message });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setResult(null);
  };

  const dailyProgress = ((userData?.dailyScans || 0) / 50);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>QR Scanner</Text>
            <Text style={styles.subtitle}>Verified QR scan karo, points kamao</Text>
          </View>
          <View style={styles.statsChip}>
            <Text style={styles.statsChipText}>
              {userData?.dailyScans || 0}/50 Today
            </Text>
          </View>
        </View>

        {/* Daily Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${Math.min(dailyProgress * 100, 100)}%`,
            backgroundColor: dailyProgress > 0.8 ? Colors.red : Colors.accent,
          }]} />
        </View>

        {/* Camera Viewport */}
        <View style={styles.cameraWrap}>
          {cameraActive ? (
            <Camera
              style={styles.camera}
              type={CameraType.back}
              flashMode={flashOn ? 'torch' : 'off'}
              barCodeScannerSettings={{
                barCodeTypes: [
                  BarCodeScanner.Constants.BarCodeType.qr,
                  BarCodeScanner.Constants.BarCodeType.ean13,
                  BarCodeScanner.Constants.BarCodeType.ean8,
                  BarCodeScanner.Constants.BarCodeType.code128,
                  BarCodeScanner.Constants.BarCodeType.code39,
                  BarCodeScanner.Constants.BarCodeType.upc_a,
                  BarCodeScanner.Constants.BarCodeType.upc_e,
                  BarCodeScanner.Constants.BarCodeType.pdf417,
                  BarCodeScanner.Constants.BarCodeType.aztec,
                  BarCodeScanner.Constants.BarCodeType.datamatrix,
                ],
                onBarCodeScanned: scanned ? undefined : handleBarCodeScanned,
              }}
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              {/* Corner overlays */}
              {[{top:16,left:16,borderTopWidth:3,borderLeftWidth:3,borderTopLeftRadius:8},
                {top:16,right:16,borderTopWidth:3,borderRightWidth:3,borderTopRightRadius:8},
                {bottom:16,left:16,borderBottomWidth:3,borderLeftWidth:3,borderBottomLeftRadius:8},
                {bottom:16,right:16,borderBottomWidth:3,borderRightWidth:3,borderBottomRightRadius:8},
              ].map((s,i) => (
                <View key={i} style={[styles.corner, s]} />
              ))}

              {/* Scan line */}
              <Animated.View style={[styles.scanLine, {
                transform: [{ translateY: scanLineAnim.interpolate({
                  inputRange: [0,1], outputRange: [0, 220],
                })}],
              }]} />

              {/* Flash button */}
              <TouchableOpacity
                style={styles.flashBtn}
                onPress={() => setFlashOn(f => !f)}
              >
                <Ionicons
                  name={flashOn ? 'flash' : 'flash-off'}
                  size={22} color={flashOn ? Colors.gold : Colors.white}
                />
              </TouchableOpacity>
            </Camera>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={{ fontSize: 52, opacity: 0.3 }}>◎</Text>
              <Text style={styles.placeholderText}>
                {loading ? 'Verifying...' : 'Camera band hai'}
              </Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          {!cameraActive ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => { resetScan(); requestCamera(); }}
              disabled={loading}
            >
              <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>
                {loading ? 'Processing...' : 'Camera Start Karo'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.red }]}
              onPress={() => { setCameraActive(false); setScanned(false); }}
            >
              <Ionicons name="stop" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Camera Band Karo</Text>
            </TouchableOpacity>
          )}
        </View>

        {scanned && !cameraActive && (
          <TouchableOpacity style={styles.rescanBtn} onPress={() => { resetScan(); setCameraActive(true); }}>
            <Text style={styles.rescanText}>↺ Dobara Scan Karo</Text>
          </TouchableOpacity>
        )}

        {/* Result */}
        <ResultCard result={result} onDismiss={() => setResult(null)} />

        {/* Demo codes (testing ke liye) */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>TEST CODES (Demo)</Text>
          <View style={styles.demoRow}>
            {DEMO_CODES.map(d => (
              <TouchableOpacity
                key={d.code}
                style={[styles.demoChip, { borderColor: d.color + '55', backgroundColor: d.color + '15' }]}
                onPress={() => { resetScan(); doScan(d.code); }}
                disabled={loading}
              >
                <Text style={[styles.demoChipText, { color: d.color }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Anti-cheat info */}
        <View style={styles.anticheat}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.blue} style={{ marginRight: 6 }} />
          <Text style={styles.anticheatText}>
            Anti-Cheat: Max 50 scans · 100 pts/day · Sirf verified QR
          </Text>
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textSub, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  statsChip: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.borderAccent,
  },
  statsChipText: { fontSize: FontSizes.xs, color: Colors.accent, fontWeight: '700' },

  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: Spacing.xl, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  cameraWrap: {
    width: '100%', aspectRatio: 1, borderRadius: Radius.xl,
    overflow: 'hidden', backgroundColor: '#0A0A14',
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg, maxHeight: 300,
  },
  camera: { flex: 1 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: Colors.accent },
  scanLine: {
    position: 'absolute', left: 20, right: 20, height: 2,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  flashBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  cameraPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  placeholderText: { color: Colors.textMuted, fontSize: FontSizes.sm },

  btnRow: { marginBottom: Spacing.sm },
  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...Shadow.accent,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '800' },

  rescanBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: Spacing.md },
  rescanText: { color: Colors.accent, fontSize: FontSizes.md, fontWeight: '700' },

  resultCard: {
    borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1.5,
    marginBottom: Spacing.lg, ...Shadow.card,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  resultIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: FontSizes.lg, fontWeight: '800' },
  resultReason: { fontSize: FontSizes.sm, color: Colors.textSub, marginTop: 2, lineHeight: 17 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  resultCell: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md, padding: 10,
  },
  resultKey: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  resultVal: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  eventTag: {
    backgroundColor: Colors.goldSoft, borderRadius: Radius.md, padding: 10, marginBottom: 12,
  },
  eventTagText: { fontSize: FontSizes.sm, color: Colors.gold, fontWeight: '700' },
  resultPoints: {
    fontSize: FontSizes['4xl'], fontWeight: '900', color: Colors.gold, textAlign: 'center',
  },

  demoSection: { marginBottom: Spacing.lg },
  demoLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  demoChip: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  demoChipText: { fontSize: FontSizes.sm, fontWeight: '600' },

  anticheat: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.blueSoft, borderRadius: Radius.md, padding: 10,
    borderWidth: 1, borderColor: Colors.blue + '30',
  },
  anticheatText: { fontSize: FontSizes.xs, color: Colors.textSub, flex: 1 },
});
