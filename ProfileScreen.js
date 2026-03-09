// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../firebase/authService';
import { updateUserProfile } from '../firebase/authService';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const { user, userData, refreshUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(userData?.name || '');
  const [giftEmail, setGiftEmail] = useState(userData?.giftCardEmail || '');
  const [saving, setSaving]   = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name, giftCardEmail: giftEmail });
      await refreshUserData();
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Profile save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    { icon: 'person-outline',    label: 'Naam',           value: userData?.name || '-' },
    { icon: 'mail-outline',      label: 'Email',           value: userData?.email || '-' },
    { icon: 'call-outline',      label: 'Phone',           value: userData?.phone || '-' },
    { icon: 'star-outline',      label: 'Total Points',    value: (userData?.points || 0).toLocaleString() },
    { icon: 'scan-outline',      label: 'Total Scans',     value: `${userData?.totalScans || 0}` },
    { icon: 'log-in-outline',    label: 'Login Method',    value: userData?.loginMethod || '-' },
    { icon: 'calendar-outline',  label: 'Member Since',    value: userData?.createdAt?.toDate
        ? userData.createdAt.toDate().toLocaleDateString('en-IN') : '-' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => setEditing(e => !e)}>
            <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 14 }}>
              {editing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(userData?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.avatarName}>{userData?.name || 'User'}</Text>
          <Text style={styles.avatarEmail}>{user?.email || user?.phoneNumber || ''}</Text>
          {userData?.eligible && (
            <View style={styles.eligBadge}>
              <Text style={styles.eligBadgeText}>🎁 Reward Eligible</Text>
            </View>
          )}
        </View>

        {/* Edit form */}
        {editing ? (
          <View style={styles.editCard}>
            <Text style={styles.editLabel}>Naam</Text>
            <TextInput value={name} onChangeText={setName} style={styles.editInput} placeholderTextColor={Colors.textMuted} placeholder="Apna naam..." />
            <Text style={styles.editLabel}>Gift Card Email</Text>
            <TextInput value={giftEmail} onChangeText={setGiftEmail} style={styles.editInput} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textMuted} placeholder="Amazon email..." />
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Karo'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoCard}>
            {rows.map(r => (
              <View key={r.label} style={styles.infoRow}>
                <Ionicons name={r.icon} size={16} color={Colors.accent} style={{ marginRight: 10 }} />
                <Text style={styles.infoLabel}>{r.label}</Text>
                <Text style={styles.infoValue}>{r.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout Karo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.text },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...Shadow.accent },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  avatarName: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  avatarEmail: { fontSize: FontSizes.sm, color: Colors.textSub, marginBottom: 10 },
  eligBadge: { backgroundColor: Colors.greenSoft, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: Colors.green + '44' },
  eligBadgeText: { fontSize: FontSizes.xs, color: Colors.green, fontWeight: '700' },
  infoCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSub },
  infoValue: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, textAlign: 'right', flex: 1 },
  editCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
  editLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  editInput: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, color: Colors.text, fontSize: FontSizes.md },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 20, ...Shadow.accent },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSizes.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.redSoft, borderRadius: Radius.lg, paddingVertical: 16, borderWidth: 1, borderColor: Colors.red + '44' },
  logoutText: { color: Colors.red, fontWeight: '800', fontSize: FontSizes.md },
});
