import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Reward</Text>
      <Text style={styles.subtitle}>Login karke shuru karein</Text>

      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleBtn}>
        <Text style={styles.googleText}>🔵 Google se Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070F', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 32 },
  input: { width: '100%', backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16 },
  button: { width: '100%', backgroundColor: '#6C63FF', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 14 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  googleBtn: { width: '100%', backgroundColor: '#1a1a2e', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  googleText: { color: '#fff', fontSize: 16 },
});
