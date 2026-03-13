// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen       from '../screens/HomeScreen';
import ScanScreen       from '../screens/ScanScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import RewardsScreen    from '../screens/RewardsScreen';
import AdminScreen      from '../screens/AdminScreen';
import ProfileScreen    from '../screens/ProfileScreen';
import { Colors, FontSizes } from '../utils/theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home:        ['home',        'home-outline'],
  Scan:        ['scan-circle', 'scan-circle-outline'],
  Leaderboard: ['trophy',      'trophy-outline'],
  Rewards:     ['gift',        'gift-outline'],
  Admin:       ['settings',    'settings-outline'],
};

function TabBar({ state, descriptors, navigation }) {
  return (
    <View style={{
      flexDirection: 'row', backgroundColor: Colors.surface,
      borderTopWidth: 1, borderTopColor: Colors.border,
      paddingBottom: 20, paddingTop: 8,
    }}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] || ['ellipse','ellipse-outline'];
        const isCenter = route.name === 'Scan';
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: 'center' }}
          >
            {isCenter ? (
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
                marginTop: -20, shadowColor: Colors.accent, shadowOpacity: 0.5,
                shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
                borderWidth: 3, borderColor: Colors.bg,
              }}>
                <Ionicons name="scan" size={26} color="#fff" />
              </View>
            ) : (
              <>
                <Ionicons
                  name={focused ? activeIcon : inactiveIcon}
                  size={22}
                  color={focused ? Colors.accent : Colors.textMuted}
                />
                <Text style={{
                  fontSize: 9, fontWeight: '700', letterSpacing: 0.4,
                  textTransform: 'uppercase', marginTop: 3,
                  color: focused ? Colors.accent : Colors.textMuted,
                }}>{route.name}</Text>
                {focused && <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: Colors.accent, marginTop: 2 }} />}
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"        component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Scan"        component={ScanScreen} />
      <Tab.Screen name="Rewards"     component={RewardsScreen} />
      <Tab.Screen name="Admin"       component={AdminScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.textSub, marginTop: 12, fontSize: FontSizes.sm }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main"    component={MainTabs} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
