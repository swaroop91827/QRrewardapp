import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>🔳</Text>
      <Text style={styles.title}>QR <Text style={{color:'#6C63FF'}}>Reward</Text></Text>
      <Text style={styles.subtitle}>Scan QR codes · Earn rewards · Win big</Text>

      <View style={styles.card}>
        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setTab('login')} style={[styles.tab, tab==='login' && styles.activeTab]}>
            <Text style={[styles.tabText, tab==='login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('signup')} style={[styles.tab, tab==='signup' && styles.activeTab]}>
            <Text style={[styles.tabText, tab==='signup' && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {tab === 'signup' && (
          <View>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#555" value={name} onChangeText={setName} />
          </View>
        )}

        <Text style={styles.label}>EMAIL</Text>
        <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#555" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.buttonText}>{tab === 'login' ? 'Login →' : 'Create Account →'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.socialBtn} onPress={() => setShowPhone(!showPhone)}>
          <Text style={styles.socialText}>📱  Continue with Phone Number</Text>
        </TouchableOpacity>

        {showPhone && (
          <View>
            <TextInput style={[styles.input, {marginTop: 10}]} placeholder="+91 Phone Number" placeholderTextColor="#555" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Send OTP →</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.socialBtn}>
          <Text style={styles.socialText}>🔵  Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#07070F', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 34, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#555', marginBottom: 24 },
  card: { width: '100%', backgroundColor: '#0f0f1a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1a1a2e' },
  tabRow: { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 12, marginBottom: 20, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#6C63FF' },
  tabText: { color: '#555', fontSize: 15, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  label: { color: '#555', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 1 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a3e' },
  button: { backgroundColor: '#6C63FF', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 14 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: '#1a1a2e' },
  orText: { color: '#555', marginHorizontal: 10, fontSize: 12 },
  socialBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#2a2a3e' },
  socialText: { color: '#fff', fontSize: 14 },
});
