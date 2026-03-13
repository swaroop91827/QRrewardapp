import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Login');
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🔳</Text>
      <Text style={styles.title}>QR <Text style={{color:'#6C63FF'}}>Reward</Text></Text>
      <Text style={styles.subtitle}>Scan · Earn · Win</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070F', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 40, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', letterSpacing: 3 },
});
