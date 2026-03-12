import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Reward App</Text>
      <Text style={styles.subtitle}>Welcome!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    marginTop: 10,
  },
});
